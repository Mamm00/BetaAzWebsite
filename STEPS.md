# Al Azhar Tex — Complete Step-by-Step Guide

Detailed instructions for every step of the platform: environment setup, the
build milestones, content editing, admin CMS, AI image generation, GitHub
publish, dual deployment, verification, and troubleshooting.

Repo: `/home/user/BetaAzWebsite` · Branch: `arena/eb842db4-betaazwebsite`
Stack: Astro 5 + React 19 islands + Tailwind v4 + TypeScript (strict) +
Zod + three.js + qrcode. Fully static, no backend.

---

## Phase 0 — Prerequisites & setup

**Step 0.1 — Requirements**
- Node.js 22+ (the `validate` script uses `--experimental-strip-types`, so
  Node 22.6+ is required).
- npm 10+.
- A GitHub account (for the CMS publish pipeline and GitHub Pages deploy).

**Step 0.2 — Get the code**
```bash
git clone https://github.com/Mamm00/BetaAzWebsite.git
cd BetaAzWebsite
git checkout arena/eb842db4-betaazwebsite   # or your working branch
```

**Step 0.3 — Install dependencies**
```bash
npm install
```
Installs 387 packages: `astro`, `@astrojs/react`, `react`/`react-dom`,
`three`, `qrcode`, `zod`, plus dev deps `tailwindcss`, `@tailwindcss/vite`,
`typescript` and type packages.

**Step 0.4 — Confirm the three gates pass**
```bash
npm run validate    # → "PASS — all validation rules satisfied"
npx tsc --noEmit   # → exit 0, no output
npm run build      # → "212 page(s) built" + "Complete!"
```
If any gate fails, do not deploy — fix first (troubleshooting in Phase 9).

---

## Phase 1 — Project scaffold (milestones 1–2)

**Step 1.1 — Core config files (already in place)**

| File | Purpose |
|---|---|
| `package.json` | name `al-azhar-tex`, scripts: dev / build / preview / validate / astro |
| `astro.config.mjs` | site `https://alazhartex.com`; `base` from `AZT_BASE` env (default `/`); `trailingSlash: 'always'`; `build.format: 'directory'`; react + tailwindcss(vite) |
| `tsconfig.json` | extends `astro/tsconfigs/strict`; `jsx: react-jsx`; `strict`, `noImplicitAny` |
| `.gitignore` | ignores `node_modules/`, `dist/`, `.astro/`, etc. |
| `.nojekyll` | empty file — stops GitHub Pages from ignoring `_astro/` |
| `public/CNAME` | contains `alazhartex.com` — deploys the custom domain |

**Step 1.2 — Design tokens (`src/styles/tokens.css`)**
Tailwind v4 `@theme` block: palette (sand/ink/giza/madder/indigo/ok), fonts
(naskh / arabic / display / sans / mono), motion, surfaces, buttons, chips,
grade accents (`--color-ok` A, `--color-indigo` B, `--color-madder` C),
focus ring, skip-link, reveal animation.

**Step 1.3 — The URL module (`src/lib/url.ts`)**
The single place that prefixes the base path. Exports `url()`, `absUrl()`,
`locUrl()`, `slugPath()`, `Locale`, `LOCALES`, `otherLocale()`. **Rule:
never hardcode a leading `/` outside this file.** All links go through
`locUrl(locale, 'fabrics/<slug>')` etc.

---

## Phase 2 — Data layer (milestone 3)

**Step 2.1 — Verified facts (`src/data/company.ts`)**
`COMPANY` holds the byte-exact verified facts: founder Shady Anwar / شادي
أنور, phones `+20 100 360 0949` and `+20 120 175 4177`, both WhatsApp
numbers, the EN/AR gallery addresses, plus the admin account:
username `admin`, password stored only as SHA-256 digest
`8a344ad4…c6f6b3ac2`. Helper: `whatsappLink()`.

**Step 2.2 — Locale dictionaries (`src/content/locales/ar.json` / `en.json`)**
Flat dotted-key JSON (e.g. `"nav.fabrics": "الأقمشة"`). Arabic authored
first; EN mirrors every key. **Rule: a missing EN key must never render the
raw key** — `t()` falls back to the AR string.

