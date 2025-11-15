"""
merge_improved.py

Mục tiêu: merge các file .csv cùng tên trong 3 thư mục, đảm bảo:
 - giữ union (outer join) tất cả các nhãn (labels)
 - chuẩn hoá nhãn (strip, to_string) để tránh mất match do spacing/case
 - xử lý duplicate label trong 1 file (giữ first occurrence)
 - coalesce (lấy giá trị non-null) theo thứ tự ưu tiên thư mục (DIR1 > DIR2 > DIR3)
 - xuất file merged cùng tên vào OUTPUT_DIR và in log chi tiết.

SỬ DỤNG:
 - Sửa 3 biến DIR1, DIR2, DIR3, OUTPUT_DIR, LABEL_COLUMN ở đầu file
 - Chạy: python merge_improved.py
"""

import os
import pandas as pd
from collections import defaultdict

# === CHỈNH Ở ĐÂY ===
DIR1 = r"output_csvs3"
DIR2 = r"output_csvs"
DIR3 = r"output_csvs2"
OUTPUT_DIR = r"merged_csvs"

LABEL_COLUMN = None  # None => dùng cột đầu tiên của mỗi CSV làm label
NORMALIZE_LABEL = True  # True => strip() và chuyển về string
DEDUP_POLICY = "first"  # "first" hoặc "aggregate" (aggregate chưa cài, default giữ first)
PREFER_ORDER = ["1", "2", "3"]  # thứ tự ưu tiên khi coalesce (tương ứng DIR1,DIR2,DIR3)
# =====================

os.makedirs(OUTPUT_DIR, exist_ok=True)

def read_and_prepare(path, label_column, tag):
    df = pd.read_csv(path, dtype=str)  # đọc hết dưới dạng string để tránh mismatched types
    if label_column:
        if label_column not in df.columns:
            raise ValueError(f"{path}: không tìm thấy cột label '{label_column}'. Có các cột: {list(df.columns)}")
        lbl = label_column
    else:
        lbl = df.columns[0]

    # chuẩn hoá label column: strip, convert to string
    if NORMALIZE_LABEL:
        df[lbl] = df[lbl].astype(str).str.strip()
    else:
        df[lbl] = df[lbl].astype(str)

    # xử lý duplicate label: giữ bản ghi đầu (có thể mở rộng thành aggregate)
    if DEDUP_POLICY == "first":
        df = df[~df.duplicated(subset=[lbl])]
    else:
        df = df[~df.duplicated(subset=[lbl])]  # fallback

    # đặt index là label
    df = df.set_index(lbl)

    # thêm hậu tố vào tên cột tạm (nhằm phân biệt nguồn trước khi coalesce)
    df = df.rename(columns=lambda c: f"{c}__{tag}")
    return df

def coalesce_merged(df_concat, base_cols, prefer_order_tags):
    # df_concat: DataFrame có cột dạng "colname__tag"
    # base_cols: set các tên cột gốc (không gồm label)
    # prefer_order_tags: e.g. ["1","2","3"] quyết định thứ tự lấy giá trị non-null
    merged = pd.DataFrame(index=df_concat.index)

    for base in sorted(base_cols):
        cols = [f"{base}__{tag}" for tag in prefer_order_tags if f"{base}__{tag}" in df_concat.columns]
        if not cols:
            continue
        # bắt đầu từ cột ưu tiên nhất, combine_first với các cột sau
        s = df_concat[cols[0]].copy()
        for c in cols[1:]:
            s = s.combine_first(df_concat[c])
        merged[base] = s

    return merged

def discover_all_filenames(*dirs):
    allnames = set()
    for d in dirs:
        if os.path.isdir(d):
            for f in os.listdir(d):
                if f.lower().endswith(".csv"):
                    allnames.add(f)
    return sorted(allnames)

def main():
    dirs = [DIR1, DIR2, DIR3]
    tags = ["1","2","3"]
    filenames = discover_all_filenames(*dirs)
    if not filenames:
        print("Không tìm thấy file .csv ở các thư mục đã cấu hình.")
        return

    print(f"Phát hiện {len(filenames)} file (unique) để merge.")

    for fname in filenames:
        paths = [os.path.join(d, fname) for d in dirs]
        dfs = []
        per_file_counts = {}
        present_tags = []
        base_cols_set = set()
        for p, tag in zip(paths, tags):
            if os.path.isfile(p):
                try:
                    df = read_and_prepare(p, LABEL_COLUMN, tag)
                    dfs.append((df, tag))
                    per_file_counts[tag] = len(df)
                    present_tags.append(tag)
                    # thu thập base column names (xóa hậu tố)
                    base_cols_set.update([col.rsplit("__", 1)[0] for col in df.columns])
                except Exception as e:
                    print(f"  [LỖI đọc] {p}: {e}")
                    dfs.append((None, tag))
                    per_file_counts[tag] = 0
            else:
                dfs.append((None, tag))
                per_file_counts[tag] = 0

        # concat theo index (outer union)
        concat_parts = []
        for df, tag in dfs:
            if df is not None:
                concat_parts.append(df)
        if not concat_parts:
            print(f"  Bỏ qua {fname} — không tìm thấy file ở bất kỳ thư mục nào.")
            continue

        df_concat = pd.concat(concat_parts, axis=1, sort=False)

        # đảm bảo index chuẩn (strip/norm) nếu cần
        if NORMALIZE_LABEL:
            # index là string do đọc dtype=str; strip again to be safe
            df_concat.index = df_concat.index.astype(str)
            df_concat.index = df_concat.index.str.strip()

        # coalesce theo prefer order
        merged = coalesce_merged(df_concat, base_cols_set, PREFER_ORDER)

        # merged index là label; sắp xếp index
        try:
            merged.sort_index(inplace=True)
        except Exception:
            pass

        outpath = os.path.join(OUTPUT_DIR, fname)
        merged.reset_index().rename(columns={"index": LABEL_COLUMN if LABEL_COLUMN else df_concat.index.name if df_concat.index.name else "label"}).to_csv(outpath, index=False)

        # Logging chi tiết
        total_rows_merged = len(merged)
        print(f"→ {fname}: merged rows = {total_rows_merged}. source rows:", per_file_counts)
        # show labels that exist only in some sources (optional short list)
        label_presence = defaultdict(list)  # label -> list of tags present
        for tag, p in zip(tags, paths):
            if os.path.isfile(p):
                tmp = pd.read_csv(p, dtype=str)
                lbl = LABEL_COLUMN if LABEL_COLUMN else tmp.columns[0]
                if NORMALIZE_LABEL:
                    tmp[lbl] = tmp[lbl].astype(str).str.strip()
                else:
                    tmp[lbl] = tmp[lbl].astype(str)
                for v in tmp[lbl].unique():
                    label_presence[v].append(tag)

        only_in = {lab: tags_present for lab, tags_present in label_presence.items() if len(tags_present) < len(tags)}
        # show up to 5 examples of labels that are not present in all sources
        sample_only_in = list(only_in.items())[:5]
        if sample_only_in:
            print("   Ví dụ nhãn không xuất hiện ở tất cả nguồn (label -> tags_present):")
            for lab, tgs in sample_only_in:
                print(f"     {lab!r} -> {tgs}")
            if len(only_in) > len(sample_only_in):
                print(f"   ... và {len(only_in)-len(sample_only_in)} nhãn khác có presence không đồng nhất.")
        else:
            print("   Mọi nhãn đều đồng nhất về presence (có thể tất cả files chứa cùng nhãn).")

    print("Hoàn tất.")

if __name__ == "__main__":
    main()
