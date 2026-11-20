# AGENT_STATE.md — Al Azhar Tex (BetaAzWebsite) living audit log

_Autonomous continuous-improvement tracker. Updated each cycle._

## Repo / Deploy
- **Branch:** `arena/fe0d3606-betaazwebsite` (active)
- **Deploy target:** GitHub Pages → `alazhartex.com` (CNAME)
- **Workflow:** `.github/workflows/deploy.yml` — `AZT_BASE=/` build, CNAME kept
- **Pages source:** `legacy` (⚠ user must switch to **GitHub Actions**)
- **DNS:** `alazhartex.com` / `www` **do NOT resolve** (⚠ Squarespace records not pointing to GitHub IPs 185.199.108–111.153)

## Build gates
- `npx tsc --noEmit` → clean (after media() type fix)
- `npm run validate` → PASS (68 records, 6 collections, 2 locales)
- `AZT_BASE=/ npm run build` → 205 pages (was 215; 2 categories × 2 locales = 4 category pages, down from 7×2=14)

## Scorecard (live)
- **Pages:** 205 built · **broken links:** 0 (8,374 internal checked)
- **Meta coverage:** 100% (title / description / canonical / og:image on all pages)
- **tsc:** clean · **validate:** PASS (68 records, 6 collections, 2 locales)
- **Deploys:** GitHub Pages (legacy, not yet live) + Vercel production (live)
- **Logo:** operator PHOENIX logo live (dark + light variants) — PR #12
- **Blockers (human):** Pages → GitHub Actions; Squarespace DNS for alazhartex.com

## Cycle 1 — Image optimization (CRUSHED)
**Problem found:** `media()` returned `.src` string → Astro `<Image>` bypassed its
optimization pipeline. All 20 images served as raw JPGs (srcset pointed to the SAME
file at every width). dist = 49MB. `gallery-floor-1.jpg` was 43MP / 4.4MB.

**Fixes applied:**
- `media()` now returns the `ImageMetadata` OBJECT (not `.src`); added `mediaUrl()`
  for React `<img>` contexts (fixed `LightRoomApp.tsx`)
- Added `format="avif"` to all 5 `<Image>` components (FabricImage, GalleryCard,
  FabricCard, ProductPage ×2, GalleryPage)
- Batch pre-processed all 20 media assets with sharp (mozjpeg q82, cap 1600px wide):
  source media 12MB → 3.3MB; `gallery-floor-1` 4.4MB → 383KB
- Result: 159 AVIF variants generated, each 12–152KB. Served image weight dropped
  ~95%. dist 57MB → 48MB (sources still emitted alongside AVIF).

## Cycle 2 — SEO / social (FIXED)
**Problem found:** `og:image` / `twitter:image` pointed to `/media/og-default.svg`
which **did not exist** → every social share had a broken image.

**Fixes applied:**
- Generated `public/media/og-default.png` (1200×630, brand loom motif, 35KB)
- BaseLayout now references the PNG + added `og:image:width/height`
- Added `public/favicon.svg` (brand mark) + `<link rel="icon">` / apple-touch-icon

