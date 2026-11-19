/**
 * TranslationsView (§24) — locale dictionary overlay editing with
 * completeness meter, base/en/ar overlay, exportable JSON.
 */
import { useMemo, useState } from 'react';
import { localeDicts } from '../../lib/content';
import { KEYS, readJson, writeJson } from '../../lib/store';
import { t } from '../../lib/i18n';
import type { Locale } from '../../lib/url';
import { Field, useToast, ValidationList } from './adminUi';

export interface Props {
  locale: Locale;
  onNavigate: (path: string) => void;
}

const AR_BASE = localeDicts.ar as Record<string, string>;
const EN_BASE = localeDicts.en as Record<string, string>;

export default function TranslationsView({ locale, onNavigate }: Props) {
  const [arOverlay, setArOverlay] = useState<Record<string, string>>({});
  const [enOverlay, setEnOverlay] = useState<Record<string, string>>({});
  const [filter, setFilter] = useState('');
  const toast = useToast();

  const keys = useMemo(() => Object.keys(AR_BASE).sort(), []);

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return keys;
    return keys.filter((k) => k.toLowerCase().includes(q) || (AR_BASE[k] ?? '').includes(q) || (EN_BASE[k] ?? '').includes(q.toLowerCase()));
  }, [filter, keys]);

  const resolve = (k: string) => ({
    ar: arOverlay[k] ?? AR_BASE[k] ?? '',
    en: enOverlay[k] ?? EN_BASE[k] ?? '',
  });

  const missingEn = keys.filter((k) => !resolve(k).en.trim()).length;
  const missingAr = keys.filter((k) => !resolve(k).ar.trim()).length;
  const pct = Math.round(((keys.length - Math.max(missingEn, missingAr)) / keys.length) * 100);

  function setAr(k: string, v: string): void {
    setArOverlay((prev) => ({ ...prev, [k]: v }));
  }
  function setEn(k: string, v: string): void {
    setEnOverlay((prev) => ({ ...prev, [k]: v }));
  }

  function exportJson(): void {
    const out = { ar: { ...AR_BASE, ...arOverlay }, en: { ...EN_BASE, ...enOverlay } };
    const text = JSON.stringify(out, null, 2);
    writeJson(KEYS.localeOverlay, out);
    void navigator.clipboard?.writeText(text).then(() => toast(t(locale, 'toast.copied'), 'ok'));
  }

  function applyOverlay(): void {
    writeJson(KEYS.localeOverlay, { ar: arOverlay, en: enOverlay });
    pushLocaleOverlay();
    toast(t(locale, 'toast.draftSaved'), 'ok');
  }

  function pushLocaleOverlay(): void {
    // re-read with validation (fallback keeps base)
    readJson(KEYS.localeOverlay, (v): v is { ar: Record<string, string>; en: Record<string, string> } => typeof v === 'object' && v !== null, { ar: arOverlay, en: enOverlay });
  }

  const issues = useMemo(() => {
    const out: string[] = [];
    if (missingAr > 0) out.push(`${missingAr} AR missing`);
    if (missingEn > 0) out.push(`${missingEn} EN missing`);
    return out;
  }, [missingAr, missingEn]);

  return (
    <div style={{ display: 'grid', gap: 20, maxWidth: 960 }}>
      <div className="azt-card" style={{ padding: 20, display: 'grid', gap: 12 }}>
        <h2 style={{ margin: 0, fontSize: '1rem' }}>{t(locale, 'admin.translations')}</h2>
        <Field label={t(locale, 'admin.search')} locale={locale}>
          <input className="azt-input" value={filter} onChange={(e) => setFilter(e.target.value)} />
        </Field>
        <div className="azt-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-ink-500)' }}>{locale === 'ar' ? 'العربية' : 'Arabic'}</span>
            <div style={{ height: 8, background: 'var(--color-sand-200)', borderRadius: 999, overflow: 'hidden', marginBlockStart: 6 }}>
              <div style={{ height: '100%', width: `${(100 - (missingAr / keys.length) * 100) * 1}%`, background: 'var(--color-ok)' }} />
            </div>
            <span className="azt-mono" style={{ fontSize: '0.72rem' }}>
              {keys.length - missingAr}/{keys.length}
            </span>
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-ink-500)' }}>English</span>
            <div style={{ height: 8, background: 'var(--color-sand-200)', borderRadius: 999, overflow: 'hidden', marginBlockStart: 6 }}>
              <div style={{ height: '100%', width: `${(keys.length - missingEn) / keys.length * 100}%`, background: 'var(--color-giza)' }} />
            </div>
            <span className="azt-mono" style={{ fontSize: '0.72rem' }}>
              {keys.length - missingEn}/{keys.length}
            </span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button type="button" className="azt-btn" style={{ minHeight: 44 }} onClick={applyOverlay}>
            {t(locale, 'common.saveDraft')}
          </button>
          <button type="button" className="azt-btn azt-btn-ghost" style={{ minHeight: 44 }} onClick={exportJson}>
            {t(locale, 'admin.commitJson')}
          </button>
          <button type="button" className="azt-btn azt-btn-ghost" style={{ minHeight: 44 }} onClick={() => onNavigate('fabrics')}>
            {t(locale, 'admin.fabrics')}
          </button>
        </div>
        <ValidationList issues={issues} locale={locale} />
      </div>

      <div className="azt-card" style={{ padding: 20, display: 'grid', gap: 14 }}>
        {filtered.map((k) => {
          const r = resolve(k);
          const edited = k in arOverlay || k in enOverlay;
          return (
            <div key={k} style={{ display: 'grid', gap: 6, padding: 10, border: '1px solid var(--azt-hairline)', borderRadius: 'var(--azt-radius)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="azt-mono" style={{ fontSize: '0.75rem' }}>
                  {k}
                </span>
                {edited && <span className="azt-chip" style={{ fontSize: '0.66rem' }}>{t(locale, 'admin.draft')}</span>}
              </div>
              <div className="azt-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <input className="azt-input" dir="rtl" value={r.ar} onChange={(e) => setAr(k, e.target.value)} placeholder="AR" />
                <input className="azt-input" dir="ltr" value={r.en} onChange={(e) => setEn(k, e.target.value)} placeholder="EN" />
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && <p style={{ margin: 0, color: 'var(--color-ink-500)' }}>{t(locale, 'catalog.noResults')}</p>}
      </div>

      <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--color-ink-500)' }}>{pct}% complete</p>
    </div>
  );
}
