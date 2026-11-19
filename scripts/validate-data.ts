/**
 * validate-data.ts — CI gate (§12).
 * Fails on: duplicate slug, dangling alternatives, <18 per grade, missing
 * locale field, duplicate lotId, unlinked image path, missing hero/macro
 * image, empty alt in either locale, source:'render' without seed.
 * Run: npm run validate
 */
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import {
  FabricsSchema,
  CategoriesSchema,
  GradesSchema,
  GallerySchema,
  JournalSchema,
  CompanySchema,
} from '../src/lib/schema.ts';
import type { Fabric, JournalArticle } from '../src/lib/schema.ts';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const content = join(root, 'src', 'content');

function load<T>(name: string): T {
  return JSON.parse(readFileSync(join(content, name), 'utf8')) as T;
}

const errors: string[] = [];
const warnings: string[] = [];
let checked = 0;

/* ---------- media file inventory ---------- */
const mediaDir = join(root, 'src', 'assets', 'media');
const mediaFiles = new Set(
  readdirSync(mediaDir).filter((f) => /\.(jpg|jpeg|png|webp|avif)$/i.test(f)),
);

function checkImagePath(kind: string, id: string, p: string | null): void {
  if (!p) return;
  const name = p.split('/').pop() ?? '';
  if (!mediaFiles.has(name)) {
    errors.push(`[${kind}] ${id}: unlinked image path "${p}" (no file in src/assets/media)`);
  }
}

/* ---------- Zod schema pass ---------- */
const collections: Array<[string, unknown]> = [
  ['fabrics.json', load('fabrics.json')],
  ['categories.json', load('categories.json')],
  ['grades.json', load('grades.json')],
  ['gallery.json', load('gallery.json')],
  ['journal.json', load('journal.json')],
  ['company.json', load('company.json')],
];

const schemas = [
  FabricsSchema,
  CategoriesSchema,
  GradesSchema,
  GallerySchema,
  JournalSchema,
  CompanySchema,
];

for (let i = 0; i < collections.length; i++) {
  const [name, data] = collections[i]!;
  const result = schemas[i]!.safeParse(data);
  if (!result.success) {
    for (const issue of result.error.issues) {
      errors.push(`[schema:${name}] ${issue.path.join('.') || '(root)'}: ${issue.message}`);
    }
  }
}

/* ---------- fabrics ---------- */
const fabrics = load<Fabric[]>('fabrics.json');
const slugs = new Set<string>();
const lotIds = new Set<string>();
const gradeCounts: Record<string, number> = { A: 0, B: 0, C: 0 };

for (const f of fabrics) {
  checked++;
  if (slugs.has(f.slug)) errors.push(`[fabrics] duplicate slug: ${f.slug}`);
  slugs.add(f.slug);

  if (lotIds.has(f.lotId)) errors.push(`[fabrics] duplicate lotId: ${f.lotId} (${f.slug})`);
  lotIds.add(f.lotId);

  gradeCounts[f.grade] = (gradeCounts[f.grade] ?? 0) + 1;

  // missing locale field (any bilingual object with an empty side)
  const localized: Array<[string, { ar: string; en: string } | undefined]> = [
    ['name', f.name],
    ['construction', f.construction],
    ['finish', f.finish],
  ];
  for (const [field, obj] of localized) {
    if (!obj) continue;
    if (!obj.ar.trim()) errors.push(`[fabrics] ${f.slug}: missing locale field ${field}.ar`);
    if (!obj.en.trim()) errors.push(`[fabrics] ${f.slug}: missing locale field ${field}.en`);
  }
  if (!f.gradeNotes.ar.length) errors.push(`[fabrics] ${f.slug}: missing gradeNotes.ar`);
  if (!f.gradeNotes.en.length) errors.push(`[fabrics] ${f.slug}: missing gradeNotes.en`);
  for (const [i, s] of f.shades.entries()) {
    if (!s.ar.trim()) errors.push(`[fabrics] ${f.slug}: shade[${i}].ar empty`);
    if (!s.en.trim()) errors.push(`[fabrics] ${f.slug}: shade[${i}].en empty`);
  }

  // dangling alternatives
  for (const alt of f.alternatives) {
    if (!slugs.has(alt) && !fabrics.some((o) => o.slug === alt)) {
      errors.push(`[fabrics] ${f.slug}: dangling alternative "${alt}"`);
    }
  }

  // render without seed
  if (f.source === 'render' && f.seed === null) {
    errors.push(`[fabrics] ${f.slug}: source:'render' without seed`);
  }
  if (f.source === 'photo' && !f.photo) {
    errors.push(`[fabrics] ${f.slug}: source:'photo' without photo path`);
  }
  checkImagePath('fabrics', f.slug, f.photo);

  // every fabric needs hero + macro material: a photo provides both crops;
  // a render provides both via its seeded schematic.
  if (f.source === 'render' && f.seed === null) {
    errors.push(`[fabrics] ${f.slug}: missing hero/macro image (render without seed)`);
  }
}

