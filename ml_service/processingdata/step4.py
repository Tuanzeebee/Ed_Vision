import os
import pandas as pd
import re

input_folder = "output"
output_folder = "output_final_fixed"

os.makedirs(output_folder, exist_ok=True)

def extract_file_course_code(filename):
    return os.path.splitext(filename)[0]

for filename in os.listdir(input_folder):
    if filename.endswith(".csv"):
        print("Đang xử lý:", filename)
        file_path = os.path.join(input_folder, filename)

        df = pd.read_csv(file_path, dtype=str)

        # Xoá các dòng trống hoàn toàn trước khi xử lý
        df = df.dropna(how="all")

        # Nếu không có course_code → thêm cột mới
        if "course_code" not in df.columns:
            df["course_code"] = extract_file_course_code(filename)
            print(f"➕ Thêm course_code = '{extract_file_course_code(filename)}'")
        else:
            # Nếu có → fill xuống nhưng KHÔNG tạo dòng dư
            df["course_code"] = df["course_code"].ffill()

        # Xuất file
        output_name = filename.replace(".csv", ".csv")
        df.to_csv(os.path.join(output_folder, output_name), index=False)

print("Hoàn tất!")
