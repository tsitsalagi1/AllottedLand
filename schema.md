# AllottedLand.com data schema

## Core production files

### `data/map_index.json`

One row per Library of Congress map page.

Recommended fields: `type`, `loc_page`, `sheet_title`, `township`, `range`, `township_range`, `loc_image_view`, `loc_item_page`, `ocr_status`, `notes`.

### `data/allotment_records.json`

One row per approved public person/map record. Rows should come from human-reviewed transcription, not raw OCR.

Recommended fields:

- `verified_name`
- `first_name`
- `middle_name`
- `last_name`
- `surname`
- `given_name`
- `tribe`
- `map_number`
- `number_shown_on_map`
- `number_type` — default: `unknown_map_number`
- `roll_number` — only if separately verified
- `enrollment_number` — only if separately verified
- `census_card_number` — only if separately verified
- `allotment_number` — only if the reviewer is confident the number is an allotment number or a later source verifies it
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
- `confidence` — `human-reviewed`, `needs-review`, `uncertain`, or `source-verified`
- `needs_human_review` — `yes` or `no`
- `notes`
- `review_trace` — optional information from the map workbench

### `data/section_status.json`

Tracks transcription progress by township/range and section. Suggested status values:

- `not_started`
- `has_rows`
- `complete`
- `needs_review`
- `no_records`

## Deprecated files

`data/allotment_records_candidates.json` and OCR candidate outputs are deprecated. Do not use raw OCR candidates as public records.
