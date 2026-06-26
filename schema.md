# AllottedLand.com data schema

## `data/map_index.json`

One row per Library of Congress map page.

Recommended fields:

- `type` — usually `map`.
- `loc_page` — LOC sequence page number.
- `sheet_title` — map sheet title or township label.
- `township` — numeric township, without `T` or `N`.
- `range` — numeric range, without `R` or `E`.
- `township_range` — normalized string, for example `T21N R12E`.
- `loc_image_view` — public LOC image-view URL.
- `loc_item_page` — main LOC item URL.
- `ocr_status` — not OCRed, OCRed, verified, etc.
- `notes` — processing notes.

## `data/allotment_records.json`

One row per searchable person/allotment entry.

Recommended fields:

- `verified_name`
- `possible_ocr_name`
- `surname`
- `given_name`
- `tribe`
- `roll_number`
- `enrollment_number`
- `census_card_number`
- `allotment_number`
- `status_restriction_notation`
- `loc_page`
- `township_range`
- `township`
- `range`
- `section`
- `county`
- `state`
- `legal_description`
- `source_link`
- `confidence` — suggested values: `unverified`, `ocr-low`, `ocr-medium`, `human-reviewed`, `source-verified`.
- `needs_human_review` — `yes` or `no`.
- `notes`

Keep **roll/enrollment number** and **allotment number** separate. They are not automatically the same thing.

## `data/county_routes.json`

One row per township/range/section-to-county route.

Recommended fields:

- `tribe`
- `township`
- `range`
- `section` — optional but preferred because county lines can cut through township/range areas.
- `township_range`
- `county`
- `state`
- `basis` — how the county route was verified.
- `notes`

The county route file is critical for the “what county do I contact?” feature. Treat unverified rows as leads until checked against official PLSS/county-boundary sources.

## Suggested verification statuses

- `unverified` — imported lead, no review.
- `ocr-low` — OCR text likely has mistakes.
- `ocr-medium` — OCR text looks plausible but not confirmed.
- `human-reviewed` — checked by a reviewer against map image.
- `source-verified` — checked against original map plus Dawes/NARA/county/BIA source record.


## v0.4 added files

### data/map_review_status.json
Project-level status fields for the current public index, including map pages indexed, verified name rows, public submission status, and next data goal.

### data/sample_map_records.json
Non-personal map-only examples used for testing and documentation. These records should not contain family names or private information.

### data/transcription_queue_template.csv
Template for future map transcription work. Public upload/intake is not open until privacy and review processes are finalized.


## Project contact

Public project email: `allottedland@gmail.com`. Do not send private family documents or sensitive living-person information unless redacted and permission has been obtained.


## Project update files

- `changelog.html` — public project updates page for site visitors.
- `CHANGELOG.md` — GitHub-facing version history for maintainers.


## `data/allotment_records_candidates.json`

Holding file for machine-extracted OCR candidate rows. These are not verified public records.

Additional candidate-only fields may include:

- `record_type` — usually `ocr-candidate`.
- `run_id` — unique OCR run identifier.
- `candidate_id` — unique row identifier.
- `sheet_title` — map sheet title from `map_index.json`.
- `image_source` — downloaded image URL used by the OCR agent.
- `tile_id` — source tile identifier.
- `tile_path` — local tile image path.
- `tile_box` — tile position on the processed source image.
- `bbox_in_tile` — OCR line bounding box within the tile.
- `raw_ocr_line` — full OCR line as read by the machine.
- `ocr_confidence_percent` — Tesseract confidence when available.
- `review_status` — `not-reviewed`, `needs-second-review`, `approved`, or `rejected`.

Candidate rows should be copied into `data/allotment_records.json` only after human review and cleanup.

## `tools/` OCR helper files

- `tools/map_indexing_agent.py` — local OCR candidate generator.
- `tools/review_candidates.html` — local candidate review helper.
- `tools/requirements.txt` — Python dependencies for the OCR agent.

## `data/ocr_runs/`

Local output folder for OCR run CSV files and tile images. Most generated run files should be reviewed before being committed to GitHub because they can become large.


## v0.10 Windows Tesseract path helper

If Windows says `tesseract` is not recognized even though Tesseract is installed, run the agent with:

```cmd
python tools\map_indexing_agent.py --page 29 --max-tiles 12 --psm 11 --min-conf 60 --preprocess threshold --tesseract-cmd "C:\Program Files\Tesseract-OCR\tesseract.exe"
```

The agent also now checks common Windows install locations automatically.


## Review trace fields

Approved rows may include a `review_trace` object showing the original OCR candidate ID, tile ID, tile path, raw OCR line, and OCR confidence. This is optional but useful for auditability while records are still being reviewed.


## v0.12 section-first candidate fields

When the local OCR agent is run with `--mode sections`, candidate rows may also include:

- `section_source` — usually `plss-grid-crop`, meaning the row came from a calculated section crop.
- `section_image_path` — local path to the saved section crop image under `data/ocr_runs/`.
- `section_grid` — grid rectangle and row/column metadata used to create the section crop.
- `legal_description` — may be prefilled as `Section X, T##N R##E` for review convenience.

These fields are review aids only. A section-first candidate is not a verified allotment record until a human checks the crop and original map source.
