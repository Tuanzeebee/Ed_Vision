# Install deps: pip install pymupdf Pillow
#
# Usage:
#   python pdf_image_extractor.py <pdf_path> <output_dir> <slug>
#       [--skill-area listening|reading|speaking|writing]
#       [--min-width 80] [--min-height 80]
#
# The script scans each PDF page for skill-section / part-number markers in
# the page text, then only saves images found on pages that belong to the
# requested skill area.  This prevents images from e.g. a Speaking section
# leaking into a Listening import and vice-versa.

import argparse
import json
import os
import re
import sys
from io import BytesIO

# ── dependency checks ────────────────────────────────────────────────────────

try:
    import fitz  # pymupdf
except ImportError:
    print(
        json.dumps(
            {
                "status": "error",
                "message": "pymupdf not installed. Run: pip install pymupdf",
            }
        )
    )
    sys.exit(1)

try:
    from PIL import Image
except ImportError:
    print(
        json.dumps(
            {
                "status": "error",
                "message": "Pillow not installed. Run: pip install Pillow",
            }
        )
    )
    sys.exit(1)

# ── skill-area definitions ───────────────────────────────────────────────────
#
# Each skill area has:
#   • "section_patterns"  – regex list that, when matched in page text, means
#                           we have entered that skill section.
#   • "part_range"        – TOEIC part numbers that belong to this skill.
#                           An empty tuple means "no part-number filter".
#
# Detection priority: explicit section-name keywords beat part-number inference.

SKILL_DEFINITIONS = {
    "listening": {
        "section_patterns": [
            re.compile(
                r"\bLISTENING\s+(?:COMPREHENSION|SECTION|TEST|PART)?\b", re.IGNORECASE
            ),
            re.compile(r"\bPHẦN\s+NGHE\b", re.IGNORECASE),  # Vietnamese
            re.compile(r"\bNGHE\s+HIỂU\b", re.IGNORECASE),
        ],
        "part_range": (1, 4),
        "stop_section_patterns": [
            # Entering any of these means we've LEFT the listening section
            re.compile(
                r"\bREADING\s+(?:COMPREHENSION|SECTION|TEST|PART)?\b", re.IGNORECASE
            ),
            re.compile(r"\bSPEAKING\s+(?:SECTION|TEST|PART)?\b", re.IGNORECASE),
            re.compile(r"\bWRITING\s+(?:SECTION|TEST|PART)?\b", re.IGNORECASE),
            re.compile(r"\bPHẦN\s+ĐỌC\b", re.IGNORECASE),
            re.compile(r"\bPHẦN\s+NÓI\b", re.IGNORECASE),
            re.compile(r"\bPHẦN\s+VIẾT\b", re.IGNORECASE),
        ],
        "stop_part_above": 4,  # if we ever detect Part 5+ we've left listening
    },
    "reading": {
        "section_patterns": [
            re.compile(
                r"\bREADING\s+(?:COMPREHENSION|SECTION|TEST|PART)?\b", re.IGNORECASE
            ),
            re.compile(r"\bPHẦN\s+ĐỌC\b", re.IGNORECASE),
        ],
        "part_range": (5, 7),
        "stop_section_patterns": [
            re.compile(
                r"\bLISTENING\s+(?:COMPREHENSION|SECTION|TEST|PART)?\b", re.IGNORECASE
            ),
            re.compile(r"\bSPEAKING\s+(?:SECTION|TEST|PART)?\b", re.IGNORECASE),
            re.compile(r"\bWRITING\s+(?:SECTION|TEST|PART)?\b", re.IGNORECASE),
        ],
        "stop_part_above": 7,
    },
    "speaking": {
        "section_patterns": [
            re.compile(r"\bSPEAKING\s+(?:SECTION|TEST|PART)?\b", re.IGNORECASE),
            re.compile(r"\bPHẦN\s+NÓI\b", re.IGNORECASE),
        ],
        "part_range": (),  # no standard part numbers for speaking
        "stop_section_patterns": [
            re.compile(
                r"\bLISTENING\s+(?:COMPREHENSION|SECTION|TEST|PART)?\b", re.IGNORECASE
            ),
            re.compile(
                r"\bREADING\s+(?:COMPREHENSION|SECTION|TEST|PART)?\b", re.IGNORECASE
            ),
            re.compile(r"\bWRITING\s+(?:SECTION|TEST|PART)?\b", re.IGNORECASE),
        ],
        "stop_part_above": 0,
    },
    "writing": {
        "section_patterns": [
            re.compile(r"\bWRITING\s+(?:SECTION|TEST|PART)?\b", re.IGNORECASE),
            re.compile(r"\bPHẦN\s+VIẾT\b", re.IGNORECASE),
        ],
        "part_range": (),
        "stop_section_patterns": [
            re.compile(
                r"\bLISTENING\s+(?:COMPREHENSION|SECTION|TEST|PART)?\b", re.IGNORECASE
            ),
            re.compile(
                r"\bREADING\s+(?:COMPREHENSION|SECTION|TEST|PART)?\b", re.IGNORECASE
            ),
            re.compile(r"\bSPEAKING\s+(?:SECTION|TEST|PART)?\b", re.IGNORECASE),
        ],
        "stop_part_above": 0,
    },
}

