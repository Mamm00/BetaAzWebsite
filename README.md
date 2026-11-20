# Al Azhar Tex — Fabric Gallery

A bilingual (Arabic-first), fully static, no-backend fabric gallery platform
for **Al Azhar Tex** (Zagazig, Sharkia, Egypt). Built with Astro 5 + React
islands + Tailwind v4 + strict TypeScript.

## What's inside

- **60 fabrics** across grades **A / B / C** (20 groups × 3 grades), each
  with composition, construction, shades, price, MOQ, bench data, and grade
  notes — authored content validated by a Zod gate (`npm run validate`).
- **Public pages**: Home, Catalog (filters + sort), Product (spec table,
  grade notes, related fabrics, Product JSON-LD), Grades, Gallery,
  Categories, Wholesale, About, Journal (3 articles), Contact, Legal,
  Trade Desk, Sample List, API docs.
- **Hijack-matrix features (§10)**:
  - **Match** — in-browser CIE76 Lab colour matching against fabrics +
    AI mood board (3/session cap).
  - **Twin Studio** — three.js drape/stretch/weight tuner with manifest export.
  - **Light Room** — CSS-filter lighting simulation (D50/D65/TL84/horizon/UV).
  - **Wash Lab** — three.js wash-simulator shader with recipe save/export.
  - **Bench** — SVG water/carbon/cost comparison over fabrics.
  - **Provenance** — Web Crypto sha256 chain recompute + verify, QR embed.
  - **Swap** — impact-delta bars from bench data.
  - **Handoff** — deterministic JSON manifest for dye/print/factory handoff.
- **Admin CMS (§23–§27)** at `/ar/admin` / `/en/admin`:
  - single-admin auth (username `admin`, password stored only as SHA-256,
    12h session + 60m idle, 5-fail lockout),
  - dashboard with LIVE stats + activity log,
  - fabric editor (bilingual fields, validation, 10s autosave to
    localStorage drafts, commit-JSON export),
  - AI image generation (pollinations keyless / venice BYO key / manual URL,
    templated prompts, IndexedDB cache with 150 MB LRU cap),
  - GitHub Pages publish pipeline (sequential PUTs, 409 stops and names the
    colliding file, UTF-8 safe base64),
  - translations overlay editor with completeness meters,
  - settings: change password (emits exact `company.json` commit snippet),
    reset drafts, provider config.
- **Honesty system**: every rendered schematic carries a `RenderTag` chip;
  AI-generated assets are labelled; unknown facts render `TBD` chips and are
  logged in [`PLACEHOLDERS.md`](./PLACEHOLDERS.md).

## Commands

```bash
npm install
npm run dev        # dev server (bind 0.0.0.0 for previews)
npm run build      # static build → dist/
npm run preview    # preview the build
npm run validate   # Zod gate over all content + locales (CI)
npx tsc --noEmit   # strict type check
```

## Deployment — one build, two hosts

The build is fully static. `astro.config.mjs` sets `base` from
`process.env.AZT_BASE` (default `/`):

- **Custom domain**: `AZT_BASE=/` → `dist/` deployed at the repo root;
  `public/CNAME` carries `alazhartex.com`.
- **GitHub Pages**: `AZT_BASE=/al-azhar-tex/` → `dist/` deployed to
  `https://<user>.github.io/al-azhar-tex/`.

`src/lib/url.ts` is the single place that prefixes the base path.

## Content model

```
src/content/
  fabrics.json      60 fabrics (AZT-001..060, lotIds LT-NN-G)
  categories.json   7 categories
  grades.json       A/B/C with 4 bullets each + accents
  gallery.json      gallery images incl. hero/macro/floor/frontage/palette
  journal.json      3 articles (AR 500+ words, EN 1200+ chars)
  company.json      verified facts (founder, phones, address) + admin digest
  locales/          ar.json + en.json (flat dotted keys, AR-first)
```

Regenerate seed content with `node scripts/generate-content.mjs`, then
`npm run validate`. Never hand-edit generated content without re-running the
validator.

## Admin

- URL: `/ar/admin` (or `/en/admin`)
- Default credentials: **username `admin`**, **password `azt-admin-2026`**
  — change immediately via Settings (only the SHA-256 digest is stored; the
  Settings screen emits the exact `company.json` snippet to commit).
- Publish: connect a GitHub token with `Contents: read/write` in Settings.
  Publishing writes staged JSON files to the repo and never wipes content.

## Honesty notes

- 45 of 60 fabrics render as seeded schematic plates (deterministic,
  grade-faithful) — each carries a `RenderTag`; 15 use real photography.
- Bench/swap/wash numbers are indicative modelling, not verified lab data —
  see `PLACEHOLDERS.md`.
- No backend: trade roles, samples, lots, quotes, recipes, and admin drafts
  live in `localStorage`/`sessionStorage` (single storage module:
  `src/lib/store.ts`).
