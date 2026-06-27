# AllottedLand data schema

## Public approved records

Approved records are stored in Cloudflare D1 table `approved_records` and may also be exported as JSON.

Core fields:

```json
{
  "verified_name": "Sarah R. Gourd",
  "first_name": "Sarah",
  "middle_name": "R.",
  "last_name": "Gourd",
  "tribe": "Cherokee Nation",
  "map_number": "18338",
  "number_shown_on_map": "18338",
  "number_type": "unknown_map_number",
  "roll_number": "",
  "enrollment_number": "",
  "census_card_number": "",
  "allotment_number": "",
  "loc_page": 29,
  "township_range": "T24N R14E",
  "township": "24",
  "range": "14",
  "section": "24",
  "legal_description": "Section 24, T24N R14E",
  "source_link": "https://www.loc.gov/resource/g4021gm.gla00497/?sp=29&st=image",
  "confidence": "human-reviewed",
  "needs_human_review": "no"
}
```

## Number type rule

Numbers seen on the LOC map should default to:

```text
unknown_map_number
```

Do not force a visible map number into `roll_number`, `enrollment_number`, `census_card_number`, or `allotment_number` unless separately verified.

## D1 tables

The SQL tables are defined in `schema.sql`:

- `approved_records`
- `pending_records`
- `section_status`
- `grid_calibrations`
- `submission_log`