## Cycle 3 — Link audit (CLEAN)
- 173 internal links extracted from built HTML → **0 broken** (after fixing a
  path-join bug in the audit script; initial 172 false positives were the script's fault)

## Core Web Vitals (targets)
- **LCP:** was killed by 4.4MB hero/gallery images → now AVIF 12–152KB. Expected LCP < 1.5s on 4G.
- **CLS:** all `<Image>` carry explicit `width`/`height` + `aspect-ratio` → near 0.
- **INP:** three.js islands (TwinStudio, LightRoom, WashLab) are lazy-loaded; monitor.
- **FCP/TTFB:** static HTML on GitHub Pages CDN → fast.

## Open items (user-side, blocked)
1. Switch Pages source → **GitHub Actions** (Settings → Pages)
2. Fix Squarespace DNS → A records to 185.199.108–111.153, CNAME www → mamm00.github.io
3. Wait for DNS propagation, then verify live `alazhartex.com`

## Cycle 4 — SVG weight collapse (CRUSHED)
**Problem:** fabricArt generated hundreds of inline elements per schematic
(net/lace ~320 circles, plain weave 26-40 rects), ×48 SVGs/page → HTML
1.1MB/page, 31MB total.

**Fixes:**
- net/lace mesh → single `<pattern>` tile + fill rect
- plain/satin/brocade weft → two-pick `<pattern>` tile
- noise dots 90→22, tightened numeric formatting
- **HTML 31MB → 16MB (−48%); dist 43MB → 28MB; lace page SVG elems 48→7**

## Cycle 5 — Accessibility contrast (FIXED)
**Problem:** gold (--color-giza) buttons used sand-50 light text at 2.13:1
contrast — failing WCAG AA.

**Fix:** Added `.azt-btn-giza` utility (ink-900 dark text on gold = 8.36:1,
AA pass); applied to Provenance CTA + WhatsApp CTA.

## Cycle 6 — SEO infrastructure (DONE)
- @astrojs/sitemap: sitemap-index.xml + sitemap-0.xml, **185 public URLs**
  (30 admin routes filtered out)
- public/robots.txt pointing to sitemap

## Verified clean
- **Links:** 175 internal → 0 broken; external (WhatsApp, OSM, Google Fonts) all valid
- **Alt text:** 297 images → 0 missing
- **JSON-LD:** valid (Organization, LocalBusiness, Product, BreadcrumbList, single-slash URLs)
- **Contrast:** ink-900/sand-50 = 17.8; giza-on-ink = 8.36; giza buttons now 8.36 (was 2.13)
- **Page weights:** homepage 68K, gallery 36K, fabrics 380K, twin-studio 160K
- **Client bundle:** NOT loaded on homepage (no module scripts — pure HTML+CSS)

## Cycle 7 — SVG patterns verified
- `<pattern>` elements render correctly in built SVGs (mesh44, weft tiles)
- validate PASS, 0 broken links after pattern refactor

## Cycle 8 — Women's & Men's fabrics restructure (USER DIRECTIVE)
**Problem / directive:** Company must trade in **women's and men's fabrics only**,
with all known textile names/types for each gender. Supersedes the prior 7-category
structure (womens-apparel, shirting, jersey-knit, lace-tulle, home-textiles, linings, surplus).

**Fixes applied:**
- `categories.json` rewritten to exactly **2 categories**: `womens-fabrics`
  (الأقمشة النسائية) and `mens-fabrics` (الأقمشة الرجالية), each with ar/en name +
  description enumerating the known textile types (Chiffon, Georgette, Crepe, Satin,
  Voile, Lace, Tulle, Jacquard Brocade, Viscose for women's; Poplin, Twill, Lycra Jersey,
  Scuba Knit, Linen Blend, Crepe, Satin/Twill linings for men's).
- `fabrics.json` — all 60 fabrics (AZT-001–060, ×A/B/C grades) **reclassified** by
  textile type: **33 women's, 27 men's, 0 unmatched** (scripted remap of `category`).
- `src/pages/[locale]/[...slug].astro` — category route list → `['womens-fabrics','mens-fabrics']`.
- `Header.astro` — nav dropdown + mobile nav rewired to the 2 new categories;
  added `nav.womensFabrics` / `nav.mensFabrics` locale keys (en.json + ar.json).
- `HomePage.astro` — category mosaic redesigned: 2-column grid, both gendered categories.
- All category page rendering is dynamic (driven by `categories.json` + `categorySlug`),
  so no per-category view edits were needed.

**Results:** tsc clean; validate PASS (68 records, 6 collections, 2 locales);
build 205 pages (4 category pages, down from 14); **0 broken links** (8,374 checked);
old slugs fully purged from `dist/`. **Vercel redeployed** to production
(`dpl_6jJu4dcvRpcHuEvpA6hE6z16bEVn`, commit `c59e8f4`, PROMOTED); both
`/en/categories/womens-fabrics/` and `/en/categories/mens-fabrics/` verified live.

## Cycle 9 — Brand logo replacement (USER DIRECTIVE)
**Problem / directive:** Replace the generic inline SVG loom mark with the
operator-supplied PHOENIX logo.

**Fixes applied:**
- Source was a 1536×1024 JPEG on a near-white background (mislabeled .png).
- Processed into two transparent PNGs:
  - `public/logo.png` — dark navy+red (for light surfaces: header, footer)
  - `public/logo-light.png` — hue-preserved light recolour (for dark hero)
- White background keyed out via brightness-alpha + unpremultiply (recovers
  true logo colours); cropped to content bbox (947×916); quantized to 48 colours.
- `src/components/Logo.astro` now renders the image mark + wordmark, picking the
  variant by `tone` (dark→`/logo.png`, light→`/logo-light.png`).

**Results:** dark logo 13KB / light logo 18KB (from 300KB/175KB). tsc clean;
validate PASS; 0 broken links; build 205 pages. Header (36px) + footer (40px)
use the dark variant, hero (96px) uses the light variant. PR #12 merged; Vercel
redeployed (`dpl_HH4xwsnn39mLxDj8oKzsuuBxmCg8`, PROMOTED); homepage hero logo
verified live at `https://al-azhar-tex.vercel.app/logo-light.png`.

## Open items (user-side, blocked)
1. Switch Pages source → **GitHub Actions** (Settings → Pages) — still `legacy`
2. Fix Squarespace DNS → A records to 185.199.108–111.153, CNAME www → mamm00.github.io
3. DNS still does NOT resolve (alazhartex.com) — site cannot load until fixed

## Next targets
- LightRoom React island serves raw source JPGs (niche page; could pre-generate AVIF)
- Consider web app manifest / PWA
- Self-host fonts (blocked by sandbox egress — Google Fonts only)
- Lighthouse audit once live on alazhartex.com
