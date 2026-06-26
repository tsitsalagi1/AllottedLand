# AllottedLand.com OCR / Map Indexing Workflow

This is the local Map Indexing Agent workflow for turning public Library of Congress allotment map images into reviewable candidate rows. Version 0.9 adds filtering and tuning options because old allotment maps often produce noisy OCR output.

## Safety rule

Do **not** publish machine OCR as verified data. OCR is only a lead. A human must check every row against the original source image before moving it into `data/allotment_records.json`.

## What the agent does

1. Reads `data/map_index.json`.
2. Downloads a public image for one LOC atlas page.
3. Enlarges and cleans the image for OCR.
4. Splits the map into overlapping tiles.
5. Runs Tesseract OCR on each tile.
6. Writes candidate rows to `data/allotment_records_candidates.json`, a run-specific JSON file, and CSV files in `data/ocr_runs/`.
7. Leaves every row marked `ocr-candidate` and `needs_human_review: yes`.

## Install requirements

Install Python 3, then from the project folder run:

```bash
pip install -r tools/requirements.txt
```

You also need the Tesseract OCR engine installed on your computer. Confirm it works:

```bash
tesseract --version
```

## First test run

Start with only a few tiles so you can confirm everything works:

```bash
python tools/map_indexing_agent.py --page 29 --max-tiles 4 --psm 11 --min-conf 45 --preprocess threshold
```

Then run more tiles once the first test works:

```bash
python tools/map_indexing_agent.py --page 29 --max-tiles 12 --psm 11 --min-conf 45 --preprocess threshold
```

If the output is still too noisy, raise the confidence threshold:

```bash
python tools/map_indexing_agent.py --page 29 --max-tiles 12 --psm 11 --min-conf 60 --preprocess threshold
```

If the output misses too much, try multiple modes and lower confidence:

```bash
python tools/map_indexing_agent.py --page 29 --max-tiles 12 --psm 11,6 --min-conf 32 --preprocess all
```

Clear old candidates before a fresh test:

```bash
python tools/map_indexing_agent.py --clear-candidates
```

The default image source is the Wikimedia Commons mirror of the LOC image file:

```text
https://commons.wikimedia.org/wiki/Special:FilePath/Cherokee_Nation_LOC_2011585467-29.jpg
```

You can also provide a direct image URL:

```bash
python tools/map_indexing_agent.py --page 29 --image-url "https://example.com/image.jpg"
```

## Review candidates

Open this file locally in your browser:

```text
tools/review_candidates.html
```

Then choose:

```text
data/allotment_records_candidates.json
```

For each possible row:

1. Open the original source map.
2. Compare the OCR line to the map image.
3. Correct the name/allotment number/status note.
4. Mark confidence only after review.
5. Copy the approved JSON object.
6. Paste it into `data/allotment_records.json`.

## Output files

- `data/allotment_records_candidates.json` — latest candidate OCR rows by default. Use `--append` only if you intentionally want to accumulate runs.
- `data/ocr_runs/page_###_candidates.csv` — per-page candidate CSV.
- `data/ocr_runs/page_###_raw_lines.csv` — raw OCR line CSV.
- `data/ocr_runs/loc###_YYYYMMDD_HHMMSS_candidates.json` — run-specific candidate JSON.
- `data/ocr_runs/page_###_tiles/` — tile images for manual checking.

## Good confidence values

- `ocr-candidate` — machine lead only; do not publish as verified.
- `ocr-low` — weak OCR read.
- `ocr-medium` — plausible OCR read but still not checked.
- `human-reviewed` — checked against the map image.
- `source-verified` — checked against map plus another source such as NARA, Dawes allotment jacket, county record, or BIA/LTRO record.

## What not to do

- Do not use private family stories as public examples.
- Do not add roll/enrollment numbers unless a Dawes/NARA or other source supports them.
- Do not treat allotment numbers and roll/enrollment numbers as the same thing.
- Do not publish living-person private information.
- Do not publish sensitive documents before privacy, consent, and review procedures are finalized.


## Useful tuning options

- `--psm 11` — sparse text mode; often better for map labels.
- `--psm 6` — assumes a uniform block of text; sometimes better for dense labels.
- `--psm 11,6` — tries both and keeps the better candidate lines.
- `--min-conf 45` — filters out low-confidence OCR. Raise it if output is junk; lower it if output misses too much.
- `--preprocess threshold` — high-contrast black/white image.
- `--preprocess soft` — lighter cleanup.
- `--preprocess all` — tries soft, threshold, and invert.
- `--append` — append candidates instead of replacing the local candidate file.
- `--clear-candidates` — reset `data/allotment_records_candidates.json` to an empty list.
