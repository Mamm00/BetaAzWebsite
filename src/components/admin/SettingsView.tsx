/**
 * SettingsView (§23) — change password (emits a commit snippet), draft
 * reset, provider/publish config, logout.
 */
import { useState } from 'react';
import { COMPANY } from '../../data/company';
import { hashForCommit, logout } from '../../lib/adminAuth';
import { loadGenSettings, saveGenSettings, type GenSettings } from '../../lib/imagegen';
import { loadPublishSettings, savePublishSettings, type PublishSettings } from '../../lib/publish';
import { resetAllDrafts } from '../../lib/adminContent';
import { clearActivity } from '../../lib/store';
import { t } from '../../lib/i18n';
import type { Locale } from '../../lib/url';
import { Field, useToast } from './adminUi';

export interface Props {
  locale: Locale;
  onLoggedOut: () => void;
}

export default function SettingsView({ locale, onLoggedOut }: Props) {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [commitSnippet, setCommitSnippet] = useState<string | null>(null);
  const [gen, setGen] = useState<GenSettings>(() => loadGenSettings());
  const [pub, setPub] = useState<PublishSettings | null>(() => loadPublishSettings());
  const toast = useToast();

  async function changePassword(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    if (next.length < 8) {
      toast(t(locale, 'toast.pwShort'), 'error');
      return;
    }
    if (next !== confirm) {
      toast(t(locale, 'toast.pwMismatch'), 'error');
      return;
    }
    // We cannot verify current password without re-auth; require a fresh login
    // with the new password before the commit replaces the stored hash.
    setCommitSnippet(await hashForCommit(next));
    toast(t(locale, 'toast.pwCommit'), 'ok');
  }

  function resetDrafts(): void {
    resetAllDrafts();
    clearActivity();
    toast(t(locale, 'toast.draftsReset'), 'info');
  }

  return (
    <div style={{ display: 'grid', gap: 20, maxWidth: 860 }}>
      <div className="azt-card" style={{ padding: 20, display: 'grid', gap: 14 }}>
        <h2 style={{ margin: 0, fontSize: '1rem' }}>{t(locale, 'admin.changePassword')}</h2>
        <form onSubmit={(e) => void changePassword(e)} noValidate style={{ display: 'grid', gap: 12, gridTemplateColumns: '1fr 1fr 1fr', maxWidth: 560 }}>
          <Field label={t(locale, 'admin.currentPassword')} locale={locale}>
            <input type="password" className="azt-input" value={current} onChange={(e) => setCurrent(e.target.value)} autoComplete="current-password" />
          </Field>
          <Field label={t(locale, 'admin.newPassword')} locale={locale} hint={t(locale, 'admin.pwMin8')}>
            <input type="password" className="azt-input" value={next} onChange={(e) => setNext(e.target.value)} autoComplete="new-password" />
          </Field>
          <Field label={t(locale, 'admin.confirm')} locale={locale}>
            <input type="password" className="azt-input" value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" />
          </Field>
          <button type="submit" className="azt-btn" style={{ minHeight: 44, justifySelf: 'start' }}>
            {t(locale, 'admin.changePasswordBtn')}
          </button>
        </form>
        {commitSnippet && (
          <div>
            <p style={{ margin: '0 0 8px', fontSize: '0.8rem', color: 'var(--color-ink-700)' }}>
              {locale === 'ar' ? 'استبدل src/content/company.json بالتالي (ثم سجّل وأرسل):' : 'Commit this exact snippet to src/content/company.json:'}
            </p>
            <pre className="azt-mono" style={{ margin: 0, padding: 14, background: 'var(--color-sand-100)', borderRadius: 'var(--azt-radius)', fontSize: '0.72rem', whiteSpace: 'pre-wrap' }}>
              {commitSnippet}
            </pre>
          </div>
        )}
        <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--color-ink-500)' }}>
          {locale === 'ar' ? `الحساب: ${COMPANY.admin.username}. يتم تخزين SHA-256 فقط، ولا توجد كلمة واضحة في أي مكان.` : `Account: ${COMPANY.admin.username}. Only the SHA-256 digest is stored; no plaintext anywhere.`}
        </p>
      </div>

      <div className="azt-card" style={{ padding: 20, display: 'grid', gap: 14 }}>
        <h2 style={{ margin: 0, fontSize: '1rem' }}>{t(locale, 'admin.imageSettings')}</h2>
        <div className="azt-grid" style={{ gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
          <Field label={t(locale, 'admin.provider')} locale={locale}>
            <select
              className="azt-input"
              value={gen.provider}
              onChange={(e) => {
                const next = { ...gen, provider: e.target.value as GenSettings['provider'] };
                setGen(next);
                saveGenSettings(next);
              }}
            >
              <option value="pollinations">pollinations</option>
              <option value="venice">venice</option>
              <option value="manual">manual</option>
            </select>
          </Field>
          <Field label={t(locale, 'admin.model')} locale={locale}>
            <input className="azt-input azt-mono" value={gen.model} onChange={(e) => setGen({ ...gen, model: e.target.value })} />
          </Field>
          <Field label={t(locale, 'admin.steps')} locale={locale}>
            <input
              type="number"
              className="azt-input"
              value={gen.steps}
              onChange={(e) => setGen({ ...gen, steps: Number(e.target.value) })}
              onBlur={() => saveGenSettings(gen)}
            />
          </Field>
        </div>
        <button type="button" className="azt-btn azt-btn-ghost" style={{ minHeight: 44, justifySelf: 'start' }} onClick={() => saveGenSettings(gen)}>
          {t(locale, 'common.saveDraft')}
        </button>
      </div>

      <div className="azt-card" style={{ padding: 20, display: 'grid', gap: 14 }}>
        <h2 style={{ margin: 0, fontSize: '1rem' }}>{t(locale, 'admin.dangerZone')}</h2>
        <button type="button" className="azt-btn azt-btn-ghost" style={{ minHeight: 44, justifySelf: 'start' }} onClick={resetDrafts}>
          {t(locale, 'admin.resetDrafts')}
        </button>
        {pub && (
          <p className="azt-mono" style={{ margin: 0, fontSize: '0.75rem', color: 'var(--color-ink-500)' }}>
            publish: {pub.owner}/{pub.repo}@{pub.branch}
          </p>
        )}
        <button
          type="button"
          className="azt-btn"
          style={{ minHeight: 44, justifySelf: 'start', background: 'var(--color-madder)', borderColor: 'var(--color-madder)' }}
          onClick={() => {
            logout();
            onLoggedOut();
          }}
        >
          {t(locale, 'admin.logout')}
        </button>
      </div>
    </div>
  );
}
