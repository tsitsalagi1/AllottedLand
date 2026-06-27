#!/usr/bin/env python3
"""
AllottedLand.com Map Indexing Agent v0.21

Purpose:
  Turn a Library of Congress allotment map image into *candidate* OCR rows for
  human review. This script does NOT create verified public records by itself.

What changed in v0.21:
  - Adds --manual-grid-json so a human can calibrate the outside and internal section lines visually.
  - Supports coordinates exported from tools/grid_calibrator.html.
  - Converts source-image grid coordinates into scaled/preprocessed crop coordinates.

What changed in v0.20:
  - Adds line-detected section grid cropping so section crops follow actual map section lines.
  - Adds manual grid-line overrides and debug overlay images for calibration.
  - Adds crop metadata showing whether percent grid, detected lines, or manual lines were used.

What changed in v0.19:
  - Adds township/range/section organized output folders.
  - Raises the default section padding for more complete human-review section crops.
  - Adds --output-layout trs so crops are grouped by township_range/section_##.
  - Adds manifest fields for storage keys and duplicate-safe T/R/S review workflow.

What changed in v0.18:
  - Adds section-crop-only mode so one township/range map can generate all 36 section images without OCR.
  - Writes section manifest/status files to support human section entry and progress tracking.
  - Keeps OCR as an optional clue, not the record-maker.

What changed in v0.12:
  - Adds section-first extraction using the PLSS township section grid.
  - Supports --sections 24 or --sections all or --sections 1,2,3.
  - Saves one crop image per section so reviewers can inspect a fixed legal land unit.
  - Adds section, section_source, section_image_path, and section_grid metadata to candidates.
  - Keeps the older tile workflow as a fallback.

What changed in v0.10:
  - Auto-detects common Windows Tesseract install paths.
  - Adds --tesseract-cmd so Windows users can point directly to tesseract.exe if PATH fails.

Safety rule:
  Treat every OCR row as a lead. Move a row into data/allotment_records.json
  only after a human verifies it against the original source map image.
"""
from __future__ import annotations

import argparse
import csv
import json
import re
import shutil
import subprocess
import time
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Iterable

import requests
from PIL import Image, ImageDraw, ImageFilter, ImageOps
import pytesseract

PROJECT_ROOT = Path(__file__).resolve().parents[1]
MAP_INDEX_PATH = PROJECT_ROOT / "data" / "map_index.json"
CANDIDATES_PATH = PROJECT_ROOT / "data" / "allotment_records_candidates.json"
SECTION_STATUS_PATH = PROJECT_ROOT / "data" / "section_status.json"
RUNS_DIR = PROJECT_ROOT / "data" / "ocr_runs"
IMAGE_DIR = RUNS_DIR / "source_images"
GRID_CALIBRATIONS_DIR = PROJECT_ROOT / "data" / "grid_calibrations"
PREPROCESS_BORDER = 25

COMMONS_URL_TEMPLATE = "https://commons.wikimedia.org/wiki/Special:FilePath/Cherokee_Nation_LOC_2011585467-{page}.jpg"
LOC_VIEW_TEMPLATE = "https://www.loc.gov/resource/g4021gm.gla00497/?sp={page}&st=image"

# Standard PLSS section numbering when the map is north-up:
# top row is 6 5 4 3 2 1, then row 2 is 7 8 9 10 11 12, etc.
SECTION_GRID = [
    [6, 5, 4, 3, 2, 1],
    [7, 8, 9, 10, 11, 12],
    [18, 17, 16, 15, 14, 13],
    [19, 20, 21, 22, 23, 24],
    [30, 29, 28, 27, 26, 25],
    [31, 32, 33, 34, 35, 36],
]

SKIP_LINE_PATTERNS = [
    r"^township\b", r"^range\b", r"^section\b", r"^cherokee\b", r"^scale\b",
    r"^legend\b", r"^index\b", r"^map\b", r"^north\b", r"^south\b", r"^east\b", r"^west\b",
    r"^page\b", r"^loc\b", r"^image\b", r"^not\s+ocred\b",
]

MAP_NOISE_WORDS = {
    "road", "roads", "creek", "river", "branch", "school", "cem", "cemetery", "church",
    "railroad", "r.r", "rr", "town", "townsite", "boundary", "line", "reserve", "reservation",
    "north", "south", "east", "west", "range", "township", "muskogee", "sale", "building",
}

@dataclass
class Tile:
    tile_id: str
    left: int
    top: int
    right: int
    bottom: int
    path: Path
    preprocess: str
    section: str = ""
    section_source: str = ""
    section_image_path: str = ""
    section_grid: dict[str, Any] | None = None


def load_map_index() -> list[dict[str, Any]]:
    if not MAP_INDEX_PATH.exists():
        raise FileNotFoundError(f"Missing map index: {MAP_INDEX_PATH}")
    return json.loads(MAP_INDEX_PATH.read_text(encoding="utf-8"))


def find_page(page_no: int) -> dict[str, Any]:
    for row in load_map_index():
        if int(row.get("loc_page", -1)) == page_no:
            return row
    raise ValueError(f"Page {page_no} not found in data/map_index.json")