# Part-number detection (1-7)
_PART_PATTERNS = [
    (i, re.compile(rf"\bPART\s*{i}\b", re.IGNORECASE)) for i in range(1, 8)
]


# ── helpers ──────────────────────────────────────────────────────────────────


def detect_part_in_text(text: str) -> int | None:
    """Return the highest TOEIC part number found in *text*, or None."""
    found = None
    for part_num, pattern in _PART_PATTERNS:
        if pattern.search(text):
            if found is None or part_num > found:
                found = part_num
    return found


def page_enters_target_section(text: str, skill_area: str) -> bool:
    defn = SKILL_DEFINITIONS[skill_area]
    return any(p.search(text) for p in defn["section_patterns"])


def page_leaves_target_section(text: str, skill_area: str) -> bool:
    defn = SKILL_DEFINITIONS[skill_area]
    return any(p.search(text) for p in defn["stop_section_patterns"])


def part_is_in_skill(part_num: int, skill_area: str) -> bool:
    """Return True when *part_num* belongs to *skill_area*."""
    part_range = SKILL_DEFINITIONS[skill_area]["part_range"]
    if not part_range:
        return False  # skill has no numeric parts
    return part_range[0] <= part_num <= part_range[1]


def part_leaves_skill(part_num: int, skill_area: str) -> bool:
    """Return True when *part_num* is beyond the skill's part range."""
    stop_above = SKILL_DEFINITIONS[skill_area]["stop_part_above"]
    if stop_above == 0:
        return False
    return part_num > stop_above


# ── core extraction ──────────────────────────────────────────────────────────


def classify_page(
    page_text: str,
    skill_area: str,
    in_target_section: bool,
    highest_seen_part: int,
) -> tuple[bool, int]:
    """
    Decide whether *this page* belongs to the target skill section.

    Returns:
        (in_target_section, highest_seen_part)

    Flexible extraction logic:
    ---------------------------------------------------------------------------
    By default, the script assumes we are IN the target section.
    We only exit if we see an explicit stop keyword (e.g. "READING" when looking for "LISTENING")
    or an out-of-range part number.
    We explicitly re-enter if we see a section keyword or a valid part number.
    This seamlessly supports both Standalone files (no keywords) and Full Exams.
    """
    defn = SKILL_DEFINITIONS[skill_area]

    detected_part = detect_part_in_text(page_text)
    if detected_part is not None and detected_part > highest_seen_part:
        highest_seen_part = detected_part

    enters = page_enters_target_section(page_text, skill_area)
    leaves = page_leaves_target_section(page_text, skill_area)

    # 1. Explicit stop keywords force exit
    if leaves and not enters:
        return False, highest_seen_part

    # 2. Out-of-range part numbers force exit
    if (
        detected_part is not None
        and part_leaves_skill(detected_part, skill_area)
        and not enters
    ):
        return False, highest_seen_part

    # 3. Explicit enter keywords force entry
    if enters:
        return True, highest_seen_part

    # 4. Valid part numbers force entry
    if detected_part is not None and part_is_in_skill(detected_part, skill_area):
        return True, highest_seen_part

    # 5. Otherwise, preserve the current state
    return in_target_section, highest_seen_part


