# AGENT_STATE.md — Al Azhar Tex (BetaAzWebsite) living audit log

_Autonomous continuous-improvement tracker. Updated each cycle._

## Repo / Deploy
- **Branch:** `arena/7da7288b-betaazwebsite` (active)
- **Deploy target:** GitHub Pages → `alazhartex.com` (CNAME)
- **Workflow:** `.github/workflows/deploy.yml` — `AZT_BASE=/` build, CNAME kept
- **Pages source:** `legacy` (⚠ user must switch to **GitHub Actions**)
- **DNS:** `alazhartex.com` / `www` **do NOT resolve** (⚠ Squarespace records not pointing to GitHub IPs 185.199.108–111.153)

## Build gates
- `npx tsc --noEmit` → clean (after media() type fix)
- `npm run validate` → PASS (68 records, 6 collections, 2 locales)
- `AZT_BASE=/ npm run build` → 215 pages

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

## Next targets
- Validate JSON-LD structured data (Product, BreadcrumbList, LocalBusiness)
- Accessibility: alt-text coverage, contrast ratios, keyboard nav
- Lighthouse audit once live
- Reduce AVIF build time (211s) — consider fewer widths or cached image service
