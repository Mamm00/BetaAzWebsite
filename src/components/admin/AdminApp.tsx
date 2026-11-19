/**
 * AdminApp (§23–§27) — the authed admin shell: route guard, nav,
 * view switch, 10s draft autosave guard, logout.
 */
import { useEffect, useMemo, useState } from 'react';
import { isAuthed, touchSession } from '../../lib/adminAuth';
import { draftIndex } from '../../lib/adminContent';
import { t } from '../../lib/i18n';
import type { Locale } from '../../lib/url';
import LoginView from './LoginView';
import DashboardView from './DashboardView';
import FabricListView from './FabricListView';
import FabricEditorView from './FabricEditorView';
import GenerateView from './GenerateView';
import PublishView from './PublishView';
import TranslationsView from './TranslationsView';
import SettingsView from './SettingsView';
import { ToastProvider, UnsavedGuard } from './adminUi';

export interface Props {
  locale: Locale;
  next: string;
}

type View = 'dashboard' | 'fabrics' | 'editor' | 'generate' | 'publish' | 'translations' | 'settings';

export default function AdminApp({ locale, next }: Props) {
  const [authed, setAuthed] = useState<boolean>(() => isAuthed());
  const [view, setView] = useState<View>('dashboard');
  const [editorSlug, setEditorSlug] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (!authed) return;
    const timer = setInterval(() => {
      touchSession();
    }, 5 * 60 * 1000);
    return () => clearInterval(timer);
  }, [authed]);

  const draftCount = useMemo(() => draftIndex().length, []);

  if (!authed) {
    return (
      <ToastProvider>
        <LoginView locale={locale} next={next} onLoggedIn={() => setAuthed(true)} />
      </ToastProvider>
    );
  }

  const NAV: Array<{ id: View; label: string }> = [
    { id: 'dashboard', label: t(locale, 'nav.home') },
    { id: 'fabrics', label: t(locale, 'admin.fabrics') },
    { id: 'generate', label: t(locale, 'admin.generate') },
    { id: 'publish', label: t(locale, 'admin.publish') },
    { id: 'translations', label: t(locale, 'admin.translations') },
    { id: 'settings', label: t(locale, 'admin.settings') },
  ];

  return (
    <ToastProvider>
      <div style={{ display: 'grid', gap: 24 }}>
        <UnsavedGuard dirty={dirty} onDiscard={() => setDirty(false)} onKeep={() => setDirty(false)} locale={locale} />

        <nav aria-label={t(locale, 'admin.shell')} style={{ display: 'flex', gap: 8, flexWrap: 'wrap', borderBottom: '1px solid var(--azt-hairline)', paddingBlockEnd: 8 }}>
          {NAV.map((n) => (
            <button
              key={n.id}
              type="button"
              className={view === n.id || (n.id === 'fabrics' && view === 'editor') ? 'azt-btn' : 'azt-btn azt-btn-ghost'}
              style={{ minHeight: 40, fontSize: '0.82rem' }}
              onClick={() => setView(n.id)}
            >
              {n.label}
              {n.id === 'fabrics' && draftCount > 0 ? ` · ${draftCount}` : ''}
            </button>
          ))}
        </nav>

        {view === 'dashboard' && <DashboardView locale={locale} onNavigate={(p) => setView(p as View)} />}
        {view === 'fabrics' && (
          <FabricListView
            locale={locale}
            onOpen={(slug) => {
              setEditorSlug(slug);
              setView('editor');
            }}
            onNew={() => {
              setEditorSlug('new');
              setView('editor');
            }}
            draftMarker={(slug) => draftIndex().some((d) => d.collection === 'fabrics' && d.id === slug)}
          />
        )}
        {view === 'editor' && editorSlug && (
          <FabricEditorView locale={locale} slug={editorSlug === 'new' ? '' : editorSlug} onBack={() => setView('fabrics')} />
        )}
        {view === 'generate' && <GenerateView locale={locale} />}
        {view === 'publish' && <PublishView locale={locale} />}
        {view === 'translations' && <TranslationsView locale={locale} onNavigate={(p) => setView(p as View)} />}
        {view === 'settings' && <SettingsView locale={locale} onLoggedOut={() => setAuthed(false)} />}

        <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--color-ink-500)' }}>
          {locale === 'ar' ? 'لوحة إدارة — بيانات LIVE من JSON، المسوّدة في localStorage، والنشر عبر GitHub.' : 'Admin — LIVE data from JSON, drafts in localStorage, publish via GitHub.'}
        </p>
      </div>
    </ToastProvider>
  );
}
