#!/usr/bin/env python3
"""
rename_csv_headers.py

Duyệt tất cả file .csv trong folder nguồn, đổi tên cột theo mapping
và xuất file đã đổi tên vào folder đích.

Chạy:
    python rename_csv_headers.py /path/to/input_folder /path/to/output_folder

Nếu không truyền tham số sẽ dùng folder hiện tại/input_csvs và output_csvs.
"""

import os
import sys
import argparse
import pandas as pd
import unicodedata
import difflib
from pathlib import Path

# -----------------------
# Cấu hình mapping ở đây
# Bạn có thể thêm nhiều biến thể cho mỗi tên chuẩn (canonical name)
# -----------------------
CANONICAL_MAP = {
    "no": ["no", "stt", "số thứ tự", "số", "index","Cột 1"],
    "student_id": ["mã sinh viên", "mssv", "studentid", "student id", "id", "ma sv", "mã sv"],
    "attend": ["chuyên cần", "chuyên cần%", "attendance", "attend", "điểm chuyên cần"],
    "regular": ["kiểm tra thường kỳ", "kt thường kỳ", "regular", "quiz", "kiem tra thuong ky"],
    "practice": ["thực hành", "thực hành & thực tế", "thuc hanh", "practice", "lab"],
    "final": ["kiểm tra cuối kỳ", "kt cuối kỳ", "final", "final exam", "ktra cuoi ky","Thi cuối kỳ"],
    "midterm": ["kiểm tra giữa kỳ", "kt giữa kỳ", "midterm", "giữa kỳ"],
    "homework":["Bài tập Về nhà"],
    "speech_and_discussion":["Phát biểu & Thảo luận"],
    "group_project":["Đồ Án Nhóm"],
    "individual_project":["Đồ Án Cá Nhân"],
    "essay":["Tiểu luận"],
    "course_code":["course_code","course code"]
}

# Các kiểu mở rộng: bạn có thể bổ sung regex hoặc logic khác nếu cần.


# -----------------------
# Hàm hỗ trợ
# -----------------------
def normalize_text(s: str) -> str:
    """Chuẩn hóa: lowercase, strip, bỏ dấu, giữ chữ số/chữ cái và space."""
    if s is None:
        return ""
    s = str(s).strip().lower()
    s = unicodedata.normalize("NFKD", s)
    s = "".join([c for c in s if not unicodedata.combining(c)])
    s = "".join(ch if (ch.isalnum() or ch.isspace()) else " " for ch in s)
    s = " ".join(s.split())
    return s

def build_reverse_map(canonical_map):
    """Tạo map từ biến thể chuẩn hóa -> tên chuẩn"""
    rev = {}
    for canonical, variants in canonical_map.items():
        for v in variants + [canonical]:
            key = normalize_text(v)
            if key:
                rev[key] = canonical
    return rev

def guess_canonical(col_name, reverse_map, canonical_keys):
    """
    Cố gắng đoán tên chuẩn của col_name theo nhiều chiến lược:
      1) exact normalized match
      2) substring contains
      3) difflib close match trên variants
      4) difflib close match trên canonical names
    Trả về tên chuẩn (string) hoặc None nếu không đoán được.
    """
    norm = normalize_text(col_name)
    if not norm:
        return None

    # 1) exact
    if norm in reverse_map:
        return reverse_map[norm]

    # 2) contains (variant in norm or norm in variant)
    for key, canonical in reverse_map.items():
        if key and (key in norm or norm in key):
            return canonical

    # 3) close match among variants
    keys = list(reverse_map.keys())
    close = difflib.get_close_matches(norm, keys, n=1, cutoff=0.75)
    if close:
        return reverse_map[close[0]]

    # 4) close match among canonical names
    close2 = difflib.get_close_matches(norm, canonical_keys, n=1, cutoff=0.8)
    if close2:
        # close2[0] is normalized canonical; find original canonical key
        return close2[0]

    return None