def save_optimised_webp(
    raw_bytes: bytes,
    abs_path: str,
    min_width: int,
    min_height: int,
    max_width: int = 1200,
    skip_text_images: bool = True,
) -> tuple[int, int, int] | None:
    """
    Open *raw_bytes* as an image, apply quality optimisations, save as WebP.

    Returns (width, height, size_bytes) on success, None if the image should
    be skipped or if any processing step fails.

    Watermark filter: images with extreme aspect ratios (banner-style text
    strips like "Zenlish - Học TOEIC 1 lần là Đạt") are skipped.
    Real TOEIC photographs have moderate aspect ratios (0.3 – 4.0).
    """
    try:
        pil_img = Image.open(BytesIO(raw_bytes))
        pil_img.load()
    except Exception:
        return None

    orig_w, orig_h = pil_img.size

    # Skip tiny decorative images
    if orig_w < min_width or orig_h < min_height:
        return None

    # Skip full-page scanned backgrounds (very tall portrait, likely a page scan)
    if orig_h >= 800 and (orig_h / float(max(1, orig_w))) > 1.2:
        return None

    # ── Watermark / text-strip filter ────────────────────────────────────────
    # Watermark images embedded in TOEIC PDFs (e.g. "Zenlish - Học TOEIC 1 lần
    # là Đạt") are typically very wide and short — aspect ratio >> 4:1.
    # Real TOEIC Part 1 photographs are landscape (≈1.3:1) or portrait (≈0.75:1).
    # We skip anything with aspect > 6:1 or < 1:6 as those are clearly strips.
    if orig_w > 0 and orig_h > 0:
        aspect = orig_w / orig_h
        if aspect > 6.0 or aspect < (1.0 / 6.0):
            return None
    # ─────────────────────────────────────────────────────────────────────────

    # Convert to RGB (handles RGBA, CMYK, P-mode, etc.)
    try:
        if pil_img.mode != "RGB":
            pil_img = pil_img.convert("RGB")
    except Exception:
        return None

    # Downscale if wider than max_width (preserve aspect ratio)
    if orig_w > max_width:
        scale = max_width / orig_w
        new_w = max_width
        new_h = max(1, int(orig_h * scale))
        try:
            pil_img = pil_img.resize((new_w, new_h), Image.LANCZOS)
        except Exception:
            return None
    else:
        new_w, new_h = orig_w, orig_h

    try:
        pil_img.save(abs_path, format="WEBP", quality=82, method=4)
    except Exception:
        return None

    try:
        size_bytes = os.path.getsize(abs_path)
    except OSError:
        size_bytes = 0

    return new_w, new_h, size_bytes


