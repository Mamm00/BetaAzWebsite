/**
 * promptTemplate.ts — per-role prompt templates with {{tokens}} (§22.1).
 * Negative prompts are appended automatically from the role spec.
 */
import { ROLES, type ImageRole } from './imageRoles';
import type { Fabric } from './schema';

export interface PromptTokens {
  composition: string;
  construction: string;
  gsm: string;
  shade: string;
  grade: string;
  category: string;
  name: string;
}

export function tokensFor(fabric: Fabric, locale: 'ar' | 'en'): PromptTokens {
  return {
    composition: fabric.composition,
    construction: locale === 'ar' ? fabric.construction.ar : fabric.construction.en,
    gsm: `${fabric.gsm} g/m²`,
    shade: fabric.shades[0]?.hex ?? '#C8A45C',
    grade: fabric.grade,
    category: fabric.category,
    name: locale === 'ar' ? fabric.name.ar : fabric.name.en,
  };
}

const TEMPLATES: Record<ImageRole, string> = {
  hero: 'Wide hero shot of {{name}} fabric ({{composition}}), full bolt on a fabric gallery shelf, soft directional studio light, {{shade}} tones, {{gsm}}, {{construction}}',
  macro: 'Extreme macro plate of {{name}} fabric weave ({{composition}}), thread-level detail, {{shade}} colour, {{construction}}, {{gsm}}, studio plate shot',
  drape: 'Folded drape of {{name}} fabric ({{composition}}), soft folds over a surface, {{shade}} tones, {{gsm}}, {{construction}}',
  'shade-flat': 'Flat swatch of {{name}} fabric, single {{shade}} colour, even studio light, minimal',
  'grade-evidence': 'Fabric quality evidence plate of {{name}} ({{composition}}), grade {{grade}}, {{shade}} tones, macro view',
  'gallery-floor': 'Fabric gallery floor with bolts on shelves, warm store light, organised rows',
  'gallery-frontage': 'Gallery storefront, signage, street view, daylight',
  founder: 'Portrait of a fabric gallery founder in a fabric warehouse, natural light',
  journal: 'Textile studio scene for a journal article, {{composition}} fabric detail',
  og: 'Social card for {{name}} fabric, {{composition}}, {{shade}} palette, clean composition',
  placeholder: 'Placeholder textile plate for {{name}}, {{composition}}, {{shade}}',
};

/** Grade guidance goes into the prompt so renders approximate the grade (§21.1). */
function gradeGuidance(grade: string): string {
  if (grade === 'A') return 'flawless, tight uniform weave, consistent dye';
  if (grade === 'B') return 'slight weave variation, honest mid-quality hand';
  return 'slight weave irregularity, honest defect, clearance lot';
}

export function templateFor(role: ImageRole, tokens: PromptTokens): string {
  let tpl = TEMPLATES[role];
  for (const [k, v] of Object.entries(tokens)) {
    tpl = tpl.replaceAll(`{{${k}}}`, v);
  }
  tpl = `${tpl}, ${gradeGuidance(tokens.grade)}`;
  return tpl;
}

export function negativeFor(role: ImageRole): string {
  return ROLES[role].negative;
}
