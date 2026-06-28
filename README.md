## v0.36 — Dawes quick-search layer and branded PDF packet

This release adds a fast homepage search layer for Dawes / Five Tribes record leads. It loads `data/dawes_index.json` and lets users search by name, tribe, enrollment category, roll/enrollment number, census card number, and keyword before the full allotment-map transcription is complete.

The release also adds a branded research packet print feature. Users can add Dawes lead results to a packet, click **Print / save PDF**, and use the browser print dialog to save a branded PDF. The packet includes AllottedLand.com branding, result fields, next research steps, source links, and a research-only disclaimer.

New files:

- `assets/dawes-search.js` — static Dawes search and branded print-packet logic.
- `data/dawes_index.json` — starter JSON index with one NARA guide example record for testing.
- `data/dawes_index_template.csv` — bulk-entry template for reviewed public Dawes index rows.
- `tools/build_dawes_index_from_csv.py` — converts the reviewed CSV into `data/dawes_index.json`.

Important: this version does not scrape Ancestry, FamilySearch, or other restricted databases. Add only data that has been lawfully obtained, reviewed, and allowed for public indexing. Treat all matches as research leads until checked against original records.

## v0.35 — Land Loss Project pattern-evidence intake

This release expands `evidence.html` from a short evidence form into a structured pattern-evidence intake. It asks for allottee identity, land description, land-loss mechanism, actors, protection/vulnerability flags, document checklist, federal approval status, and pattern-research consent.

The form still submits the existing compact backend keys (`family_name`, `tribe`, `county`, `decade`, `loss_method`, `source_type`, `summary`, `source_note`, `contact`, and `consent`) so the current pending-evidence queue can keep working. Extended details are compiled into the review summary/source fields and included as `draft_details` for future backend support.

Fast data that can be collected before full map transcription: Dawes roll/card basics, allotment-packet status, county book/page, probate case number, tax-sale year, sheriff deed, mortgage/release, BIA/LTRO file clue, and oil/gas lease clue.

## v0.34 — Site-wide map background

This release makes the angled source-map pattern consistent across all included pages by using the shared `assets/v032-visual.css` override and adding that stylesheet to About, Contact, and Source Records. The green header remains solid for readability.

## v0.33 — Green header + Land Loss Project

This release keeps the original green header color while leaving the angled source-map pattern in the page body only. It also renames the public evidence initiative to **Land Loss Project** while preserving the existing `evidence.html` URL.



## v0.32 — Home mission, consent placement, and visual background
- Moved search/research-path consent checkboxes next to the buttons they unlock.
- Removed the separate “Before using the research tools” box from the home page.
- Expanded the Mission panel with more detail about source-first, family-guided research.
- Added a light angled map-pattern background outside the green header area.
# AllottedLand.com

Project contact: allottedland@gmail.com

AllottedLand.com is a free public research-tool prototype for helping Native families find allotted land from partial clues such as name, tribe, roll/enrollment number, township/range/section, county, town, cemetery, or family story.

## Current status

Beta / Phase 1. Current public version: v0.9. See `CHANGELOG.md` and `changelog.html` for project updates.

Beta / Phase 1. The current live search starts with the Library of Congress 1909 Cherokee Nation atlas map index. Name, roll-number, allotment-number, county-routing, testimonial, and land-loss datasets will expand only as verified records are added.

## v0.5 changes

- Added public project email: `allottedland@gmail.com`.
- Updated `contact.html` with general question, correction/removal, and volunteer mailto links.
- Added contact email to footers and policy pages.
- Added a reminder not to email sensitive private family documents unless redacted and permitted.
- Added basic Organization structured data on the homepage with project URL and contact email.

## Site pages

- `index.html` — homepage, guided finder, search, process guide, request builder, stories/data preview
- `about.html` — mission and beta scope
- `sources.html` — source-record explanation and official source links
- `transcribe.html` — indexing/transcription plan
- `contact.html` — contact/correction guidance and privacy warning
- `privacy.html` — starter privacy policy
- `terms.html` — starter terms of use
- `submission-policy.html` — starter submission consent policy
- `sitemap.xml` — sitemap for search engines
- `robots.txt` — crawl rules and sitemap location

## Safety rule

Do not accept uploads, testimonials, corrections, or family documents until Privacy, Terms, Submission Consent, and a review/removal process are finalized.

## Deployment

