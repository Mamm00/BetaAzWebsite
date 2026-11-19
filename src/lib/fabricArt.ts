/**
 * fabricArt — deterministic, local, seeded textile schematics.
 *
 * Committed `source:'render'` assets are drawn here as SVG (no external
 * provider URLs in production markup, §19; nothing unseeded, §19). The
 * result is an honest schematic of the weave, tagged RenderTag — never
 * presented as a photograph (§21.1). Grade is carried into the drawing:
 * A tight and flawless, B with slight irregularity, C with visible
 * defects and short-length marks.
 */

export type Grade = 'A' | 'B' | 'C';

/** mulberry32 — tiny deterministic PRNG. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** FNV-1a string hash → uint32. */
export function hashSeed(s: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export interface FabricArtOpts {
  seed: number;
  shade: string; // hex
  grade: Grade;
  construction?: string;
  w?: number;
  h?: number;
}

interface RGB {
  r: number;
  g: number;
  b: number;
}

function hexToRgb(hex: string): RGB {
  let h = hex.replace('#', '');
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  const n = parseInt(h, 16);
  if (Number.isNaN(n)) return { r: 200, g: 164, b: 92 };
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function shade(c: RGB, dl: number): string {
  const f = (v: number) => Math.max(0, Math.min(255, Math.round(v + dl)));
  return `rgb(${f(c.r)},${f(c.g)},${f(c.b)})`;
}

function rgba(c: RGB, a: number, dl = 0): string {
  const f = (v: number) => Math.max(0, Math.min(255, Math.round(v + dl)));
  return `rgba(${f(c.r)},${f(c.g)},${f(c.b)},${a})`;
}

type WeaveKind = 'plain' | 'satin' | 'knit' | 'lace' | 'net' | 'brocade';

function weaveKind(construction?: string): WeaveKind {
  const c = (construction ?? '').toLowerCase();
  if (c.includes('satin')) return 'satin';
  if (c.includes('jersey') || c.includes('knit')) return 'knit';
  if (c.includes('lace') || c.includes('tulle')) return 'lace';
  if (c.includes('brocade') || c.includes('jacquard')) return 'brocade';
  return 'plain';
}

/**
 * Render a deterministic textile schematic as an SVG string.
 * Pure function — safe for both Astro (set:html) and React islands.
 */
export function fabricArt(opts: FabricArtOpts): string {
  const { seed, shade: shadeHex, grade, construction } = opts;
  const w = opts.w ?? 400;
  const h = opts.h ?? 500;
  const rnd = mulberry32(seed >>> 0);
  const base = hexToRgb(shadeHex);
  const kind = weaveKind(construction);

  const parts: string[] = [];
  parts.push(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="100%" height="100%" role="img" preserveAspectRatio="xMidYMid slice">`,
  );
  parts.push(`<rect width="${w}" height="${h}" fill="${shade(base, 0)}"/>`);

  // Lighting/sheen band — deterministic angle per seed.
  const angle = Math.floor(rnd() * 360);
  const sheen = grade === 'A' ? 0.16 : grade === 'B' ? 0.1 : 0.05;
  parts.push(
    `<rect width="${w}" height="${h}" fill="url(#sheen${seed % 97})" opacity="${sheen}"/>`,
  );
  parts.push(
    `<defs><linearGradient id="sheen${seed % 97}" gradientTransform="rotate(${angle})"><stop offset="0%" stop-color="rgba(255,255,255,0.55)"/><stop offset="42%" stop-color="rgba(255,255,255,0)"/><stop offset="58%" stop-color="rgba(255,255,255,0)"/><stop offset="100%" stop-color="rgba(255,255,255,0.35)"/></linearGradient></defs>`,
  );

  if (kind === 'net' || kind === 'lace') {
    // Open net / raschel lace: mesh of nodes with random drops.
    const step = kind === 'net' ? 26 : 34;
    for (let y = 0; y < h + step; y += step) {
      for (let x = 0; x < w + step; x += step) {
        const ox = (Math.floor(y / step) % 2) * (step / 2);
        const px = x + ox;
        const py = y;
        const open = rnd() > (kind === 'net' ? 0.25 : 0.55);
        if (open) {
          parts.push(
            `<circle cx="${px}" cy="${py}" r="${step * 0.28}" fill="${rgba(base, 0.12, -18)}"/>`,
          );
          continue;
        }
        const r = step * 0.3;
        parts.push(
          `<circle cx="${px}" cy="${py}" r="${r}" fill="none" stroke="${shade(base, -26)}" stroke-width="${step * 0.12}"/>`,
        );
        if (kind === 'lace' && rnd() > 0.6) {
          parts.push(
            `<circle cx="${px}" cy="${py}" r="${r * 0.45}" fill="${rgba(base, 0.5, 26)}"/>`,
          );
        }
      }
    }
  } else if (kind === 'knit') {
    // Jersey / single knit: vertical loop columns.
    const cols = 26;
    const cw = w / cols;
    for (let i = 0; i < cols; i++) {
      const x = i * cw;
      const wave = Math.sin((i * 12 + seed) % 360) * cw * 0.25;
      parts.push(
        `<path d="M ${x + cw * 0.25} 0 C ${x + cw * 0.1 + wave} ${h * 0.25}, ${x + cw * 0.9 + wave} ${h * 0.6}, ${x + cw * 0.5} ${h} L ${x + cw * 0.75} ${h} C ${x + cw * 0.9 + wave} ${h * 0.6}, ${x + cw * 0.1 + wave} ${h * 0.25}, ${x + cw * 0.75} 0 Z" fill="${shade(base, i % 2 ? -10 : 6)}" opacity="0.85"/>`,
      );
    }
    const rows = 14;
    for (let j = 0; j < rows; j++) {
      const y = ((j + 1) * h) / rows;
      parts.push(
        `<path d="M 0 ${y - h / rows * 0.4} Q ${w / 2} ${y - h / rows * 0.1}, ${w} ${y - h / rows * 0.4}" stroke="${shade(base, -30)}" stroke-width="2" fill="none" opacity="0.5"/>`,
      );
    }
  } else {
    // Plain / satin / brocade: warp × weft weave.
    const warps = kind === 'satin' ? 9 : 16;
    const wefts = kind === 'satin' ? 26 : 40;
    // Weft stripes with alternating light/dark picks.
    for (let i = 0; i < wefts; i++) {
      const y = (i * h) / wefts;
      const pick = i % 2 === 0 ? 0 : (kind === 'satin' ? 14 : -12);
      const l = grade === 'C' ? -6 : 0;
      parts.push(`<rect x="0" y="${y}" width="${w}" height="${h / wefts + 1}" fill="${shade(base, pick + l)}"/>`);
    }
    // Warp lines with a per-seed phase offset for satin floats.
    for (let j = 0; j < warps; j++) {
      const x = (j * w) / warps;
      const phase =
        kind === 'satin' ? ((j * 3 + Math.floor(seed / 7)) % 5) / 5 : j % 2 / 2;
      const op = kind === 'satin' ? 0.55 + phase * 0.3 : 0.5;
      parts.push(
        `<line x1="${x}" y1="0" x2="${x}" y2="${h}" stroke="${shade(base, kind === 'satin' ? 22 : -24)}" stroke-width="${w / warps * 0.55}" opacity="${op}"/>`,
      );
    }
    if (kind === 'brocade') {
      // Medallion motifs on the weave — deterministic positions.
      const motifs = 5;
      for (let m = 0; m < motifs; m++) {
        const cx = ((hashSeed(`${seed}-m${m}`) % 1000) / 1000) * w;
        const cy = ((hashSeed(`${seed}-n${m}`) % 1000) / 1000) * h;
        const r = 18 + (m % 3) * 8;
        parts.push(
          `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${r}" fill="none" stroke="${shade(base, -44)}" stroke-width="2.5" opacity="0.7"/>`,
        );
        parts.push(
          `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${r * 0.55}" fill="${rgba(base, 0.55, -36)}"/>`,
        );
      }
    }
  }

  // Grade-faithful defects. Grade C: slub streaks, knots, short-length marks.
  if (grade === 'B' || grade === 'C') {
    const streaks = grade === 'C' ? 7 : 3;
    for (let s = 0; s < streaks; s++) {
      const x = rnd() * w;
      const y = rnd() * h;
      const len = w * (0.18 + rnd() * 0.4);
      const dx = (rnd() - 0.5) * len;
      const dy = (rnd() - 0.5) * len * 0.18;
      parts.push(
        `<line x1="${x.toFixed(1)}" y1="${y.toFixed(1)}" x2="${(x + dx).toFixed(1)}" y2="${(y + dy).toFixed(1)}" stroke="${rgba(base, grade === 'C' ? 0.55 : 0.3, -40)}" stroke-width="${2 + rnd() * 3}" opacity="0.7"/>`,
      );
    }
  }
  if (grade === 'C') {
    // Knots / visible defects as darker dots.
    const knots = 10;
    for (let k = 0; k < knots; k++) {
      const x = rnd() * w;
      const y = rnd() * h;
      parts.push(
        `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${2 + rnd() * 3}" fill="${shade(base, -55)}" opacity="0.8"/>`,
      );
    }
    // Short-length edge marks — the lot was cut short.
    parts.push(
      `<rect x="0" y="${h - 22}" width="${w}" height="22" fill="${rgba(base, 0.28, -30)}" opacity="0.8"/>`,
    );
    parts.push(
      `<line x1="0" y1="${h - 22}" x2="${w}" y2="${h - 22}" stroke="${shade(base, -50)}" stroke-width="1.5" stroke-dasharray="6 6"/>`,
    );
  }

  // Subtle noise dot field for texture.
  const dots = 90;
  for (let d = 0; d < dots; d++) {
    const x = rnd() * w;
    const y = rnd() * h;
    parts.push(
      `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(rnd() * 1.2).toFixed(2)}" fill="${rgba(base, 0.12, rnd() > 0.5 ? 14 : -14)}"/>`,
    );
  }

  parts.push('</svg>');
  return parts.join('');
}

/** Data-URI version for <img> contexts that cannot take inline SVG. */
export function fabricArtUri(opts: FabricArtOpts): string {
  const svg = fabricArt(opts);
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}
