/**
 * SwapApp — impact delta bars from the internal dataset (§8/#9).
 * Delta = from − to (negative = improvement when swapping to `to`).
 */
import { useState } from 'react';
import { t } from '../lib/i18n';
import type { Locale } from '../lib/url';
import { fabrics } from '../lib/content';

export interface Props {
  locale: Locale;
}

const METRICS: Array<{ key: string; labelKey: string; get: (f: (typeof fabrics)[number]) => number; better: 'lower' | 'higher' }> = [
  { key: 'water', labelKey: 'bench.water', get: (f) => f.bench.waterLkg, better: 'lower' },
  { key: 'carbon', labelKey: 'bench.carbon', get: (f) => f.bench.carbonKg, better: 'lower' },
  { key: 'cost', labelKey: 'bench.cost', get: (f) => f.bench.costIndex, better: 'lower' },
];

export default function SwapApp({ locale }: Props) {
  const [from, setFrom] = useState(fabrics[1]!.slug);
  const [to, setTo] = useState(fabrics[11]!.slug);

  const a = fabrics.find((f) => f.slug === from)!;
  const b = fabrics.find((f) => f.slug === to)!;

  return (
    <div style={{ display: 'grid', gap: 24, maxWidth: 860 }}>
      <div className="azt-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <label style={{ display: 'grid', gap: 6 }}>
          <span style={{ fontSize: '0.85rem' }}>{t(locale, 'swap.from')}</span>
          <select className="azt-input" value={from} onChange={(e) => setFrom(e.target.value)}>
            {fabrics.map((f) => (
              <option key={f.slug} value={f.slug}>
                {locale === 'ar' ? f.name.ar : f.name.en} · {f.code} · {f.grade}
              </option>
            ))}
          </select>
        </label>
        <label style={{ display: 'grid', gap: 6 }}>
          <span style={{ fontSize: '0.85rem' }}>{t(locale, 'swap.to')}</span>
          <select className="azt-input" value={to} onChange={(e) => setTo(e.target.value)}>
            {fabrics.map((f) => (
              <option key={f.slug} value={f.slug}>
                {locale === 'ar' ? f.name.ar : f.name.en} · {f.code} · {f.grade}
              </option>
            ))}
          </select>
        </label>
      </div>

      {METRICS.map((m) => {
        const va = m.get(a);
        const vb = m.get(b);
        const delta = va - vb;
        const improved = m.better === 'lower' ? delta > 0 : delta < 0;
        const pct = Math.min(100, Math.abs(delta) / Math.max(va, vb, 1) * 100);
        return (
          <div key={m.key} className="azt-card" style={{ padding: '16px 18px', display: 'grid', gap: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12, flexWrap: 'wrap' }}>
              <strong>{t(locale, m.labelKey)}</strong>
              <span className="azt-mono" style={{ fontSize: '0.85rem', color: improved ? 'var(--color-ok)' : 'var(--color-madder)' }}>
                {delta >= 0 ? '+' : ''}{delta.toFixed(2)} {locale === 'ar' ? 'تفاضل' : 'delta'}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span className="azt-mono" style={{ fontSize: '0.75rem', color: 'var(--color-ink-500)', minWidth: 64 }}>{va}</span>
              <span role="img" aria-label={`${t(locale, 'swap.delta')}: ${pct.toFixed(0)}%`} style={{ flex: 1, height: 10, background: 'var(--color-sand-200)', borderRadius: 999, overflow: 'hidden' }}>
                <span style={{ display: 'block', height: '100%', width: `${Math.max(4, pct)}%`, background: improved ? 'var(--color-ok)' : 'var(--color-madder)' }} />
              </span>
              <span className="azt-mono" style={{ fontSize: '0.75rem', color: 'var(--color-ink-500)', minWidth: 64, textAlign: 'end' }}>{vb}</span>
            </div>
          </div>
        );
      })}

      <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--color-ink-500)' }}>
        {t(locale, 'swap.saved')}
      </p>
    </div>
  );
}
