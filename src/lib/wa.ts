/**
 * WhatsApp templates (§20). Egyptian colloquial, not MSA.
 * Everything through encodeURIComponent — never build these by hand.
 */
import { COMPANY } from '../data/company';

export type WaTemplate = 'gradeA' | 'gradeC' | 'generic';

export function waTemplate(kind: WaTemplate, vars: {
  code?: string;
  name?: string;
  grade?: string;
  moq?: string | number;
}): string {
  switch (kind) {
    case 'gradeA':
      return (
        'مرحباً الأزهر تكس، مهتم بـ ' +
        (vars.code ?? '') +
        ' — ' +
        (vars.name ?? '') +
        ' (درجة ' +
        (vars.grade ?? 'A') +
        ')، كمية ' +
        (vars.moq ?? '') +
        ' متر. متاح؟'
      );
    case 'gradeC':
      return (
        'مرحباً، عايز أعرف تفاصيل الدفعة ' +
        (vars.code ?? '') +
        ' (درجة C) والسعر للكمية.'
      );
    case 'generic':
      return 'مرحباً الأزهر تكس، عايز أستفسر عن المتاح عندكم.';
  }
}

/** Prefill for a fabric: grade A/B use the A template, C uses the C template. */
export function fabricWa(fabric: {
  code: string;
  nameAr: string;
  grade: 'A' | 'B' | 'C';
  moq: number;
}): string {
  if (fabric.grade === 'C') {
    return waTemplate('gradeC', { code: fabric.code });
  }
  return waTemplate('gradeA', {
    code: fabric.code,
    name: fabric.nameAr,
    grade: fabric.grade,
    moq: fabric.moq,
  });
}

/** Deep link with prefilled text, on the primary WhatsApp number. */
export function waLink(text: string): string {
  return `https://wa.me/${COMPANY.whatsapp[0]}?text=${encodeURIComponent(text)}`;
}

export function waLinkFor(text: string, phone: string): string {
  return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
}
