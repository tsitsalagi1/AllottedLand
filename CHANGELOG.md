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

## v0.30 — Login, testimonials, evidence project, consent gate
- Added `/login.html` for reviewer/admin key storage and verification.
- Added Testimonials page with consent-gated public submissions for review.
- Added People Powered Evidence Project page with consent-gated evidence submissions and aggregate chart placeholders.
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
