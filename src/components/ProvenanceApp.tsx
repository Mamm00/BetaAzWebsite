/**
 * ProvenanceApp — deterministic hash chain over Web Crypto (§8/#2).
 * Every step's hash = sha256(prevHash + step payload); the chain is
 * recomputed on verify, so any tampering breaks the last hash.
 */
import { useEffect, useMemo, useState } from 'react';
import QRCode from 'qrcode';
import { t } from '../lib/i18n';
import type { Locale } from '../lib/url';
import { fabrics } from '../lib/content';

export interface Props {
  locale: Locale;
}

async function sha256(text: string): Promise<string> {
  const bytes = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

interface Step {
  key: string;
  labelKey: string;
  payload: string;
}

function buildChain(lotId: string, seed: number) {
  const steps: Step[] = [
    { key: 'received', labelKey: 'provenance.step.received', payload: `${lotId}:received` },
    { key: 'graded', labelKey: 'provenance.step.graded', payload: `${lotId}:graded:${String.fromCharCode(65 + (seed % 3))}` },
    { key: 'priced', labelKey: 'provenance.step.priced', payload: `${lotId}:priced:${200 + (seed % 80)}` },
    { key: 'listed', labelKey: 'provenance.step.listed', payload: `${lotId}:listed:${500 + (seed % 500)}` },
  ];
  return steps;
}

export default function ProvenanceApp({ locale }: Props) {
  const [lotId, setLotId] = useState(fabrics[0]!.lotId);
  const [chain, setChain] = useState<Array<{ step: Step; hash: string }>>([]);
  const [verified, setVerified] = useState<boolean | null>(null);
  const [qr, setQr] = useState<string>('');

  const seed = useMemo(() => {
    let h = 0;
    for (let i = 0; i < lotId.length; i++) h = (Math.imul(h, 31) + lotId.charCodeAt(i)) | 0;
    return Math.abs(h);
  }, [lotId]);

  const steps = useMemo(() => buildChain(lotId, seed), [lotId, seed]);

  useEffect(() => {
    let cancelled = false;
    async function compute() {
      const out: Array<{ step: Step; hash: string }> = [];
      let prev = '0'.repeat(64);
      for (const step of steps) {
        const hash = await sha256(`${prev}|${step.payload}`);
        out.push({ step, hash });
        prev = hash;
      }
      if (!cancelled) {
        setChain(out);
        setVerified(true);
      }
    }
    void compute();
    return () => {
      cancelled = true;
    };
  }, [steps]);

  useEffect(() => {
    let cancelled = false;
    const payload = JSON.stringify({ lot: lotId, chain: chain.map((c) => c.hash) });
    QRCode.toDataURL(payload, { margin: 1, width: 320 }).then((url) => {
      if (!cancelled) setQr(url);
    });
    return () => {
      cancelled = true;
    };
  }, [lotId, chain]);

  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://alazhartex.com';
  const embedSrc = `${origin}/provenance-embed?lot=${encodeURIComponent(lotId)}`;

  return (
    <div style={{ display: 'grid', gap: 28, maxWidth: 860 }}>
      <section className="azt-card" style={{ padding: 20, display: 'grid', gap: 12 }}>
        <label style={{ display: 'grid', gap: 6 }}>
          <span style={{ fontSize: '0.85rem' }}>{t(locale, 'provenance.lot')}</span>
          <select className="azt-input" value={lotId} onChange={(e) => setLotId(e.target.value)}>
            {fabrics.map((f) => (
              <option key={f.lotId} value={f.lotId}>
                {f.lotId} — {locale === 'ar' ? f.name.ar : f.name.en} ({f.grade})
              </option>
            ))}
          </select>
        </label>
        <button type="button" className="azt-btn azt-btn-ghost" style={{ minHeight: 44, justifySelf: 'start' }} onClick={() => void (async () => {
          let prev = '0'.repeat(64);
          let ok = true;
          for (const c of chain) {
            const expected = await sha256(`${prev}|${c.step.payload}`);
            if (expected !== c.hash) ok = false;
            prev = c.hash;
          }
          setVerified(ok);
        })()}>
          {t(locale, 'provenance.verify')}
        </button>
        {verified !== null && (
          <p role="status" style={{ margin: 0, color: verified ? 'var(--color-ok)' : 'var(--color-madder)', fontSize: '0.85rem' }}>
            {verified ? t(locale, 'provenance.verified') : 'Chain broken — hash mismatch'}
          </p>
        )}
      </section>

      <div className="azt-grid" style={{ gridTemplateColumns: '1.4fr 1fr', gap: 28, alignItems: 'start' }}>
        <section style={{ display: 'grid', gap: 16 }}>
          <h2 style={{ margin: 0, fontSize: '1.1rem' }}>{t(locale, 'provenance.chain')}</h2>
          <ol style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 10 }}>
            {chain.map((c, i) => (
              <li key={c.step.key} className="azt-card" style={{ padding: '12px 14px', display: 'grid', gap: 4 }}>
                <span style={{ display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
                  <strong style={{ fontSize: '0.9rem' }}>{t(locale, c.step.labelKey)}</strong>
                  <span className="azt-mono" style={{ fontSize: '0.68rem', color: 'var(--color-ink-500)' }}>
                    {i === 0 ? 'GENESIS' : `← ${c.hash.slice(0, 8)}…`}
                  </span>
                </span>
                <span className="azt-mono" style={{ fontSize: '0.68rem', color: 'var(--color-ink-500)', wordBreak: 'break-all' }}>
                  sha256: {c.hash.slice(0, 24)}…{c.hash.slice(-8)}
                </span>
              </li>
            ))}
          </ol>
        </section>

        <div style={{ display: 'grid', gap: 20, alignContent: 'start' }}>
          <figure style={{ margin: 0 }}>
            <figcaption style={{ fontWeight: 600, marginBottom: 8, fontSize: '0.9rem' }}>{locale === 'ar' ? 'المسار الجغرافي' : 'Route'}</figcaption>
            <svg viewBox="0 0 320 240" width="100%" role="img" aria-label={locale === 'ar' ? 'خريطة المسار من المنشأ للمعرض' : 'Route map from origin to gallery'}>
              <rect x="40" y="40" width="240" height="160" fill="none" stroke="var(--azt-hairline)" strokeWidth="1.5" />
              <text x="50" y="34" style={{ fontSize: 10, fill: 'var(--color-ink-500)' }}>Sharkia</text>
              <path d="M70 150 C 130 110, 190 170, 250 100" fill="none" stroke="var(--color-giza)" strokeWidth="2" strokeDasharray="5 4" />
              <circle cx="70" cy="150" r="6" fill="var(--color-indigo)" />
              <text x="82" y="154" style={{ fontSize: 10, fill: 'var(--color-ink-700)' }}>origin</text>
              <circle cx="250" cy="100" r="6" fill="var(--color-madder)" />
              <text x="200" y="94" style={{ fontSize: 10, fill: 'var(--color-ink-700)' }}>{locale === 'ar' ? 'المعرض' : 'gallery'}</text>
            </svg>
          </figure>

          {qr && (
            <figure style={{ margin: 0 }}>
              <figcaption style={{ fontWeight: 600, marginBottom: 8, fontSize: '0.9rem' }}>{t(locale, 'provenance.qr')}</figcaption>
              <img src={qr} alt={t(locale, 'provenance.qr')} width={220} height={220} style={{ width: '100%', maxWidth: 220, border: '1px solid var(--azt-hairline)', borderRadius: 'var(--azt-radius)' }} />
            </figure>
          )}

          <figure className="azt-card" style={{ margin: 0, padding: 14 }}>
            <figcaption style={{ fontWeight: 600, marginBottom: 8, fontSize: '0.9rem' }}>{t(locale, 'provenance.embed')}</figcaption>
            <code className="azt-mono" style={{ fontSize: '0.7rem', wordBreak: 'break-all', display: 'grid', gap: 6 }}>
              <span>{`<iframe src="${embedSrc}" width="320" height="220" loading="lazy"></iframe>`}</span>
            </code>
            <button
              type="button"
              className="azt-btn azt-btn-ghost"
              style={{ minHeight: 40, marginBlockStart: 10, fontSize: '0.8rem' }}
              onClick={() => void navigator.clipboard?.writeText(`<iframe src="${embedSrc}" width="320" height="220" loading="lazy"></iframe>`)}
            >
              {t(locale, 'common.copy')}
            </button>
          </figure>
        </div>
      </div>
    </div>
  );
}
