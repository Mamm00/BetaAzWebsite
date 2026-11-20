/**
 * Media manifest — real photography imported through astro:assets (§6.1).
 * Keyed by bare filename; content JSON references "/media/<file>".
 */
import f01 from './fabric-photo-01.jpg';
import f02 from './fabric-photo-02.jpg';
import f03 from './fabric-photo-03.jpg';
import f04 from './fabric-photo-04.jpg';
import f05 from './fabric-photo-05.jpg';
import f06 from './fabric-photo-06.jpg';
import f07 from './fabric-photo-07.jpg';
import f08 from './fabric-photo-08.jpg';
import f09 from './fabric-photo-09.jpg';
import f10 from './fabric-photo-10.jpg';
import f11 from './fabric-photo-11.jpg';
import f12 from './fabric-photo-12.jpg';
import f13 from './fabric-photo-13.jpg';
import f14 from './fabric-photo-14.jpg';
import f15 from './fabric-photo-15.jpg';
import gFront from './gallery-frontage.jpg';
import gFloor1 from './gallery-floor-1.jpg';
import gFloor2 from './gallery-floor-2.jpg';
import gFloor3 from './gallery-floor-3.jpg';
import paletteRef from './palette-reference.jpg';

const MEDIA: Record<string, import('astro').ImageMetadata> = {
  'fabric-photo-01.jpg': f01,
  'fabric-photo-02.jpg': f02,
  'fabric-photo-03.jpg': f03,
  'fabric-photo-04.jpg': f04,
  'fabric-photo-05.jpg': f05,
  'fabric-photo-06.jpg': f06,
  'fabric-photo-07.jpg': f07,
  'fabric-photo-08.jpg': f08,
  'fabric-photo-09.jpg': f09,
  'fabric-photo-10.jpg': f10,
  'fabric-photo-11.jpg': f11,
  'fabric-photo-12.jpg': f12,
  'fabric-photo-13.jpg': f13,
  'fabric-photo-14.jpg': f14,
  'fabric-photo-15.jpg': f15,
  'gallery-frontage.jpg': gFront,
  'gallery-floor-1.jpg': gFloor1,
  'gallery-floor-2.jpg': gFloor2,
  'gallery-floor-3.jpg': gFloor3,
  'palette-reference.jpg': paletteRef,
};

/** Resolve a "/media/<file>" reference to the imported asset metadata object.
 *  Returning the OBJECT (not .src) lets Astro's <Image> run its full
 *  optimization pipeline: AVIF/WebP variants, real multi-width srcset,
 *  and compression. Passing .src as a string bypasses all of that. */
export function media(ref: string | null): import('astro').ImageMetadata | null {
  if (!ref) return null;
  const name = ref.split('/').pop() ?? '';
  return MEDIA[name] ?? null;
}

/** Raw URL string — only for non-<Image> contexts (rare). */
export function mediaUrl(ref: string | null): string | null {
  const m = media(ref);
  return m?.src ?? null;
}

export const MEDIA_FILES = Object.keys(MEDIA);