def resolve_tesseract(tesseract_cmd: str | None = None) -> str:
    candidates: list[str] = []
    if tesseract_cmd:
        candidates.append(tesseract_cmd)
    found = shutil.which("tesseract")
    if found:
        candidates.append(found)
    candidates.extend([
        r"C:\Program Files\Tesseract-OCR\tesseract.exe",
        r"C:\Program Files (x86)\Tesseract-OCR\tesseract.exe",
    ])
    for candidate in candidates:
        if not candidate:
            continue
        path = Path(candidate)
        if shutil.which(candidate) or path.exists():
            pytesseract.pytesseract.tesseract_cmd = str(candidate)
            return str(candidate)
    raise RuntimeError(
        "Tesseract OCR engine was not found. Install Tesseract first, or run with "
        "--tesseract-cmd \"C:\\Program Files\\Tesseract-OCR\\tesseract.exe\"."
    )


def check_tesseract(tesseract_cmd: str | None = None) -> None:
    cmd = resolve_tesseract(tesseract_cmd)
    subprocess.run([cmd, "--version"], check=True, capture_output=True, text=True)
    print(f"Using Tesseract: {cmd}")


def download_image(page_no: int, image_url: str | None = None, overwrite: bool = False) -> Path:
    IMAGE_DIR.mkdir(parents=True, exist_ok=True)
    out_path = IMAGE_DIR / f"cherokee_nation_loc_page_{page_no:03}.jpg"
    if out_path.exists() and not overwrite:
        return out_path
    url = image_url or COMMONS_URL_TEMPLATE.format(page=page_no)
    headers = {"User-Agent": "AllottedLandMapIndexingAgent/0.21 (+https://allottedland.com)"}
    resp = requests.get(url, headers=headers, timeout=120, allow_redirects=True)
    if resp.status_code != 200 or not resp.content:
        raise RuntimeError(f"Could not download image for page {page_no}: HTTP {resp.status_code} from {url}")
    out_path.write_bytes(resp.content)
    return out_path


def base_image(path: Path, scale: float = 3.0) -> Image.Image:
    img = Image.open(path).convert("L")
    if scale and scale != 1:
        w, h = img.size
        img = img.resize((int(w * scale), int(h * scale)), Image.Resampling.LANCZOS)
    img = ImageOps.autocontrast(img)
    return img


def preprocess_image(img: Image.Image, mode: str) -> Image.Image:
    out = img.copy()
    if mode == "soft":
        out = out.filter(ImageFilter.SHARPEN)
        out = ImageOps.expand(out, border=PREPROCESS_BORDER, fill=255)
        return out
    if mode == "threshold":
        out = out.filter(ImageFilter.SHARPEN)
        out = out.point(lambda p: 255 if p > 178 else 0)
        out = ImageOps.expand(out, border=PREPROCESS_BORDER, fill=255)
        return out
    if mode == "invert":
        out = ImageOps.invert(out)
        out = out.filter(ImageFilter.SHARPEN)
        out = out.point(lambda p: 255 if p > 170 else 0)
        out = ImageOps.invert(out)
        out = ImageOps.expand(out, border=PREPROCESS_BORDER, fill=255)
        return out
    raise ValueError(f"Unknown preprocess mode: {mode}")


def parse_psm_list(psm_value: str) -> list[int]:
    out: list[int] = []
    for item in str(psm_value).split(','):
        item = item.strip()
        if item:
            out.append(int(item))
    return out or [11]


def parse_sections(value: str | None) -> list[int]:
    if not value:
        return []
    value = value.strip().lower()
    if value in {"all", "*"}:
        return list(range(1, 37))
    sections: list[int] = []
    for part in value.split(','):
        part = part.strip()
        if not part:
            continue
        if '-' in part:
            a, b = [int(x.strip()) for x in part.split('-', 1)]
            sections.extend(range(min(a, b), max(a, b) + 1))
        else:
            sections.append(int(part))
    return sorted({s for s in sections if 1 <= s <= 36})


def section_to_row_col(section: int) -> tuple[int, int]:
    for r, row in enumerate(SECTION_GRID):
        for c, value in enumerate(row):
            if value == section:
                return r, c
    raise ValueError(f"Invalid section number: {section}")


def parse_grid_pct(value: str, w: int, h: int) -> tuple[int, int, int, int]:
    """Parse left,top,right,bottom as percentages/fractions or pixels.

    Examples:
      --grid-pct 0.07,0.12,0.93,0.88
      --grid-pct 7,12,93,88
      --grid-pct 300,420,5100,5200
    """
    parts = [float(p.strip()) for p in value.split(',')]
    if len(parts) != 4:
        raise ValueError("--grid-pct must contain four values: left,top,right,bottom")
    # 0..1 fractions
    if all(0 <= p <= 1 for p in parts):
        l, t, r, b = parts
        return int(l * w), int(t * h), int(r * w), int(b * h)
    # 0..100 percentages
    if all(0 <= p <= 100 for p in parts):
        l, t, r, b = [p / 100.0 for p in parts]
        return int(l * w), int(t * h), int(r * w), int(b * h)
    # pixels
    l, t, r, b = parts
    return int(l), int(t), int(r), int(b)


def make_tiles(img: Image.Image, page_no: int, tile_size: int, overlap: int, preprocess: str) -> list[Tile]:
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
            tile_id = f"p{page_no:03}_{preprocess}_t{idx:04}"
            tile_path = tile_dir / f"{tile_id}.jpg"
            img.crop((left, top, right, bottom)).save(tile_path, quality=94)
            tiles.append(Tile(tile_id, left, top, right, bottom, tile_path, preprocess))
    return tiles


