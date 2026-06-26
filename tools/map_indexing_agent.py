#!/usr/bin/env python3
"""
AllottedLand.com Map Indexing Agent (starter kit)

Purpose:
  Turn a Library of Congress allotment map image into OCR candidate rows for
  human review. This script does NOT create verified public records by itself.

Default source:
  The 1909 Library of Congress Cherokee Nation atlas. The script reads
  data/map_index.json, downloads a public image, splits it into tiles, runs
  Tesseract OCR, and writes candidate JSON/CSV files.

Install:
  pip install -r tools/requirements.txt
  Also install the Tesseract OCR engine on your computer and make sure the
  `tesseract` command works from a terminal.

Example:
  python tools/map_indexing_agent.py --page 29 --max-tiles 4
  python tools/map_indexing_agent.py --page 29 --tile-size 1200 --overlap 150

Output:
  data/allotment_records_candidates.json
  data/ocr_runs/page_029_candidates.csv
  data/ocr_runs/page_029_raw_lines.csv
  data/ocr_runs/page_029_tiles/*.jpg

Safety rule:
  Treat every OCR row as a lead. Move a row into data/allotment_records.json
  only after a human verifies it against the original source image.
"""
from __future__ import annotations

import argparse
import csv
import json
import re
import shutil
import subprocess
import sys
import time
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Iterable

import requests
from PIL import Image, ImageFilter, ImageOps
import pytesseract

PROJECT_ROOT = Path(__file__).resolve().parents[1]
MAP_INDEX_PATH = PROJECT_ROOT / "data" / "map_index.json"
CANDIDATES_PATH = PROJECT_ROOT / "data" / "allotment_records_candidates.json"
RUNS_DIR = PROJECT_ROOT / "data" / "ocr_runs"
IMAGE_DIR = RUNS_DIR / "source_images"

COMMONS_URL_TEMPLATE = "https://commons.wikimedia.org/wiki/Special:FilePath/Cherokee_Nation_LOC_2011585467-{page}.jpg"
LOC_VIEW_TEMPLATE = "https://www.loc.gov/resource/g4021gm.gla00497/?sp={page}&st=image"

SKIP_LINE_PATTERNS = [
    r"^township\b", r"^range\b", r"^section\b", r"^cherokee\b", r"^scale\b",
    r"^legend\b", r"^index\b", r"^map\b", r"^north\b", r"^south\b", r"^east\b", r"^west\b",
]

@dataclass
class Tile:
    tile_id: str
    left: int
    top: int
    right: int
    bottom: int
    path: Path


def load_map_index() -> list[dict[str, Any]]:
    if not MAP_INDEX_PATH.exists():
        raise FileNotFoundError(f"Missing map index: {MAP_INDEX_PATH}")
    return json.loads(MAP_INDEX_PATH.read_text(encoding="utf-8"))


def find_page(page_no: int) -> dict[str, Any]:
    for row in load_map_index():
        if int(row.get("loc_page", -1)) == page_no:
            return row
    raise ValueError(f"Page {page_no} not found in data/map_index.json")


def check_tesseract() -> None:
    if not shutil.which("tesseract"):
        raise RuntimeError(
            "Tesseract OCR engine was not found on PATH. Install Tesseract first, "
            "then confirm `tesseract --version` works in a terminal."
        )
    try:
        subprocess.run(["tesseract", "--version"], check=True, capture_output=True, text=True)
    except Exception as exc:
        raise RuntimeError(f"Tesseract is installed but did not run cleanly: {exc}") from exc


def download_image(page_no: int, image_url: str | None = None, overwrite: bool = False) -> Path:
    IMAGE_DIR.mkdir(parents=True, exist_ok=True)
    out_path = IMAGE_DIR / f"cherokee_nation_loc_page_{page_no:03}.jpg"
    if out_path.exists() and not overwrite:
        return out_path
    url = image_url or COMMONS_URL_TEMPLATE.format(page=page_no)
    headers = {"User-Agent": "AllottedLandMapIndexingAgent/0.8 (+https://allottedland.com)"}
    resp = requests.get(url, headers=headers, timeout=90, allow_redirects=True)
    if resp.status_code != 200 or not resp.content:
        raise RuntimeError(f"Could not download image for page {page_no}: HTTP {resp.status_code} from {url}")
    out_path.write_bytes(resp.content)
    return out_path


def prepare_image(path: Path, scale: float = 2.0) -> Image.Image:
    img = Image.open(path).convert("L")
    if scale and scale != 1:
        w, h = img.size
        img = img.resize((int(w * scale), int(h * scale)))
    img = ImageOps.autocontrast(img)
    img = img.filter(ImageFilter.SHARPEN)
    return img


