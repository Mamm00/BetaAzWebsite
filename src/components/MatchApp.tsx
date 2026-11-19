/**
 * MatchApp — upload a photo or pick a colour; rank fabrics by CIE76
 * colour distance in Lab (§6.6: raw RGB picks wrong matches). Everything
 * on-device; nothing uploaded (§22.4).
 */
import { useEffect, useRef, useState } from 'react';
import { t } from '../lib/i18n';
import type { Locale } from '../lib/url';
import { fabrics } from '../lib/content';

export interface Props {
  locale: Locale;
}

interface MatchResult {
  slug: string;
  distance: number;
  confidence: number; // 0..100
}

function srgbToLab(r: number, g: number, b: number): [number, number, number] {
  const f = (c: number) => (c > 0.04045 ? Math.pow((c + 0.055) / 1.055, 2.4) : c / 12.92);
  const R = f(r / 255);
  const G = f(g / 255);
  const B = f(b / 255);
  const x = (R * 0.4124 + G * 0.3576 + B * 0.1805) / 0.95047;
  const y = R * 0.2126 + G * 0.7152 + B * 0.0722;
  const z = (R * 0.0193 + G * 0.1192 + B * 0.9505) / 1.08883;
  const fx = (v: number) => (v > 0.008856 ? Math.cbrt(v) : 7.787 * v + 16 / 116);
  const fxv = fx(x);
  const fyv = fx(y);
  const fzv = fx(z);
  return [116 * fyv - 16, 500 * (fxv - fyv), 200 * (fyv - fzv)];
}

function hexToLab(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  const n = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16);
  return srgbToLab((n >> 16) & 255, (n >> 8) & 255, n & 255);
}

function extractDominant(canvas: HTMLCanvasElement): [number, number, number] {
  const ctx = canvas.getContext('2d');
  if (!ctx) return [200, 164, 92];
  const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const buckets = new Map<string, { count: number; r: number; g: number; b: number }>();
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i]!;
    const g = data[i + 1]!;
    const b = data[i + 2]!;
    const key = `${r >> 4}-${g >> 4}-${b >> 4}`;
    const bk = buckets.get(key);
    if (bk) {
      bk.count++;
      bk.r += r;
      bk.g += g;
      bk.b += b;
    } else {
      buckets.set(key, { count: 1, r, g, b });
    }
  }
  let best: { count: number; r: number; g: number; b: number } | null = null;
  for (const v of buckets.values()) {
    if (!best || v.count > best.count) best = v;
  }
  if (!best) return [200, 164, 92];
  return [best.r / best.count, best.g / best.count, best.b / best.count];
}

const SESSION_KEY = 'azt:visitor-gen';
const VISITOR_CAP = 3;

