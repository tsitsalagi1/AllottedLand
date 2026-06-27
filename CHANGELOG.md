# Changelog

## v0.17 — Human Section Entry Helper

- Added `tools/section_entry.html`, a local manual transcription tool for entering rows from section crop images.
- Shifted the recommended workflow from OCR-first to section-first/human-reviewed.
- Added export buttons for approved rows so humans can build `data/allotment_records.json` more accurately.
- Kept OCR as an optional clue source, not proof.


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