def process_csv_file(in_path: Path, out_path: Path, reverse_map, canonical_keys, sep=None, encoding='utf-8'):
    """Đọc CSV, loại bỏ Unnamed columns, đổi tên headers, ghi file ra out_path.
    Trả về: (mapping_used, unmapped_cols)
    """
    # --- đọc CSV ---
    try:
        if sep is None:
            df = pd.read_csv(in_path, engine="python", sep=None)
        else:
            df = pd.read_csv(in_path, sep=sep, encoding=encoding)
    except Exception:
        for s in [',', ';', '\t', '|']:
            try:
                df = pd.read_csv(in_path, sep=s, encoding=encoding)
                break
            except:
                continue
        else:
            raise RuntimeError(f"Không đọc được file {in_path}")

    # --- bỏ Unnamed ---
    df = df.loc[:, ~df.columns.str.contains(r'^Unnamed', regex=True)]

    original_cols = list(df.columns)
    new_cols = []
    mapping_used = {}
    unmapped = []   # ← thêm để lưu cột không đổi được

    for col in original_cols:
        guessed = guess_canonical(col, reverse_map, canonical_keys)

        if guessed:
            # tránh trùng tên
            target = guessed
            suffix = 1
            while target in new_cols:
                suffix += 1
                target = f"{guessed}_{suffix}"
            new_cols.append(target)
            mapping_used[col] = target
        else:
            # không đổi → đánh dấu unmapped
            new_cols.append(col)
            unmapped.append(col)

    df.columns = new_cols

    # ghi file xuất
    out_path.parent.mkdir(parents=True, exist_ok=True)
    df.to_csv(out_path, index=False, encoding=encoding)

    return mapping_used, unmapped

# -----------------------
# CLI chính
# -----------------------
def main():
    parser = argparse.ArgumentParser(description="Đổi tên header nhiều file CSV (mặc định input=data_train).")
    parser.add_argument("input_dir", nargs="?", default="train__1",
                        help="Thư mục chứa file csv (mặc định: data_train)")
    parser.add_argument("output_dir", nargs="?", default="output_csvs3",
                        help="Thư mục xuất file (mặc định: output_csvs)")
    parser.add_argument("--encoding", default="utf-8", help="Encoding khi đọc/ghi CSV (mặc định utf-8)")
    parser.add_argument("--sep", default=None, help="If known separator, pass here (e.g. ',' or ';' or '\\t')")
    parser.add_argument("--ext", default=".csv", help="File extension to process (default .csv)")
    args = parser.parse_args()

    in_dir = Path(args.input_dir)
    out_dir = Path(args.output_dir)

    if not in_dir.exists() or not in_dir.is_dir():
        print(f"Thư mục nguồn không tồn tại: {in_dir}")
        sys.exit(1)

    reverse_map = build_reverse_map(CANONICAL_MAP)
    canonical_keys = [normalize_text(k) for k in CANONICAL_MAP.keys()]

    processed = 0
    for p in sorted(in_dir.iterdir()):
        if p.is_file() and p.suffix.lower() == args.ext.lower():
            rel_out = out_dir / p.name
            try:
                mapping_used, unmapped = process_csv_file(p, rel_out, reverse_map, canonical_keys, sep=args.sep,
                                                          encoding=args.encoding)
                if unmapped:
                    print(f"[WARNING] {p.name} -> còn {len(unmapped)} cột chưa đổi: {unmapped}")
                else:
                    print(f"[OK] {p.name} -> tất cả cột đã được đổi tên.")

                processed += 1

            except Exception as e:
                print(f"[ERR] {p.name}: {e}")

    if processed == 0:
        print("Không tìm thấy file csv nào để xử lý.")
    else:
        print(f"Hoàn thành xử lý {processed} file. File đã lưu vào: {out_dir.resolve()}")

if __name__ == "__main__":
    main()