# AllottedLand.com data schema

## `data/map_index.json`

One row per Library of Congress map page.

Recommended fields:

- `type` — usually `map`.
- `loc_page` — LOC sequence page number.
- `sheet_title` — map sheet title or township label.
- `township` — numeric township, without `T` or `N`.
- `range` — numeric range, without `R` or `E`.
- `township_range` — normalized string, for example `T26N R21E`.
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
