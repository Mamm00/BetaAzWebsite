/**
 * url() — the single path helper (§6.1).
 * Every internal href/src/srcset/content goes through this.
 * No hardcoded leading "/" outside this helper.
 */

/** Normalise a path and prefix it with the configured base path. */
export function url(p: string): string {
  const base: string = import.meta.env.BASE_URL || '/';
  const clean = p === '' || p === '/' ? '' : p.replace(/^\/+/, '').replace(/\/+$/, '');
  // Collapse the base's trailing slash and rebuild.
  const baseDir = base.replace(/\/+$/, '');
  const suffix = clean === '' ? '' : `/${clean}`;
  return `${baseDir}${suffix}/`;
}

/** Absolute URL for internal links (for hreflang, canonical, sitemap). */
export function absUrl(p: string, origin: string): string {
  return `${origin.replace(/\/+$/, '')}${url(p)}`;
}

/** Locale-prefixed path: locale is 'ar' | 'en'. Arabic is the default locale. */
export function locUrl(locale: Locale, p: string): string {
  if (locale === 'ar' && p === '') return url('');
  return url(`${locale}${p ? `/${p.replace(/^\/+|\/+$/g, '')}` : ''}`);
}

export type Locale = 'ar' | 'en';

export const LOCALES: readonly Locale[] = ['ar', 'en'] as const;

export function otherLocale(l: Locale): Locale {
  return l === 'ar' ? 'en' : 'ar';
}

/** Encode a slug segment (Arabic passes through encodeURIComponent, §6.8). */
export function slugPath(...segments: string[]): string {
  return segments.map((s) => encodeURIComponent(s)).join('/');
}
