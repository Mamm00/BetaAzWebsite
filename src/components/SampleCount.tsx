/**
 * SampleCount — header badge with the live sample-list count (§13).
 * Reads through the store; listens for azt:store to update.
 */
import { useEffect, useState } from 'react';
import { getSamples, onStoreChange } from '../lib/store';
import { locUrl, type Locale } from '../lib/url';
import { t } from '../lib/i18n';

export interface Props {
  locale: Locale;
}

export default function SampleCount({ locale }: Props) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    setCount(getSamples().length);
    const off = onStoreChange(() => setCount(getSamples().length));
    return off;
  }, []);

  return (
    <a
      href={locUrl(locale, 'sample-list')}
      className="azt-sample-count"
      aria-label={`${t(locale, 'nav.sampleList')}: ${count}`}
      style={{
        position: 'fixed',
        insetBlockEnd: 20,
        insetInlineEnd: 20,
        zIndex: 40,
        display: count > 0 ? 'inline-flex' : 'none',
        alignItems: 'center',
        gap: 8,
        minHeight: 44,
        padding: '8px 14px',
        background: 'var(--color-ink-900)',
        color: 'var(--color-sand-50)',
        borderRadius: 'var(--azt-radius)',
        textDecoration: 'none',
        fontSize: '0.85rem',
        fontFamily: 'var(--font-mono)',
      }}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true" focusable="false">
        <path d="M6 4h9l4 4v12a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1Z" />
        <path d="M9 13h6M9 17h4" />
      </svg>
      {count}
    </a>
  );
}
