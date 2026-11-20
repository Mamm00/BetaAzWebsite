# LOG.md — Al Azhar Tex (BetaAzWebsite) append-only run log

_Every cycle: what was attempted, what was measured, what was kept._

## Cycle 1 — Image optimization
- **Attempted:** Fix `media()` returning raw `.src` (bypassed Astro `<Image>`
  optimization). Pre-processed 20 media assets with sharp; added `format="avif"`.
- **Measured:** 159 AVIF variants; dist 57MB → 48MB; served image weight ~95% lower.
- **Kept:** Yes. PR #6 merged.

## Cycle 2 — SEO / social
- **Attempted:** Fix missing `og:image` (pointed to non-existent SVG). Generated
  `og-default.png` (1200×630) + favicon.svg.
- **Measured:** All pages now carry og:image.
- **Kept:** Yes. PR #6.

## Cycle 3 — Sitemap / robots
- **Attempted:** Add `@astrojs/sitemap` with `filter` (not `exclude` — v3.7.6
  has no `exclude` option). Added `public/robots.txt`.
- **Measured:** sitemap-index.xml + sitemap-0.xml, 185 entries, 0 admin.
- **Kept:** Yes. PR #7 merged.

## Cycle 4 — SVG weight collapse
- **Attempted:** Convert lace/net + weft SVG to `<pattern>` tiles; reduce noise
  dots 90→22.
- **Measured:** Lace-page SVG elems 48→7; largest page 1.2M→380K; HTML 31M→16M;
  dist 43M→28M.
- **Kept:** Yes. PR #8 merged.

## Cycle 5 — Accessibility contrast
- **Attempted:** Fix gold-button contrast (giza on sand-50 = 2.13 FAIL). Added
  `.azt-btn-giza` (ink-900 on giza = 8.36 PASS).
- **Measured:** Contrast 2.13 → 8.36 (AA pass).
- **Kept:** Yes. PR #9 merged.

## Cycle 6 — PWA
- **Attempted:** Add manifest + maskable icons (192/512/apple-touch).
- **Measured:** manifest.webmanifest, theme-color, apple-touch-icon in HTML.
- **Kept:** Yes. PR #10 merged.

## Cycle 7 — Women's & Men's fabrics restructure (user directive)
- **Attempted:** Collapse 7 fabric categories → 2 (womens-fabrics, mens-fabrics);
  reclassify all 60 fabrics; rewire nav, routes, homepage mosaic, locales.
- **Measured:** 33 women's / 27 men's / 0 unmatched; build 205 pages (4 category
  pages); 0 broken links (8,374 checked).
- **Kept:** Yes. PR #11 merged. Vercel redeployed (`dpl_6jJu4dcvRpcHuEvpA6hE6z16bEVn`).

## Cycle 8 — Brand logo replacement (user directive)
- **Attempted:** Replace inline SVG loom mark with operator-supplied PHOENIX logo.
  Source was a 1536×1024 JPEG on white. Processed → transparent PNGs (dark +
  light hue-preserved variant), cropped to content bbox, white keyed out via
  brightness-alpha + unpremultiply, quantized to 48 colours.
- **Measured:** dark logo 13KB, light logo 18KB (from 300KB/175KB). tsc clean,
  validate PASS, 0 broken links. Header/footer use dark variant (light bg), hero
  uses light variant (dark bg).
- **Kept:** Yes. PR #12 merged. Vercel redeployed
  (`dpl_HH4xwsnn39mLxDj8oKzsuuBxmCg8`, PROMOTED); homepage hero logo verified live.