**Step 2.3 — i18n helper (`src/lib/i18n.ts`)**
`t(locale, key, vars?)` — lookup EN → fallback AR → fallback raw key (last
resort only). `pair()` returns both locales for a key; `keysOf()` lists
keys; `resultsLabel()` pluralises counts.

**Step 2.4 — WhatsApp templates (`src/lib/wa.ts`)**
`waTemplate('gradeA'|'gradeC'|'generic', vars)` in Egyptian colloquial,
`fabricWa(fabric)` picks the right template, `waLink(text)` /
`waLinkFor(text, phone)` build `wa.me/` deep links via `encodeURIComponent`
(never hand-build these).

**Step 2.5 — Zod schemas (`src/lib/schema.ts`)**
Schemas + inferred types for `Fabric`, `Category`, `Grade`, `GalleryImage`,
`JournalArticle`, `Company`. Enforces: slugs `^[a-z0-9]+(-[a-z0-9]+)*$`,
codes `AZT-\d{3}`, lotIds `LT-\d{2}-[ABC]`, `bullets` min 3 per grade per
locale, `gradeNotes` min 3 per locale.

**Step 2.6 — Typed content access (`src/lib/content.ts`)**
`fabrics`, `categories`, `grades`, `gallery`, `journal`, `company`,
`localeDicts`, plus `getFabric`, `getCategory`, `getGrade`, `getJournal`,
`fabricsByCategory`, `relatedFabrics`, `facetValues`, `priceLabel`,
`gsmBounds`, `widthBounds`, `gradeAccent`.

**Step 2.7 — SEO helpers (`src/lib/seo.ts`)**
`jsonld()` builder, canonical/hreflang pairing, organization and
localBusiness JSON-LD.

**Step 2.8 — The single storage module (`src/lib/store.ts`)**
The ONLY place that touches `localStorage`/`sessionStorage`. Versioned keys
(`azt:v1:*`, `azt:v2:*`), quota-guarded, schema-checked reads that degrade
to `[]` on corrupt blobs. Holds: samples (cap 50), locale, lots, quotes,
recipes (cap 4), activity log, draft overlay, locale overlay, plus
`onStoreChange` (cross-tab `azt:store` event) and `migrate()`.

**Step 2.9 — Media manifest (`src/assets/media/index.ts`)**
20 real photos imported via `astro:assets` (15 fabric photos, 4 gallery
images, 1 palette reference). `media(ref)` resolves a `/media/<file>` JSON
reference to the processed asset URL.

**Step 2.10 — Seeded schematic art (`src/lib/fabricArt.ts`)**
`fabricArt()` / `fabricArtUri()` — mulberry32 PRNG + FNV-1a `hashSeed`,
generates deterministic SVG textile plates with grade-faithful defects
(A = clean, B = slight variation, C = visible irregularity). Used for the
45 fabrics without real photos; every render carries a `RenderTag` honesty
chip.

**Step 2.11 — Content generation & validation**
```bash
node scripts/generate-content.mjs   # regenerates the 6 content JSON files
npm run validate                    # CI gate over all content + locales
```
Generator output: 60 fabrics (20 groups × A/B/C, codes AZT-001..060),
7 categories, 3 grades with 4 bullets each, gallery items, 3 journal
articles (AR 500+ words, EN 1200+ chars), 68 total records. Never hand-edit
generated content without re-running the validator.

---

## Phase 3 — Layout & shared components (milestone 4)

**Step 3.1 — `src/layouts/BaseLayout.astro`**
Page shell: SEO `<head>`, skip link, canonical + hreflang, OG/Twitter
cards, fonts, JSON-LD (incl. `extraJsonld` prop), Header, Footer,
SampleCount. Takes `locale`, `title`, `description`, `path`, `type`,
`extraJsonld` props.

