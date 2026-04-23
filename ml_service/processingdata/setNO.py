import os
import pandas as pd

#  Thư mục chứa các file CSV cần xử lý
ROOT = "output_final_fixed"

#  Nếu bạn muốn ghi đè file cũ → True
OVERWRITE = True

#  Nếu muốn lưu file mới, sửa tên folder này
OUTPUT = "output_final_train"

if not OVERWRITE:
    os.makedirs(OUTPUT, exist_ok=True)

for root, dirs, files in os.walk(ROOT):
    for file in files:
        if file.lower().endswith(".csv"):
            path = os.path.join(root, file)

            print(f"\n Đang xử lý: {path}")

            try:
                df = pd.read_csv(path)

                # kiểm tra cột "no"
                if "no" not in df.columns:
                    print("    Không có cột 'no', bỏ qua.")
                    continue

                # đánh lại thứ tự 1 → n
                df["no"] = range(1, len(df) + 1)

                # lưu file
                if OVERWRITE:
                    df.to_csv(path, index=False)
                    print("    Đã ghi đè file.")
                else:
                    out_path = os.path.join(OUTPUT, file)
                    df.to_csv(out_path, index=False)
                    print(f"    Đã lưu file mới: {out_path}")

            except Exception as e:
                print(f"    Lỗi đọc file: {e}")
