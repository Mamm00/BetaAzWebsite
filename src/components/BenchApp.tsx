/**
 * BenchApp — hand-built SVG charts (no chart library, §19) with hidden
 * data tables per chart (§14). Comparison overlay across up to 4 fabrics.
 */
import { useMemo, useState } from 'react';
import { t } from '../lib/i18n';
import type { Locale } from '../lib/url';
import { fabrics } from '../lib/content';

export interface Props {
  locale: Locale;
}

type Metric = 'water' | 'carbon' | 'cost' | 'weight';

const METRICS: Array<{ id: Metric; labelKey: string; get: (f: (typeof fabrics)[number]) => number }> = [
  { id: 'water', labelKey: 'bench.water', get: (f) => f.bench.waterLkg },
  { id: 'carbon', labelKey: 'bench.carbon', get: (f) => f.bench.carbonKg },
  { id: 'cost', labelKey: 'bench.cost', get: (f) => f.bench.costIndex },
  { id: 'weight', labelKey: 'bench.weight', get: (f) => f.gsm },
];

const COLORS = ['var(--color-giza)', 'var(--color-indigo)', 'var(--color-madder)', 'var(--color-ok)'];

export default function BenchApp({ locale }: Props) {
  const [selected, setSelected] = useState<string[]>([fabrics[0]!.slug, fabrics[10]!.slug]);
  const chosen = useMemo(() => fabrics.filter((f) => selected.includes(f.slug)), [selected]);

  function toggle(slug: string) {
    setSelected((s) => (s.includes(slug) ? s.filter((x) => x !== slug) : s.length >= 4 ? s : [...s, slug]));
  }

  return (
    <div style={{ display: 'grid', gap: 28, maxWidth: 900 }}>
      <section className="azt-card" style={{ padding: 20, display: 'grid', gap: 12 }}>
        <h2 style={{ margin: 0, fontSize: '1rem' }}>{t(locale, 'bench.compare')}</h2>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {fabrics.map((f) => (
            <button
              key={f.slug}
              type="button"
              onClick={() => toggle(f.slug)}
              className="azt-chip"
              style={{
                cursor: 'pointer',
                borderColor: selected.includes(f.slug) ? 'var(--color-ink-900)' : undefined,
                background: selected.includes(f.slug) ? 'var(--color-ink-900)' : undefined,
                color: selected.includes(f.slug) ? 'var(--color-sand-50)' : undefined,
              }}
            >
              <span className="azt-mono" style={{ fontSize: '0.7rem' }}>{f.code}</span>
              {locale === 'ar' ? f.name.ar : f.name.en} · {f.grade}
            </button>
          ))}
        </div>
      </section>

      {chosen.length > 0 &&
        METRICS.map((m) => {
          const values = chosen.map((f) => m.get(f));
          const max = Math.max(...values, 1);
          return (
            <figure key={m.id} style={{ margin: 0 }}>
              <figcaption style={{ fontWeight: 600, marginBottom: 10 }}>
                {t(locale, m.labelKey)}
                <span style={{ fontWeight: 400, color: 'var(--color-ink-500)', marginInlineStart: 8, fontSize: '0.8rem' }}>
                  {locale === 'ar' ? 'مقارنة' : 'comparison'}
                </span>
              </figcaption>
              <svg viewBox={`0 0 ${Math.max(360, chosen.length * 240)} 220`} width="100%" role="img" aria-label={t(locale, m.labelKey)} style={{ display: 'block' }}>
                {values.map((v, i) => {
                  const barW = (v / max) * 180;
                  const x = i * 240 + 20;
                  return (
                    <g key={chosen[i]!.slug}>
                      <text x={x} y={28} style={{ fontSize: 11, fill: 'var(--color-ink-700)' }}>
                        {locale === 'ar' ? chosen[i]!.name.ar.slice(0, 18) : chosen[i]!.name.en.slice(0, 18)}
                      </text>
                      <rect x={x} y={40} width={180} height={16} fill="var(--color-sand-200)" rx={2} />
                      <rect x={x} y={40} width={barW} height={16} fill={COLORS[i % COLORS.length]} rx={2} />
                      <text x={x} y={70} style={{ fontSize: 11, fill: 'var(--color-ink-500)', fontFamily: 'var(--font-mono)' }}>
                        {Math.round(v * 100) / 100}
                      </text>
                    </g>
                  );
                })}
              </svg>
              <table style={{ width: '100%', borderCollapse: 'collapse', marginBlockStart: 10 }}>
                <caption className="azt-visually-hidden">{t(locale, m.labelKey)}</caption>
                <thead>
                  <tr>
                    <th scope="col" style={{ textAlign: 'start', padding: '6px 8px', borderBottom: '1px solid var(--azt-hairline)', fontSize: '0.8rem' }}>{locale === 'ar' ? 'القماش' : 'Fabric'}</th>
                    <th scope="col" style={{ textAlign: 'end', padding: '6px 8px', borderBottom: '1px solid var(--azt-hairline)', fontSize: '0.8rem' }}>{t(locale, m.labelKey)}</th>
                  </tr>
                </thead>
                <tbody>
                  {chosen.map((f, i) => (
                    <tr key={f.slug}>
                      <th scope="row" style={{ textAlign: 'start', padding: '6px 8px', borderBottom: '1px solid var(--azt-hairline)', fontSize: '0.8rem', fontWeight: 400 }}>{locale === 'ar' ? f.name.ar : f.name.en}</th>
                      <td style={{ textAlign: 'end', padding: '6px 8px', borderBottom: '1px solid var(--azt-hairline)', fontSize: '0.8rem' }} className="azt-mono">
                        <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 2, background: COLORS[i % COLORS.length], marginInlineEnd: 8 }} />
                        {m.get(f)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </figure>
          );
        })}

      <section className="azt-card" style={{ padding: 20 }}>
        <h2 style={{ margin: '0 0 12px', fontSize: '1rem' }}>{t(locale, 'bench.dataTable')}</h2>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
          <thead>
            <tr>
              <th scope="col" style={{ textAlign: 'start', padding: '6px 8px', borderBottom: '1px solid var(--azt-hairline)' }}>{locale === 'ar' ? 'القماش' : 'Fabric'}</th>
              <th scope="col" style={{ textAlign: 'end', padding: '6px 8px', borderBottom: '1px solid var(--azt-hairline)' }}>{t(locale, 'bench.weight')}</th>
              <th scope="col" style={{ textAlign: 'end', padding: '6px 8px', borderBottom: '1px solid var(--azt-hairline)' }}>{t(locale, 'bench.water')}</th>
              <th scope="col" style={{ textAlign: 'end', padding: '6px 8px', borderBottom: '1px solid var(--azt-hairline)' }}>{t(locale, 'bench.carbon')}</th>
              <th scope="col" style={{ textAlign: 'end', padding: '6px 8px', borderBottom: '1px solid var(--azt-hairline)' }}>{t(locale, 'bench.cost')}</th>
            </tr>
          </thead>
          <tbody>
            {chosen.map((f) => (
              <tr key={f.slug}>
                <th scope="row" style={{ textAlign: 'start', padding: '6px 8px', borderBottom: '1px solid var(--azt-hairline)', fontWeight: 400 }}>{locale === 'ar' ? f.name.ar : f.name.en}</th>
                <td className="azt-mono" style={{ textAlign: 'end', padding: '6px 8px', borderBottom: '1px solid var(--azt-hairline)' }}>{f.gsm}</td>
                <td className="azt-mono" style={{ textAlign: 'end', padding: '6px 8px', borderBottom: '1px solid var(--azt-hairline)' }}>{f.bench.waterLkg}</td>
                <td className="azt-mono" style={{ textAlign: 'end', padding: '6px 8px', borderBottom: '1px solid var(--azt-hairline)' }}>{f.bench.carbonKg}</td>
                <td className="azt-mono" style={{ textAlign: 'end', padding: '6px 8px', borderBottom: '1px solid var(--azt-hairline)' }}>{f.bench.costIndex}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p style={{ margin: '12px 0 0', fontSize: '0.75rem', color: 'var(--color-ink-500)' }}>
          {locale === 'ar' ? 'القيم دي توضيحية من قاعدة بيانات داخلية — مش شهادات.' : 'Values are indicative, drawn from the internal dataset — not certifications.'}
        </p>
      </section>
    </div>
  );
}
