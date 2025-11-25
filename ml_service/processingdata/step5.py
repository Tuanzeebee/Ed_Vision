import os
import csv

# Thư mục chứa tất cả các file CSV cần xử lý
input_folder = "merged_csvs"
output_file = "output.csv"

all_rows = []

for filename in os.listdir(input_folder):
    if not filename.lower().endswith(".csv"):
        continue  # chỉ xử lý file .csv

    course_code = os.path.splitext(filename)[0]
    file_path = os.path.join(input_folder, filename)

    with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
        lines = [ln.strip() for ln in f if ln.strip()]

    # Dòng đầu tiên là header
    header = [h.strip() for h in lines[0].split(",")]

    # Dòng cuối cùng chứa weight
    last_line = lines[-1]
    weights = [w.strip() for w in last_line.split(",")]

    # Ghép header & weight theo từng cột
    for component, wt in zip(header, weights):
        if wt.endswith("%"):                       # chỉ lấy những cột có weight
            value = float(wt.replace("%", "")) / 100
            all_rows.append([course_code, component, value])

# Ghi ra file CSV tổng
with open(output_file, "w", newline="", encoding="utf-8") as f:
    writer = csv.writer(f)
    writer.writerow(["course_code", "component", "weight"])
    writer.writerows(all_rows)

print("Đã tạo file:", output_file)
