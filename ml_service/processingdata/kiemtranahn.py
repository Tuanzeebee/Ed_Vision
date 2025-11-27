import os
import pandas as pd

# 📁 Thư mục chứa file CSV
root_folder = "train__1"

# Các tên cột nhãn phổ biến (ưu tiên)
possible_label_names = ["label", "class", "category", "target", "tags"]


def detect_label_column(df):
    cols = df.columns.tolist()

    # Ưu tiên tên cột phổ biến
    for name in possible_label_names:
        if name in cols:
            return name

    # Nếu không có → tự tìm cột có unique ít nhất
    unique_counts = df.nunique().sort_values()
    candidate = unique_counts.index[0]

    # Nếu unique quá nhiều → không phải nhãn
    if unique_counts[candidate] > 100:
        return None

    return candidate


def has_whitespace(label):
    """Trả về True nếu nhãn có khoảng trắng đầu, cuối, hoặc thừa trong chuỗi."""
    if pd.isna(label):
        return False
    s = str(label)
    return s != s.strip() or "  " in s  # strip bỏ đầu/cuối, "  " phát hiện double space


for root, dirs, files in os.walk(root_folder):
    for file in files:
        if file.endswith(".csv"):
            file_path = os.path.join(root, file)
            print(f"\n📌 File: {file_path}")

            try:
                df = pd.read_csv(file_path)

                # Tìm cột nhãn
                label_col = detect_label_column(df)
                if label_col is None:
                    print("   ❌ Không tìm thấy cột nhãn.")
                    continue

                # Kiểm tra khoảng trắng
                labels = df[label_col].astype(str)
                bad_labels = labels[labels.apply(has_whitespace)]

                if len(bad_labels) > 0:
                    print(f"   ⚠️ Nhãn có khoảng trắng: {bad_labels.unique()}")
                else:
                    print("   ✔ Không có nhãn nào chứa khoảng trắng.")

            except Exception as e:
                print(f"   ❌ Lỗi đọc file: {e}")