def make_tiles(img: Image.Image, page_no: int, tile_size: int, overlap: int) -> list[Tile]:
    tiles: list[Tile] = []
    tile_dir = RUNS_DIR / f"page_{page_no:03}_tiles"
    tile_dir.mkdir(parents=True, exist_ok=True)
    w, h = img.size
    step = max(1, tile_size - overlap)
    idx = 0
    for top in range(0, h, step):
        for left in range(0, w, step):
            right = min(left + tile_size, w)
            bottom = min(top + tile_size, h)
            if right - left < 250 or bottom - top < 250:
                continue
            idx += 1
            tile_id = f"p{page_no:03}_t{idx:04}"
            tile_path = tile_dir / f"{tile_id}.jpg"
            img.crop((left, top, right, bottom)).save(tile_path, quality=92)
            tiles.append(Tile(tile_id, left, top, right, bottom, tile_path))
    return tiles


def clean_text(text: str) -> str:
    text = re.sub(r"\s+", " ", text or "").strip()
    text = text.replace("|", "I")
    return text


def looks_like_candidate(text: str) -> bool:
    t = clean_text(text)
    if len(t) < 3:
        return False
    if sum(ch.isalpha() for ch in t) < 3:
        return False
    lower = t.lower()
    if any(re.search(pattern, lower) for pattern in SKIP_LINE_PATTERNS):
        return False
    # Reject mostly grid/coordinate noise.
    letters = sum(ch.isalpha() for ch in t)
    digits = sum(ch.isdigit() for ch in t)
    if digits > letters * 3:
        return False
    return True


def guess_name_and_allotment(line: str) -> tuple[str, str]:
    """Very conservative guess. This is for review only, not verification."""
    text = clean_text(line)
    nums = re.findall(r"\b\d{2,5}\b", text)
    allotment_number = nums[0] if nums else ""
    name = re.sub(r"\b\d{1,5}\b", " ", text)
    name = re.sub(r"[^A-Za-z .,'\-]", " ", name)
    name = clean_text(name)
    return name, allotment_number


def split_name(name: str) -> tuple[str, str]:
    parts = [p.strip(" .,;:") for p in clean_text(name).split() if p.strip(" .,;:")]
    if not parts:
        return "", ""
    if len(parts) == 1:
        return parts[0], ""
    return " ".join(parts[:-1]), parts[-1]


def ocr_tile(tile: Tile, psm: int) -> list[dict[str, Any]]:
    data = pytesseract.image_to_data(Image.open(tile.path), config=f"--psm {psm}", output_type=pytesseract.Output.DICT)
    grouped: dict[tuple[int, int, int], list[int]] = {}
    for i, text in enumerate(data.get("text", [])):
        if not clean_text(text):
            continue
        key = (data["block_num"][i], data["par_num"][i], data["line_num"][i])
        grouped.setdefault(key, []).append(i)

    lines: list[dict[str, Any]] = []
    for key, idxs in grouped.items():
        words = [clean_text(data["text"][i]) for i in idxs if clean_text(data["text"][i])]
        line = clean_text(" ".join(words))
        if not looks_like_candidate(line):
            continue
        confs: list[float] = []
        for i in idxs:
            try:
                c = float(data["conf"][i])
                if c >= 0:
                    confs.append(c)
            except Exception:
                pass
        lefts = [int(data["left"][i]) for i in idxs]
        tops = [int(data["top"][i]) for i in idxs]
        rights = [int(data["left"][i]) + int(data["width"][i]) for i in idxs]
        bottoms = [int(data["top"][i]) + int(data["height"][i]) for i in idxs]
        avg_conf = round(sum(confs) / len(confs), 2) if confs else None
        lines.append({
            "tile_id": tile.tile_id,
            "tile_path": str(tile.path.relative_to(PROJECT_ROOT)),
            "tile_box": {"left": tile.left, "top": tile.top, "right": tile.right, "bottom": tile.bottom},
            "bbox_in_tile": {"left": min(lefts), "top": min(tops), "right": max(rights), "bottom": max(bottoms)},
            "raw_line": line,
            "ocr_confidence_percent": avg_conf,
        })
    return lines


def candidate_from_line(line: dict[str, Any], page: dict[str, Any], run_id: str, idx: int) -> dict[str, Any]:
    guessed_name, guessed_allotment = guess_name_and_allotment(line["raw_line"])
    given, surname = split_name(guessed_name)
    return {
        "record_type": "ocr-candidate",
        "run_id": run_id,
        "candidate_id": f"{run_id}-{idx:05}",
        "verified_name": "",
        "possible_ocr_name": guessed_name,
        "surname": surname,
        "given_name": given,
        "tribe": "Cherokee Nation",
        "roll_number": "",
        "enrollment_number": "",
        "census_card_number": "",
        "allotment_number": guessed_allotment,
        "status_restriction_notation": "",
        "loc_page": int(page.get("loc_page", 0)),
        "sheet_title": page.get("sheet_title", ""),
        "township_range": page.get("township_range", ""),
        "township": page.get("township", ""),
        "range": page.get("range", ""),
        "section": "",
        "county": "",
        "state": "Oklahoma",
        "legal_description": "",
        "source_link": page.get("loc_image_view") or LOC_VIEW_TEMPLATE.format(page=page.get("loc_page", "")),
        "image_source": COMMONS_URL_TEMPLATE.format(page=page.get("loc_page", "")),
        "tile_id": line.get("tile_id", ""),
        "tile_path": line.get("tile_path", ""),
        "tile_box": line.get("tile_box", {}),
        "bbox_in_tile": line.get("bbox_in_tile", {}),
        "raw_ocr_line": line.get("raw_line", ""),
        "ocr_confidence_percent": line.get("ocr_confidence_percent"),
        "confidence": "ocr-candidate",
        "needs_human_review": "yes",
        "review_status": "not-reviewed",
        "notes": "Machine-extracted from a public LOC map image. Human review required before publishing as a searchable record."
    }


