/**
 * TwinStudioApp — fabric picker + TwinViewer + manifest export (§8/#3).
 */
import { useState } from 'react';
import { t } from '../lib/i18n';
import type { Locale } from '../lib/url';
import type { Fabric } from '../lib/schema';
import TwinViewer from './TwinViewer.tsx';

export interface Props {
  locale: Locale;
  fabrics: Fabric[];
}

export default function TwinStudioApp({ locale, fabrics }: Props) {
  const [slug, setSlug] = useState(fabrics[0]!.slug);
  const fabric = fabrics.find((f) => f.slug === slug) ?? fabrics[0]!;

  const manifest = {
    studio: 'azt-twin',
    fabric: { code: fabric.code, slug: fabric.slug, grade: fabric.grade, composition: fabric.composition, gsm: fabric.gsm },
    settings: { drape: 0.5, stretch: 1.0, weight: 0.5 },
  };

  return (
    <div style={{ display: 'grid', gap: 24, maxWidth: 860 }}>
      <div className="azt-card" style={{ padding: 20, display: 'grid', gap: 12 }}>
        <label style={{ display: 'grid', gap: 6 }}>
          <span style={{ fontSize: '0.85rem' }}>{t(locale, 'twin.fabric')}</span>
          <select className="azt-input" value={slug} onChange={(e) => setSlug(e.target.value)}>
            {fabrics.map((f) => (
              <option key={f.slug} value={f.slug}>
                {locale === 'ar' ? f.name.ar : f.name.en} · {f.code} · {f.grade}
              </option>
            ))}
          </select>
        </label>
      </div>

      <TwinViewer fabric={fabric} locale={locale} />

      <div className="azt-card" style={{ padding: 20 }}>
        <h2 style={{ margin: '0 0 12px', fontSize: '1rem' }}>{t(locale, 'twin.manifest')}</h2>
        <pre className="azt-mono" style={{ margin: 0, padding: 14, background: 'var(--color-sand-100)', borderRadius: 'var(--azt-radius)', fontSize: '0.75rem', lineHeight: 1.6, overflowX: 'auto', whiteSpace: 'pre-wrap' }}>
          {JSON.stringify(manifest, null, 2)}
        </pre>
        <button
          type="button"
          className="azt-btn azt-btn-ghost"
          style={{ minHeight: 44, marginBlockStart: 12 }}
          onClick={() => void navigator.clipboard?.writeText(JSON.stringify(manifest, null, 2))}
        >
          {t(locale, 'twin.manifest')}
        </button>
      </div>
    </div>
  );
}
