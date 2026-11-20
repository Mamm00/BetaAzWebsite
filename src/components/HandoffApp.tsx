/**
 * HandoffApp — target picker + payload → deterministic manifest (§8/#7).
 */
import { useMemo, useState } from 'react';
import { t } from '../lib/i18n';
import type { Locale } from '../lib/url';
import { fabrics, priceLabel } from '../lib/content';

export interface Props {
  locale: Locale;
}

const TARGETS = [
  { id: 'print', labelKey: 'handoff.target.print' },
  { id: 'dye', labelKey: 'handoff.target.dye' },
  { id: 'factory', labelKey: 'handoff.target.factory' },
  { id: 'warehouse', labelKey: 'handoff.target.warehouse' },
];

export default function HandoffApp({ locale }: Props) {
  const [target, setTarget] = useState('print');
  const [fabricSlug, setFabricSlug] = useState(fabrics[0]!.slug);
  const [metres, setMetres] = useState(50);
  const [notes, setNotes] = useState('');

  const fabric = fabrics.find((f) => f.slug === fabricSlug)!;

  const manifest = useMemo(() => {
    return {
      handoff: 'azt-handoff',
      version: 1,
      createdFor: target,
      fabric: {
        code: fabric.code,
        slug: fabric.slug,
        grade: fabric.grade,
        composition: fabric.composition,
        gsm: fabric.gsm,
        widthCm: fabric.widthCm,
      },
      quantityMetres: metres,
      unitPricePiastres: fabric.pricePerMetre,
      totalPiastres: fabric.pricePerMetre * metres,
      notes: notes.trim() || null,
      generatedBy: 'Al Azhar Tex static site',
    };
  }, [target, fabric, metres, notes]);

  return (
    <div style={{ display: 'grid', gap: 24, maxWidth: 860, gridTemplateColumns: '1fr 1fr' }}>
      <div className="azt-card" style={{ padding: 24, display: 'grid', gap: 16 }}>
        <fieldset style={{ border: 'none', padding: 0, margin: 0, display: 'grid', gap: 10 }}>
          <legend style={{ fontSize: '0.85rem' }}>{t(locale, 'handoff.target')}</legend>
          <div role="radiogroup" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {TARGETS.map((tg) => (
              <button
                key={tg.id}
                type="button"
                role="radio"
                aria-checked={target === tg.id}
                onClick={() => setTarget(tg.id)}
                style={{
                  minHeight: 44,
                  padding: '8px 16px',
                  border: target === tg.id ? '1px solid var(--color-ink-900)' : '1px solid var(--azt-hairline)',
                  background: target === tg.id ? 'var(--color-ink-900)' : 'var(--color-sand-50)',
                  color: target === tg.id ? 'var(--color-sand-50)' : 'inherit',
                  borderRadius: 'var(--azt-radius)',
                  cursor: 'pointer',
                  font: 'inherit',
                }}
              >
                {t(locale, tg.labelKey)}
              </button>
            ))}
          </div>
        </fieldset>

        <label style={{ display: 'grid', gap: 6 }}>
          <span style={{ fontSize: '0.85rem' }}>{t(locale, 'twin.fabric')}</span>
          <select className="azt-input" value={fabricSlug} onChange={(e) => setFabricSlug(e.target.value)}>
            {fabrics.map((f) => (
              <option key={f.slug} value={f.slug}>
                {locale === 'ar' ? f.name.ar : f.name.en} · {f.code} · {f.grade}
              </option>
            ))}
          </select>
        </label>

        <label style={{ display: 'grid', gap: 6 }}>
          <span style={{ fontSize: '0.85rem' }}>{locale === 'ar' ? 'الكمية (متر)' : 'Quantity (metres)'}</span>
          <input
            type="number"
            min={fabric.moqM}
            step={5}
            className="azt-input"
            value={metres}
            onChange={(e) => setMetres(Math.max(fabric.moqM, Math.floor(Number(e.target.value) || fabric.moqM)))}
          />
        </label>

        <label style={{ display: 'grid', gap: 6 }}>
          <span style={{ fontSize: '0.85rem' }}>{t(locale, 'contact.formMessage')}</span>
          <textarea className="azt-input" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </label>
      </div>

      <div className="azt-card" style={{ padding: 24, display: 'grid', gap: 16, alignContent: 'start' }}>
        <h2 style={{ margin: 0, fontSize: '1rem' }}>{t(locale, 'handoff.manifest')}</h2>
        <pre className="azt-mono" style={{ margin: 0, padding: 16, background: 'var(--color-sand-100)', borderRadius: 'var(--azt-radius)', fontSize: '0.75rem', lineHeight: 1.6, overflowX: 'auto', whiteSpace: 'pre-wrap' }}>
          {JSON.stringify(manifest, null, 2)}
        </pre>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button
            type="button"
            className="azt-btn"
            style={{ minHeight: 44 }}
            onClick={() => void navigator.clipboard?.writeText(JSON.stringify(manifest, null, 2))}
          >
            {t(locale, 'handoff.copy')}
          </button>
          <span className="azt-mono" style={{ alignSelf: 'center', fontSize: '0.8rem', color: 'var(--color-ink-500)' }}>
            {priceLabel(manifest.totalPiastres, locale)}
          </span>
        </div>
      </div>
    </div>
  );
}
