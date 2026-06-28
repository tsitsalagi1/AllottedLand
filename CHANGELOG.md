
## v0.45 — Unified search + research packet

- Added a one-search homepage engine that accepts names, roll/card numbers, addresses, coordinates, township/range/section, counties, family stories, and legal-notice clues.
- Added `/api/unified-search` to classify clues, build a research path, prepare source links, return approved D1 record matches, and generate request-packet text.
- Added `assets/unified-search.js` to search local map/Dawes/index data, approved records, NARA/LOC/Federal Register/Chronicling America/Census connectors, and render one printable results package.
- Added branded print/save-PDF support for all unified results.
- Keeps advanced individual tools on the page for power users while giving regular users one place to start.


## v0.44 — Address-to-coordinate lookup for Census/TIGERweb

- Added `/api/address-resolve` endpoint.
- Added “Address → coordinates” button to the Official Source Lookup form.
- Census lookup now attempts address-to-coordinate fallback if Census cannot match a street address directly.
- Added OpenStreetMap/Nominatim attribution and verification warnings.
- Removed the need for ordinary users to manually find latitude/longitude before using Census/TIGERweb geography leads.

# v0.43 — Census coordinate bug hotfix

- Fixed `/api/census-lookup` so missing `lat` / `lon` parameters remain blank instead of being treated as `0`.
- This prevents false coordinate lookups at `0,0` when users search by address only.
- Added clearer guidance when Census cannot geocode a rural, historic, or non-standard street address: use latitude/longitude from a map pin.

## v0.36 — Dawes quick-search layer and branded PDF packet

- Added a home-page Dawes / Five Tribes quick-search section powered by `data/dawes_index.json`.
- Added fields for name, tribe/nation, enrollment category, roll/enrollment number, census card number, age, sex, blood degree, relationship, source, and notes.
- Added `data/dawes_index_template.csv` and `tools/build_dawes_index_from_csv.py` so reviewed CSV rows can be converted into the public JSON index.
- Added branded print / save-as-PDF research packets for selected or current Dawes search results.
- Added print CSS that hides the normal page and prints a branded AllottedLand.com research packet with a research-only disclaimer.

## v0.35 — Land Loss Project pattern-evidence intake

This release expands `evidence.html` from a short evidence form into a structured pattern-evidence intake. It asks for allottee identity, land description, land-loss mechanism, actors, protection/vulnerability flags, document checklist, federal approval status, and pattern-research consent.

The form still submits the existing compact backend keys (`family_name`, `tribe`, `county`, `decade`, `loss_method`, `source_type`, `summary`, `source_note`, `contact`, and `consent`) so the current pending-evidence queue can keep working. Extended details are compiled into the review summary/source fields and included as `draft_details` for future backend support.

Fast data that can be collected before full map transcription: Dawes roll/card basics, allotment-packet status, county book/page, probate case number, tax-sale year, sheriff deed, mortgage/release, BIA/LTRO file clue, and oil/gas lease clue.

# Changelog

## v0.34 — Site-wide map pattern background
- Applied the same angled map-pattern background through the shared visual stylesheet across all included pages.
- Added the shared visual stylesheet link to recovered static pages: About, Contact, and Source Records.
- Kept the green header/hero treatment intact so the map pattern stays behind the page body content.


## v0.33 — Green header restoration and Land Loss Project rename
- Restored the solid green header so the map-pattern background does not affect the hero/nav area.
- Renamed the public evidence initiative from People Powered Evidence Project to Land Loss Project.
- Kept the existing evidence.html route for stability while updating public labels, admin labels, and documentation.



## v0.32 — Home mission, consent placement, and visual background
- Moved search/research-path consent checkboxes next to the buttons they unlock.
- Removed the separate “Before using the research tools” box from the home page.
- Expanded the Mission panel with more detail about source-first, family-guided research.
- Added a light angled map-pattern background outside the green header area.
## v0.29b — Workbench admin navigation

- Adds an Admin link to the Workbench header so trusted reviewers can move from data entry to review without typing the URL.
- Keeps v0.29 admin lock/home cleanup changes.

# Changelog

## v0.11 — Tile Review Upgrade

- Improved the local OCR candidate review page.
- Added tile-image preview for candidate rows using the saved OCR tile path.
- Added a bounding-box overlay where Tesseract coordinates are available.
- Added filters for likely map-label noise, rejected rows, and minimum confidence.
- Added reject/hide and quick-mark review buttons so OCR candidates can be screened before any public record is drafted.


All notable public changes to AllottedLand.com will be documented here.

