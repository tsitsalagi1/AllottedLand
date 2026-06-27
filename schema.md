# AllottedLand Data Schema v0.27

The public record schema keeps both human-readable names and conservative map-number fields.

Key fields:

- `verified_name`
- `first_name`
- `middle_name`
- `last_name`
- `tribe`
- `map_number`
- `number_shown_on_map`
- `number_type`
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
- `legal_description`
- `source_link`
- `confidence`
- `notes`

Pending records are stored in `pending_records`; approved records are stored in `approved_records`. Admin review tools can update, approve, or reject pending records.