def extract_images(
    pdf_path: str,
    output_dir: str,
    slug: str,
    skill_area: str = "listening",
    min_width: int = 80,
    min_height: int = 80,
) -> dict:
    """
    Extract and optimise images from *pdf_path*, saving only those found on
    pages that belong to *skill_area*.

    Returns a result dict suitable for JSON serialisation.
    """
    os.makedirs(output_dir, exist_ok=True)

    try:
        doc = fitz.open(pdf_path)
    except Exception as exc:
        return {"status": "error", "message": f"Failed to open PDF: {exc}"}

    total_pages = len(doc)
    extracted: list[dict] = []

    # Derive the uploads-relative URL prefix from output_dir
    norm_out = output_dir.replace("\\", "/")
    uploads_marker = "/uploads/"
    if uploads_marker in norm_out:
        rel_base = norm_out.split(uploads_marker, 1)[1]
    else:
        # Fallback: build conventional path
        rel_base = f"TOEIC/toeic-{skill_area}/{slug}/images"

    # ── page-level state machine ──────────────────────────────────────────
    # We default to True to support Standalone PDFs (where no section headers exist).
    # classify_page will flip this to False if it encounters an explicit stop signal
    # (e.g., seeing "READING" when we want "LISTENING").

    in_target = True
    highest_seen_part = 0

    for page_idx in range(total_pages):
        page = doc[page_idx]
        one_indexed = page_idx + 1

        # ── classify the page ────────────────────────────────────────────
        try:
            page_text = page.get_text()
        except Exception:
            page_text = ""

        in_target, highest_seen_part = classify_page(
            page_text, skill_area, in_target, highest_seen_part
        )

        # Skip pages that don't belong to our target skill section
        if not in_target:
            continue

        # ── extract images from this page ────────────────────────────────
        try:
            image_list = page.get_images(full=True)
        except Exception:
            continue

        img_idx = 1  # 1-indexed per page

        for img_info in image_list:
            xref = img_info[0]

            try:
                img_data = doc.extract_image(xref)
            except Exception:
                continue

            if not img_data:
                continue

            raw_bytes = img_data.get("image")
            if not raw_bytes:
                continue

            filename = f"{slug}_p{one_indexed:03d}_img{img_idx:02d}.webp"
            abs_path = os.path.join(output_dir, filename)

            result = save_optimised_webp(raw_bytes, abs_path, min_width, min_height)
            if result is None:
                continue  # too small, unreadable, text-only, or save failed

            new_w, new_h, size_bytes = result
            url_path = f"{rel_base}/{filename}"

            extracted.append(
                {
                    "filename": filename,
                    "path": os.path.abspath(abs_path),
                    "url_path": url_path,
                    "page": one_indexed,
                    "skill_area": skill_area,
                    "width": new_w,
                    "height": new_h,
                    "size_bytes": size_bytes,
                }
            )

            img_idx += 1

    doc.close()

    return {
        "status": "ok",
        "skill_area": skill_area,
        "images": extracted,
        "total_pages": total_pages,
        "total_extracted": len(extracted),
    }


# ── CLI entry point ──────────────────────────────────────────────────────────


def main() -> None:
    parser = argparse.ArgumentParser(
        description=(
            "Extract and optimise embedded images from a TOEIC PDF, "
            "filtering by skill area (listening / reading / speaking / writing)."
        )
    )
    parser.add_argument("pdf_path", help="Absolute path to the source PDF file.")
    parser.add_argument("output_dir", help="Directory where images will be saved.")
    parser.add_argument("slug", help="Unique slug used in output filenames.")
    parser.add_argument(
        "--skill-area",
        default="listening",
        choices=list(SKILL_DEFINITIONS.keys()),
        help="Skill area whose images to extract (default: listening).",
    )
    parser.add_argument(
        "--min-width",
        type=int,
        default=80,
        help="Minimum image width  to keep in pixels (default: 80).",
    )
    parser.add_argument(
        "--min-height",
        type=int,
        default=80,
        help="Minimum image height to keep in pixels (default: 80).",
    )

    args = parser.parse_args()

    # ── validate input ───────────────────────────────────────────────────
    if not os.path.isfile(args.pdf_path):
        print(
            json.dumps(
                {"status": "error", "message": f"PDF file not found: {args.pdf_path}"}
            )
        )
        sys.exit(1)

    if not args.pdf_path.lower().endswith(".pdf"):
        print(json.dumps({"status": "error", "message": "Chỉ hỗ trợ file PDF (.pdf)."}))
        sys.exit(1)

    try:
        with open(args.pdf_path, "rb") as fh:
            magic = fh.read(4)
        if magic != b"%PDF":
            print(
                json.dumps(
                    {
                        "status": "error",
                        "message": "File không phải PDF hợp lệ (magic bytes không khớp).",
                    }
                )
            )
            sys.exit(1)
    except OSError as exc:
        print(json.dumps({"status": "error", "message": f"Không đọc được file: {exc}"}))
        sys.exit(1)

    # ── run extraction ───────────────────────────────────────────────────
    try:
        result = extract_images(
            pdf_path=args.pdf_path,
            output_dir=args.output_dir,
            slug=args.slug,
            skill_area=args.skill_area,
            min_width=args.min_width,
            min_height=args.min_height,
        )
    except Exception as exc:
        result = {"status": "error", "message": f"Unexpected error: {exc}"}

    print(json.dumps(result, ensure_ascii=False, indent=2))

    if result.get("status") != "ok":
        sys.exit(1)


if __name__ == "__main__":
    main()
