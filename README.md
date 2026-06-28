

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
This version adds public Testimonials and People Powered Evidence Project pages, a `/login.html` key helper for reviewers/admins, and D1-backed pending review queues for testimonials and evidence submissions.

After uploading v0.30, run this migration in Cloudflare D1 Console:

```sql
-- open migrations/0002_testimonials_evidence.sql and paste the whole file into D1 Console
```

The public source image still is not stored by the website. Workbench users load the LOC image locally in their browser, enter human-reviewed rows, and submit record data only.

County lookup is now supported through `data/township_county_lookup.json`. Do not rely on a county suggestion until the township/range-to-county crosswalk has been independently verified.

### v0.31 consent gate update
Public search and research-path tools now require a Privacy Policy / Terms of Use checkbox before the buttons activate. Testimonial, evidence-project, and Workbench submission buttons remain disabled until required consent boxes are checked. Server-side Functions also reject submissions missing required consent confirmations.

This is not a substitute for legal review. The project should continue to review privacy, accessibility, child-privacy, data-retention, and state privacy requirements before wider public launch.