def slug(value: str) -> str:
    value = str(value or "").strip().replace("/", "_").replace("\\", "_")
    value = re.sub(r"[^A-Za-z0-9._-]+", "_", value)
    return value.strip("_") or "unknown"



def parse_number_list(value: str | None) -> list[int]:
    if not value:
        return []
    out: list[int] = []
    for part in str(value).split(','):
        part = part.strip()
        if not part:
            continue
        out.append(int(float(part)))
    return sorted(out)

def resolve_project_path(value: str | None) -> Path | None:
    """Resolve a user-supplied path relative to the project root when needed."""
    if not value:
        return None
    p = Path(value.strip().strip('"'))
    if not p.is_absolute():
        p = PROJECT_ROOT / p
    return p


def load_manual_grid_json(path_value: str | None, scale: float, preprocess_border: int = PREPROCESS_BORDER) -> tuple[list[int], list[int], dict[str, Any]]:
    """Load grid-line coordinates exported by tools/grid_calibrator.html.

    The browser calibrator exports coordinates in the original/source image's natural
    pixel space. The agent crops from the scaled/preprocessed image, so those source
    coordinates must be multiplied by --scale and shifted by the preprocessing border.

    The function also accepts already-scaled coordinates when coordinate_space is
    "agent-image" or "scaled-image".
    """
    p = resolve_project_path(path_value)
    if not p or not p.exists():
        return [], [], {}
    data = json.loads(p.read_text(encoding="utf-8"))
    x_lines = [float(v) for v in data.get("x_lines", [])]
    y_lines = [float(v) for v in data.get("y_lines", [])]
    if len(x_lines) != 7 or len(y_lines) != 7:
        raise ValueError(f"Manual grid JSON must contain exactly 7 x_lines and 7 y_lines: {p}")
    space = str(data.get("coordinate_space") or "source-image").lower().strip()
    if space in {"source", "source-image", "original", "original-image", "natural-image"}:
        x_lines = [int(round((x * scale) + preprocess_border)) for x in x_lines]
        y_lines = [int(round((y * scale) + preprocess_border)) for y in y_lines]
    else:
        x_lines = [int(round(x)) for x in x_lines]
        y_lines = [int(round(y)) for y in y_lines]
    meta = {
        "manual_grid_json": str(p.relative_to(PROJECT_ROOT)) if str(p).startswith(str(PROJECT_ROOT)) else str(p),
        "coordinate_space": space,
        "source_image_width": data.get("image_width", ""),
        "source_image_height": data.get("image_height", ""),
        "calibrated_loc_page": data.get("loc_page", ""),
        "calibrated_township_range": data.get("township_range", ""),
        "converted_with_scale": scale,
        "preprocess_border": preprocess_border,
        "notes": data.get("notes", ""),
    }
    return sorted(x_lines), sorted(y_lines), meta


def cluster_positions(values: list[int], tolerance: int = 28) -> list[int]:
    """Cluster nearby line coordinates into one representative coordinate."""
    if not values:
        return []
    values = sorted(int(v) for v in values)
    groups: list[list[int]] = [[values[0]]]
    for value in values[1:]:
        if abs(value - groups[-1][-1]) <= tolerance:
            groups[-1].append(value)
        else:
            groups.append([value])
    return [int(round(sum(g) / len(g))) for g in groups]


def choose_grid_lines(candidates: list[int], left: int, right: int) -> list[int]:
    """Choose 7 section-grid lines from many detected line candidates.

    Maps contain both section lines and allotment/subdivision lines. This function
    keeps candidates inside the rough grid area and prefers a sequence whose
    spacing is roughly regular. If detection fails, caller should fall back.
    """
    candidates = sorted(x for x in candidates if left <= x <= right)
    if len(candidates) < 7:
        return []
    expected = [(left + (right - left) * i / 6.0) for i in range(7)]
    chosen: list[int] = []
    for e in expected:
        nearest = min(candidates, key=lambda x: abs(x - e))
        chosen.append(int(nearest))
    # Ensure strictly increasing and close to the rough grid. If duplicates occur,
    # detection latched onto subdivision lines rather than section grid lines.
    if len(set(chosen)) != 7:
        return []
    chosen = sorted(chosen)
    spacings = [chosen[i+1] - chosen[i] for i in range(6)]
    avg = sum(spacings) / max(1, len(spacings))
    if avg <= 0 or any(s < avg * 0.35 for s in spacings):
        return []
    return chosen


