# v0.48 Universal Search Readability Cleanup

- Renamed public-facing “clue” language to “Information you have” / “Information I have.”
- Moved the user guidance boxes above Universal Search so families read the instructions before searching.
- Kept Universal Search as the single public homepage tool instead of exposing several separate search forms.
- Tightened site/index matching so person or roll-number searches do not show every township/section neighbor as a direct match.
- Improved print CSS so agency request packet text prints fully instead of appearing as scroll boxes.



## v0.46 — Unified horizontal family-land search

- Replaced the separate Guided Family-Land Finder homepage section with one Universal Search form.
- Expanded the form to include the questions from the older What do you know?, Official-source lookup clues, Dawes search, and current-index search workflows.
- Moved Unified Results directly below the Universal Search form.
- Reordered unified output so the Built Research Path appears first, followed by summary, local/index matches, official-source leads, prepared links, and record-request packet.
- Added an “I don’t know where to start” button that builds a starter research path when the user has no clue yet.
- Improved built research path cards to explain what to look for and where to search for each record type.
- Added guards so older advanced-tool JavaScript does not fail when the old wizard section is no longer present on the homepage.


## v0.45 Unified Search API

Endpoint: `/api/unified-search?q=...`

Returns: `query`, `detected_types`, `research_path`, `approved_records`, `official_source_leads`, and `record_request_packet`. The endpoint does not require a database migration. If the D1 `DB` binding is available, it searches approved public records; otherwise it still returns path/source-link guidance.


## v0.44 Address resolver endpoint

`GET /api/address-resolve?address=...` returns:

- `resolved.lat`
- `resolved.lon`
- `resolved.provider`
- `resolved.label`
- printable source lead cards

The resolver uses Census first and OpenStreetMap Nominatim only as a fallback. It is for end-user-triggered, low-volume research lookup, not bulk geocoding.

## v0.36 — Dawes quick-search index schema

`data/dawes_index.json` powers the new homepage Dawes / Five Tribes quick-search layer. It is a lightweight static JSON file so the site can help users find record leads before every allotment map is indexed.

Recommended fields for each `records[]` item:

- `id` — stable unique row ID.
- `record_type` — usually `Dawes Roll Match`, `Dawes Census Card Lead`, `Enrollment Application Lead`, or `Allotment Jacket Lead`.
- `full_name`, `first_name`, `middle_name`, `last_name`, `variant_names`.
- `tribe` and `nation`.
- `enrollment_category` and `category_abbreviation`.
- `roll_number` / enrollment number.
- `census_card_number`.
- `age`, `sex`, `blood_degree`.
- `relationship_to_head` for census-card/family-group records when known.
- `source_title`, `source_url`, `notes`, `search_terms`.

Build workflow:

1. Put reviewed rows into `data/dawes_index_template.csv`.
2. Run `python tools/build_dawes_index_from_csv.py data/dawes_index_template.csv data/dawes_index.json`.
3. Commit/deploy the updated JSON.
4. The homepage Dawes search reads the new static index automatically.

Do not confuse `roll_number` / enrollment number with allotment number or map number. Keep Dawes identity records separate from allotment-map records until they are verified and linked by source documents.

## v0.35 — Land Loss Project pattern-evidence intake

The public `evidence.html` form now collects structured pattern-evidence fields while preserving the existing compact backend keys used by `/api/submit-evidence`. Extra details are compiled into `summary` and `source_note` so the current review queue can still receive submissions without a database migration.

Recommended extended Land Loss Project fields for a future D1 migration:

### Allottee identity
- `family_name`
- `tribe`
- `roll_number`
- `census_card_number`
- `enrollment_category`
- `blood_degree_or_status`
- `age_or_birth_year`
- `relationship_to_submitter`

### Land description
- `county`
- `township`
- `range`
- `section`
- `allotment_or_map_number`
- `acreage`
- `legal_description`
- `map_or_source_link`

### Loss event
- `loss_method` — `tax_sale`, `mortgage_foreclosure`, `sheriff_sale`, `private_deed`, `probate_partition`, `guardian_sale`, `restriction_removal`, `right_of_way_condemnation`, `oil_gas_mineral`, `fraud_alleged`, `still_in_family`, or `unknown`.
- `event_year`
- `decade`
- `amount_debt_tax_or_bid`
- `buyer_grantee_or_lender`
- `case_or_instrument_number`
- `summary`

### Pattern fields
- `actors` — array of government/private actors shown in the record.
- `flags` — array of protection/vulnerability flags such as minor, guardianship, missing notice, taxation issue, missing federal approval, or title-chain gap.
- `documents` — array of document types located or still needed.
- `federal_approval_status` — `yes`, `no`, `unknown`, or `not_applicable`.
- `contact_permission`
- `pattern_research_consent`

Fast data that can be added before map transcription is complete: Dawes roll/card basics, allotment-packet status, county book/page, probate case number, tax-sale year, sheriff deed, mortgage/release, BIA/LTRO file clue, and oil/gas lease clue.

## v0.33 naming update

The public evidence initiative is now named **Land Loss Project**. Existing D1 table/API names that use `evidence` may remain for backward compatibility, but public labels should use Land Loss Project.



