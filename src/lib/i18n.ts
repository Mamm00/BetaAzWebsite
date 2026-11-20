/**
 * i18n — locale dictionaries and the t() helper (§15).
 * Arabic is authored first. A missing key renders the AR string,
 * never the raw key (§19 anti-patterns).
 */
import arDict from '../content/locales/ar.json';
import enDict from '../content/locales/en.json';
import type { Locale } from './url';

type Dict = Record<string, string>;

const dicts: Record<Locale, Dict> = {
  ar: arDict as Dict,
  en: enDict as Dict,
};

/** Translate a key for a locale. Falls back AR → key (never raw key). */
export function t(locale: Locale, key: string, vars?: Record<string, string | number>): string {
  let s: string | undefined = dicts[locale][key];
  if (s === undefined) s = dicts.ar[key];
  if (s === undefined) return key;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      s = s.replaceAll(`{${k}}`, String(v));
    }
  }
  return s;
}

/** Both locales for a key — used by BilingualField and translations screen. */
export function pair(key: string): { ar: string; en: string } {
  return { ar: dicts.ar[key] ?? '', en: dicts.en[key] ?? '' };
}

export function keysOf(locale: Locale): string[] {
  return Object.keys(dicts[locale]);
}

/** Plural-ish count formatter: {count} + results keys. */
export function resultsLabel(locale: Locale, count: number): string {
  if (count === 1) return t(locale, 'common.results_one');
  return t(locale, 'common.results_other');
}