The format follows the spirit of Keep a Changelog: versions are grouped by release and changes are written in plain language for users, families, researchers, and volunteers.

## [0.8] - 2026-06

### Added
- Added the local Map Indexing Agent starter kit in `tools/map_indexing_agent.py`.
- Added `tools/review_candidates.html` for local human review of OCR candidate rows.
- Added `data/allotment_records_candidates.json` as a holding file for unverified OCR leads.
- Added `docs/ocr-workflow.md` with installation, running, review, and safety instructions.
- Added `tools/requirements.txt` for Python dependencies.

### Safety
- OCR results remain candidate leads only. Human review is required before any row is moved into `data/allotment_records.json`.
- Public submissions and automatic publication remain closed.

## [0.7] - 2026-06

### Added
- Added `changelog.html` as a public Project Updates page.
- Added `CHANGELOG.md` for GitHub version tracking.
- Added project-update links in navigation/footer areas.
- Added `changelog.html` to `sitemap.xml`.

### Kept closed
- Public uploads, testimonials, corrections, and land-loss submissions remain closed until privacy, consent, and review rules are finalized.

## [0.6] - 2026-06

### Fixed
- Replaced primary contact buttons with Gmail web-compose links.
- Added a copy-email button for `allottedland@gmail.com`.
- Kept a default email-app fallback link.

## [0.5] - 2026-06

### Added
- Added the project email address: `allottedland@gmail.com`.
- Updated Contact page buttons for questions, corrections/removal requests, and volunteer indexing.
- Added contact email to footers and policy pages.

## [0.4] - 2026-06

### Added
- Added Phase 1 data-status language.
- Added `transcribe.html` for the safe map-indexing workflow.
- Added map review status and transcription queue templates.
- Improved map preview fallback behavior.

## [0.3] - 2026-06

### Added
- Added About, Source Records, and Contact pages.
- Added sitemap and robots.txt updates.
- Added footer links and Beta / Phase 1 language.

## [0.2] - 2026-06

### Fixed
- Removed personal family sample data from public example text.
- Changed search behavior so the page starts with no results until a user searches.
- Clarified untranscribed map status language.

## [0.1] - 2026-06

### Added
- Created the first public static site foundation.
- Added homepage, guided finder, search prototype, county request builder, privacy policy, terms of use, and submission consent page.
- Started the data layer with the Library of Congress Cherokee Nation atlas map index.


## v0.10 Windows Tesseract path helper

If Windows says `tesseract` is not recognized even though Tesseract is installed, run the agent with:

```cmd
python tools\map_indexing_agent.py --page 29 --max-tiles 12 --psm 11 --min-conf 60 --preprocess threshold --tesseract-cmd "C:\Program Files\Tesseract-OCR\tesseract.exe"
```

The agent also now checks common Windows install locations automatically.


## v0.28 — Public homepage database connection and simplified navigation
- Removed homepage section-anchor links from the public nav.
- Added a dynamic approved-records count from Cloudflare D1.
- Added pending-record count so admins can see review backlog.
- Added a latest-approved-records panel.
- Added homepage search wiring to `/api/records`.

## v0.29 — Locked admin panel and cleaner home page

- Adds an admin-key gate to `admin.html` so pending/admin data does not load until the key is entered and verified.
- Adds `functions/api/admin-dashboard.js` for admin-only dashboard counts and latest approved records.
- Moves latest-approved-record display and Phase 1 data status off the public home page and into the admin panel.
- Keeps the public home page focused on search, guidance, source records, and the volunteer workbench.

## v0.30 — Login, testimonials, Land Loss Project, consent gate
- Added `/login.html` for reviewer/admin key storage and verification.
- Added Testimonials page with consent-gated public submissions for review.
- Added Land Loss Project page with consent-gated evidence submissions and aggregate chart placeholders.
- Added backend APIs for testimonials and evidence review using Cloudflare Pages Functions + D1.
- Added admin review sections for pending testimonials and evidence submissions.
- Cleaned the public home page: removed launch/verification-rule blocks and Help Index Maps button.
- Added Privacy/Terms agreement gate before public search and guided research-path tools.
- Updated Workbench with user-focused instructions, LOC source link, saved reviewer-key loading, and township/range county lookup architecture.
- Added D1 migration `migrations/0002_testimonials_evidence.sql`.