Static site for GitHub + Cloudflare Pages. Suggested Cloudflare Pages settings: Framework preset `None`, build command blank, build output directory `/` or `.`.


## v0.6 update

Replaced primary contact buttons with Gmail web compose links, kept a default-email-app fallback, and added a copy-email button so contact works even when mailto links are not configured in the visitor's browser or operating system.


## v0.7 update

Added public project-update tracking with `changelog.html` and `CHANGELOG.md`, updated navigation/footer links, and added the updates page to the sitemap.


## v0.9 update

Added a local Map Indexing Agent starter kit:

- `tools/map_indexing_agent.py` — downloads one public LOC map image, tiles it, runs Tesseract OCR, and writes candidate rows.
- `tools/review_candidates.html` — local browser review helper for OCR candidate rows.
- `tools/requirements.txt` — Python package requirements.
- `docs/ocr-workflow.md` — installation, running, review, and safety workflow.
- `data/allotment_records_candidates.json` — unverified OCR candidate holding file.

OCR candidates are not public verified records. Move rows into `data/allotment_records.json` only after human review against the original source image.


## v0.10 Windows Tesseract path helper

If Windows says `tesseract` is not recognized even though Tesseract is installed, run the agent with:

```cmd
python tools\map_indexing_agent.py --page 29 --max-tiles 12 --psm 11 --min-conf 60 --preprocess threshold --tesseract-cmd "C:\Program Files\Tesseract-OCR\tesseract.exe"
```

The agent also now checks common Windows install locations automatically.


## v0.11 — Tile Review Upgrade

The local OCR review helper now shows saved tile images beside candidate OCR rows, includes a bounding-box overlay where available, and adds filters/reject buttons so noisy map-label text can be screened before any row is drafted for `data/allotment_records.json`.


## v0.28 homepage behavior
The public home page now reads approved records from `/api/records` and database counts from `/api/stats`. Pending records remain hidden from public search until approved through `admin.html`. The top navigation now links only to full pages instead of internal home-page anchors.

### v0.29 admin/homepage cleanup

`admin.html` is now the place for internal counts, latest approved records, pending records, and review workflow. The public homepage no longer displays latest approved records or Phase 1 data-status cards.

The admin page does not load database content until the `ADMIN_KEY` is entered and verified through `/api/admin-dashboard`. The D1 APIs still enforce the key server-side. For stronger page-level protection, place `/admin.html` behind Cloudflare Access / Zero Trust.


### v0.29b navigation note
The Workbench header now includes a direct Admin link for trusted reviewers. The admin page still requires the ADMIN_KEY before database data loads.

## v0.30 notes
This version adds public Testimonials and Land Loss Project pages, a `/login.html` key helper for reviewers/admins, and D1-backed pending review queues for testimonials and evidence submissions.

After uploading v0.30, run this migration in Cloudflare D1 Console:

```sql
-- open migrations/0002_testimonials_evidence.sql and paste the whole file into D1 Console
```

The public source image still is not stored by the website. Workbench users load the LOC image locally in their browser, enter human-reviewed rows, and submit record data only.

County lookup is now supported through `data/township_county_lookup.json`. Do not rely on a county suggestion until the township/range-to-county crosswalk has been independently verified.

### v0.31 consent gate update
Public search and research-path tools now require a Privacy Policy / Terms of Use checkbox before the buttons activate. Testimonial, evidence-project, and Workbench submission buttons remain disabled until required consent boxes are checked. Server-side Functions also reject submissions missing required consent confirmations.

This is not a substitute for legal review. The project should continue to review privacy, accessibility, child-privacy, data-retention, and state privacy requirements before wider public launch.

## v0.37 hotfix deployment notes

Upload/overwrite these changed files after v0.36:

- `index.html`
- `assets/dawes-search.js`
- `assets/v032-visual.css`
- `CHANGELOG.md`
- `changelog.html` if using the public changelog page

This release fixes the Dawes search/PDF display bug. The print packet is hidden on screen and appears only in the browser print/save-PDF output. Dawes results no longer display before a user enters a search clue and clicks Search.

## v0.38 deployment note

Upload these changed files over the current site:

- `index.html`
- `assets/print-packet.js`
- `assets/v032-visual.css`
- `assets/app.js`
- `README.md`
- `CHANGELOG.md`
- `changelog.html`

After upload, hard refresh the site with Ctrl+F5. The print packet must remain outside `<main>` in `index.html`; otherwise print CSS can hide the packet's parent container.