def append_candidates(new_rows: list[dict[str, Any]]) -> None:
    CANDIDATES_PATH.parent.mkdir(parents=True, exist_ok=True)
    if CANDIDATES_PATH.exists():
        existing = json.loads(CANDIDATES_PATH.read_text(encoding="utf-8") or "[]")
    else:
        existing = []
    seen = {row.get("candidate_id") for row in existing}
    for row in new_rows:
        if row.get("candidate_id") not in seen:
            existing.append(row)
    CANDIDATES_PATH.write_text(json.dumps(existing, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def write_csv(path: Path, rows: Iterable[dict[str, Any]]) -> None:
    rows = list(rows)
    path.parent.mkdir(parents=True, exist_ok=True)
    if not rows:
        path.write_text("", encoding="utf-8")
        return
    # Flatten nested boxes for CSV review.
    flat_rows: list[dict[str, Any]] = []
    for row in rows:
        flat = dict(row)
        for key in ("tile_box", "bbox_in_tile"):
            if isinstance(flat.get(key), dict):
                for k, v in flat[key].items():
                    flat[f"{key}_{k}"] = v
                flat.pop(key, None)
        flat_rows.append(flat)
    fields = sorted({k for row in flat_rows for k in row.keys()})
    with path.open("w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fields)
        writer.writeheader()
        writer.writerows(flat_rows)


def main() -> None:
    parser = argparse.ArgumentParser(description="OCR one LOC allotment map page into human-review candidate records.")
    parser.add_argument("--page", type=int, required=True, help="LOC sequence page number, e.g. 29")
    parser.add_argument("--image-url", default=None, help="Optional direct image URL. Defaults to Wikimedia Commons LOC mirror.")
    parser.add_argument("--overwrite-image", action="store_true", help="Redownload source image even if cached.")
    parser.add_argument("--scale", type=float, default=2.0, help="Image scale before tiling/OCR. Default: 2.0")
    parser.add_argument("--tile-size", type=int, default=1400, help="Tile size in pixels after scaling. Default: 1400")
    parser.add_argument("--overlap", type=int, default=180, help="Overlap between tiles in pixels. Default: 180")
    parser.add_argument("--psm", type=int, default=6, help="Tesseract page segmentation mode. Default: 6")
    parser.add_argument("--max-tiles", type=int, default=0, help="Limit tile count for quick testing. 0 means no limit.")
    args = parser.parse_args()

    check_tesseract()
    page = find_page(args.page)
    run_id = f"loc{args.page:03}_{time.strftime('%Y%m%d_%H%M%S')}"
    print(f"Run: {run_id}")
    print(f"Page: {page.get('loc_page')} — {page.get('sheet_title')}")

    image_path = download_image(args.page, args.image_url, overwrite=args.overwrite_image)
    img = prepare_image(image_path, scale=args.scale)
    tiles = make_tiles(img, args.page, args.tile_size, args.overlap)
    if args.max_tiles and args.max_tiles > 0:
        tiles = tiles[: args.max_tiles]
    print(f"Tiles to OCR: {len(tiles)}")

    raw_lines: list[dict[str, Any]] = []
    candidates: list[dict[str, Any]] = []
    for tile in tiles:
        lines = ocr_tile(tile, psm=args.psm)
        raw_lines.extend(lines)
        for line in lines:
            candidates.append(candidate_from_line(line, page, run_id, len(candidates) + 1))
        print(f"{tile.tile_id}: {len(lines)} candidate lines")

    append_candidates(candidates)
    write_csv(RUNS_DIR / f"page_{args.page:03}_raw_lines.csv", raw_lines)
    write_csv(RUNS_DIR / f"page_{args.page:03}_candidates.csv", candidates)

    print(f"Wrote/updated: {CANDIDATES_PATH.relative_to(PROJECT_ROOT)}")
    print(f"Wrote CSV: data/ocr_runs/page_{args.page:03}_candidates.csv")
    print("Next: open tools/review_candidates.html locally and review candidates before publishing any row.")


if __name__ == "__main__":
    main()
