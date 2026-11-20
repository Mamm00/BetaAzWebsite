/**
 * PublishView (§26) — connection form, staged-file list, publish button,
 * commit output, Actions run URL. Publish NEVER wipes content; 409 stops.
 */
import { useState } from 'react';
import { fabrics, localeDicts } from '../../lib/content';
import {
  loadPublishSettings,
  savePublishSettings,
  publishFiles,
  type PublishResult,
  type PublishProgress,
  type PublishSettings,
  type StagedFile,
} from '../../lib/publish';
import { pushActivity } from '../../lib/store';
import { t } from '../../lib/i18n';
import type { Locale } from '../../lib/url';
import { Field, useToast } from './adminUi';

export interface Props {
  locale: Locale;
}

export default function PublishView({ locale }: Props) {
  const [settings, setSettings] = useState<PublishSettings | null>(() => loadPublishSettings());
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<PublishProgress | null>(null);
  const [result, setResult] = useState<PublishResult | null>(null);
  const toast = useToast();

  const files: StagedFile[] = [
    { path: 'src/content/fabrics.json', content: JSON.stringify(fabrics, null, 2) },
    { path: 'src/content/categories.json', content: JSON.stringify(localeDicts.ar, null, 2) },
    { path: 'src/content/grades.json', content: JSON.stringify(localeDicts.en, null, 2) },
  ];

  function update(patch: Partial<PublishSettings>): void {
    const next = { ...(settings ?? { owner: '', repo: '', branch: 'main', token: '' }), ...patch };
    setSettings(next);
    savePublishSettings(next);
  }

  async function publish(): Promise<void> {
    if (!settings || busy) return;
    setBusy(true);
    setResult(null);
    setProgress({ stage: 'start', index: 0, total: files.length });
    const res = await publishFiles(files, settings, (p) => setProgress(p));
    setResult(res);
    setBusy(false);
    pushActivity(`publish:${res.ok ? 'ok' : 'failed'}`);
    if (res.ok) toast(t(locale, 'toast.published'), 'ok');
    else toast(res.error ?? 'publish failed', 'error');
  }

  return (
    <div style={{ display: 'grid', gap: 20, maxWidth: 860 }}>
      <div className="azt-card" style={{ padding: 20, display: 'grid', gap: 14 }}>
        <h2 style={{ margin: 0, fontSize: '1rem' }}>{t(locale, 'admin.connection')}</h2>
        <div className="azt-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <Field label={t(locale, 'admin.owner')} locale={locale}>
            <input className="azt-input azt-mono" value={settings?.owner ?? ''} onChange={(e) => update({ owner: e.target.value })} placeholder="Mamm00" />
          </Field>
          <Field label={t(locale, 'admin.repo')} locale={locale}>
            <input className="azt-input azt-mono" value={settings?.repo ?? ''} onChange={(e) => update({ repo: e.target.value })} placeholder="BetaAzWebsite" />
          </Field>
          <Field label={t(locale, 'admin.branch')} locale={locale}>
            <input className="azt-input azt-mono" value={settings?.branch ?? 'main'} onChange={(e) => update({ branch: e.target.value })} />
          </Field>
          <Field label={t(locale, 'admin.token')} locale={locale} hint={t(locale, 'admin.tokenHint')}>
            <input
              type="password"
              className="azt-input azt-mono"
              value={settings?.token ?? ''}
              onChange={(e) => update({ token: e.target.value })}
              autoComplete="off"
            />
          </Field>
        </div>
        <button type="button" className="azt-btn" style={{ minHeight: 44 }} onClick={() => void publish()} disabled={busy || !settings?.owner || !settings?.repo || !settings?.token}>
          {busy ? t(locale, 'common.loading') : t(locale, 'admin.publishBtn')}
        </button>
      </div>

      <div className="azt-card" style={{ padding: 20, display: 'grid', gap: 12 }}>
        <h2 style={{ margin: 0, fontSize: '1rem' }}>{t(locale, 'admin.stagedFiles')}</h2>
        <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 6, fontSize: '0.82rem' }}>
          {files.map((f) => (
            <li key={f.path} style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
              <span className="azt-mono">{f.path}</span>
              <span style={{ color: 'var(--color-ink-500)' }}>{f.content.length} bytes</span>
            </li>
          ))}
        </ul>
        {progress && (
          <p className="azt-mono" style={{ margin: 0, fontSize: '0.78rem', color: 'var(--color-ink-700)' }}>
            {progress.stage === 'start' ? t(locale, 'admin.publishing') : ''} {progress.index + 1}/{progress.total} · {progress.path}
          </p>
        )}
      </div>

      {result && (
        <div className="azt-card" style={{ padding: 20, display: 'grid', gap: 12 }}>
          <h2 style={{ margin: 0, fontSize: '1rem' }}>{t(locale, 'admin.commitOutput')}</h2>
          {result.ok ? (
            <div style={{ display: 'grid', gap: 6, fontSize: '0.82rem' }}>
              <p style={{ margin: 0, color: 'var(--color-ok)' }}>{t(locale, 'toast.published')}</p>
              <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 4 }}>
                {result.committed.map((c) => (
                  <li key={c.path} className="azt-mono">
                    {c.path} — {c.sha.slice(0, 10)}
                  </li>
                ))}
              </ul>
              {result.runUrl && (
                <a href={result.runUrl} target="_blank" rel="noopener" className="azt-chip" style={{ fontSize: '0.72rem', display: 'inline-flex' }}>
                  {locale === 'ar' ? 'متابعة العمل' : 'View workflow'}
                </a>
              )}
            </div>
          ) : (
            <p role="alert" style={{ margin: 0, color: 'var(--color-madder)' }}>
              {t(locale, 'toast.publishFailed')}: {result.error}
              {result.collidingPath && ` — ${result.collidingPath}`}
            </p>
          )}
        </div>
      )}

      <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--color-ink-500)' }}>
        {locale === 'ar' ? 'النشر لا يمسح أي محتوى أبداً؛ إذا حصل تعارض يتوقف التشغيل ويُذكر الملف المتعارض.' : 'Publish never wipes content; a 409 conflict stops the run and names the colliding file.'}
      </p>
    </div>
  );
}
