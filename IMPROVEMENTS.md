# IMPROVEMENTS.md — Al Azhar Tex (BetaAzWebsite) backlog

_One line per finding. Priority: P0 critical / P1 high / P2 polish.
Status: open / done / rejected / needs-human. Evidence cited per item._

## P0 — Critical

- [done] **Custom domain `alazhartex.com` not live** — DNS does not resolve;
  Pages `build_type` still `legacy`. Requires operator action: switch Pages
  Source → GitHub Actions; Squarespace DNS A `@` → 185.199.108–111.153,
  CNAME `www` → `mamm00.github.io`. Evidence: `gethostbyname_ex` returns no A
  records; `gh api repos/Mamm00/BetaAzWebsite/pages` → `build_type: legacy`.
  Status: **needs-human** (operator token lacks Pages admin → 403 on PUT).

## P1 — High

- [done] **Brand logo was a generic SVG loom mark** — replaced with the
  operator-supplied PHOENIX logo (dark + light transparent PNG variants).
  Evidence: PR #12, `public/logo.png` (13KB) + `public/logo-light.png` (18KB),
  `src/components/Logo.astro` rewired. Deployed to Vercel production.
- [done] **Women's/men's fabric taxonomy** — company trades in women's and
  men's fabrics only; 7 categories collapsed to 2, all 60 fabrics
  reclassified (33 women's / 27 men's). Evidence: PR #11, `categories.json`,
  `fabrics.json`.
- [done] **Gold-button WCAG contrast** — giza-on-sand-50 failed at 2.13:1;
  switched to `.azt-btn-giza` (ink-900 on giza = 8.36:1 AA pass). Evidence:
  PR #9, `src/styles/tokens.css`.
- [done] **Image weight** — `media()` returned raw `.src`, bypassing Astro
  optimization; fixed to return ImageMetadata + AVIF. 159 variants, ~95%
  weight reduction. Evidence: PR #6.
- [done] **SVG weight collapse** — lace/weft `<pattern>` tiles; largest page
  1.2M→380K, HTML 31M→16M. Evidence: PR #8, `src/lib/fabricArt.ts`.

## P2 — Polish

- [open] **Favicon still uses old loom diamond motif** — brand mark changed to
  PHOENIX logo; favicon.svg not yet updated for consistency. The new logo may
  not scale cleanly to 16–64px; needs a dedicated simplified mark. Priority:
  after confirming the new logo's legibility at small sizes.
- [open] **og-default.png / PWA icons still use old brand motif** — social
  card and manifest icons not yet aligned to the new logo. P2 polish.
- [open] **Self-host fonts** — Google Fonts only (blocked by sandbox egress).
  P2, needs-human for font licensing/hosting.
- [open] **LightRoom React island serves raw source JPGs** — niche page;
  could pre-generate AVIF. P2.

## Open items needing human

1. Switch GitHub Pages source → **GitHub Actions** (still `legacy`).
2. Fix Squarespace DNS → GitHub Pages IPs for `alazhartex.com`.
3. (Optional) confirm new logo legibility at favicon/social sizes.
