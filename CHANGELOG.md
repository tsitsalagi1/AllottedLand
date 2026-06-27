# Changelog

## v0.25 — Cleanup and production-tool focus

- Confirmed that the OCR agent is no longer part of the active production workflow.
- Declared `tools/map_workbench.html` the primary data-entry tool.
- Added cleanup guidance for deleting deprecated OCR, crop, and review-helper files.
- Added `.gitignore` rules to keep generated crops, OCR runs, Python caches, and downloaded exports out of the public repository.
- Kept public repository focused on code, verified records JSON, section progress JSON, source links, and documentation.

## v0.24 — Data-entry guide and safer map-number fields

- Added a beginner guide explaining how to read LOC map labels.
- Added first, middle, and last name fields.
- Added `number_shown_on_map`, `map_number`, and `number_type` so map numbers are not forced into roll/allotment fields prematurely.

## v0.23 — Full Map Workbench / No crop files

- Added `tools/map_workbench.html`.
- Human loads one LOC source map image, calibrates the grid, selects a section, and enters human-reviewed records.
- Selected sections are zoomed live from the full image instead of requiring saved crop folders.

## Earlier experimental phases

- v0.8–v0.15 tested OCR candidates, Tesseract, tile review, and candidate export.
- v0.16–v0.22 tested section-entry, crop generation, township/range folders, and manual calibration.
- Those experiments informed the current full-map workbench but are now deprecated for production use.