## v0.31 — Required Consent Gates and Compliance Hardening
- Disabled public Search and Build Research Path buttons until the user checks the Privacy Policy / Terms of Use agreement.
- Disabled testimonial, evidence, and Workbench submit buttons until all required consent boxes are checked.
- Added age/guardian confirmation to public testimonial and evidence submissions.
- Added server-side consent checks for Workbench record submissions, testimonials, and evidence submissions.
- Updated Privacy Policy, Terms of Use, and Submission Consent Policy language for the live beta submission workflow.
- Added a legal/compliance notes document for ongoing review.

## v0.37 — Dawes search screen/PDF hotfix

- Fixed the branded print packet appearing on the live homepage screen.
- Added an inline Dawes research-lead consent checkbox before Dawes searching/printing.
- Disabled Dawes search and print buttons until the checkbox is checked.
- Stopped the Dawes starter record from appearing as a result before the user runs a search.
- Requires at least one Dawes search clue before showing results.
- Added cache-busting query strings to the Dawes CSS/JS references in `index.html`.

## v0.38 — Universal Branded Print Packets + Data API Roadmap

- Fixed print output by moving the hidden print packet outside `<main>`, so print CSS no longer hides the packet's parent container.
- Added branded print/save-PDF support for:
  - built research path results;
  - generated county-record request text;
  - visible site-search index results and map leads;
  - individual visible result cards;
  - Dawes/Five Tribes result packets through the existing Dawes print button.
- Added `assets/print-packet.js` as a client-side universal print manager.
- Added print buttons for “Build research path” results and “Search the current index” results.
- Added CSS for printable preformatted county-request text and result cards.
- Data roadmap: NARA Catalog API, LOC JSON/IIIF APIs, OHS Dawes database fields, and BIA/LTRO record paths should be treated as source-linked leads, not proof.

## v0.39 — Official Source Connector Hub

- Added homepage Official Source Lookup section for NARA, LOC, OHS, BIA/LTRO, BLM GLO, and NARA AWS bulk dataset paths.
- Added `assets/source-connectors.js` for source clue collection, official link generation, NARA lookup, LOC map lookup, source result cards, and branded print/save-PDF packets.
- Added `/api/nara-search` Cloudflare Pages Function. It requires `NARA_API_KEY` and keeps the key server-side.
- Added `/api/loc-search` Cloudflare Pages Function for public Library of Congress map-source leads.
- Added `data/source_catalog.json` to document the source systems and their best use.
- Updated `sources.html` with the official-source connector hub and source roadmap.
- Added CSS for source connector cards, thumbnails, result cards, source links, and print behavior.

Notes:
- NARA live API results require a Cloudflare Pages secret named `NARA_API_KEY`.
- OHS, BIA/LTRO, and BLM GLO are included as official linkout / request paths unless an official public API is identified and approved for this use.
- Do not scrape NARA live API for bulk data. Use NARA AWS Catalog dataset for bulk metadata work.

## v0.40 — Official source connector resilience hotfix

- Fixed LOC source lookup so a 403/rate-limit/proxy block no longer leaves users with no useful result. The connector now returns printable official LOC search-link cards when live JSON cannot be fetched.
- Broadened NARA live API searches and added multiple fallback searches instead of forcing one over-specific Dawes/allotment phrase.
- Added NARA fallback result cards when the API key is missing, placeholder, blocked, or the live API returns no rows.
- Improved NARA result normalization for nested v2 Catalog API records.
- Updated cache-busting query strings to `v=040` for the homepage connector assets.

## v0.41 — Full deployment repair package

- Rebuilt a complete deployable site snapshot instead of a changed-files-only patch.
- Restored core static assets such as `assets/styles.css`, `assets/app.js`, data files, docs, and all public pages.
- Preserved v0.40 connector resilience fixes and v0.39 official-source connectors.
- Use this folder for Wrangler deployments. Do not deploy a changed-files-only patch folder as the entire Cloudflare Pages site.

## v0.42 — Public source-lead connectors

- Added `/api/chronicling-search` for Chronicling America / LOC historic newspaper source leads, with printable fallback official links.
- Added `/api/fr-search` for FederalRegister.gov source leads. No API key required.
- Added `/api/census-lookup` for Census Geocoder and TIGERweb AIANNH/OTSA geography source leads. No API key required for these endpoints.
- Expanded the homepage Official Source Lookup section with buttons for newspapers, Federal Register, Census geography lookup, and record request packets.
- Added address, latitude, and longitude inputs for Census geography lookup.
- Added printable record request packet text for NARA, OHS, county clerks, BIA/LTRO, and BLM/GLO.
- Updated `sources.html`, schema notes, and connector source cards.

Deployment note: deploy this as a full site folder with Wrangler, not as a changed-files-only patch.
