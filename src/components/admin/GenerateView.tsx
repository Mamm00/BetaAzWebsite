/**
 * GenerateView (§22) — one-image generation, role picker, templated prompts,
 * provider config, seed control, cache meter, polling UI, visibility chip.
 */
import { useEffect, useState } from 'react';
import { fabrics, categories } from '../../lib/content';
import { ROLES, type ImageRole } from '../../lib/imageRoles';
import { templateFor, negativeFor, tokensFor, type PromptTokens } from '../../lib/promptTemplate';
import { generateWithCache, loadGenSettings, saveGenSettings, cacheUsage, maskKey, GenError, type GenSettings } from '../../lib/imagegen';
import { pushActivity } from '../../lib/store';
import { t } from '../../lib/i18n';
import type { Locale } from '../../lib/url';
import { Field, useToast, CompletenessMeter } from './adminUi';

export interface Props {
  locale: Locale;
}

const PROVIDERS: Array<{ id: GenSettings['provider']; label: string }> = [
  { id: 'pollinations', label: 'pollinations (keyless, default)' },
  { id: 'venice', label: 'venice (BYO key)' },
  { id: 'manual', label: 'manual (URL paste)' },
];

export default function GenerateView({ locale }: Props) {
  const [settings, setSettings] = useState<GenSettings>(() => loadGenSettings());
  const [fabricSlug, setFabricSlug] = useState(fabrics[0]!.slug);
  const [role, setRole] = useState<ImageRole>('hero');
  const [seed, setSeed] = useState(12345);
  const [width, setWidth] = useState(800);
  const [height, setHeight] = useState(600);
  const [busy, setBusy] = useState(false);
  const [image, setImage] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('');
  const [negative, setNegative] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [cache, setCache] = useState({ bytes: 0, cap: 150 * 1024 * 1024 });
  const toast = useToast();

  const fabric = fabrics.find((f) => f.slug === fabricSlug) ?? fabrics[0]!;

  useEffect(() => {
    setPrompt(templateFor(role, tokensFor(fabric, locale)));
    setNegative(negativeFor(role));
  }, [fabric, role, locale]);

  useEffect(() => {
    void cacheUsage().then(setCache);
  }, []);

  function update(patch: Partial<GenSettings>): void {
    const next = { ...settings, ...patch };
    setSettings(next);
    saveGenSettings(next);
  }

  async function generate(): Promise<void> {
    if (busy) return;
    setBusy(true);
    setError(null);
    setImage(null);
    try {
      const req = {
        prompt: prompt,
        negative: negative,
        width,
        height,
        seed,
        steps: settings.steps,
      };
      const blob = await generateWithCache(req, settings);
      const url = URL.createObjectURL(blob);
      setImage(url);
      pushActivity(`generate:${role}:${seed}`);
      setCache(await cacheUsage());
      toast(t(locale, 'toast.generated'), 'ok');
    } catch (err) {
      if (err instanceof GenError) {
        setError(`${err.status} — ${err.message}`);
      } else {
        setError(err instanceof Error ? err.message : String(err));
      }
    } finally {
      setBusy(false);
    }
  }

  const tokens: PromptTokens = tokensFor(fabric, locale);

  return (
    <div style={{ display: 'grid', gap: 20, maxWidth: 960 }}>
      <div className="azt-card" style={{ padding: 20, display: 'grid', gap: 14 }}>
        <h2 style={{ margin: 0, fontSize: '1rem' }}>{t(locale, 'admin.generate')}</h2>
        <div className="azt-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <Field label={t(locale, 'admin.fabric')} locale={locale}>
            <select className="azt-input" value={fabricSlug} onChange={(e) => setFabricSlug(e.target.value)}>
              {fabrics.map((f) => (
                <option key={f.slug} value={f.slug}>
                  {locale === 'ar' ? f.name.ar : f.name.en} · {f.code}
                </option>
              ))}
            </select>
          </Field>
          <Field label={t(locale, 'admin.role')} locale={locale}>
            <select className="azt-input" value={role} onChange={(e) => setRole(e.target.value as ImageRole)}>
              {(Object.keys(ROLES) as ImageRole[]).map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </Field>
          <Field label={t(locale, 'admin.seed')} locale={locale} hint={t(locale, 'admin.seedHint')}>
            <input type="number" className="azt-input azt-mono" value={seed} onChange={(e) => setSeed(Number(e.target.value))} />
          </Field>
          <div className="azt-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <Field label={t(locale, 'admin.width')} locale={locale}>
              <input type="number" className="azt-input" value={width} onChange={(e) => setWidth(Number(e.target.value))} />
            </Field>
            <Field label={t(locale, 'admin.height')} locale={locale}>
              <input type="number" className="azt-input" value={height} onChange={(e) => setHeight(Number(e.target.value))} />
            </Field>
          </div>
        </div>

        <Field label={t(locale, 'admin.prompt')} locale={locale}>
          <textarea className="azt-input" rows={4} value={prompt} onChange={(e) => setPrompt(e.target.value)} />
        </Field>
        <Field label={t(locale, 'admin.negative')} locale={locale}>
          <textarea className="azt-input" rows={2} value={negative} onChange={(e) => setNegative(e.target.value)} />
        </Field>
        <div style={{ fontSize: '0.75rem', color: 'var(--color-ink-500)' }}>
          {t(locale, 'admin.templateTokens')} {Object.keys(tokens).join(' · ')}
        </div>
        <button type="button" className="azt-btn" style={{ minHeight: 48 }} onClick={() => void generate()} disabled={busy}>
          {busy ? t(locale, 'common.loading') : t(locale, 'admin.generateBtn')}
        </button>
        {error && <p role="alert" style={{ margin: 0, color: 'var(--color-madder)', fontSize: '0.82rem' }}>{error}</p>}
      </div>

      <div className="azt-card" style={{ padding: 20, display: 'grid', gap: 14 }}>
        <h2 style={{ margin: 0, fontSize: '1rem' }}>{t(locale, 'admin.providerConfig')}</h2>
        <Field label={t(locale, 'admin.provider')} locale={locale}>
          <select className="azt-input" value={settings.provider} onChange={(e) => update({ provider: e.target.value as GenSettings['provider'] })}>
            {PROVIDERS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
        </Field>
        <div className="azt-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <Field label={t(locale, 'admin.model')} locale={locale}>
            <input className="azt-input azt-mono" value={settings.model} onChange={(e) => update({ model: e.target.value })} />
          </Field>
          <Field label={t(locale, 'admin.steps')} locale={locale}>
            <input type="number" className="azt-input" value={settings.steps} onChange={(e) => update({ steps: Number(e.target.value) })} />
          </Field>
        </div>
        <Field label={t(locale, 'admin.providerKey')} locale={locale} hint={t(locale, 'admin.keyStored')}>
          <input
            type="password"
            className="azt-input azt-mono"
            placeholder={maskKey(settings.key) || '—'}
            onChange={(e) => update({ key: e.target.value })}
            autoComplete="off"
          />
        </Field>
        <CompletenessMeter pct={Math.round((cache.bytes / cache.cap) * 100)} label={`${locale === 'ar' ? 'مساحة التخزين' : 'Gen cache'}: ${Math.round(cache.bytes / 1024)}KB / ${Math.round(cache.cap / 1024 / 1024)}MB`} locale={locale} />
        <Field label={t(locale, 'admin.category')} locale={locale}>
          <span className="azt-chip" style={{ fontSize: '0.72rem' }}>{fabric.category}</span>
          <span style={{ fontSize: '0.72rem', color: 'var(--color-ink-500)', marginInlineStart: 8 }}>
            {categories.length} {locale === 'ar' ? 'فئة' : 'categories'}
          </span>
        </Field>
      </div>

      {image && (
        <div className="azt-card" style={{ padding: 20, display: 'grid', gap: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ margin: 0, fontSize: '1rem' }}>{t(locale, 'admin.result')}</h2>
            <span className="azt-chip" style={{ fontSize: '0.72rem' }}>
              {role} · seed {seed} · {width}×{height}
            </span>
          </div>
          <img src={image} alt={`${fabric.code} ${role}`} style={{ width: '100%', maxHeight: 420, objectFit: 'contain', background: 'var(--color-sand-100)', borderRadius: 'var(--azt-radius)' }} />
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <a className="azt-btn azt-btn-ghost" style={{ minHeight: 44 }} href={image} download={`azt-${fabric.slug}-${role}-${seed}.png`}>
              {locale === 'ar' ? 'تنزيل' : 'Download'}
            </a>
            <button type="button" className="azt-btn azt-btn-ghost" style={{ minHeight: 44 }} onClick={() => void navigator.clipboard?.writeText(image)}>
              {locale === 'ar' ? 'نسخ URL' : 'Copy URL'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
