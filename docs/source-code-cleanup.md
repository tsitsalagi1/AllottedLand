# Source-code cleanup plan

## Active production tool

Keep:

- `tools/map_workbench.html`
- `data/allotment_records.json`
- `data/map_index.json`
- `data/section_status.json`
- public site files such as `index.html`, `sources.html`, `transcribe.html`, `privacy.html`, `terms.html`, `submission-policy.html`, `about.html`, `contact.html`, `assets/`, `sitemap.xml`, and `robots.txt`

## Delete from the public GitHub repo

The following files/folders are no longer needed for the production workflow:

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

## Why

The OCR/crop pipeline was useful for testing, but the map images are more reliably transcribed by humans using the calibrated full-map workbench. The source image should be loaded by the reviewer in the browser, not stored in the public repository.

## Suggested commit messages

1. `Deprecate OCR agent workflow`
2. `Remove unused OCR and crop tools`
3. `Keep repository focused on map workbench and verified records`

## Do not delete

Do not delete `data/allotment_records.json` or `data/map_index.json`. These are core public data files.
