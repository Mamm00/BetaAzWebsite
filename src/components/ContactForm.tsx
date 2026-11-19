/**
 * ContactForm — builds a WhatsApp deep link locally; nothing is posted
 * anywhere (static site). Validates on blur, never blocks submission.
 */
import { useState } from 'react';
import { t } from '../lib/i18n';
import { waLink } from '../lib/wa';
import type { Locale } from '../lib/url';

export interface Props {
  locale: Locale;
}

export default function ContactForm({ locale }: Props) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; phone?: string }>({});

  function onBlur(field: 'name' | 'phone') {
    const next: typeof errors = {};
    if (field === 'name' && !name.trim()) next.name = locale === 'ar' ? 'الاسم مطلوب' : 'Name is required';
    if (field === 'phone' && !/^\+?[\d\s-]{6,}$/.test(phone.trim())) next.phone = locale === 'ar' ? 'الرقم مش صحيح' : 'Phone is not valid';
    setErrors(next);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const finalErrors: typeof errors = {};
    if (!name.trim()) finalErrors.name = locale === 'ar' ? 'الاسم مطلوب' : 'Name is required';
    if (!/^\+?[\d\s-]{6,}$/.test(phone.trim())) finalErrors.phone = locale === 'ar' ? 'الرقم مش صحيح' : 'Phone is not valid';
    setErrors(finalErrors);
    if (Object.keys(finalErrors).length > 0) return;
    const text = `${name.trim()}: ${message.trim() || t(locale, 'wa.generic')}`;
    window.location.href = waLink(text);
    setSent(true);
  }

  if (sent) {
    return (
      <div role="status" style={{ display: 'grid', gap: 12, padding: '12px 0' }}>
        <p style={{ margin: 0, color: 'var(--color-ok)' }}>{t(locale, 'contact.formSent')}</p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} noValidate style={{ display: 'grid', gap: 16 }}>
      <label style={{ display: 'grid', gap: 6 }}>
        <span style={{ fontSize: '0.85rem' }}>{t(locale, 'contact.formName')}</span>
        <input
          className="azt-input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={() => onBlur('name')}
          placeholder={t(locale, 'contact.formNamePlaceholder')}
          aria-invalid={Boolean(errors.name)}
        />
        {errors.name && <span style={{ color: 'var(--color-madder)', fontSize: '0.78rem' }}>{errors.name}</span>}
      </label>
      <label style={{ display: 'grid', gap: 6 }}>
        <span style={{ fontSize: '0.85rem' }}>{t(locale, 'contact.formPhone')}</span>
        <input
          className="azt-input"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          onBlur={() => onBlur('phone')}
          placeholder={t(locale, 'contact.formPhonePlaceholder')}
          aria-invalid={Boolean(errors.phone)}
        />
        {errors.phone && <span style={{ color: 'var(--color-madder)', fontSize: '0.78rem' }}>{errors.phone}</span>}
      </label>
      <label style={{ display: 'grid', gap: 6 }}>
        <span style={{ fontSize: '0.85rem' }}>{t(locale, 'contact.formMessage')}</span>
        <textarea
          className="azt-input"
          rows={4}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={t(locale, 'contact.formMessagePlaceholder', { code: 'AZT-001', grade: 'A' })}
        />
      </label>
      <button type="submit" className="azt-btn" style={{ justifySelf: 'start' }}>
        {t(locale, 'contact.formSend')}
      </button>
    </form>
  );
}
