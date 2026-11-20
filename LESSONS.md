# LESSONS.md — Al Azhar Tex (BetaAzWebsite) standing rules

_Hard-won rules written back into process. When the same mistake appears twice,
its fix is promoted here and followed in every later cycle._

## Build & tooling
- **`node_modules` and `dist/` are wiped between turns.** Always run `npm install`
  before any build. A build that says `astro: not found` means deps are gone.
- **`@astrojs/sitemap` v3.7.6 has NO `exclude` option** — using it yields a
  `[WARN] Unrecognized key` and no sitemap. Use `filter: (url) => boolean`.
- **`Astro.site` is a URL object, not a string** — pass `Astro.site!.toString()`
  to `absUrl()`; passing the object throws at build.
- **Large JSON content files (~100KB) must be edited with a script**, not
  `edit_file`. Remap fields programmatically (read → transform → write).

## Image processing
- **Never use ImageMagick `convert` for photos** — `-resize '1920x>'` corrupted
  `gallery-floor-1.jpg` (EXIF orientation ignored). Use **sharp with `.rotate()`**
  first.
- **JPEGs have no transparency.** A logo supplied as JPEG on white must be
  keyed out (brightness-alpha + unpremultiply to recover true colours) before
  use on dark surfaces. Always sample corner pixels to detect the background
  before assuming.
- **Quantize logos/simple graphics to a small palette** (FASTOCTREE, ~48 colours)
  — a 2-colour transparent logo dropped from 300KB → 13KB with no visible loss.
- **Generate a light variant of any dark logo** for dark backgrounds (hero,
  footer). Hue-preserving recolour (keep hue, raise lightness) preserves the
  logo's identity while staying visible on dark surfaces.

## Verification
- **`gh pr merge` can silently leave a PR open** — always verify with
  `gh pr view <n> --json state`. Re-run the merge if it reports OPEN.
- **`gh api` Pages settings PUT → 403** — the token lacks Pages admin. Do not
  retry; operator must switch Pages source / manage custom domain in the UI.
- **Sandbox egress is restricted** (github/npm/pypi only). `curl` to the live
  site returns 000; use `fetch_page` or the Vercel/GitHub APIs to verify live
  content instead.
- **Link-audit path bug:** hrefs starting with `/` break `os.path.join('dist',
  '/...')`. Always `.lstrip('/')` before joining. Reuse the corrected script.

## Content & deploy
- **Category rendering is dynamic** (driven by `categories.json` + `categorySlug`
  from the URL). Restructuring categories only requires rewriting the data +
  the hardcoded route list in `[...slug].astro` + nav references — not every view.
- **Vercel production branch is `main`.** To deploy a change to the live Vercel
  site, the code must be merged to `main` first, then trigger a deployment from
  `main` via `create_deployment` with `git_source.ref = "main"`.
- **Keep JSON-LD literals single-line** to avoid build issues.
