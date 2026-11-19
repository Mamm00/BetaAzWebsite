/**
 * FabricEditorView (§25) — fabric edit form with live JSON, validation,
 * 10s autosave to localStorage drafts, commit-to-GitHub export.
 * Reads from base content merged with the draft overlay (§26).
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { fabrics } from '../../lib/content';
import { getDraft, saveDraft, discardDraft, validateFabric, type FieldIssue } from '../../lib/adminContent';
import { pushActivity } from '../../lib/store';
import { t } from '../../lib/i18n';
import type { Locale } from '../../lib/url';
import type { Fabric } from '../../lib/schema';
import { BilingualField, CompletenessMeter, Field, ValidationList, useToast } from './adminUi';

export interface Props {
  locale: Locale;
  slug: string;
  onBack: () => void;
}

interface EditorState {
  slug: string;
  code: string;
  lotId: string;
  name: { ar: string; en: string };
  grade: 'A' | 'B' | 'C';
  availability: 'in-stock' | 'low-stock' | 'out-of-stock';
  category: string;
  composition: string;
  construction: { ar: string; en: string };
  finish: { ar: string; en: string };
  gsm: number;
  widthCm: number;
  pricePerMetre: number;
  moqM: number;
  stockMetres: number;
  shades: Array<{ ar: string; en: string; hex: string }>;
  alternatives: string[];
  source: Fabric['source'];
  seed: number | null;
  photo: string | null;
  gradeNotes: { ar: string[]; en: string[] };
  bench: { waterLkg: number; carbonKg: number; costIndex: number };
}

function baseFor(slug: string, draftSlug: string): EditorState | null {
  const f = fabrics.find((x) => x.slug === slug);
  if (!f) return null;
  const draft = getDraft<Fabric>('fabrics', slug, f);
  const d = draftSlug ? draft : f;
  return {
    slug: d.slug,
    code: d.code,
    lotId: d.lotId,
    name: { ar: d.name.ar, en: d.name.en },
    grade: d.grade,
    category: d.category,
    composition: d.composition,
    construction: { ar: d.construction.ar, en: d.construction.en },
    finish: { ar: d.finish.ar, en: d.finish.en },
    gsm: d.gsm,
    widthCm: d.widthCm,
    pricePerMetre: d.pricePerMetre,
    moqM: d.moqM,
    stockMetres: d.stockMetres,
    availability: d.availability,
    shades: d.shades.map((x) => ({ ...x })),
    alternatives: [...d.alternatives],
    source: d.source,
    seed: d.seed,
    photo: d.photo,
    gradeNotes: { ar: [...d.gradeNotes.ar], en: [...d.gradeNotes.en] },
    bench: { ...d.bench },
  };
}

const AUTOSAVE_MS = 10_000;

export default function FabricEditorView({ locale, slug, onBack }: Props) {
  const [state, setState] = useState<EditorState | null>(() => baseFor(slug, slug) ?? null);
  const [dirty, setDirty] = useState(false);
  const [issues, setIssues] = useState<FieldIssue[]>([]);
  const toast = useToast();
  const lastSavedRef = useRef(0);

  const set = <K extends keyof EditorState>(key: K, value: EditorState[K]) => {
    setState((prev) => (prev ? { ...prev, [key]: value } : prev));
    setDirty(true);
  };

  useEffect(() => {
    const s = baseFor(slug, slug);
    if (!s) return;
    setState(s);
    setDirty(false);
  }, [slug]);

  // Validate on every change (§27)
  useEffect(() => {
    if (!state) return;
    setIssues(validateFabric(state));
  }, [state]);

  // 10s autosave while dirty (§25)
  useEffect(() => {
    if (!dirty || !state) return;
    if (Date.now() - lastSavedRef.current < AUTOSAVE_MS) {
      const timer = setTimeout(() => {
        if (state) {
          saveDraft('fabrics', slug, state as unknown as Fabric);
          lastSavedRef.current = Date.now();
          setDirty(false);
        }
      }, AUTOSAVE_MS);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [dirty, state, slug]);

  const compact = useMemo(() => {
    const missing = state
      ? [
          state.name.ar && !state.name.en ? 'name.en' : null,
          state.name.en && !state.name.ar ? 'name.ar' : null,
        ].filter((x): x is string => x !== null)
      : [];
    return { missing };
  }, [state]);

  if (!state) {
    return <p>{t(locale, 'catalog.noResults')}</p>;
  }

  const commitJson = JSON.stringify(state, null, 2);

  function saveNow(): void {
    if (!state) return;
    saveDraft('fabrics', slug, state as unknown as Fabric);
    pushActivity(`fabric:${slug} draft saved`);
    lastSavedRef.current = Date.now();
    setDirty(false);
    toast(t(locale, 'toast.draftSaved'), 'ok');
  }

  function discard(): void {
    discardDraft('fabrics', slug);
    const s = baseFor(slug, '');
    if (s) {
      setState(s);
      setDirty(false);
    }
    toast(t(locale, 'toast.discarded'), 'info');
  }

  function removeShade(i: number): void {
    if (!state) return;
    set('shades', state.shades.filter((_, idx) => idx !== i));
  }

  return (
    <div style={{ display: 'grid', gap: 20, maxWidth: 860 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <button type="button" className="azt-btn azt-btn-ghost" style={{ minHeight: 40 }} onClick={onBack}>
          ← {t(locale, 'admin.fabrics')}
        </button>
        <strong className="azt-mono">{state.code} · {state.slug}</strong>
      </div>

      <div className="azt-grid" style={{ gridTemplateColumns: '2fr 1fr', gap: 20, alignItems: 'start' }}>
        <div style={{ display: 'grid', gap: 16 }}>
          <div className="azt-card" style={{ padding: 20, display: 'grid', gap: 14 }}>
            <h2 style={{ margin: 0, fontSize: '1rem' }}>{t(locale, 'admin.fabric')}</h2>
            <Field label={t(locale, 'admin.slug')} locale={locale} hint={t(locale, 'admin.slugHint')}>
              <input className="azt-input azt-mono" value={state.slug} onChange={(e) => set('slug', e.target.value)} disabled />
            </Field>
            <div className="azt-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <Field label={t(locale, 'admin.colCode')} locale={locale}>
                <input className="azt-input azt-mono" value={state.code} onChange={(e) => set('code', e.target.value)} disabled />
              </Field>
              <Field label={t(locale, 'admin.grade')} locale={locale}>
                <select className="azt-input" value={state.grade} onChange={(e) => set('grade', e.target.value as EditorState['grade'])}>
                  {(['A', 'B', 'C'] as const).map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
            <BilingualField
              label={t(locale, 'admin.name')}
              locale={locale}
              ar={state.name.ar}
              en={state.name.en}
              onAr={(v) => set('name', { ...state.name, ar: v })}
              onEn={(v) => set('name', { ...state.name, en: v })}
            />
            <Field label={t(locale, 'admin.composition')} locale={locale}>
              <input className="azt-input" value={state.composition} onChange={(e) => set('composition', e.target.value)} />
            </Field>
            <BilingualField
              label={t(locale, 'admin.construction')}
              locale={locale}
              ar={state.construction.ar}
              en={state.construction.en}
              onAr={(v) => set('construction', { ...state.construction, ar: v })}
              onEn={(v) => set('construction', { ...state.construction, en: v })}
            />
          </div>

          <div className="azt-card" style={{ padding: 20, display: 'grid', gap: 14 }}>
            <h2 style={{ margin: 0, fontSize: '1rem' }}>{t(locale, 'admin.shades')}</h2>
            {state.shades.map((s, i) => (
              <div key={i} style={{ display: 'grid', gap: 10, padding: 12, border: '1px solid var(--azt-hairline)', borderRadius: 'var(--azt-radius)' }}>
                <div className="azt-grid" style={{ gridTemplateColumns: '3fr 3fr 80px auto', gap: 10, alignItems: 'center' }}>
                  <input className="azt-input" value={s.ar} onChange={(e) => set('shades', state.shades.map((x, j) => (j === i ? { ...x, ar: e.target.value } : x)))} placeholder={locale === 'ar' ? 'اسم اللون AR' : 'Shade AR'} />
                  <input className="azt-input" value={s.en} onChange={(e) => set('shades', state.shades.map((x, j) => (j === i ? { ...x, en: e.target.value } : x)))} placeholder="Shade EN" />
                  <input
                    className="azt-input azt-mono"
                    value={s.hex}
                    onChange={(e) => set('shades', state.shades.map((x, j) => (j === i ? { ...x, hex: e.target.value } : x)))}
                    aria-label={locale === 'ar' ? 'كود اللون' : 'Hex'}
                  />
                  <button type="button" className="azt-btn azt-btn-ghost" style={{ minHeight: 36 }} onClick={() => removeShade(i)} aria-label={t(locale, 'admin.removeShade')}>
                    ✕
                  </button>
                </div>
                <span style={{ width: 28, height: 28, borderRadius: 8, background: s.hex, display: 'inline-block' }} />
              </div>
            ))}
            <button type="button" className="azt-btn azt-btn-ghost" style={{ minHeight: 40, justifyContent: 'flex-start' }} onClick={() => set('shades', [...state.shades, { ar: '', en: '', hex: '#C8A45C' }])}>
              {t(locale, 'admin.addShade')}
            </button>
          </div>

          <div className="azt-card" style={{ padding: 20, display: 'grid', gap: 14 }}>
            <h2 style={{ margin: 0, fontSize: '1rem' }}>{t(locale, 'admin.specs')}</h2>
            <div className="azt-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <Field label={t(locale, 'admin.widthCm')} locale={locale}>
                <input type="number" className="azt-input" value={state.widthCm} onChange={(e) => set('widthCm', Number(e.target.value))} />
              </Field>
              <Field label={t(locale, 'admin.gsm')} locale={locale}>
                <input type="number" className="azt-input" value={state.gsm} onChange={(e) => set('gsm', Number(e.target.value))} />
              </Field>
              <Field label={t(locale, 'admin.pricePerMetre')} locale={locale}>
                <input type="number" className="azt-input" value={state.pricePerMetre} onChange={(e) => set('pricePerMetre', Number(e.target.value))} />
              </Field>
              <Field label={t(locale, 'admin.moqM')} locale={locale}>
                <input type="number" className="azt-input" value={state.moqM} onChange={(e) => set('moqM', Number(e.target.value))} />
              </Field>
              <Field label={t(locale, 'admin.stockMetres')} locale={locale}>
                <input type="number" className="azt-input" value={state.stockMetres} onChange={(e) => set('stockMetres', Number(e.target.value))} />
              </Field>
              <Field label={t(locale, 'admin.category')} locale={locale}>
                <input className="azt-input azt-mono" value={state.category} onChange={(e) => set('category', e.target.value)} />
              </Field>
              <Field label={t(locale, 'admin.lotId')} locale={locale}>
                <input className="azt-input azt-mono" value={state.lotId} onChange={(e) => set('lotId', e.target.value)} />
              </Field>
            </div>
            <BilingualField
              label={t(locale, 'admin.finish')}
              locale={locale}
              ar={state.finish.ar}
              en={state.finish.en}
              onAr={(v) => set('finish', { ...state.finish, ar: v })}
              onEn={(v) => set('finish', { ...state.finish, en: v })}
            />
            <div className="azt-grid" style={{ gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
              <Field label={t(locale, 'admin.benchWater')} locale={locale}>
                <input type="number" className="azt-input" value={state.bench.waterLkg} onChange={(e) => set('bench', { ...state.bench, waterLkg: Number(e.target.value) })} />
              </Field>
              <Field label={t(locale, 'admin.benchCarbon')} locale={locale}>
                <input type="number" className="azt-input" value={state.bench.carbonKg} onChange={(e) => set('bench', { ...state.bench, carbonKg: Number(e.target.value) })} />
              </Field>
              <Field label={t(locale, 'admin.benchCost')} locale={locale}>
                <input type="number" className="azt-input" value={state.bench.costIndex} onChange={(e) => set('bench', { ...state.bench, costIndex: Number(e.target.value) })} />
              </Field>
            </div>
            <Field label={t(locale, 'admin.availability')} locale={locale}>
              <select className="azt-input" value={state.availability} onChange={(e) => set('availability', e.target.value as EditorState['availability'])}>
                {(['in-stock', 'low-stock', 'out-of-stock'] as const).map((v) => (
                  <option key={v} value={v}>
                    {locale === 'ar' ? { 'in-stock': 'متوفر', 'low-stock': 'كمية محدودة', 'out-of-stock': 'غير متوفر' }[v] : v}
                  </option>
                ))}
              </select>
            </Field>
            <Field label={t(locale, 'admin.alternatives')} locale={locale} hint={t(locale, 'admin.alternativesHint')}>
              <input
                className="azt-input"
                value={state.alternatives.join(', ')}
                onChange={(e) => set('alternatives', e.target.value.split(',').map((x) => x.trim()).filter(Boolean))}
              />
            </Field>
          </div>

          <div className="azt-card" style={{ padding: 20, display: 'grid', gap: 14 }}>
            <h2 style={{ margin: 0, fontSize: '1rem' }}>{t(locale, 'admin.imagery')}</h2>
            <div className="azt-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <Field label={t(locale, 'admin.source')} locale={locale}>
                <select className="azt-input" value={state.source} onChange={(e) => set('source', e.target.value as EditorState['source'])}>
                  <option value="photo">photo</option>
                  <option value="render">render</option>
                </select>
              </Field>
              <Field label={t(locale, 'admin.seed')} locale={locale} hint={state.source === 'render' ? '32-bit, no +/-/whitespace' : t(locale, 'admin.seedHint')}>
                <input
                  className="azt-input azt-mono"
                  value={state.seed ?? ''}
                  onChange={(e) => {
                    const v = e.target.value;
                    if (/^\d+$/.test(v)) set('seed', Number(v) % 2 ** 31);
                    else set('seed', null);
                  }}
                />
              </Field>
              <Field label={t(locale, 'admin.photo')} locale={locale}>
                <input className="azt-input azt-mono" value={state.photo ?? ''} onChange={(e) => set('photo', e.target.value || null)} />
              </Field>
              <Field label={t(locale, 'admin.alternatives')} locale={locale} hint={t(locale, 'admin.alternativesHint')}>
                <input
                  className="azt-input azt-mono"
                  value={state.alternatives.join(', ')}
                  onChange={(e) => set('alternatives', e.target.value.split(',').map((x) => x.trim()).filter(Boolean))}
                />
              </Field>
            </div>
          </div>

          <div className="azt-card" style={{ padding: 20, display: 'grid', gap: 14 }}>
            <h2 style={{ margin: 0, fontSize: '1rem' }}>{t(locale, 'admin.gradeNotes')}</h2>
            {state.gradeNotes.ar.map((line, i) => (
              <div key={`ar-${i}`} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 32px', gap: 8 }}>
                <input
                  className="azt-input"
                  value={state.gradeNotes.ar[i] ?? ''}
                  onChange={(e) => set('gradeNotes', { ...state.gradeNotes, ar: state.gradeNotes.ar.map((x, j) => (j === i ? e.target.value : x)) })}
                  placeholder={locale === 'ar' ? 'ملاحظة AR' : 'Note AR'}
                />
                <input
                  className="azt-input"
                  value={state.gradeNotes.en[i] ?? ''}
                  onChange={(e) => set('gradeNotes', { ...state.gradeNotes, en: state.gradeNotes.en.map((x, j) => (j === i ? e.target.value : x)) })}
                  placeholder="Note EN"
                />
                <button
                  type="button"
                  className="azt-btn azt-btn-ghost"
                  style={{ minHeight: 36 }}
                  onClick={() => set('gradeNotes', { ar: state.gradeNotes.ar.filter((_, j) => j !== i), en: state.gradeNotes.en.filter((_, j) => j !== i) })}
                  aria-label={t(locale, 'admin.removeShade')}
                >
                  ✕
                </button>
              </div>
            ))}
            <button
              type="button"
              className="azt-btn azt-btn-ghost"
              style={{ minHeight: 40, justifyContent: 'flex-start' }}
              onClick={() => set('gradeNotes', { ar: [...state.gradeNotes.ar, ''], en: [...state.gradeNotes.en, ''] })}
            >
              {t(locale, 'admin.addNote')}
            </button>
          </div>
        </div>

        <aside style={{ display: 'grid', gap: 16, alignContent: 'start' }}>
          <div className="azt-card" style={{ padding: 20, display: 'grid', gap: 12 }}>
            <h2 style={{ margin: 0, fontSize: '1rem' }}>{t(locale, 'admin.validation')}</h2>
            <ValidationList issues={issues.map((i) => (locale === 'ar' ? i.field : i.messageKey))} locale={locale} />
            <CompletenessMeter pct={100 - Math.round((issues.length / 7) * 100)} label={t(locale, 'admin.completeness')} locale={locale} />
            {compact.missing.length > 0 && (
              <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--color-madder)' }}>{compact.missing.join(', ')}</p>
            )}
          </div>

          <div className="azt-card" style={{ padding: 20, display: 'grid', gap: 12 }}>
            <h2 style={{ margin: 0, fontSize: '1rem' }}>{t(locale, 'admin.commitJson')}</h2>
            <pre className="azt-mono" style={{ margin: 0, padding: 12, background: 'var(--color-sand-100)', borderRadius: 'var(--azt-radius)', fontSize: '0.7rem', lineHeight: 1.5, overflowX: 'auto', maxHeight: 320, whiteSpace: 'pre-wrap' }}>
              {commitJson}
            </pre>
            <button
              type="button"
              className="azt-btn azt-btn-ghost"
              style={{ minHeight: 44 }}
              onClick={() => void navigator.clipboard?.writeText(commitJson).then(() => toast(t(locale, 'toast.copied'), 'ok'))}
            >
              {locale === 'ar' ? 'نسخ JSON' : 'Copy JSON'}
            </button>
          </div>

          <div className="azt-card" style={{ padding: 20, display: 'grid', gap: 12 }}>
            <h2 style={{ margin: 0, fontSize: '1rem' }}>{t(locale, 'admin.draftOps')}</h2>
            <button type="button" className="azt-btn" style={{ minHeight: 44 }} onClick={saveNow}>
              {t(locale, 'common.saveDraft')}
            </button>
            <button type="button" className="azt-btn azt-btn-ghost" style={{ minHeight: 44 }} onClick={discard}>
              {t(locale, 'common.discard')}
            </button>
            <span style={{ fontSize: '0.72rem', color: 'var(--color-ink-500)' }}>
              {t(locale, 'admin.autosaveHint')}
            </span>
          </div>
        </aside>
      </div>
    </div>
  );
}