**Step 3.2 — Header / Footer / LangToggle**
`Header.astro` — nav (fabrics, grades, categories, gallery, wholesale,
contact, trade desk, about, journal, sample list, admin) with a
checkbox/burger mobile nav (CSS-only, `:has()` driven). `LangToggle`
switches AR/EN. `Footer.astro` — company facts, quick links, rights line.

**Step 3.3 — Card & display components**
`FabricImage`, `FabricCard`, `GalleryCard`, `GradeChip` (accepts a `Grade`
object or a bare grade string), `RenderTag`, `StatusPill`, `CertBadge`,
`Breadcrumb`, `Tabs` (CSS-only checkbox tabs; panels via
`Astro.slots.render()`), `EmptyState`, `Skeleton`, `ShadeSwatch`,
`SpecTable`, `GradeComparisonStrip`, `StickyActionBar`,
`WhatsAppCTA`, `PhoneRow`, `DirectionsLink`.

**Step 3.4 — Interactive islands (`client:load` / `client:visible`)**
`SampleCount.tsx`, `ARHoldOverlay.tsx` (camera access gated behind an
explicit tap; stops tracks + revokes object URLs on unmount),
`VisualiseButton.tsx` (visitor AI generation capped at 3/session via
`sessionStorage` key `azt:visitor-gen`; calls pollinations with
`?model=flux&nologo=true`), `ContactForm.tsx` (builds a WhatsApp link
locally — no backend).

---

## Phase 4 — Public pages (milestone 5)

All pages live in `src/views/` and are dispatched by the single dynamic
route `src/pages/[locale]/[...slug].astro` (which generates all 212
localized routes via `getStaticPaths`).

**Step 4.1 — Home (`HomePage.astro`)**
Full-bleed macro hero → gallery band → grade strip → category mosaic →
Twin Studio / Provenance teasers → founder note → journal trio → contact
band. All text from `t()`, all images through `media()` / `fabricArt()`.

**Step 4.2 — Catalog (`CatalogPage.astro`)**
Filter sidebar (grade, composition, gsm, width, construction, finish,
availability) + sort (relevance, price asc/desc, name, newest). Empty
state with reset. `data-fabric-grid` marks the grid.

**Step 4.3 — Product (`ProductPage.astro`)**
Sticky media column (photo or seeded render + `RenderTag`), grade chip,
spec table, Grade Notes above the fold, tabs (details / shades / gallery),
related fabrics, sticky mobile action bar, Product + Breadcrumb JSON-LD,
AR hold overlay, visualise button.

**Step 4.4 — Static content pages**
`GradesPage` (A/B/C cards with bullets, comparison strip, statement),
`GalleryPage` (hours, phones, address, map link, parking),
`CategoriesIndexPage`, `WholesalePage`, `AboutPage` (with `TBD` chips for
founding year/capacity/certs), `JournalIndexPage`, `JournalArticlePage`
(article JSON-LD), `ApiDocsPage`, `ContactPage`, `LegalPage` (privacy /
terms via `kind` prop), `TradeDeskPage` + `TradeDeskApp.tsx` (role
gating: visitor / registered; tabs for lots, samples, quotes,
downloads; local trader record in `azt:v1:trader`), `SampleListPage` +
`SampleListApp.tsx` (metres per fabric, WhatsApp share, `azt-samples.txt`
blob download).

**Step 4.5 — The dynamic route (`src/pages/[locale]/[...slug].astro`)**
`getStaticPaths()` returns 212 paths: static slugs (fabrics, grades,
gallery, categories, trade-desk, sample-list, wholesale, about, journal,
api, contact, legal/privacy, legal/terms, match, twin-studio, light-room,
wash-lab, bench, provenance, swap, handoff), 60 fabric pages, 7 category
pages, 3 journal articles, and 15 admin routes — for each of `ar`/`en`.
Note: the catch-all param key is `slug` (the `...` is filename syntax, not
the param name).

---

## Phase 5 — Hijack-matrix feature pages (§8, §10)

Each feature has a page + a React island.

