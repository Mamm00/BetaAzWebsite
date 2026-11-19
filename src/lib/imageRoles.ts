/**
 * Image roles (§21.2). Every image carries exactly one role; the role
 * fixes ratio, style and negative prompt.
 */

export type ImageRole =
  | 'hero'
  | 'macro'
  | 'drape'
  | 'shade-flat'
  | 'grade-evidence'
  | 'gallery-floor'
  | 'gallery-frontage'
  | 'founder'
  | 'journal'
  | 'og'
  | 'placeholder';

export interface RoleSpec {
  role: ImageRole;
  ratio: string; // "16:9" etc.
  width: number;
  height: number;
  negative: string;
}

export const ROLES: Record<ImageRole, RoleSpec> = {
  hero: {
    role: 'hero',
    ratio: '16:9',
    width: 1600,
    height: 900,
    negative: 'text, watermark, logo, clutter, mannequin face, oversaturation, distorted weave',
  },
  macro: {
    role: 'macro',
    ratio: '4:5',
    width: 1200,
    height: 1500,
    negative: 'text, watermark, logo, clutter, mannequin face, oversaturation, distorted weave',
  },
  drape: {
    role: 'drape',
    ratio: '3:4',
    width: 1200,
    height: 1600,
    negative: 'text, watermark, logo, clutter, mannequin face, oversaturation, hard folds',
  },
  'shade-flat': {
    role: 'shade-flat',
    ratio: '1:1',
    width: 800,
    height: 800,
    negative: 'text, watermark, logo, clutter, gradient, texture noise',
  },
  'grade-evidence': {
    role: 'grade-evidence',
    ratio: '4:5',
    width: 1200,
    height: 1500,
    negative: 'text, watermark, logo, clutter, oversaturation',
  },
  'gallery-floor': {
    role: 'gallery-floor',
    ratio: '3:2',
    width: 1500,
    height: 1000,
    negative: 'text, watermark, logo, clutter, blur, oversaturation',
  },
  'gallery-frontage': {
    role: 'gallery-frontage',
    ratio: '3:2',
    width: 1500,
    height: 1000,
    negative: 'text, watermark, logo, clutter, blur, oversaturation',
  },
  founder: {
    role: 'founder',
    ratio: '4:5',
    width: 1200,
    height: 1500,
    negative: 'text, watermark, logo, clutter, oversaturation',
  },
  journal: {
    role: 'journal',
    ratio: '16:9',
    width: 1600,
    height: 900,
    negative: 'text, watermark, logo, clutter, oversaturation',
  },
  og: {
    role: 'og',
    ratio: '1200×630',
    width: 1200,
    height: 630,
    negative: 'text, watermark, logo, clutter, oversaturation',
  },
  placeholder: {
    role: 'placeholder',
    ratio: '4:5',
    width: 1200,
    height: 1500,
    negative: 'text, watermark, logo, clutter',
  },
};

export const ROLE_LIST = Object.values(ROLES);

/** Roles required per fabric record (§22.3 image plan). */
export const FABRIC_ROLES: ImageRole[] = ['hero', 'macro'];