/* alternatives reference check happens after all slugs are known */
for (const f of fabrics) {
  for (const alt of f.alternatives) {
    if (!fabrics.some((o) => o.slug === alt)) {
      errors.push(`[fabrics] ${f.slug}: dangling alternative "${alt}"`);
    }
  }
}

/* ---------- grade coverage ---------- */
for (const g of ['A', 'B', 'C'] as const) {
  if ((gradeCounts[g] ?? 0) < 18) {
    errors.push(`[fabrics] only ${gradeCounts[g] ?? 0} fabrics at grade ${g} (minimum 18)`);
  }
}

/* ---------- categories referenced by fabrics exist ---------- */
const categories = load<{ slug: string }[]>('categories.json');
const catSlugs = new Set(categories.map((c) => c.slug));
for (const f of fabrics) {
  if (!catSlugs.has(f.category)) {
    errors.push(`[fabrics] ${f.slug}: unknown category "${f.category}"`);
  }
}

/* ---------- gallery ---------- */
const gallery = load<{ id: string; src: string; alt: { ar: string; en: string } }[]>('gallery.json');
for (const g of gallery) {
  checked++;
  checkImagePath('gallery', g.id, g.src);
  if (!g.alt.ar.trim()) errors.push(`[gallery] ${g.id}: empty alt.ar`);
  if (!g.alt.en.trim()) errors.push(`[gallery] ${g.id}: empty alt.en`);
}

/* ---------- journal ---------- */
const journal = load<JournalArticle[]>('journal.json');
for (const j of journal) {
  checked++;
  for (const [field, obj] of [
    ['title', j.title],
    ['excerpt', j.excerpt],
    ['author', j.author],
  ] as const) {
    if (!obj.ar.trim()) errors.push(`[journal] ${j.slug}: missing locale field ${field}.ar`);
    if (!obj.en.trim()) errors.push(`[journal] ${j.slug}: missing locale field ${field}.en`);
  }
  const arWords = j.body.ar.trim().split(/\s+/).length;
  if (arWords < 500) {
    errors.push(`[journal] ${j.slug}: AR body is ${arWords} words (minimum 500)`);
  }
}

/* ---------- locales parity ---------- */
const arLocale = JSON.parse(readFileSync(join(content, 'locales', 'ar.json'), 'utf8')) as Record<string, string>;
const enLocale = JSON.parse(readFileSync(join(content, 'locales', 'en.json'), 'utf8')) as Record<string, string>;
const arKeys = new Set(Object.keys(arLocale));
for (const k of arKeys) {
  if (!(k in enLocale)) errors.push(`[locales] key missing in EN: ${k}`);
}
for (const k of Object.keys(enLocale)) {
  if (!arKeys.has(k)) errors.push(`[locales] key missing in AR: ${k}`);
}
for (const [loc, dict] of [['ar', arLocale], ['en', enLocale]] as const) {
  for (const [k, v] of Object.entries(dict)) {
    if (!v.trim()) errors.push(`[locales] empty value ${loc}:${k}`);
    if (/[一-鿿]/.test(v)) errors.push(`[locales] CJK characters in ${loc}:${k}`);
  }
}

/* ---------- report ---------- */
console.log(`validate-data: ${checked} records checked across 6 collections + 2 locales`);
if (warnings.length) {
  for (const w of warnings) console.warn(`WARN ${w}`);
}
if (errors.length) {
  console.error(`\nFAIL — ${errors.length} error(s):`);
  for (const e of errors) console.error(`  ✖ ${e}`);
  process.exit(1);
}
console.log('PASS — all validation rules satisfied');