**Step 5.1 — Match (`MatchPage.astro` + `MatchApp.tsx`)**
Upload an image; the app computes CIE76 Lab colour distance against the
60 fabrics, ranks by confidence, shows dominant-colour extraction +
palette swatches, and builds a mood board via pollinations (3/session
cap). Honest labelling: matching is indicative, not a lab report.

**Step 5.2 — Twin Studio (`TwinStudioPage.astro` + `TwinStudioApp.tsx` + `TwinViewer.tsx`)**
Fabric picker → three.js viewer: drape / stretch / weight sliders drive a
deformation loop on a fabric-textured plane (shared `uniformsRef` fed to
the RAF loop, not React state), RoomEnvironment PMREM map, resize +
intersection observers, full dispose on unmount. Exports a JSON manifest
(fabric + settings) with copy.

**Step 5.3 — Light Room (`LightRoomPage.astro` + `LightRoomApp.tsx`)**
CSS-filter lighting simulation over a fabric photo or swatch: D50, D65,
TL84, horizon, UV presets via per-channel filter matrices.

**Step 5.4 — Wash Lab (`WashLabPage.astro` + `WashSimulator.tsx`)**
three.js wash-simulator shader: temperature / time / ratio / cycle
controls, before/after split render (scissor before + after), `onBeforeCompile`
wash-shader injection, PNG export captured right after a render frame,
recipe save/delete via store (4-cap), recipe list display.

**Step 5.5 — Bench (`BenchPage.astro` + `BenchApp.tsx`)**
Hand-built SVG bars for water (kg) / carbon (kg) / cost index across
fabrics, hidden data tables for accessibility, up-to-4-fabric overlay
comparison.

**Step 5.6 — Provenance (`ProvenancePage.astro` + `ProvenanceApp.tsx`)**
Web Crypto SHA-256 chain recompute + verify, deterministic chain from the
fabric record, SVG route map (received → graded → priced → listed), QR
code (qrcode package), iframe embed copy.

**Step 5.7 — Swap (`SwapPage.astro` + `SwapApp.tsx`)**
Pick a fabric to swap FROM and a target TO; impact-delta bars computed
from the internal bench data.

**Step 5.8 — Handoff (`HandoffPage.astro` + `HandoffApp.tsx`)**
Target picker (print / dye / factory / warehouse), quantity + notes,
deterministic JSON manifest, clipboard copy + price label.

---

## Phase 6 — Admin CMS (§23–§27)

Routes: `/ar/admin` and `/en/admin` (plus the `admin/*` subpaths).

**Step 6.1 — Auth (`src/lib/adminAuth.ts`)**
- Single admin: username `admin`, password compared as SHA-256 against
  the digest in `company.json` (constant-time string compare).
- Session: `azt:session` in sessionStorage — 12h absolute, 60m idle
  (touched every 5 min by the shell).
- 5 failed attempts → 60s lockout (persisted key `azt:v1:lockout`).
- `isAuthed()` gates the shell; `logout()` clears.
- `hashForCommit(password)` emits the exact `company.json` snippet for the
  change-password flow.

**Step 6.2 — Draft overlay (`src/lib/adminContent.ts`)**
JSON → localStorage drafts → unsaved form state. `deepMerge()` merges
objects and replaces arrays (keyed by `id`/`slug`). Keys:
`azt:v2:draft:<collection>:<id>`. Autosave every 10s while dirty;
**Discard** restores the layer below and clears the key.

**Step 6.3 — AI image generation (§21–§22)**
- `src/lib/promptTemplate.ts` — per-role prompt templates with `{{tokens}}`
  (composition, construction, gsm, shade, grade, category, name), grade
  guidance appended, negative prompts from the role spec.
- `src/lib/imagegen.ts` — provider abstraction:
  - **pollinations** (keyless, default) — GET `image.pollinations.ai/prompt/...`
  - **venice** (BYO key) — POST `api.venice.ai` with the key from
    localStorage (masked to last 4 on display)
  - **manual** — paste a URL, fetched directly
  - 25s timeout + one retry; 401/429 surface and stop the queue.
  - IndexedDB cache `azt:v3:gencache`, keyed by
    sha256(provider|model|prompt|seed|w|h), LRU eviction at 150 MB.
