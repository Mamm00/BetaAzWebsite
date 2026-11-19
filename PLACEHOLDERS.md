# PLACEHOLDERS — Al Azhar Tex

Genuine unknowns logged here, per the build brief. Everything below is a real
gap, not a guess. Each entry says what is unknown, where it shows, and what to
do when the fact becomes known.

## Content & facts

- **Founding year** — not provided by the user. `about.stats.founded` renders a
  `TBD` chip on the About page. Replace with the verified year when known.
- **Gallery capacity / sqm** — not provided. `about.stats.*` and gallery
  captions use `TBD` chips. Add verified capacity, floor area, and booth count.
- **Certifications** — no cert names, bodies, or numbers were provided.
  `CertBadge` is wired but no cert data exists in `src/content/`. Add a
  `certifications` collection with verified issuer + cert id + expiry when
  available; until then the badge does not render.
- **Trading hours** — `COMPANY.hours` in `src/data/company.ts` holds
  weekday-hour placeholders. Replace with the gallery's real opening hours
  (the About/Gallery pages label the source as "assumed").
- **Prices** — `pricePerMetre` values are indicative placeholders, not quotes.
  The Trade Desk and Sample List make this explicit; confirm real per-grade
  pricing before any commercial use.
- **Grade A/B/C thresholds** — the grading rubric bullets are authored
  content, not a measured standard. If Al Azhar Tex grades by specific
  thresholds (gsm tolerance, defect counts), record them and link the rubric.
- **Water/carbon/cost bench numbers** — `fabric.bench` values are indicative
  modelling placeholders used by the Bench and Swap features. Replace with
  verified or properly sourced numbers before publication.

## Images

- **Photo coverage** — 15 of 60 fabrics use real photography; 45 use seeded
  schematic renders (each carries a `RenderTag` honesty chip). As real
  photos arrive, swap the `photo` field and `source: 'photo'` in
  `src/content/fabrics.json` (admin: Fabric editor → Imagery).
- **Gallery photos** — 4 gallery images (frontage, 3 floor shots) are
  placeholders from the upload set. Replace with verified gallery photography.
- **Generated images** — the admin Generate view can produce AI images via
  pollinations (keyless) or venice (BYO key). Generated output is cached
  locally (IndexedDB, 150 MB cap) and never committed. Review AI output
  before publishing — it is a starting point, not a verified photograph.

## Operations

- **GitHub publish token** — the admin Publish view needs a token with
  `Contents: read/write` on the target repo. Store it in the admin Settings
  (localStorage only, never committed). Until connected, the admin shows a
  local-draft banner; publishing is blocked.
- **Admin password** — default `azt-admin-2026` (username `admin`). The
  stored value is only the SHA-256 digest. **Change it via Settings →
  Change password and commit the emitted `company.json` snippet before
  any real deployment.**
- **Domain** — `alazhartex.com` is configured as `public/CNAME`. The
  `AZT_BASE` env var controls the GitHub Pages sub-path
  (`https://<user>.github.io/al-azhar-tex/`); default `/` serves the custom
  domain. One build serves both.
- **SEO verification** — no `sitemap.xml`, robots, or Search Console
  verification files are included. Add them once the domain is live.

## Feature honesty

- **Match (§10)** — colour matching runs in-browser on the uploaded image;
  the mood board uses pollinations AI with a 3/session cap. Results are
  indicative, not a lab report.
- **Twin Studio (§8)** — drape/stretch/weight sliders drive a three.js
  preview with a seeded schematic texture. It is a tuning aid, not a
  physical sample.
- **Wash Lab (§8)** — wash simulator shader is illustrative; saved recipes
  are local-only (4-cap) and not a process specification.
- **Provenance (§10)** — the chain is deterministic from the fabric record
  and recomputed/verified in-browser via Web Crypto. It proves internal
  consistency of the published record, not an external registry.
- **Trade Desk** — role gating is local (visitor / registered). There is no
  backend, so "verified" is a local-state concept only.
- **AI images** — every AI-generated asset is labelled; rendered schematics
  carry the `RenderTag` chip on public pages.
