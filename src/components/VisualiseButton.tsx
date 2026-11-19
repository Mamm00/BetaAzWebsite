/**
 * VisualiseButton — visitor "Visualise": one drape still, one button, no
 * dialog (§22.4). Capped at 3 generations per session via sessionStorage;
 * pollinations only, 12s timeout, soft failure toast with retry.
 */
import { useEffect, useRef, useState } from 'react';
import { ROLES } from '../lib/imageRoles';
import { t } from '../lib/i18n';
import type { Locale } from '../lib/url';
import type { Fabric } from '../lib/schema';

export interface Props {
  fabric: Fabric;
  locale: Locale;
}

const SESSION_KEY = 'azt:visitor-gen';
const VISITOR_CAP = 3;
const TIMEOUT_MS = 12_000;

export default function VisualiseButton({ fabric, locale }: Props) {
  const [busy, setBusy] = useState(false);
  const [used, setUsed] = useState(0);
  const [failed, setFailed] = useState(false);
  const [img, setImg] = useState<string | null>(null);
  const mounted = useRef(false);

  useEffect(() => {
    mounted.current = true;
    try {
      const raw = sessionStorage.getItem(SESSION_KEY);
      setUsed(raw ? Number(raw) || 0 : 0);
    } catch {
      setUsed(0);
    }
    return () => {
      mounted.current = false;
    };
  }, []);

  const prompt =
    `Drape of ${fabric.name.en} fabric, ${fabric.composition}, ${fabric.gsm} g/m², ` +
    `${fabric.shades[0]?.hex ?? '#C8A45C'} tone, ${fabric.grade} grade textile, soft folds, studio light`;

  async function generate() {
    if (busy) return;
    if (used >= VISITOR_CAP) {
      setFailed(true);
      return;
    }
    setBusy(true);
    setFailed(false);
    try {
      const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=${ROLES.drape.width}&height=${ROLES.drape.height}&seed=${fabric.seed ?? 1}&model=flux&nologo=true`;
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timer);
      if (!res.ok) throw new Error(String(res.status));
      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      if (!mounted.current) {
        URL.revokeObjectURL(objectUrl);
        return;
      }
      setImg(objectUrl);
      try {
        sessionStorage.setItem(SESSION_KEY, String(used + 1));
      } catch {
        /* ignore */
      }
      setUsed((u) => u + 1);
    } catch {
      setFailed(true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ display: 'flex; flex-direction: column; gap: 8px; max-width: 320px;' }}>
      <button
        type="button"
        className="azt-btn azt-btn-ghost"
        onClick={() => void generate()}
        disabled={busy || used >= VISITOR_CAP}
        style={{ minHeight: 44 }}
      >
        {busy ? t(locale, 'common.loading') : t(locale, 'product.visualise')}
      </button>
      <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--color-ink-500)' }}>{t(locale, 'product.visualiseHint')}</p>
      {img && (
        <img
          src={img}
          alt={t(locale, 'product.visualiseHint')}
          width={320}
          height={427}
          style={{ width: '100%', aspectRatio: '3 / 4', objectFit: 'cover', borderRadius: 'var(--azt-radius)', border: '1px solid var(--azt-hairline)' }}
        />
      )}
      {failed && used >= VISITOR_CAP && (
        <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--color-madder)' }}>
          {locale === 'ar' ? 'وصلت الحد المسموح للصور التخيلي في الجلسة دي — سجّل كتّاجر عشان تكمل.' : 'Session generation cap reached — register as a trader for more.'}
        </p>
      )}
    </div>
  );
}