- **Generate view**: pick fabric + role (hero, macro, drape, shade-flat,
  grade-evidence, gallery-floor, gallery-frontage, founder, journal, og,
  placeholder), seed, size; preview prompt + negative; result with
  download + copy URL; cache meter.

**Step 6.4 — GitHub publish pipeline (§26, `src/lib/publish.ts`)**
- Connection form: owner, repo, branch, token (localStorage
  `azt:v2:publish`, never committed).
- Staged file list (fabrics.json + categories/grades JSON).
- Publish: GET current sha → PUT each file sequentially (350ms gap),
  UTF-8-safe base64 via `TextEncoder → binary string → btoa` (plain btoa
  breaks on Arabic).
- 409 stops and names the colliding file; 401/403 surface the scope hint.
- Polls the Actions API once for the run URL (never loops).

**Step 6.5 — Admin views**
- **LoginView** — the honest curtain; shows lockout state; single-account
  note.
- **DashboardView** — stat cards (live fabrics, drafts, out-of-stock,
  translation %, render coverage, grade split), recent activity log,
  publish banner when disconnected, quick actions.
- **FabricListView** — searchable table with per-row draft markers.
- **FabricEditorView** — the main form: identity (slug/code/lotId/name),
  construction (composition/finish, bilingual), specs (width/gsm/price/
  MOQ/stock/availability/alternatives), shades editor (add/remove,
  AR/EN/hex), imagery (source/seed/photo), gradeNotes (AR/EN lists),
  bench inputs. Sidebar: live validation list, completeness meter,
  commit-JSON preview + copy, draft ops. 10s autosave; beforeunload guard.
- **TranslationsView** — locale overlay editing with AR/EN completeness
  bars, search, export JSON.
- **SettingsView** — change password (emits the exact `company.json`
  snippet), image provider config, danger zone (reset drafts + activity,
  logout).

---

## Phase 7 — Content editing workflows

**Step 7.1 — Edit a fabric via admin (no code)**
1. Sign in to `/ar/admin`.
2. **Fabrics** → click a row (or **New fabric**).
3. Edit fields; each BilingualField shows AR/EN completeness inline and a
   "Copy AR→EN" helper.
4. Validation list flags missing locales, bad slugs, unseeded renders,
   missing photos.
5. **Save draft** (or let the 10s autosave run) → stored in localStorage.
6. **Commit JSON** → copy the exact JSON → paste into
   `src/content/fabrics.json` → `npm run validate` → `npm run build` →
   **Publish** (or commit + push).

**Step 7.2 — Edit via files directly**
```bash
# edit one of:
src/content/fabrics.json       # 60 fabrics
src/content/categories.json    # 7 categories
src/content/grades.json        # A/B/C + bullets
src/content/gallery.json       # gallery images
src/content/journal.json       # 3 articles
src/content/locales/ar.json    # Arabic UI dictionary
src/content/locales/en.json    # English UI dictionary
npm run validate                # MUST pass
npm run build
```

**Step 7.3 — Regenerate seed content**
```bash
node scripts/generate-content.mjs   # rewrites the 6 JSON files deterministically
npm run validate
```
Only run this if you want to re-roll the seeded content; it regenerates
the full 60-fabric matrix.

**Step 7.4 — Upgrade a fabric to real photography**
1. Drop the photo into `src/assets/media/` (e.g. `fabric-photo-16.jpg`).
2. Add it to `src/assets/media/index.ts` (import + manifest entry).
3. In `fabrics.json` set `"source": "photo"` and `"photo": "/media/fabric-photo-16.jpg"`.
4. `npm run validate && npm run build`.

---

## Phase 8 — Deployment (dual host, one build)

`astro.config.mjs` reads `AZT_BASE`:
- `AZT_BASE=/` (default) → root domain `alazhartex.com`.
- `AZT_BASE=/al-azhar-tex/` → GitHub Pages subpath.

