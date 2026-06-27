# AllottedLand.com

Project contact: allottedland@gmail.com

AllottedLand.com is a free public research-tool prototype for helping Native families find allotted land from public map and record sources.

## Current production workflow — v0.25

The active data-entry workflow is now **human-reviewed full-map transcription** using:

- `tools/map_workbench.html`
- `data/allotment_records.json`
- `data/section_status.json` or future township/range section-status JSON files
- `data/map_index.json`

The reviewer loads one full LOC source map image in the browser, calibrates the township/range grid, selects a section, enters human-reviewed rows, marks section progress, and exports JSON. The source image is not stored by the website.

## Deprecated local tools

The early OCR/crop tools were useful experiments, but they are no longer the production path. OCR candidates were too noisy for reliable public records. These can be deleted from the public repo after confirming `tools/map_workbench.html` works:

- `tools/map_indexing_agent.py`
- `tools/review_candidates.html`
- `tools/section_entry.html`
- `tools/grid_calibrator.html`
- `tools/township_workbench.html`
- `tools/requirements.txt`
- `docs/ocr-workflow.md`
- `data/allotment_records_candidates.json`
- `data/ocr_runs/`
- `tools/__pycache__/`

See `docs/source-code-cleanup.md` for the safe cleanup plan.

## Public data files

- `data/map_index.json` — LOC map-page index.
- `data/allotment_records.json` — approved, human-reviewed searchable records.
- `data/section_status.json` — section progress/status data.
- `data/county_routes.json` — future county-record routing data.

## Safety rules

- Do not publish living-person private information.
- Do not treat OCR or map guesses as proof.
- Keep roll, enrollment, census-card, allotment, and map-number fields separate unless verified.
- Source images can be loaded by the browser for review, but they do not need to be stored in the repo.

## Deployment

Static site for GitHub + Cloudflare Pages. Suggested Cloudflare Pages settings: Framework preset `None`, build command blank, build output directory `/` or `.`.
