/**
 * LoginView (§23) — honest auth UI: the curtain, not a vault.
 */
import { useState } from 'react';
import { COMPANY } from '../../data/company';
import { login, remainingLockout } from '../../lib/adminAuth';
import { t } from '../../lib/i18n';
import type { Locale } from '../../lib/url';
import { useToast } from './adminUi';

export interface Props {
  locale: Locale;
  next: string;
  onLoggedIn: () => void;
}

export default function LoginView({ locale, next, onLoggedIn }: Props) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lockoutMs = remainingLockout();
  const toast = useToast();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    const res = await login(username, password);
    setBusy(false);
    if (res.ok) {
      toast(t(locale, 'toast.loginOk'), 'ok');
      onLoggedIn();
      return;
    }
    if (res.reason === 'locked') {
      setError(t(locale, 'toast.lockedOut'));
      return;
    }
    setError(t(locale, 'toast.loginFailed'));
  }

  return (
    <div style={{ maxWidth: 420, margin: '40px auto', display: 'grid', gap: 16 }}>
      <div>
        <h1 style={{ margin: 0, fontSize: '1.5rem' }}>{t(locale, 'admin.login')}</h1>
        <p style={{ margin: '8px 0 0', fontSize: '0.8rem', color: 'var(--color-ink-500)' }}>
          {t(locale, 'admin.loginHint')}
        </p>
      </div>
      <form onSubmit={submit} noValidate style={{ display: 'grid', gap: 12 }}>
        <label style={{ display: 'grid', gap: 6 }}>
          <span style={{ fontSize: '0.85rem' }}>{t(locale, 'admin.username')}</span>
          <input className="azt-input" value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" />
        </label>
        <label style={{ display: 'grid', gap: 6 }}>
          <span style={{ fontSize: '0.85rem' }}>{t(locale, 'admin.password')}</span>
          <input className="azt-input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
        </label>
        {error && <p role="alert" style={{ margin: 0, color: 'var(--color-madder)', fontSize: '0.82rem' }}>{error}</p>}
        {lockoutMs > 0 && (
          <p role="alert" style={{ margin: 0, color: 'var(--color-madder)', fontSize: '0.82rem' }}>
            {t(locale, 'toast.lockedOut')}
          </p>
        )}
        <button type="submit" className="azt-btn" style={{ minHeight: 44 }} disabled={busy || lockoutMs > 0}>
          {busy ? t(locale, 'common.loading') : t(locale, 'admin.loginBtn')}
        </button>
      </form>
      <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--color-ink-500)' }}>
        {locale === 'ar' ? `حساب واحد: ${COMPANY.admin.username}. الكلمة مخزّنة كـ SHA-256 فقط.` : `Single account: ${COMPANY.admin.username}. The password is stored only as a SHA-256 digest.`}
      </p>
      <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--color-ink-500)' }}>
        {next ? `next=${next}` : ''}
      </p>
    </div>
  );
}
