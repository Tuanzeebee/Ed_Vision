import os
import pandas as pd
import re

input_folder = "merged_csvs"
output_folder = "output"

os.makedirs(output_folder, exist_ok=True)


def clean_value(value):
    """Trả về rỗng nếu là 'nan' (string) hoặc dạng số %."""
    if isinstance(value, str):
        v = value.strip()

        # Trường hợp là 'nan', 'NaN', 'NAN'
        if v.lower() == "nan":
            return ""

        # Trường hợp là số dạng phần trăm: 50%, 12.3%, 100%
        if re.fullmatch(r"\d+(\.\d+)?%", v):
            return ""

    return value  # giá trị hợp lệ giữ nguyên


for filename in os.listdir(input_folder):
    if filename.endswith(".csv"):
        file_path = os.path.join(input_folder, filename)
        print(f"Đang xử lý: {filename}")

        df = pd.read_csv(file_path, dtype=str)  # đọc dạng chuỗi để không bị convert lỗi

        # CHỈ xoá dữ liệu là “nan” hoặc “%”
        df = df.map(clean_value)

        # Không drop dòng nữa → giữ nguyên toàn bộ dữ liệu
        output_name = filename.replace(".csv", ".csv")
        df.to_csv(os.path.join(output_folder, output_name), index=False)

print("Hoàn tất!")
