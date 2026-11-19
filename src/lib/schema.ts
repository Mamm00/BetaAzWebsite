/**
 * Zod schemas for every content collection (§12).
 * Used at build time and on every runtime load (admin overlay, content hook).
 */
import { z } from 'zod';

export const LOCALE_TEXT = z.object({
  ar: z.string().min(1),
  en: z.string().min(1),
});

const SLUG = z
  .string()
  .min(2)
  .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'slug must be latin, lowercase, hyphenated, ASCII');

export const GradeEnum = z.enum(['A', 'B', 'C']);

export const FabricSchema = z.object({
  id: z.string().min(1),
  slug: SLUG,
  code: z.string().regex(/^AZT-\d{3}$/),
  lotId: z.string().regex(/^LT-\d{2}-[ABC]$/),
  name: LOCALE_TEXT,
  grade: GradeEnum,
  category: z.string().min(1),
  composition: z.string().min(1),
  construction: LOCALE_TEXT,
  gsm: z.number().int().positive(),
  widthCm: z.number().int().positive(),
  finish: LOCALE_TEXT,
  shades: z.array(
    z.object({
      ar: z.string().min(1),
      en: z.string().min(1),
      hex: z.string().regex(/^#[0-9a-fA-F]{6}$/),
    }),
  ).min(1),
  pricePerMetre: z.number().int().positive(),
  moqM: z.number().int().positive(),
  availability: z.enum(['in-stock', 'low-stock', 'out-of-stock']),
  stockMetres: z.number().int().nonnegative(),
  source: z.enum(['photo', 'render']),
  seed: z.number().int().positive().nullable(),
  photo: z.string().nullable(),
  alternatives: z.array(SLUG),
  gradeNotes: z.object({
    ar: z.array(z.string().min(1)).min(3),
    en: z.array(z.string().min(1)).min(3),
  }),
  bench: z.object({
    waterLkg: z.number().positive(),
    carbonKg: z.number().positive(),
    costIndex: z.number().positive(),
  }),
});

export const CategorySchema = z.object({
  id: z.string().min(1),
  slug: SLUG,
  name: LOCALE_TEXT,
  description: LOCALE_TEXT,
});

export const GradeSchema = z.object({
  id: z.enum(['A', 'B', 'C']),
  grade: GradeEnum,
  name: LOCALE_TEXT,
  tag: LOCALE_TEXT,
  description: LOCALE_TEXT,
  priceImplication: LOCALE_TEXT,
  typicalBuyer: LOCALE_TEXT,
  bullets: z.object({
    ar: z.array(z.string().min(1)).min(3),
    en: z.array(z.string().min(1)).min(3),
  }),
  accent: z.enum(['ok', 'indigo', 'madder']),
});

export const GalleryItemSchema = z.object({
  id: z.string().min(1),
  role: z.enum([
    'hero',
    'macro',
    'drape',
    'shade-flat',
    'grade-evidence',
    'gallery-floor',
    'gallery-frontage',
    'founder',
    'journal',
    'og',
    'placeholder',
  ]),
  src: z.string().min(1),
  source: z.enum(['photo', 'render']),
  alt: LOCALE_TEXT,
  caption: LOCALE_TEXT,
});

export const JournalItemSchema = z.object({
  id: z.string().min(1),
  slug: SLUG,
  title: LOCALE_TEXT,
  excerpt: LOCALE_TEXT,
  minRead: z.number().int().positive(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  author: LOCALE_TEXT,
  coverRole: z.string().min(1),
  body: z.object({
    ar: z.string().min(1500, 'article body must be 500+ words'),
    en: z.string().min(1200),
  }),
});

export const CompanySchema = z.object({
  name: z.string().min(1),
  nameAr: z.string().min(1),
  galleryName: z.string().min(1),
  galleryNameAr: z.string().min(1),
  address: LOCALE_TEXT,
  landmark: LOCALE_TEXT,
  founder: LOCALE_TEXT,
  phones: z
    .array(
      z.object({
        label: z.string().min(1),
        display: z.string().min(1),
        href: z.string().regex(/^tel:\+?\d+$/),
      }),
    )
    .min(1),
  whatsapp: z.array(z.string().regex(/^\+?\d+$/)).min(1),
  hoursAssumed: z.boolean(),
  hours: z.array(
    z.object({
      day: z.enum(['sat', 'sun', 'mon', 'tue', 'wed', 'thu', 'fri']),
      from: z.string().regex(/^\d{2}:\d{2}$/),
      to: z.string().regex(/^\d{2}:\d{2}$/),
    }),
  ),
  admin: z.object({
    username: z.string().min(1),
    passwordHash: z.string().regex(/^[0-9a-f]{64}$/),
  }),
});

export const LocaleSchema = z.record(z.string(), z.string());

export const FabricsSchema = z.array(FabricSchema);
export const CategoriesSchema = z.array(CategorySchema);
export const GradesSchema = z.array(GradeSchema);
export const GallerySchema = z.array(GalleryItemSchema);
export const JournalSchema = z.array(JournalItemSchema);

export type Fabric = z.infer<typeof FabricSchema>;
export type Category = z.infer<typeof CategorySchema>;
export type Grade = z.infer<typeof GradeSchema>;
export type GalleryImage = z.infer<typeof GalleryItemSchema>;
export type JournalArticle = z.infer<typeof JournalItemSchema>;
export type Company = z.infer<typeof CompanySchema>;
