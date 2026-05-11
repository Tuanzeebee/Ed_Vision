"""
Remove FAILED test cases from C1SE.14-Test-Case-Sprint*.xlsx files
and re-sequence STT (column A) and Test case ID (column B).

Header row is detected by looking for a row whose first cell == 'STT'.
Data rows start 2 rows below the header (there is an empty separator row).
Sheets not containing such a header (e.g. Report) are skipped.

A backup copy of each file is created with suffix `.bak.xlsx` before saving.
"""
from __future__ import annotations

import re
import shutil
from pathlib import Path

import openpyxl

ROOT = Path(__file__).resolve().parent.parent
FILES = [ROOT / f"C1SE.14-Test-Case-Sprint{i}.xlsx" for i in range(1, 7)]

STATUS_COL = 10  # J
ID_COL = 2       # B
STT_COL = 1      # A
MAX_SCAN_HEADER = 30


def find_header_row(ws) -> int | None:
    for row in ws.iter_rows(min_row=1, max_row=MAX_SCAN_HEADER, max_col=2):
        v = row[0].value
        if isinstance(v, str) and v.strip().upper() == "STT":
            return row[0].row
    return None


def split_id(tcid: str) -> tuple[str, int] | None:
    """Split 'TC-REG-07' -> ('TC-REG-', 7). Returns None if not parseable."""
    if not isinstance(tcid, str):
        return None
    m = re.match(r"^(.*?)(\d+)\s*$", tcid.strip())
    if not m:
        return None
    prefix, num = m.group(1), int(m.group(2))
    return prefix, num


def process_sheet(ws) -> tuple[int, int]:
    """Returns (deleted_count, renumbered_count)."""
    header_row = find_header_row(ws)
    if header_row is None:
        return 0, 0
    data_start = header_row + 2  # blank separator row exists between header & data

    # Collect data rows (until row is fully empty across A..J)
    last_row = ws.max_row
    rows_to_delete: list[int] = []
    for r in range(data_start, last_row + 1):
        # consider row "present" if any of A..L has value
        values = [ws.cell(row=r, column=c).value for c in range(1, 13)]
        if all(v is None or (isinstance(v, str) and not v.strip()) for v in values):
            continue
        status = ws.cell(row=r, column=STATUS_COL).value
        if isinstance(status, str) and status.strip().upper() == "FAIL":
            rows_to_delete.append(r)

    # Delete from bottom up
    for r in reversed(rows_to_delete):
        ws.delete_rows(r, 1)

    # Renumber STT and Test case ID for remaining data rows
    pad_width = 2  # most IDs use 2-digit zero padding
    counter = 0
    last_row = ws.max_row
    renumbered = 0
    for r in range(data_start, last_row + 1):
        values = [ws.cell(row=r, column=c).value for c in range(1, 13)]
        if all(v is None or (isinstance(v, str) and not v.strip()) for v in values):
            continue
        counter += 1
        # STT
        ws.cell(row=r, column=STT_COL).value = counter
        # Test case ID: keep prefix
        cur_id = ws.cell(row=r, column=ID_COL).value
        parsed = split_id(cur_id) if isinstance(cur_id, str) else None
        if parsed is not None:
            prefix, _ = parsed
            ws.cell(row=r, column=ID_COL).value = f"{prefix}{counter:0{pad_width}d}"
            renumbered += 1
    return len(rows_to_delete), renumbered


def process_file(path: Path) -> None:
    print(f"\n=== {path.name} ===")
    if not path.exists():
        print("  (missing)")
        return
    backup = path.with_suffix(".bak.xlsx")
    if not backup.exists():
        shutil.copy2(path, backup)
        print(f"  backup -> {backup.name}")

    wb = openpyxl.load_workbook(path)
    total_deleted = 0
    for name in wb.sheetnames:
        ws = wb[name]
        deleted, renum = process_sheet(ws)
        total_deleted += deleted
        if deleted or renum:
            print(f"  [{name}] deleted={deleted}, renumbered={renum}")
    wb.save(path)
    print(f"  TOTAL deleted in file: {total_deleted}")


if __name__ == "__main__":
    for f in FILES:
        process_file(f)
    print("\nDone.")