export default function MatchApp({ locale }: Props) {
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [ranking, setRanking] = useState<MatchResult[]>([]);
  const [palette, setPalette] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [mood, setMood] = useState<string[]>([]);
  const [moodBusy, setMoodBusy] = useState(false);
  const [used, setUsed] = useState(0);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(SESSION_KEY);
      setUsed(raw ? Number(raw) || 0 : 0);
    } catch {
      setUsed(0);
    }
  }, []);

  function rank(rgb: [number, number, number]) {
    const [lr, lg, lb] = srgbToLab(rgb[0], rgb[1], rgb[2]);
    const scored = fabrics.map((f) => {
      const lab = hexToLab(f.shades[0]!.hex);
      const d = Math.sqrt((lr - lab[0]) ** 2 + (lg - lab[1]) ** 2 + (lb - lab[2]) ** 2);
      return { slug: f.slug, distance: d };
    });
    scored.sort((a, b) => (a.distance === b.distance ? a.slug.localeCompare(b.slug) : a.distance - b.distance));
    const max = scored[0]!.distance || 1;
    const results: MatchResult[] = scored.slice(0, 8).map((s) => ({
      slug: s.slug,
      distance: s.distance,
      confidence: Math.max(0, Math.round((1 - s.distance / (max * 2.2)) * 100)),
    }));
    setRanking(results);
    // mood palette from top 4 distinct shades
    const top = scored.slice(0, 4).map((s) => fabrics.find((f) => f.slug === s.slug)!.shades[0]!.hex);
    setPalette([...new Set(top)]);
  }

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const maxSide = 200;
      const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(img.width * scale));
      canvas.height = Math.max(1, Math.round(img.height * scale));
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
      rank(extractDominant(canvas));
      URL.revokeObjectURL(url);
      setBusy(false);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      setBusy(false);
    };
    img.src = url;
  }

  function buildMood() {
    if (moodBusy || used >= VISITOR_CAP || palette.length === 0) return;
    setMoodBusy(true);
    const seedBase = 1000 + Math.floor(Math.random() * 9000);
    Promise.all(
      palette.slice(0, 4).map((hex, i) =>
        fetch(
          `https://image.pollinations.ai/prompt/${encodeURIComponent(`fabric swatch mood board, ${hex} tone, textile weave, flat lay, studio light`)}?width=600&height=600&seed=${seedBase + i}&model=flux&nologo=true`,
        ).then((r) => (r.ok ? r.blob() : Promise.reject(new Error('bad')))).then((b) => URL.createObjectURL(b)),
      ),
    )
      .then((urls) => {
        setMood(urls);
        try {
          sessionStorage.setItem(SESSION_KEY, String(used + 1));
        } catch {
          /* ignore */
        }
        setUsed((u) => u + 1);
      })
      .catch(() => undefined)
      .finally(() => setMoodBusy(false));
  }

  return (
    <div style={{ display: 'grid', gap: 32, maxWidth: 900 }}>
      <div className="azt-card" style={{ padding: 24, display: 'grid', gap: 16 }}>
        <input ref={fileRef} type="file" accept="image/*" onChange={onFile} style={{ display: 'none' }} aria-label={t(locale, 'match.upload')} />
        <div>
          <button type="button" className="azt-btn" style={{ minHeight: 44 }} onClick={() => fileRef.current?.click()} disabled={busy}>
            {busy ? t(locale, 'match.processing') : t(locale, 'match.upload')}
          </button>
        </div>
        <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--color-ink-500)' }}>{t(locale, 'match.uploadHint')}</p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {(['#1E3050', '#8C3B2E', '#3F6B4A', '#C8A45C', '#6E6A63', '#E8D5C4'] as const).map((hex) => (
            <button
              key={hex}
              type="button"
              aria-label={hex}
              onClick={() => rank(hexToLab(hex).map((v) => Math.round(v)) as [number, number, number])}
              style={{ width: 44, height: 44, borderRadius: 'var(--azt-swatch-radius)', background: hex, border: '1px solid var(--azt-hairline)', cursor: 'pointer' }}
            />
          ))}
        </div>
      </div>

      {ranking.length > 0 && (
        <>
          <section style={{ display: 'grid', gap: 12 }}>
            <h2 style={{ margin: 0, fontSize: '1.1rem' }}>{t(locale, 'match.ranking')}</h2>
            <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 10 }}>
              {ranking.map((r) => {
                const f = fabrics.find((x) => x.slug === r.slug)!;
                return (
                  <li key={r.slug} className="azt-card" style={{ padding: '12px 14px', display: 'grid', gridTemplateColumns: '1fr auto', gap: 4, alignItems: 'center' }}>
                    <span>
                      <strong>{locale === 'ar' ? f.name.ar : f.name.en}</strong>
                      <span className="azt-mono" style={{ fontSize: '0.75rem', color: 'var(--color-ink-500)', marginInlineStart: 8 }}>
                        {f.code} · {f.grade}
                      </span>
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 180 }}>
                      <span className="azt-mono" style={{ fontSize: '0.75rem', color: 'var(--color-ink-500)' }}>{r.confidence}%</span>
                      <span role="img" aria-label={`${t(locale, 'match.confidence')}: ${r.confidence}%`} style={{ flex: 1, height: 8, background: 'var(--color-sand-200)', borderRadius: 999, overflow: 'hidden' }}>
                        <span style={{ display: 'block', height: '100%', width: `${r.confidence}%`, background: 'var(--color-giza)' }} />
                      </span>
                    </span>
                  </li>
                );
              })}
            </ul>
          </section>

          {palette.length > 0 && (
            <section className="azt-card" style={{ padding: 24, display: 'grid', gap: 16 }}>
              <h2 style={{ margin: 0, fontSize: '1.1rem' }}>{t(locale, 'match.moodTitle')}</h2>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {palette.map((hex) => (
                  <span key={hex} style={{ width: 40, height: 40, borderRadius: 'var(--azt-swatch-radius)', background: hex, border: '1px solid var(--azt-hairline)' }} />
                ))}
              </div>
              <button type="button" className="azt-btn azt-btn-ghost" style={{ minHeight: 44 }} onClick={() => void buildMood()} disabled={moodBusy || used >= VISITOR_CAP}>
                {moodBusy ? t(locale, 'match.generatingMood') : t(locale, 'match.upload')}
              </button>
              {used >= VISITOR_CAP && (
                <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--color-madder)' }}>
                  {locale === 'ar' ? 'وصلت الحد المسموح للصور التخيلي في الجلسة دي.' : 'Session generation cap reached.'}
                </p>
              )}
              {mood.length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 }}>
                  {mood.map((url, i) => (
                    <img key={i} src={url} alt={`${t(locale, 'match.moodTitle')} ${i + 1}`} width={200} height={200} style={{ width: '100%', aspectRatio: '1 / 1', objectFit: 'cover', borderRadius: 'var(--azt-radius)', border: '1px solid var(--azt-hairline)' }} />
                  ))}
                </div>
              )}
            </section>
          )}
        </>
      )}

      {ranking.length === 0 && (
        <p style={{ margin: 0, color: 'var(--color-ink-700)' }}>{t(locale, 'match.empty')}</p>
      )}
    </div>
  );
}