## v0.32 — Home mission, consent placement, and visual background
- Moved search/research-path consent checkboxes next to the buttons they unlock.
- Removed the separate “Before using the research tools” box from the home page.
- Expanded the Mission panel with more detail about source-first, family-guided research.
- Added a light angled map-pattern background outside the green header area.
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


## v0.28 API additions
`/api/stats` returns approved record count, pending record count, and section-status counts for homepage display.

## Admin dashboard API

`/api/admin-dashboard` requires the `X-Admin-Key` header matching `ADMIN_KEY`. It returns approved/pending counts, section-status counts, and recent approved records for the admin panel.

## v0.30 submission tables
`pending_testimonials` and `approved_testimonials` store testimonial submissions after consent. `pending_evidence` and `approved_evidence` store Land Loss Project submissions. Evidence charts should use only approved evidence rows and should be presented as aggregate patterns, not private family records.

## County lookup
`data/township_county_lookup.json` is a verified-data layer for township/range-to-county suggestions. Until a row is verified, the Workbench should leave county blank or treat it as a suggestion only.

## v0.31 Consent metadata
Submissions should include a consent object when sent to backend APIs:

```json
{
  "consent": {
    "privacy": true,
    "terms": true,
    "submission": true,
    "permission": true,
    "age": true
  }
}
```

Workbench record submissions require privacy, terms, submission, and permission confirmations. Public testimonial and evidence submissions also require age/guardian confirmation.

## v0.39 source connector endpoints

### `/api/nara-search`

Cloudflare Pages Function for National Archives Catalog source leads.

Required environment variable:

```text
NARA_API_KEY
```

Query parameters:

- `q` — required source clue string.
- `limit` — optional, clamped to 1–20.

Returns:

```json
{
  "query": "Ketcher Cherokee roll 1637",
  "provider": "NARA Catalog API",
  "results": [
    {
      "title": "NARA Catalog source lead",
      "naId": "...",
      "date": "...",
      "description": "...",
      "url": "https://catalog.archives.gov/id/...",
      "thumbnail": "..."
    }
  ],
  "official_url": "https://catalog.archives.gov/search?q=...",
  "notice": "This product uses the National Archives Catalog API but is not endorsed or certified by the National Archives and Records Administration."
}
```

Do not cache or store full NARA API responses. Use this for live lookup and printable leads only.

### `/api/loc-search`

Cloudflare Pages Function for Library of Congress map/source leads.

Query parameters:

- `q` — required source clue string.
- `limit` — optional, clamped to 1–20.

Returns normalized LOC result cards with title, URL, date, description, and thumbnail where available.

## v0.39 source catalog

`data/source_catalog.json` documents the source systems included in the homepage Official Source Lookup hub:

- NARA Catalog API
- Library of Congress JSON/YAML API
- Oklahoma Historical Society Dawes Rolls Search
- BIA Branch of Land Titles and Records / LTRO
- BLM General Land Office Records
- NARA Catalog AWS bulk dataset

## v0.40 source connector behavior

Official source lookup endpoints may return either live API results or printable fallback source-link cards.

- `/api/nara-search?q=...` returns `fallback: false` when live NARA rows are available and `fallback: true` when it returns official NARA search/guide leads.
- `/api/loc-search?q=...` returns `fallback: false` when LOC JSON rows are available and `fallback: true` when it returns official LOC search-link leads after a 403/rate-limit/proxy block or zero-row JSON response.

Fallback rows are intentional records for user guidance and printing; they are not database records and should not be treated as proof of title, enrollment, heirship, ownership, or legal rights.

## v0.42 source-lead connector response shape

New public source connectors return a common research-lead shape:

```json
{
  "query": "string",
  "provider": "string",
  "results": [
    {
      "title": "string",
      "url": "official source URL",
      "date": "string",
      "type": "string",
      "sourceId": "optional identifier",
      "description": "source lead summary",
      "thumbnail": "optional image URL"
    }
  ],
  "official_url": "official fallback URL",
  "fallback": false,
  "notice": "research-only/source notice"
}
```

Connectors added:

- `/api/chronicling-search?q=&place=&limit=`
- `/api/fr-search?q=&limit=`
- `/api/census-lookup?address=&lat=&lon=&limit=`

Census/TIGERweb results are geography leads only. They do not prove ownership, title, trust/restricted status, or final Indian Country legal status.


## v0.43 Census connector note
`/api/census-lookup` accepts either `address=` or both `lat=` and `lon=`. Blank coordinate parameters are treated as null, not zero.

## v0.47 Unified Search UX notes

The homepage now treats Universal Search as the single public entry point. Visible standalone search forms for Dawes, current index, and source lookup were removed from the home page to reduce user confusion. Universal Search combines user clues into a one-search package and returns:

1. Built research path
2. Search summary
3. Matching site/index records
4. Official source leads
5. Prepared official links
6. Agency record request packets with copy buttons

Local/index record matching should require strong evidence such as name, roll/card/allotment number, township/range/section, county, or exact identifiers. Generic words such as Cherokee, land, allotment, section, source, and record should not return all records.
