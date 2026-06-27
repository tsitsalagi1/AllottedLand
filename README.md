# AllottedLand.com

Project contact: allottedland@gmail.com

AllottedLand.com is a free public research-tool prototype for helping Native families find allotted land from partial clues such as name, tribe, roll/enrollment number, township/range/section, county, town, cemetery, or family story.

## Current status

Beta / Phase 1. Current public version: v0.15. See `CHANGELOG.md` and `changelog.html` for project updates.

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

## v0.15 — Section-First Agent

The local indexing agent now supports section-first OCR. Instead of OCRing random map tiles first, it can crop a fixed PLSS section, save the section image, and attach every OCR candidate to a stable township/range/section value. Example:

```cmd
python tools\map_indexing_agent.py --clear-candidates
python tools\map_indexing_agent.py --page 29 --mode sections --sections 24 --psm 11 --min-conf 45 --preprocess threshold --tesseract-cmd "C:\Program Files\Tesseract-OCR\tesseract.exe"
```

If the section crop is off, adjust the grid rectangle with `--grid-pct left,top,right,bottom`, for example `--grid-pct 8,15,92,87`.


### v0.15 local review note
If the View tile button does not display an image, click Open tile image directly or use Manual tile/image load and choose the matching image under data/ocr_runs/.


## v0.15 Approved Rows Export
The local OCR review helper now has an approved rows export list. After correcting and verifying a candidate against the tile/source map, use “Add corrected row to approved export list,” then download `approved_allotment_records.json` and merge/copy into `data/allotment_records.json`.