## v0.38 data-source roadmap

The next data layer should prefer official/public source paths:

1. NARA Catalog API for archival descriptions, digital-object metadata, OCR/extracted text, and JSON search results.
2. Library of Congress JSON API and IIIF image services for map metadata, map pages, citations, and images.
3. Oklahoma Historical Society Dawes database fields as a search/path reference, subject to permissions and practical access limits.
4. BIA/LTRO as the official record path for trust/restricted title documents, including patents, deeds, probate orders, leases, rights-of-way, cadastral surveys, plats, and title status records.

Do not scrape paywalled/restricted sites such as Ancestry, Fold3, or FamilySearch. Link out or use user-provided/downloaded records only where permitted.

## v0.39 official source connector hub

Upload these changed files over v0.38:

- `index.html`
- `sources.html`
- `assets/source-connectors.js`
- `assets/v032-visual.css`
- `functions/api/nara-search.js`
- `functions/api/loc-search.js`
- `data/source_catalog.json`
- `README.md`
- `CHANGELOG.md`
- `changelog.html`

### Cloudflare setup

Set this Pages environment variable if you want live NARA API results:

```text
NARA_API_KEY=your_read_only_nara_catalog_api_key
```

Do not place the NARA key in browser JavaScript or in the public GitHub repository. The site calls `/api/nara-search`, and the Cloudflare Function adds the `x-api-key` header server-side.

The LOC connector does not require a key. It uses `/api/loc-search` to query the Library of Congress JSON/YAML map endpoint and return lightweight source leads.

### Source behavior

- NARA Catalog API: live source leads when `NARA_API_KEY` is configured; official link fallback if not configured.
- LOC JSON/YAML API: live map/source leads through `/api/loc-search`.
- OHS Dawes Rolls: official state linkout/search path.
- BIA/LTRO: official title-record request path.
- BLM GLO Records: official federal land-record linkout.
- NARA AWS dataset: bulk metadata path for future offline import work.

All output remains labeled as research leads. Users should verify every lead against the official record page or original source record.


## v0.40 connector hotfix

This release keeps the same v0.39 Official Source Lookup interface but makes it safer for real public use. If the Library of Congress JSON endpoint returns HTTP 403, rate limiting, or another proxy failure, `/api/loc-search` now returns official LOC search-link cards with printable source leads instead of an error. `/api/nara-search` now tries broader searches and returns official NARA search/guide cards when the live API returns zero rows or the `NARA_API_KEY` is missing/placeholder.

Deploy with Wrangler from this folder:

```powershell
npx.cmd wrangler pages deploy . --project-name allottedland --branch main
```

Then hard refresh `https://allottedland.com` with Ctrl+F5.

## v0.41 deployment warning

This package is a full Cloudflare Pages deployment snapshot. Deploy this entire folder with Wrangler:

```powershell
npx.cmd wrangler pages deploy . --project-name allottedland --branch main
```

Do not deploy a changed-files-only folder as the whole site. Cloudflare Pages deployments replace the deployed asset snapshot with the folder you deploy. A partial folder can leave the live site missing shared CSS, JavaScript, data, and supporting pages.

## v0.43 public source-lead connectors

This build adds public source-lead tools that make the site useful while map indexing continues:

- `/api/chronicling-search` — Chronicling America / LOC historic newspaper source leads for tax-sale, sheriff sale, guardian, probate, oil/gas, and family-name searches.
- `/api/fr-search` — FederalRegister.gov public API source leads for BIA, Indian Affairs, tribal ordinances, land acquisition, and related notices.
- `/api/census-lookup` — Census Geocoder + TIGERweb AIANNH/OTSA source leads for address or coordinate lookups.
- Record request packet builder — printable request text for NARA, OHS, county clerk, BIA/LTRO, and BLM/GLO follow-up.

No new D1 migration is required. No new API keys are required for Federal Register, Census Geocoder/TIGERweb, or Chronicling America/LOC. NARA still requires `NARA_API_KEY` for live NARA rows.

Deploy the full folder with:

```powershell
npx.cmd wrangler pages deploy . --project-name allottedland --branch main
```

Do not deploy a changed-files-only folder as the full website snapshot.


## v0.43 Census lookup note
If Census returns no address match, use latitude/longitude. Rural, historic, or non-standard addresses may not geocode from Census address-range data.
