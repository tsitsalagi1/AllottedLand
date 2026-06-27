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


## v0.17 — Human Section Entry Helper

Added `tools/section_entry.html`, a local browser tool for manually entering verified allotment rows from a section crop image. This shifts the workflow from OCR-first to section-first/human-reviewed: use township, range, and section as the stable legal anchor; let a human read the names and allotment numbers; then export approved JSON rows for `data/allotment_records.json`.


### v0.17 note
The section-entry workflow is now the primary production workflow: human reviewers read one PLSS section crop at a time and export verified JSON rows. OCR remains optional and should not be treated as proof.


## v0.19 section workflow

Generate all 36 human-review section crops from one map page without OCR:

```cmd
python tools\map_indexing_agent.py --page 29 --mode sections --sections all --preprocess soft --section-padding 90 --crops-only
```

Then open `tools/section_entry.html`, load `data/ocr_runs/page_029_sections_manifest.json`, pick township/range/section, enter rows by human reading, prevent duplicates by loading `data/allotment_records.json`, and export approved rows plus section status JSON.


### v0.19 section-crop workflow

For human transcription, generate organized section crops from one township/range map:

```cmd
python tools\map_indexing_agent.py --page 29 --mode sections --sections all --preprocess soft --section-padding 240 --crops-only --output-layout trs
```

This writes a manifest and saves local review crops under:

```text
data/ocr_runs/by_township_range/T24N_R14E/section_24/
```

The public website should store searchable JSON/index data and source links. Do not commit thousands of large crop images unless intentionally creating a limited thumbnail set.
