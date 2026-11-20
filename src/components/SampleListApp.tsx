/**
 * SampleListApp — the sample list: dedupe, cap 50, remove, clear,
 * share as WhatsApp text (§13).
 */
import { useEffect, useState } from 'react';
import { addSample, clearSamples, getSamples, onStoreChange, removeSample, type SampleItem } from '../lib/store';
import { t } from '../lib/i18n';
import { locUrl, type Locale } from '../lib/url';
import { waLink } from '../lib/wa';
import { fabrics, priceLabel } from '../lib/content';

export interface Props {
  locale: Locale;
}

export default function SampleListApp({ locale }: Props) {
  const [items, setItems] = useState<SampleItem[]>([]);
  const [metres, setMetres] = useState<Record<string, number>>({});

  useEffect(() => {
    setItems(getSamples());
    const off = onStoreChange(() => setItems(getSamples()));
    return off;
  }, []);

  function add(slug: string) {
    const f = fabrics.find((x) => x.slug === slug);
    if (!f) return;
    const m = metres[slug] ?? f.moqM;
    addSample({ slug, grade: f.grade, metres: m });
    setItems(getSamples());
  }

  function share() {
    if (items.length === 0) return;
    const lines = items.map((s) => {
      const f = fabrics.find((x) => x.slug === s.slug);
      const code = f?.code ?? s.slug;
      return `${code} — ${s.grade} — ${s.metres}m`;
    });
    const text = `${locale === 'ar' ? 'قائمة عينات الأزهر تكس' : 'Al Azhar Tex sample list'}:\n${lines.join('\n')}`;
    window.location.href = waLink(text);
  }

  function copy() {
    const lines = items.map((s) => {
      const f = fabrics.find((x) => x.slug === s.slug);
      return `${f?.code ?? s.slug} — ${s.grade} — ${s.metres}m`;
    });
    void navigator.clipboard?.writeText(lines.join('\n')).then(
      () => undefined,
      () => undefined,
    );
  }

  if (items.length === 0) {
    return (
      <div className="azt-card" style={{ padding: '32px', display: 'grid', gap: 20, maxWidth: 640 }}>
        <p style={{ margin: 0, color: 'var(--color-ink-700)' }}>{t(locale, 'sample.empty')}</p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {fabrics.slice(0, 6).map((f) => (
            <button key={f.slug} type="button" className="azt-chip" style={{ cursor: 'pointer' }} onClick={() => add(f.slug)}>
              <span className="azt-mono azt-grade-c" style={{ fontSize: '0.72rem' }}>{f.code}</span>
              {locale === 'ar' ? f.name.ar : f.name.en}
            </button>
          ))}
        </div>
        <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--color-ink-500)' }}>
          {locale === 'ar' ? 'أضف عينات من صفحات الأقمشة — القائمة بتتحفظ على جهازك.' : 'Add samples from fabric pages — the list is saved on your device.'}
        </p>
      </div>
    );
  }

  return (
    <div className="azt-card" style={{ padding: 24, display: 'grid', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <p className="azt-mono" style={{ margin: 0, fontSize: '0.8rem', color: 'var(--color-ink-500)' }}>
          {t(locale, 'trade.samplesCount', { count: items.length })}
        </p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button type="button" className="azt-btn azt-btn-ghost" style={{ minHeight: 40, fontSize: '0.82rem' }} onClick={share}>
            {t(locale, 'sample.shareWhatsApp')}
          </button>
          <button type="button" className="azt-btn azt-btn-ghost" style={{ minHeight: 40, fontSize: '0.82rem' }} onClick={copy}>
            {t(locale, 'common.copy')}
          </button>
          <button type="button" className="azt-btn azt-btn-ghost azt-grade-c" style={{ minHeight: 40, fontSize: '0.82rem' }} onClick={() => { clearSamples(); setItems([]); }}>
            {t(locale, 'sample.clear')}
          </button>
        </div>
      </div>
      <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 10 }}>
        {items.map((s) => {
          const f = fabrics.find((x) => x.slug === s.slug);
          return (
            <li key={s.slug} className="azt-card" style={{ padding: '12px 14px', display: 'flex', gap: 12, alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
              <div style={{ display: 'grid', gap: 4 }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                  <strong>{f ? (locale === 'ar' ? f.name.ar : f.name.en) : s.slug}</strong>
                  <span className={`azt-chip ${s.grade === 'A' ? 'azt-grade-a' : s.grade === 'B' ? 'azt-grade-b' : 'azt-grade-c'}`} style={{ fontSize: '0.7rem' }}>
                    {s.grade}
                  </span>
                </div>
                <span className="azt-mono" style={{ fontSize: '0.75rem', color: 'var(--color-ink-500)' }}>
                  {f?.code} · {s.metres} {t(locale, 'common.metresShort')} · {f ? priceLabel(f.pricePerMetre, locale) : ''}/{t(locale, 'common.metresShort')}
                </span>
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.78rem', color: 'var(--color-ink-500)' }}>
                {t(locale, 'product.moq')}
                <input
                  type="number"
                  min={1}
                  step={5}
                  value={metres[s.slug] ?? s.metres}
                  onChange={(e) => setMetres((m) => ({ ...m, [s.slug]: Math.max(1, Math.floor(Number(e.target.value) || 1)) }))}
                  style={{ width: 80, minHeight: 36, padding: '6px 8px', border: '1px solid var(--azt-hairline)', borderRadius: 'var(--azt-radius)', background: 'var(--color-sand-50)', fontFamily: 'var(--font-mono)' }}
                />
              </label>
              <button type="button" className="azt-btn azt-btn-ghost" style={{ minHeight: 36, fontSize: '0.8rem' }} onClick={() => { removeSample(s.slug); setItems(getSamples()); }}>
                {t(locale, 'sample.remove')}
              </button>
            </li>
          );
        })}
      </ul>
      <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--color-ink-500)' }}>
        <a href={locUrl(locale, 'trade-desk')} style={{ color: 'var(--color-indigo)' }}>{locale === 'ar' ? 'إدارة في مركز التاجر' : 'Manage in the Trade Desk'} →</a>
      </p>
    </div>
  );
}
