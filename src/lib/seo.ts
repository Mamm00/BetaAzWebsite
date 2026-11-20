/**
 * SEO helpers — canonical / hreflang pairs, JSON-LD escaping (§6.8, §17).
 */
import { COMPANY } from '../data/company';
import { absUrl, url, type Locale } from './url';

/** Escape a JSON-LD payload so "</script>" cannot break out (§6.8). */
export function jsonld(obj: unknown): string {
  return JSON.stringify(obj)
    .replaceAll('<', '\\u003c')
    .replaceAll('>', '\\u003e')
    .replaceAll('&', '\\u0026');
}

export interface SeoMeta {
  title: string;
  description: string;
  /** route path WITHOUT locale prefix, e.g. "fabrics/crepe-georgette-a" */
  path: string;
  locale: Locale;
  type?: 'website' | 'product' | 'article';
  origin?: string;
}

export function canonical(meta: SeoMeta): string {
  const origin = meta.origin ?? 'https://mamm00.github.io';
  return absUrl(`${meta.locale}/${meta.path}`, origin);
}

export function hreflangPairs(meta: SeoMeta): Array<{ rel: string; hreflang: string; href: string }> {
  const origin = meta.origin ?? 'https://mamm00.github.io';
  const pairs: Array<{ rel: string; hreflang: string; href: string }> = [];
  const arHref = absUrl(`ar/${meta.path}`, origin);
  const enHref = absUrl(`en/${meta.path}`, origin);
  if (meta.locale === 'ar') {
    pairs.push({ rel: 'canonical', hreflang: '', href: arHref });
    pairs.push({ rel: 'alternate', hreflang: 'en', href: enHref });
    pairs.push({ rel: 'alternate', hreflang: 'x-default', href: arHref });
  } else {
    pairs.push({ rel: 'canonical', hreflang: '', href: enHref });
    pairs.push({ rel: 'alternate', hreflang: 'ar', href: arHref });
    pairs.push({ rel: 'alternate', hreflang: 'x-default', href: arHref });
  }
  return pairs;
}

export function organizationJsonld(): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: COMPANY.name,
    founder: { '@type': 'Person', name: COMPANY.founder.name },
    telephone: [COMPANY.phone1, COMPANY.phone2],
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Zagazig',
      addressRegion: 'Sharkia',
      addressCountry: 'EG',
      streetAddress: COMPANY.addressEn,
    },
  };
}

export function localBusinessJsonld(): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: COMPANY.galleryName,
    telephone: [COMPANY.phone1, COMPANY.phone2],
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Zagazig',
      addressRegion: 'Sharkia',
      addressCountry: 'EG',
      streetAddress: COMPANY.addressEn,
    },
    openingHoursSpecification: COMPANY.hours.map((h) => ({
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: h.day,
      opens: h.from,
      closes: h.to,
    })),
    hasMap: 'https://maps.google.com/?q=Ziraa,+Zagazig,+Sharkia,+Egypt',
  };
}

/** Internal path helper re-exported for pages. */
export { url };