def detect_grid_lines_from_image(
    img: Image.Image,
    rough_box: tuple[int, int, int, int],
    cluster_tolerance: int = 40,
    min_length_frac: float = 0.50,
) -> tuple[list[int], list[int], dict[str, Any]]:
    """Detect likely township section grid lines from the actual map image.

    Uses OpenCV morphology to emphasize long horizontal/vertical black lines,
    then clusters line coordinates. This is intentionally conservative: if it
    cannot find a reasonable 7x7 grid, the caller falls back to percent grid.
    """
    try:
        import cv2  # type: ignore
        import numpy as np  # type: ignore
    except Exception as exc:  # pragma: no cover - local dependency message
        raise RuntimeError(
            "Line-detected cropping requires OpenCV. Install with: python -m pip install opencv-python numpy"
        ) from exc

    gl, gt, gr, gb = rough_box
    crop = img.crop((gl, gt, gr, gb)).convert('L')
    arr = np.array(crop)
    # Black map lines become white foreground for morphology.
    _, binary = cv2.threshold(arr, 190, 255, cv2.THRESH_BINARY_INV)
    h, w = binary.shape[:2]
    min_h_len = max(60, int(w * min_length_frac))
    min_v_len = max(60, int(h * min_length_frac))

    h_kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (max(35, min_h_len // 3), 3))
    v_kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (3, max(35, min_v_len // 3)))
    horizontal = cv2.morphologyEx(binary, cv2.MORPH_OPEN, h_kernel, iterations=1)
    vertical = cv2.morphologyEx(binary, cv2.MORPH_OPEN, v_kernel, iterations=1)

    x_candidates: list[int] = []
    y_candidates: list[int] = []

    contours, _ = cv2.findContours(horizontal, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    for c in contours:
        x, y, ww, hh = cv2.boundingRect(c)
        if ww >= min_h_len:
            y_candidates.append(gt + y + hh // 2)

    contours, _ = cv2.findContours(vertical, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    for c in contours:
        x, y, ww, hh = cv2.boundingRect(c)
        if hh >= min_v_len:
            x_candidates.append(gl + x + ww // 2)

    x_clustered = cluster_positions(x_candidates, cluster_tolerance)
    y_clustered = cluster_positions(y_candidates, cluster_tolerance)
    x_lines = choose_grid_lines(x_clustered, gl, gr)
    y_lines = choose_grid_lines(y_clustered, gt, gb)
    meta = {
        "rough_box": {"left": gl, "top": gt, "right": gr, "bottom": gb},
        "raw_x_candidates": x_candidates,
        "raw_y_candidates": y_candidates,
        "clustered_x_candidates": x_clustered,
        "clustered_y_candidates": y_clustered,
        "selected_x_lines": x_lines,
        "selected_y_lines": y_lines,
        "cluster_tolerance": cluster_tolerance,
        "min_length_frac": min_length_frac,
    }
    return x_lines, y_lines, meta


def draw_grid_debug(img: Image.Image, x_lines: list[int], y_lines: list[int], rough_box: tuple[int,int,int,int], out_path: Path) -> None:
    preview = img.convert('RGB').copy()
    draw = ImageDraw.Draw(preview)
    gl, gt, gr, gb = rough_box
    draw.rectangle((gl, gt, gr, gb), outline=(255, 165, 0), width=6)
    for x in x_lines:
        draw.line((x, gt, x, gb), fill=(255, 0, 0), width=5)
    for y in y_lines:
        draw.line((gl, y, gr, y), fill=(0, 120, 255), width=5)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    preview.save(out_path, quality=92)

def make_section_crops(
    img: Image.Image,
    page_no: int,
    sections: list[int],
    preprocess: str,
    grid_pct: str,
    padding: int = 180,
    township_range: str = "",
    output_layout: str = "trs",
    grid_method: str = "percent",
    manual_x_lines: str | None = None,
    manual_y_lines: str | None = None,
    manual_grid_json: str | None = None,
    scale: float = 3.0,
    line_cluster_tolerance: int = 40,
    line_min_length_frac: float = 0.50,
    save_grid_debug: bool = False,
) -> list[Tile]:
    crops: list[Tile] = []
    tr_slug = slug(township_range)
    legacy_dir = RUNS_DIR / f"page_{page_no:03}_sections" / preprocess
    trs_root = RUNS_DIR / "by_township_range" / tr_slug
    legacy_dir.mkdir(parents=True, exist_ok=True)
    trs_root.mkdir(parents=True, exist_ok=True)
    w, h = img.size
    gl, gt, gr, gb = parse_grid_pct(grid_pct, w, h)
    gl, gt = max(0, gl), max(0, gt)
    gr, gb = min(w, gr), min(h, gb)
    rough_box = (gl, gt, gr, gb)

    x_lines: list[int] = []
    y_lines: list[int] = []
    line_meta: dict[str, Any] = {}
    used_method = grid_method

    json_x, json_y, json_meta = load_manual_grid_json(manual_grid_json, scale)
    manual_x = parse_number_list(manual_x_lines)
    manual_y = parse_number_list(manual_y_lines)
    if len(json_x) == 7 and len(json_y) == 7:
        x_lines, y_lines = json_x, json_y
        used_method = "manual-grid-json"
        line_meta = {"selected_x_lines": x_lines, "selected_y_lines": y_lines, "manual": True, **json_meta}
    elif len(manual_x) == 7 and len(manual_y) == 7:
        x_lines, y_lines = manual_x, manual_y
        used_method = "manual-lines"
        line_meta = {"selected_x_lines": x_lines, "selected_y_lines": y_lines, "manual": True}
    elif grid_method == "lines":
        try:
            x_lines, y_lines, line_meta = detect_grid_lines_from_image(
                img, rough_box, cluster_tolerance=line_cluster_tolerance, min_length_frac=line_min_length_frac
            )
            if not (len(x_lines) == 7 and len(y_lines) == 7):
                print("Line grid detection did not find a clean 7x7 grid; falling back to percent grid.")
                used_method = "percent-fallback"
        except Exception as exc:
            print(f"Line grid detection failed: {exc}. Falling back to percent grid.")
            used_method = "percent-fallback"

    if not (len(x_lines) == 7 and len(y_lines) == 7):
        x_lines = [int(gl + (gr - gl) * i / 6.0) for i in range(7)]
        y_lines = [int(gt + (gb - gt) * i / 6.0) for i in range(7)]
        line_meta.update({"selected_x_lines": x_lines, "selected_y_lines": y_lines})

    grid_debug_path = None
    if save_grid_debug:
        grid_debug_path = RUNS_DIR / "by_township_range" / tr_slug / f"p{page_no:03}_{preprocess}_grid_{used_method}.jpg"
        draw_grid_debug(img, x_lines, y_lines, rough_box, grid_debug_path)
        print(f"Wrote grid debug overlay: {grid_debug_path.relative_to(PROJECT_ROOT)}")

    grid_meta_base = {
        "left": min(x_lines), "top": min(y_lines), "right": max(x_lines), "bottom": max(y_lines),
        "grid_pct": grid_pct,
        "grid_method": used_method,
        "x_lines": x_lines,
        "y_lines": y_lines,
        "line_meta": line_meta,
        "grid_debug_path": str(grid_debug_path.relative_to(PROJECT_ROOT)) if grid_debug_path else "",
    }

    for section in sections:
        row, col = section_to_row_col(section)
        left = int(x_lines[col]) - padding
        top = int(y_lines[row]) - padding
        right = int(x_lines[col + 1]) + padding
        bottom = int(y_lines[row + 1]) + padding
        left, top = max(0, left), max(0, top)
        right, bottom = min(w, right), min(h, bottom)
        tile_id = f"p{page_no:03}_{preprocess}_s{section:02}"
        if output_layout == "trs":
            section_dir = trs_root / f"section_{section:02}"
            section_dir.mkdir(parents=True, exist_ok=True)
            crop_path = section_dir / f"{tile_id}_review.jpg"
        else:
            crop_path = legacy_dir / f"{tile_id}.jpg"
        img.crop((left, top, right, bottom)).save(crop_path, quality=94)
        # Also keep a legacy-compatible copy when using the new organized layout.
        if output_layout == "trs":
            legacy_copy = legacy_dir / f"{tile_id}.jpg"
            if not legacy_copy.exists():
                img.crop((left, top, right, bottom)).save(legacy_copy, quality=94)
        crops.append(Tile(
            tile_id=tile_id,
            left=left,
            top=top,
            right=right,
            bottom=bottom,
            path=crop_path,
            preprocess=preprocess,
            section=str(section),
            section_source=f"plss-grid-crop:{used_method}",
            section_image_path=str(crop_path.relative_to(PROJECT_ROOT)),
            section_grid={**grid_meta_base, "row": row, "col": col, "section": section, "padding": padding, "output_layout": output_layout, "storage_key": f"{tr_slug}/section_{section:02}"},
        ))
    return crops


def clean_text(text: str) -> str:
    text = re.sub(r"\s+", " ", text or "").strip()
    text = text.replace("|", "I")
    return text


def token_quality(text: str) -> dict[str, int | float]:
    letters = sum(ch.isalpha() for ch in text)
    digits = sum(ch.isdigit() for ch in text)
    spaces = sum(ch.isspace() for ch in text)
    punct = max(0, len(text) - letters - digits - spaces)
    alpha_ratio = letters / max(1, len(text))
    return {"letters": letters, "digits": digits, "punct": punct, "alpha_ratio": alpha_ratio}


def looks_like_candidate(text: str, avg_conf: float | None, min_conf: float) -> bool:
    t = clean_text(text)
    if len(t) < 2 or len(t) > 100:
        return False
    q = token_quality(t)
    if q["letters"] < 2 and q["digits"] < 2:
        return False
    if avg_conf is not None and avg_conf < min_conf:
        return False
    lower = t.lower()
    if any(re.search(pattern, lower) for pattern in SKIP_LINE_PATTERNS):
        return False
    words = {w.strip(".,;:'\"()[]{}-_").lower() for w in lower.split()}
    if words and words.issubset(MAP_NOISE_WORDS):
        return False
    if q["digits"] > q["letters"] * 3 and q["letters"] > 0:
        return False
    if q["punct"] > q["letters"] + q["digits"]:
        return False
    if q["alpha_ratio"] < 0.22 and q["digits"] < 2:
        return False
    return True


def guess_name_and_allotment(line: str) -> tuple[str, str]:
    text = clean_text(line)
    nums = re.findall(r"(?<![.\d])\b\d{2,5}\b(?![.\d])", text)
    allotment_number = nums[0] if nums else ""
    name = re.sub(r"(?<![.\d])\b\d{1,5}\b(?![.\d])", " ", text)
    name = re.sub(r"[^A-Za-z .,'\-]", " ", name)
    name = clean_text(name)
    parts = name.split()
    if parts and sum(1 for p in parts if len(p) == 1) > max(2, len(parts) // 2):
        return "", allotment_number
    return name, allotment_number


def split_name(name: str) -> tuple[str, str]:
    parts = [p.strip(" .,;:") for p in clean_text(name).split() if p.strip(" .,;:")]
    if not parts:
        return "", ""
    if len(parts) == 1:
        return parts[0], ""
    return " ".join(parts[:-1]), parts[-1]


def get_lines_from_tesseract(tile: Tile, psm: int, min_conf: float) -> list[dict[str, Any]]:
    config = f"--oem 3 --psm {psm} -l eng"
    data = pytesseract.image_to_data(Image.open(tile.path), config=config, output_type=pytesseract.Output.DICT)
    grouped: dict[tuple[int, int, int], list[int]] = {}
    for i, text in enumerate(data.get("text", [])):
        if not clean_text(text):
            continue
        key = (data["block_num"][i], data["par_num"][i], data["line_num"][i])
        grouped.setdefault(key, []).append(i)

    lines: list[dict[str, Any]] = []
    for _, idxs in grouped.items():
        words = [clean_text(data["text"][i]) for i in idxs if clean_text(data["text"][i])]
        line = clean_text(" ".join(words))
        confs: list[float] = []
        for i in idxs:
            try:
                c = float(data["conf"][i])
                if c >= 0:
                    confs.append(c)
            except Exception:
                pass
        avg_conf = round(sum(confs) / len(confs), 2) if confs else None
        if not looks_like_candidate(line, avg_conf, min_conf):
            continue
        lefts = [int(data["left"][i]) for i in idxs]
        tops = [int(data["top"][i]) for i in idxs]
        rights = [int(data["left"][i]) + int(data["width"][i]) for i in idxs]
        bottoms = [int(data["top"][i]) + int(data["height"][i]) for i in idxs]
        lines.append({
            "tile_id": tile.tile_id,
            "tile_path": str(tile.path.relative_to(PROJECT_ROOT)),
            "preprocess": tile.preprocess,
            "psm": psm,
            "tile_box": {"left": tile.left, "top": tile.top, "right": tile.right, "bottom": tile.bottom},
            "bbox_in_tile": {"left": min(lefts), "top": min(tops), "right": max(rights), "bottom": max(bottoms)},
            "raw_line": line,
            "ocr_confidence_percent": avg_conf,
            "section": tile.section,
            "section_source": tile.section_source,
            "section_image_path": tile.section_image_path,
            "section_grid": tile.section_grid or {},
        })
    return lines


def dedupe_lines(lines: list[dict[str, Any]]) -> list[dict[str, Any]]:
    best: dict[str, dict[str, Any]] = {}
    for line in lines:
        text_key = re.sub(r"[^a-z0-9]", "", line.get("raw_line", "").lower())
        if not text_key:
            continue
        section_key = line.get("section") or ""
        tile_key = line.get("tile_id", "").split("_t")[-1]
        key = f"{section_key}:{tile_key}:{text_key}"
        conf = line.get("ocr_confidence_percent") or 0
        if key not in best or conf > (best[key].get("ocr_confidence_percent") or 0):
            best[key] = line
    return list(best.values())


def candidate_from_line(line: dict[str, Any], page: dict[str, Any], run_id: str, idx: int) -> dict[str, Any]:
    guessed_name, guessed_allotment = guess_name_and_allotment(line["raw_line"])
    given, surname = split_name(guessed_name)
    section = str(line.get("section") or "")
    legal_description = ""
    if section:
        legal_description = f"Section {section}, {page.get('township_range', '')}".strip()
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
        "section": section,
        "section_source": line.get("section_source", ""),
        "section_image_path": line.get("section_image_path", ""),
        "section_grid": line.get("section_grid", {}),
        "county": "",
        "state": "Oklahoma",
        "legal_description": legal_description,
        "source_link": page.get("loc_image_view") or LOC_VIEW_TEMPLATE.format(page=page.get("loc_page", "")),
        "image_source": COMMONS_URL_TEMPLATE.format(page=page.get("loc_page", "")),
        "tile_id": line.get("tile_id", ""),
        "tile_path": line.get("tile_path", ""),
        "tile_box": line.get("tile_box", {}),
        "bbox_in_tile": line.get("bbox_in_tile", {}),
        "raw_ocr_line": line.get("raw_line", ""),
        "ocr_confidence_percent": line.get("ocr_confidence_percent"),
        "ocr_psm": line.get("psm"),
        "preprocess": line.get("preprocess", ""),
        "confidence": "ocr-candidate",
        "needs_human_review": "yes",
        "review_status": "not-reviewed",
        "notes": "Machine-extracted from a public LOC map image. Human review required before publishing as a searchable record."
    }


def write_candidates(rows: list[dict[str, Any]], append: bool = False) -> None:
    CANDIDATES_PATH.parent.mkdir(parents=True, exist_ok=True)
    if append and CANDIDATES_PATH.exists():
        existing = json.loads(CANDIDATES_PATH.read_text(encoding="utf-8") or "[]")
    else:
        existing = []
    seen = {row.get("candidate_id") for row in existing}
    for row in rows:
        if row.get("candidate_id") not in seen:
            existing.append(row)
    CANDIDATES_PATH.write_text(json.dumps(existing, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def write_csv(path: Path, rows: Iterable[dict[str, Any]]) -> None:
    rows = list(rows)
    path.parent.mkdir(parents=True, exist_ok=True)
    if not rows:
        path.write_text("", encoding="utf-8")
        return
    flat_rows: list[dict[str, Any]] = []
    for row in rows:
        flat = dict(row)
        for key in ("tile_box", "bbox_in_tile", "section_grid"):
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


def write_json(path: Path, rows: list[dict[str, Any]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(rows, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def manifest_from_section_tiles(tiles: list[Tile], page: dict[str, Any], run_id: str) -> list[dict[str, Any]]:
    """Build a section manifest for the human entry helper.

    The manifest is not public proof. It is a local workbench index that tells the
    browser which section crop image belongs to which township/range/section.
    """
    rows: list[dict[str, Any]] = []
    for tile in tiles:
        section = str(tile.section or "")
        rows.append({
            "status_record_type": "section-crop",
            "run_id": run_id,
            "loc_page": int(page.get("loc_page", 0)),
            "sheet_title": page.get("sheet_title", ""),
            "township_range": page.get("township_range", ""),
            "township": page.get("township", ""),
            "range": page.get("range", ""),
            "section": section,
            "section_image_path": tile.section_image_path or str(tile.path.relative_to(PROJECT_ROOT)),
            "tile_id": tile.tile_id,
            "storage_key": f"{slug(page.get('township_range', ''))}/section_{section.zfill(2)}",
            "duplicate_scope": f"{page.get('loc_page', '')}|{page.get('township_range', '')}|section:{section}",
            "preprocess": tile.preprocess,
            "section_grid": tile.section_grid or {},
            "source_link": page.get("loc_image_view") or LOC_VIEW_TEMPLATE.format(page=page.get("loc_page", "")),
            "review_status": "not-started",
            "row_count": 0,
            "completed": False,
            "notes": "Generated section crop for human transcription. Verify section boundaries before entry."
        })
    rows.sort(key=lambda r: int(r.get("section") or 0))
    return rows


def merge_section_status(manifest_rows: list[dict[str, Any]]) -> None:
    """Merge generated section-crop rows into data/section_status.json without deleting existing status notes."""
    SECTION_STATUS_PATH.parent.mkdir(parents=True, exist_ok=True)
    try:
        existing = json.loads(SECTION_STATUS_PATH.read_text(encoding="utf-8")) if SECTION_STATUS_PATH.exists() else []
        if not isinstance(existing, list):
            existing = []
    except Exception:
        existing = []
    def key(row: dict[str, Any]) -> str:
        return "|".join(str(row.get(k, "")).strip().lower() for k in ("loc_page", "township_range", "section", "preprocess"))
    by_key = {key(row): row for row in existing if isinstance(row, dict)}
    for row in manifest_rows:
        k = key(row)
        if k in by_key:
            merged = dict(row)
            merged.update({kk: vv for kk, vv in by_key[k].items() if kk in {"review_status", "row_count", "completed", "reviewer", "completed_at", "notes"}})
            by_key[k] = merged
        else:
            by_key[k] = row
    SECTION_STATUS_PATH.write_text(json.dumps(list(by_key.values()), indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def main() -> None:
    parser = argparse.ArgumentParser(description="OCR one LOC allotment map page into human-review candidate records.")
    parser.add_argument("--page", type=int, required=False, help="LOC sequence page number, e.g. 29")
    parser.add_argument("--image-url", default=None, help="Optional direct image URL. Defaults to Wikimedia Commons LOC mirror.")
    parser.add_argument("--overwrite-image", action="store_true", help="Redownload source image even if cached.")
    parser.add_argument("--scale", type=float, default=3.0, help="Image scale before cropping/OCR. Default: 3.0")
    parser.add_argument("--mode", choices=["tiles", "sections"], default="tiles", help="OCR random tiles or PLSS section crops. Default: tiles")
    parser.add_argument("--sections", default="", help="Section-first mode: e.g. 24, 24,25, 19-24, or all")
    parser.add_argument("--grid-pct", default="7,12,93,88", help="Section grid left,top,right,bottom as percent/fraction/pixels. Default: 7,12,93,88")
    parser.add_argument("--section-padding", type=int, default=180, help="Extra pixels around each section crop after scaling. Higher values prevent clipped section edges. Default: 180")
    parser.add_argument("--output-layout", choices=["trs", "legacy"], default="trs", help="Where to save section crops. trs groups by township/range/section; legacy uses page_###_sections. Default: trs")
    parser.add_argument("--grid-method", choices=["percent", "lines"], default="percent", help="Section crop method. percent uses a 6x6 percent box; lines detects actual map section lines with OpenCV. Default: percent")
    parser.add_argument("--manual-grid-lines-x", default="", help="Optional 7 comma-separated x pixel coordinates for section grid lines after scaling, overriding detection.")
    parser.add_argument("--manual-grid-lines-y", default="", help="Optional 7 comma-separated y pixel coordinates for section grid lines after scaling, overriding detection.")
    parser.add_argument("--manual-grid-json", default="", help="Path to JSON exported by tools/grid_calibrator.html. Coordinates are usually source-image pixels and are converted using --scale.")
    parser.add_argument("--line-cluster-tolerance", type=int, default=40, help="Line-detection clustering tolerance in scaled pixels. Default: 40")
    parser.add_argument("--line-min-length-frac", type=float, default=0.50, help="Line detection minimum length as fraction of rough grid width/height. Default: 0.50")
    parser.add_argument("--save-grid-debug", action="store_true", help="Save an overlay image showing the detected/manual grid lines.")
    parser.add_argument("--tile-size", type=int, default=1200, help="Tile size in pixels after scaling. Default: 1200")
    parser.add_argument("--overlap", type=int, default=220, help="Overlap between tiles in pixels. Default: 220")
    parser.add_argument("--psm", default="11", help="Tesseract PSM mode(s), e.g. 11 or 11,6. Default: 11")
    parser.add_argument("--preprocess", choices=["soft", "threshold", "invert", "all"], default="threshold", help="Preprocessing mode. Default: threshold")
    parser.add_argument("--tesseract-cmd", default=None, help="Optional full path to tesseract.exe, useful on Windows if PATH fails.")
    parser.add_argument("--min-conf", type=float, default=45.0, help="Minimum average OCR confidence. Default: 45")
    parser.add_argument("--max-tiles", type=int, default=0, help="Limit tile/section count for quick testing. 0 means no limit.")
    parser.add_argument("--crops-only", action="store_true", help="Section mode only: create section crop images and manifests without running OCR.")
    parser.add_argument("--append", action="store_true", help="Append to data/allotment_records_candidates.json instead of replacing it.")
    parser.add_argument("--clear-candidates", action="store_true", help="Clear data/allotment_records_candidates.json and exit.")
    args = parser.parse_args()

    if args.clear_candidates:
        CANDIDATES_PATH.write_text("[]\n", encoding="utf-8")
        print(f"Cleared: {CANDIDATES_PATH.relative_to(PROJECT_ROOT)}")
        return
    if not args.page:
        raise SystemExit("Error: --page is required unless using --clear-candidates")

    if not args.crops_only:
        check_tesseract(args.tesseract_cmd)
    page = find_page(args.page)
    run_id = f"loc{args.page:03}_{args.mode}_{time.strftime('%Y%m%d_%H%M%S')}"
    print(f"Run: {run_id}")
    print(f"Page: {page.get('loc_page')} — {page.get('sheet_title')}")
    print(f"Mode: {args.mode} | PSM: {args.psm} | preprocess: {args.preprocess} | min_conf: {args.min_conf} | crops_only: {args.crops_only}")

    image_path = download_image(args.page, args.image_url, overwrite=args.overwrite_image)
    base = base_image(image_path, scale=args.scale)
    preprocess_modes = ["soft", "threshold", "invert"] if args.preprocess == "all" else [args.preprocess]
    psm_modes = parse_psm_list(args.psm)

    all_raw_lines: list[dict[str, Any]] = []
    manifest_rows: list[dict[str, Any]] = []
    processed_count = 0
    for mode in preprocess_modes:
        img = preprocess_image(base, mode)
        if args.mode == "sections":
            sections = parse_sections(args.sections or "all")
            units = make_section_crops(
                img, args.page, sections, mode, args.grid_pct, args.section_padding,
                page.get("township_range", ""), args.output_layout,
                grid_method=args.grid_method,
                manual_x_lines=args.manual_grid_lines_x,
                manual_y_lines=args.manual_grid_lines_y,
                manual_grid_json=args.manual_grid_json,
                scale=args.scale,
                line_cluster_tolerance=args.line_cluster_tolerance,
                line_min_length_frac=args.line_min_length_frac,
                save_grid_debug=args.save_grid_debug,
            )
            manifest_rows.extend(manifest_from_section_tiles(units, page, run_id))
            label = "section crops"
        else:
            units = make_tiles(img, args.page, args.tile_size, args.overlap, mode)
            label = "tiles"
        if args.max_tiles and args.max_tiles > 0:
            units = units[: args.max_tiles]
        action_word = "created" if args.crops_only else "to OCR"
        print(f"{label.capitalize()} {action_word} for {mode}: {len(units)}")
        processed_count += len(units)
        if args.crops_only:
            continue
        for unit in units:
            unit_lines: list[dict[str, Any]] = []
            for psm in psm_modes:
                unit_lines.extend(get_lines_from_tesseract(unit, psm, args.min_conf))
            unit_lines = dedupe_lines(unit_lines)
            all_raw_lines.extend(unit_lines)
            unit_label = f"section {unit.section}" if unit.section else unit.tile_id
            print(f"{unit.tile_id} ({unit_label}): {len(unit_lines)} candidate lines")

    suffix = f"page_{args.page:03}_{args.mode}"
    if manifest_rows:
        manifest_path = RUNS_DIR / f"{suffix}_manifest.json"
        write_json(manifest_path, manifest_rows)
        merge_section_status(manifest_rows)
        print(f"Wrote section manifest: {manifest_path.relative_to(PROJECT_ROOT)}")
        print(f"Merged section status seed: {SECTION_STATUS_PATH.relative_to(PROJECT_ROOT)}")

    if args.crops_only:
        print(f"Section crop units created: {processed_count}")
        print("Next: open tools/section_entry.html locally, load the section manifest, and enter rows by section.")
        return

    all_raw_lines = dedupe_lines(all_raw_lines)
    candidates = [candidate_from_line(line, page, run_id, i + 1) for i, line in enumerate(all_raw_lines)]

    write_candidates(candidates, append=args.append)
    write_csv(RUNS_DIR / f"{suffix}_candidates.csv", candidates)
    write_csv(RUNS_DIR / f"{suffix}_raw_lines.csv", all_raw_lines)
    write_json(RUNS_DIR / f"{run_id}_candidates.json", candidates)

    print(f"Units processed: {processed_count}")
    print(f"Candidate rows after filtering: {len(candidates)}")
    print(f"Wrote/updated: {CANDIDATES_PATH.relative_to(PROJECT_ROOT)}")
    print(f"Wrote CSV: data/ocr_runs/{suffix}_candidates.csv")
    print(f"Wrote run JSON: data/ocr_runs/{run_id}_candidates.json")
    if args.mode == "sections":
        print("Next: review section crop images. If section boxes are off, use tools/grid_calibrator.html and rerun with --manual-grid-json.")
    print("Next: open tools/review_candidates.html locally and review candidates before publishing any row.")


if __name__ == "__main__":
    main()
