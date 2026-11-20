/**
 * Content access layer. Build-time JSON is the source of truth; the admin
 * overlay (drafts, §26) merges on top at runtime through useContent().
 */
import fabricsJson from '../content/fabrics.json';
import categoriesJson from '../content/categories.json';
import gradesJson from '../content/grades.json';
import galleryJson from '../content/gallery.json';
import journalJson from '../content/journal.json';
import companyJson from '../content/company.json';
import arLocale from '../content/locales/ar.json';
import enLocale from '../content/locales/en.json';
import type { Fabric, Category, Grade, GalleryImage, JournalArticle, Company } from './schema';

export const fabrics: Fabric[] = fabricsJson as unknown as Fabric[];
export const categories: Category[] = categoriesJson as unknown as Category[];
export const grades: Grade[] = gradesJson as unknown as Grade[];
export const gallery: GalleryImage[] = galleryJson as unknown as GalleryImage[];
export const journal: JournalArticle[] = journalJson as unknown as JournalArticle[];
export const company: Company = companyJson as unknown as Company;

export const localeDicts = { ar: arLocale, en: enLocale } as const;

export function getFabric(slug: string): Fabric | undefined {
  return fabrics.find((f) => f.slug === slug);
}

export function getCategory(slug: string): Category | undefined {
  return categories.find((c) => c.slug === slug);
}

export function getGrade(id: 'A' | 'B' | 'C'): Grade | undefined {
  return grades.find((g) => g.grade === id);
}

export function getJournal(slug: string): JournalArticle | undefined {
  return journal.find((j) => j.slug === slug);
}

export function fabricsByCategory(slug: string): Fabric[] {
  return fabrics.filter((f) => f.category === slug);
}

export function relatedFabrics(f: Fabric, limit = 4): Fabric[] {
  return fabrics
    .filter((o) => o.id !== f.id && (o.category === f.category || o.composition === f.composition))
    .sort((a, b) => {
      const sa = a.category === f.category ? 0 : 1;
      const sb = b.category === f.category ? 0 : 1;
      if (sa !== sb) return sa - sb;
      return a.slug.localeCompare(b.slug);
    })
    .slice(0, limit);
}

/** Distinct facet values, sorted deterministically. */
export function facetValues(field: 'grade' | 'composition' | 'availability'): string[] {
  const set = new Set(fabrics.map((f) => f[field]));
  return [...set].sort();
}

export function gradeAccent(grade: 'A' | 'B' | 'C'): string {
  return grade === 'A' ? 'ok' : grade === 'B' ? 'indigo' : 'madder';
}

/** Price in piastres → display string (integer piastres divided at render, §6.5). */
export function priceLabel(piastres: number, locale: 'ar' | 'en'): string {
  const eg = new Intl.NumberFormat('ar-EG-u-nu-latn', {
    style: 'currency',
    currency: 'EGP',
    minimumFractionDigits: 2,
  });
  return eg.format(piastres / 100);
}

/** GSM range facet bounds for the dual-thumb slider. */
export function gsmBounds(): { min: number; max: number } {
  const gsms = fabrics.map((f) => f.gsm);
  return { min: Math.min(...gsms), max: Math.max(...gsms) };
}

export function widthBounds(): { min: number; max: number } {
  const ws = fabrics.map((f) => f.widthCm);
  return { min: Math.min(...ws), max: Math.max(...ws) };
}
