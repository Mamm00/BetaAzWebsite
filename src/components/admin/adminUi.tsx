/**
 * adminUi.tsx — shared admin primitives (§25): Field, BilingualField,
 * Modal, ConfirmDialog, Toasts, DataTable, StatCard, CompletenessMeter,
 * MarkdownEditor, ValidationList, UnsavedGuard, ConnectionStatus.
 */
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { t } from '../../lib/i18n';
import type { Locale } from '../../lib/url';

/* ---------- Toasts ---------- */

export interface ToastItem {
  id: number;
  message: string;
  kind: 'info' | 'ok' | 'error';
}

const ToastCtx = createContext<(message: string, kind?: ToastItem['kind']) => void>(() => undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const push = useCallback((message: string, kind: ToastItem['kind'] = 'info') => {
    const id = Date.now() + Math.random();
    setItems((prev) => [...prev.slice(-2), { id, message, kind }]);
    setTimeout(() => setItems((prev) => prev.filter((i) => i.id !== id)), 5000);
  }, []);

  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div aria-live="polite" style={{ position: 'fixed', insetBlockEnd: 20, insetInlineEnd: 20, display: 'grid', gap: 8, zIndex: 100, maxWidth: 'calc(100vw - 40px)' }}>
        {items.map((i) => (
          <div
            key={i.id}
            role="status"
            style={{
              padding: '10px 16px',
              background: i.kind === 'error' ? 'var(--color-madder)' : i.kind === 'ok' ? 'var(--color-ok)' : 'var(--color-ink-900)',
              color: 'var(--color-sand-50)',
              borderRadius: 'var(--azt-radius)',
              fontSize: '0.85rem',
              maxWidth: 360,
            }}
          >
            {i.message}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

export function useToast(): (message: string, kind?: ToastItem['kind']) => void {
  return useContext(ToastCtx);
}

/* ---------- Field ---------- */

export function Field({
  label,
  children,
  hint,
  locale,
}: {
  label: string;
  children: ReactNode;
  hint?: string;
  locale: Locale;
}) {
  return (
    <label style={{ display: 'grid', gap: 6 }}>
      <span style={{ fontSize: '0.85rem', color: 'var(--color-ink-700)' }}>{label}</span>
      {children}
      {hint && <span style={{ fontSize: '0.72rem', color: 'var(--color-ink-500)' }}>{hint}</span>}
    </label>
  );
}

/* ---------- BilingualField (§25) ---------- */

export function BilingualField({
  label,
  ar,
  en,
  onAr,
  onEn,
  locale,
}: {
  label: string;
  ar: string;
  en: string;
  onAr: (v: string) => void;
  onEn: (v: string) => void;
  locale: Locale;
}) {
  const complete = ar.trim() !== '' && en.trim() !== '';
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
      <Field label={`${label} (AR)`} locale={locale}>
        <input className="azt-input" value={ar} onChange={(e) => onAr(e.target.value)} />
      </Field>
      <Field label={`${label} (EN)`} locale={locale}>
        <input className="azt-input" value={en} onChange={(e) => onEn(e.target.value)} />
      </Field>
      <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button
          type="button"
          className="azt-btn azt-btn-ghost"
          style={{ minHeight: 36, fontSize: '0.78rem' }}
          onClick={() => onEn(ar)}
        >
          {locale === 'ar' ? 'نسخ AR→EN' : 'Copy AR→EN'}
        </button>
        <span style={{ fontSize: '0.72rem', color: complete ? 'var(--color-ok)' : 'var(--color-madder)' }}>
          {complete ? t(locale, 'admin.validation.ok') : t(locale, 'admin.missing')}
        </span>
      </div>
    </div>
  );
}

/* ---------- Modal (§6.7) ---------- */

export function Modal({
  open,
  title,
  onClose,
  children,
  locale,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  locale: Locale;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 90,
        background: 'rgba(12, 11, 9, 0.55)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="azt-card"
        style={{ maxWidth: 560, width: '100%', maxHeight: '85vh', overflow: 'auto', padding: 24, display: 'grid', gap: 16 }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, fontSize: '1.1rem' }}>{title}</h2>
          <button type="button" className="azt-btn azt-btn-ghost" style={{ minHeight: 36 }} onClick={onClose} aria-label={t(locale, 'common.close')}>
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

/* ---------- ConfirmDialog (§27) ---------- */

export function ConfirmDialog({
  open,
  title,
  body,
  confirmLabel,
  onConfirm,
  onClose,
  locale,
}: {
  open: boolean;
  title: string;
  body: string;
  confirmLabel: string;
  onConfirm: () => void;
  onClose: () => void;
  locale: Locale;
}) {
  return (
    <Modal open={open} title={title} onClose={onClose} locale={locale}>
      <p style={{ margin: 0, color: 'var(--color-ink-700)' }}>{body}</p>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <button type="button" className="azt-btn azt-btn-ghost" style={{ minHeight: 44 }} onClick={onClose}>
          {t(locale, 'common.cancel')}
        </button>
        <button
          type="button"
          className="azt-btn"
          style={{ minHeight: 44, background: 'var(--color-madder)', borderColor: 'var(--color-madder)' }}
          onClick={() => {
            onConfirm();
            onClose();
          }}
        >
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}

/* ---------- DataTable (§25) ---------- */

export function DataTable<T>({
  columns,
  rows,
  rowKey,
  onRowClick,
  emptyLabel,
  locale,
}: {
  columns: Array<{ key: string; label: string; sortable?: boolean }>;
  rows: T[];
  rowKey: (row: T) => string;
  onRowClick?: (row: T) => void;
  emptyLabel: string;
  locale: Locale;
}) {
  if (rows.length === 0) {
    return <p style={{ margin: 0, color: 'var(--color-ink-500)' }}>{emptyLabel}</p>;
  }
  return (
    <div className="azt-scroll-x">
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c.key} scope="col" style={{ textAlign: 'start', padding: '8px 10px', borderBottom: '1px solid var(--azt-hairline)', whiteSpace: 'nowrap' }}>
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr
              key={rowKey(r)}
              onClick={onRowClick ? () => onRowClick(r) : undefined}
              style={{ cursor: onRowClick ? 'pointer' : 'default', borderBottom: '1px solid var(--azt-hairline)' }}
            >
              {columns.map((c) => (
                <td key={c.key} style={{ padding: '8px 10px' }}>
                  {String((r as Record<string, unknown>)[c.key] ?? '')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ---------- StatCard / CompletenessMeter ---------- */

export function StatCard({ label, value, locale }: { label: string; value: string | number; locale: Locale }) {
  return (
    <div className="azt-card" style={{ padding: 18, display: 'grid', gap: 6 }}>
      <span style={{ fontSize: '0.78rem', color: 'var(--color-ink-500)' }}>{label}</span>
      <strong style={{ fontSize: '1.6rem', fontFamily: 'var(--font-mono)' }}>{value}</strong>
    </div>
  );
}

export function CompletenessMeter({ pct, label, locale }: { pct: number; label?: string; locale: Locale }) {
  return (
    <div style={{ display: 'grid', gap: 6 }}>
      {label && <span style={{ fontSize: '0.78rem', color: 'var(--color-ink-500)' }}>{label}</span>}
      <div role="img" aria-label={`${label ?? ''}: ${pct}%`} style={{ height: 8, background: 'var(--color-sand-200)', borderRadius: 999, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: pct === 100 ? 'var(--color-ok)' : 'var(--color-giza)' }} />
      </div>
    </div>
  );
}

/* ---------- MarkdownEditor (§25, journal) ---------- */

export function MarkdownEditor({
  value,
  onChange,
  preview,
  locale,
}: {
  value: string;
  onChange: (v: string) => void;
  preview: boolean;
  locale: Locale;
}) {
  if (preview) {
    return (
      <div className="azt-card" style={{ padding: 16, minHeight: 200, whiteSpace: 'pre-wrap', color: 'var(--color-ink-700)' }}>
        {value || (locale === 'ar' ? '—' : '—')}
      </div>
    );
  }
  return (
    <textarea
      className="azt-input azt-mono"
      rows={16}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem' }}
    />
  );
}

/* ---------- ValidationList (§27) ---------- */

export function ValidationList({ issues, locale }: { issues: string[]; locale: Locale }) {
  return (
    <div style={{ display: 'grid', gap: 6 }}>
      {issues.length === 0 ? (
        <span style={{ fontSize: '0.78rem', color: 'var(--color-ok)' }}>{t(locale, 'admin.validation.ok')}</span>
      ) : (
        issues.map((i, idx) => (
          <span key={idx} style={{ fontSize: '0.78rem', color: 'var(--color-madder)' }}>
            • {i}
          </span>
        ))
      )}
    </div>
  );
}

/* ---------- ConnectionStatus ---------- */

export function ConnectionStatus({ connected, locale }: { connected: boolean; locale: Locale }) {
  return (
    <span
      className="azt-chip"
      style={{
        fontSize: '0.72rem',
        background: connected ? 'var(--color-ok)' : 'var(--color-madder)',
        color: 'var(--color-sand-50)',
        borderColor: connected ? 'var(--color-ok)' : 'var(--color-madder)',
      }}
    >
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor', display: 'inline-block' }} />
      {connected ? t(locale, 'admin.connected') : t(locale, 'admin.disconnected')}
    </span>
  );
}

/* ---------- UnsavedGuard (§27) ---------- */

export function UnsavedGuard({ dirty, onDiscard, onKeep, locale }: { dirty: boolean; onDiscard: () => void; onKeep: () => void; locale: Locale }) {
  useEffect(() => {
    if (!dirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [dirty]);

  if (!dirty) return null;
  return (
    <div className="azt-card" style={{ padding: '10px 14px', display: 'flex', gap: 10, alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
      <span style={{ fontSize: '0.82rem', color: 'var(--color-madder)' }}>
        {locale === 'ar' ? 'فيه تغييرات من غير حفظ' : 'Unsaved changes'}
      </span>
      <div style={{ display: 'flex', gap: 8 }}>
        <button type="button" className="azt-btn azt-btn-ghost" style={{ minHeight: 36, fontSize: '0.78rem' }} onClick={onDiscard}>
          {t(locale, 'common.discard')}
        </button>
        <button type="button" className="azt-btn" style={{ minHeight: 36, fontSize: '0.78rem' }} onClick={onKeep}>
          {t(locale, 'common.saveDraft')}
        </button>
      </div>
    </div>
  );
}