**Step 8.1 — Custom domain build (default)**
```bash
AZT_BASE=/ npm run build
```
- `dist/` includes `public/CNAME` (`alazhartex.com`).
- Upload `dist/` to the root of the `alazhartex.com` host (Vercel or
  any static host pointing at the repo).

**Step 8.2 — GitHub Pages subpath build**
```bash
AZT_BASE=/al-azhar-tex/ npm run build
```
- Push `dist/` to the `gh-pages` branch (or configure Pages to serve
  `dist/` from a deployment workflow).
- `.nojekyll` is included so `_astro/` assets are served.
- All links are prefixed by `src/lib/url.ts` — no manual rewriting.

**Step 8.3 — Vercel**
1. Import the repo in Vercel.
2. Build command: `AZT_BASE=/ npm run build` (or set `AZT_BASE` in
   project env for the subpath target).
3. Output directory: `dist`.
4. Domain: `alazhartex.com` (add in Vercel, CNAME already in `dist/`).

**Step 8.4 — Commit & push your work**
```bash
git add -A
git commit -m "azt: <what changed>"
git push origin arena/eb842db4-betaazwebsite
```

---

## Phase 9 — Verification & troubleshooting

**Step 9.1 — Post-deploy checklist**
1. `https://alazhartex.com/` — Arabic, `dir="rtl"`, hero + gallery band.
2. `/en/` — English, `dir="ltr"`.
3. `/ar/admin` — log in; dashboard LIVE counts render.
4. `/ar/fabrics/<slug>` — spec table, grade notes, RenderTag on rendered
   fabrics, tabs work.
5. Feature routes: `/ar/match`, `/ar/twin-studio`, `/ar/light-room`,
   `/ar/wash-lab`, `/ar/bench`, `/ar/provenance`, `/ar/swap`,
   `/ar/handoff`.
6. Sample list + trade desk islands hydrate (check DevTools Network for
   the island JS chunks).

**Step 9.2 — Common failures and fixes**

| Symptom | Cause | Fix |
|---|---|---|
| `astro: not found` | `node_modules` missing/wiped | `npm install` |
| Build error `Unexpected "export"` at an .astro line | JSON-LD object with multi-line `'@type'` keys trips the compiler's interface hoisting | Collapse the object to single-line values |
| `Astro.slots.get is not a function` | Astro 5 API | Use `await Astro.slots.render(name)` |
| All routes collapse to `index.html` | Catch-all param key written as `'...slug'` | The param name is `slug` (no dots) |
| `Cannot read properties of undefined (reading 'ar')` | Passing a `Fabric` where a `Grade` is expected (`.tag` missing) | `GradeChip` accepts both shapes |
| `await import()` in a template | Astro templates can't `await` | Static-import the module in the frontmatter |
| `validate` FAIL on locale keys | Key mismatch between ar.json/en.json | Re-run `npm run validate` after every locale edit; keys must exist in both |
| Publish 409 | File conflict on the target branch | The run stops and names the file; resolve the conflict, re-run |
| Publish 401/403 | Token scope | Regenerate a token with `Contents: read/write` |
| Raw key shown on a page | Key missing from both locales | Add the key to `ar.json` + `en.json` (AR first) |

**Step 9.3 — Reset local state (does not touch content)**
```bash
# in admin → Settings → Danger zone: "Reset all drafts and activity"
# or clear site data in the browser dev tools
```

---

## Phase 10 — Before launch (from PLACEHOLDERS.md)

Every one of these renders a `TBD` chip or is an honest placeholder until
you supply verified facts. None block the build.

1. **Change the admin password** — Settings → Change password → commit the
   emitted `company.json` snippet. Default: `admin` / `azt-admin-2026`.
2. **Connect GitHub publish** — token with `Contents: read/write` in
   admin Settings.
3. **Verified facts** — founding year, gallery capacity, certifications,
   trading hours, real per-grade prices, bench/swap/wash numbers.
4. **Photo coverage** — 15/60 fabrics photographed; swap in real photos
   as they arrive (Phase 7.4).
5. **SEO** — add `sitemap.xml`, robots, and Search Console verification
   once the domain is live.
