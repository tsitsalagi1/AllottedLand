#!/usr/bin/env python3
"""Convert a reviewed Dawes CSV into AllottedLand.com data/dawes_index.json.

Usage:
  python tools/build_dawes_index_from_csv.py data/dawes_index_template.csv data/dawes_index.json

The input CSV should use the columns listed in data/dawes_index_template.csv.
This script does not scrape any website. It only converts rows you have lawfully
obtained, reviewed, and prepared.
"""
from __future__ import annotations

import csv
import json
import re
import sys
from pathlib import Path
from typing import Dict, List

FIELDS = [
    "id", "record_type", "full_name", "first_name", "middle_name", "last_name",
    "variant_names", "tribe", "nation", "enrollment_category", "category_abbreviation",
    "roll_number", "census_card_number", "age", "sex", "blood_degree",
    "relationship_to_head", "source_title", "source_url", "notes", "search_terms"
]


def clean(value: object) -> str:
    return str(value or "").strip()


def slugify(*parts: str) -> str:
    raw = "-".join(clean(p).lower() for p in parts if clean(p)) or "dawes-record"
    slug = re.sub(r"[^a-z0-9]+", "-", raw).strip("-")
    return slug or "dawes-record"


def normalize_row(row: Dict[str, str], index: int) -> Dict[str, str]:
    out = {field: clean(row.get(field, "")) for field in FIELDS}
    if not out["full_name"]:
        out["full_name"] = " ".join(p for p in [out["first_name"], out["middle_name"], out["last_name"]] if p)
    if not out["id"]:
        out["id"] = slugify("dawes", out["tribe"], out["enrollment_category"], out["roll_number"], out["census_card_number"], out["full_name"], str(index + 1))
    if not out["record_type"]:
        out["record_type"] = "Dawes Roll Match"
    return out


def main() -> int:
    if len(sys.argv) != 3:
        print("Usage: python tools/build_dawes_index_from_csv.py INPUT.csv OUTPUT.json", file=sys.stderr)
        return 2
    in_path = Path(sys.argv[1])
    out_path = Path(sys.argv[2])
    if not in_path.exists():
        print(f"Input not found: {in_path}", file=sys.stderr)
        return 1
    with in_path.open("r", encoding="utf-8-sig", newline="") as f:
        reader = csv.DictReader(f)
        records: List[Dict[str, str]] = [normalize_row(row, i) for i, row in enumerate(reader)]
    payload = {
        "version": "0.36",
        "title": "AllottedLand.com Dawes quick-search index",
        "description": "Generated from a reviewed CSV for home-page Dawes/Five Tribes search.",
        "fields": FIELDS,
        "records": records,
    }
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {len(records)} Dawes records to {out_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
