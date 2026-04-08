from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Dict, List, Optional, Any
from functools import lru_cache
from datetime import datetime, timedelta
import uvicorn

import os
import re
import io
import hashlib

import numpy as np
import pandas as pd
import joblib

# MongoDB
from pymongo import MongoClient
from dotenv import load_dotenv

# XAI
import shap  # pip install shap

# Load environment variables
load_dotenv()

# =============================
# 0. Simple in-memory cache for SHAP results
# =============================

class SimpleCache:
    """Simple in-memory cache với TTL"""
    def __init__(self):
        self.cache: Dict[str, tuple[Any, datetime]] = {}
        self.ttl_minutes = int(os.getenv("SHAP_CACHE_TTL_MINUTES", "15"))
    
    def get(self, key: str) -> Optional[Any]:
        if key in self.cache:
            value, expiry = self.cache[key]
            if datetime.now() < expiry:
                print(f"[CACHE HIT] {key}")
                return value
            else:
                print(f"[CACHE EXPIRED] {key}")
                del self.cache[key]
        return None
    
    def set(self, key: str, value: Any):
        expiry = datetime.now() + timedelta(minutes=self.ttl_minutes)
        self.cache[key] = (value, expiry)
        print(f"[CACHE SET] {key} (expires in {self.ttl_minutes}min)")
    
    def clear(self):
        self.cache.clear()
        print("[CACHE] Cleared all entries")
    
    def get_stats(self):
        return {
            "size": len(self.cache),
            "ttl_minutes": self.ttl_minutes
        }

SHAP_CACHE = SimpleCache()

# =============================
# 1. Config đường dẫn và MongoDB
# =============================

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

DATA_DIR = os.path.join(BASE_DIR, "data")  # nơi chứa weights_used.csv (backup)
OUTPUT_DIR = os.path.join(BASE_DIR, "output_final_v2")  # nơi chứa model_artifacts_gb_rf_add_feature.joblib

ARTIFACTS_PATH = os.getenv(
    "MODEL_ARTIFACTS_PATH",
    os.path.join(OUTPUT_DIR, "model_artifacts_gb_rf_add_feature1.joblib"),
)
WEIGHTS_FILE = os.getenv(
    "WEIGHTS_FILE_PATH",
    os.path.join(DATA_DIR, "weights_used.csv"),
)  # Giữ lại làm fallback
BEHAVIOR_FILE = os.path.join(DATA_DIR, "clean_student_data_v2.csv")  # hiện tại KHÔNG dùng, để dành tương lai

COURSE_METRICS_PATH = os.getenv(
    "COURSE_METRICS_PATH",
    os.path.join(OUTPUT_DIR, "course_metrics_gradient_boosting.csv"),
)

# MongoDB Configuration
MONGODB_URI = (
    os.getenv("MONGODB_URI")
    or os.getenv("MONGO_URI")
    or "mongodb://localhost:27017/ed_vision"
)
MONGODB_DB_NAME = os.getenv("MONGODB_DB_NAME", "ed_vision")
MONGODB_COLLECTION = "gradestructures"  # Collection name trong MongoDB
APP_HOST = os.getenv("HOST", "0.0.0.0")
APP_PORT = int(os.getenv("PORT", "8000"))
ML_WORKERS = int(os.getenv("ML_WORKERS", "1"))

# Ngưỡng fallback giống notebook
HIGH_R2 = 0.60   # tin model
MID_R2 = 0.30    # tin vừa vừa, dùng blend
BLEND_ALPHA = 0.7  # tỉ lệ model trong blend

# =============================
# 2. Schema & alias (giống notebook)
# =============================

TARGET_COL = "final"

# FEATURE_SCORE_COLS giống Jupyter notebook
FEATURE_SCORE_COLS = [
    "attend",

    # quiz variants
    "quiz",
    "quiz1",
    "quiz2",

    "midterm",

    # homework variants
    "homework",
    "homework1",
    "homework2",

    "group_project",
    "individual_project",
    "practice",
    "regular",
    "speech_and_discussion",
    "project",
]

CANONICAL_FEATURES = FEATURE_SCORE_COLS + [TARGET_COL]

COLUMN_ALIASES: Dict[str, List[str]] = {
    "no": ["no", "No", "stt", "index"],

    "student_id": ["student id", "student_id", "id", "studentcode", "student_code"],
    "course_code": ["course_code", "course code", "course", "subject", "subject_code"],

    "attend": ["attend", "attendance"],

    # quiz
    "quiz": ["quiz"],
    "quiz1": ["quiz1", "quiz_1"],
    "quiz2": ["quiz2", "quiz_2"],

    # homework
    "homework": ["homework", "hw", "assignment"],
    "homework1": ["homework1", "hw1", "assignment1", "homework_1"],
    "homework2": ["homework2", "hw2", "assignment2", "homework_2"],

    "midterm": ["midterm", "mid term"],

    "group_project": ["group project", "group_project"],
    "individual_project": ["individual project", "individual_project"],

    "practice": ["practice", "lab", "exercise"],
    "regular": ["regular", "participation", "classwork"],

    "speech_and_discussion": ["speech and discussion", "speech_and_discussion", "discussion"],

    "project": ["project"],

    "final": ["final", "final_exam", "final exam", "endterm", "end_term"]
}

# Behavior features (giống notebook / artifacts) – hiện tại KHÔNG auto gán, chỉ dùng nếu có trong input
BEHAVIOR_FEATURE_BY_COURSE = [
    "weekly_study_hours_by_course",
    "part_time_hours_by_course",
    "financial_support_by_course",
    "emotional_support_by_course",
]

# =============================
# 3. Pydantic models cho JSON endpoint
# =============================

class PredictJSONRequest(BaseModel):
    course_code: Optional[str] = None  # default course_code cho cả file nếu từng row không có
    rows: List[Dict[str, Any]]


class ExplainJSONRequest(PredictJSONRequest):
    top_k: int = 10  # số feature XAI trả ra cho mỗi sinh viên


def normalize_col_name(col: str) -> str:
    return re.sub(r"\s+", "_", str(col).strip().lower())


def find_canonical_for_raw(raw_col: str) -> Optional[str]:
    raw_norm = normalize_col_name(raw_col)
    for canonical, aliases in COLUMN_ALIASES.items():
        for alias in aliases:
            alias_norm = normalize_col_name(alias)
            if raw_norm == alias_norm:
                return canonical
    return None


# =============================
# 4. Load weights từ MongoDB (hoặc fallback CSV)
# =============================

def load_weights_from_mongodb(mongo_client: MongoClient) -> Dict[str, Dict[str, float]]:
    """
    Load weights từ MongoDB collection 'gradestructures'.
    
    Format MongoDB:
    {
      "courseCode": "DTE-IS 102",
      "columns": [
        {"key": "attend", "weight": 10},    # weight là % (10%)
        {"key": "final", "weight": 55},     # weight là % (55%)
        ...
      ],
      "isActive": true
    }
    
    Chuyển đổi thành format:
    {
      "DTE-IS 102": {
        "attend": 0.10,   # chuyển về thập phân
        "final": 0.55,
        ...
      }
    }
    """
    try:
        db = mongo_client[MONGODB_DB_NAME]
        collection = db[MONGODB_COLLECTION]
        
        # Chỉ lấy grade structures đang active
        cursor = collection.find({"isActive": True})
        
        weights_by_course: Dict[str, Dict[str, float]] = {}
        
        for doc in cursor:
            course_code = doc.get("courseCode", "").strip()
            if not course_code:
                continue
            
            columns = doc.get("columns", [])
            if not columns:
                continue
            
            # Initialize course weights nếu chưa có
            if course_code not in weights_by_course:
                weights_by_course[course_code] = {}
            
            # Extract weights từ columns
            for col in columns:
                key = col.get("key", "").strip()
                weight_percent = col.get("weight", 0)  # weight là % (0-100)
                
                if key:
                    # Chuyển từ % sang thập phân (55% -> 0.55)
                    weight_decimal = weight_percent / 100.0
                    
                    # Map key về canonical name nếu cần
                    canonical_key = find_canonical_for_raw(key) or key
                    
                    # Cộng dồn nếu trùng key (giống logic CSV)
                    weights_by_course[course_code][canonical_key] = \
                        weights_by_course[course_code].get(canonical_key, 0.0) + weight_decimal
        
        print(f"[INFO] Đã load weights từ MongoDB cho {len(weights_by_course)} courses.")
        return weights_by_course
        
    except Exception as e:
        print(f"[ERROR] Lỗi khi load weights từ MongoDB: {e}")
        return {}


def load_weights(weights_file: str) -> Dict[str, Dict[str, float]]:
    """
    Load weights từ CSV file (fallback nếu MongoDB fail).
    """
    if not os.path.exists(weights_file):
        print("[WARN] Không tìm thấy weights_used.csv, sẽ không dùng baseline theo weights.")
        return {}

    wdf = pd.read_csv(weights_file)
    if not {"course_code", "component", "weight"}.issubset(set(wdf.columns)):
        print("[WARN] weights_used.csv không có cột (course_code, component, weight) đúng format.")
        return {}

    wdf["course_code"] = wdf["course_code"].astype(str).str.strip()
    wdf["component_norm"] = wdf["component"].apply(find_canonical_for_raw)
    wdf = wdf[~wdf["component_norm"].isna()].copy()

    weights_by_course: Dict[str, Dict[str, float]] = {}
    for _, row in wdf.iterrows():
        course = row["course_code"]
        comp = row["component_norm"]
        weight = float(row["weight"])
        if course not in weights_by_course:
            weights_by_course[course] = {}
        weights_by_course[course][comp] = weights_by_course[course].get(comp, 0.0) + weight

    print(f"[INFO] Đã load weights từ CSV cho {len(weights_by_course)} courses.")
    return weights_by_course


def add_baseline_from_weights(df: pd.DataFrame,
                              weights_by_course: Dict[str, Dict[str, float]]) -> pd.DataFrame:
    df = df.copy()
    df["baseline_final_weighted"] = np.nan

    if not weights_by_course:
        return df

    df["course_code_norm"] = df["course_code"].astype(str).str.strip()

    for course, comp_weights in weights_by_course.items():
        mask_course = df["course_code_norm"] == course
        if not mask_course.any():
            continue
        idx = df.index[mask_course]
        baseline = pd.Series(0.0, index=idx)

        for comp, w in comp_weights.items():
            if comp == TARGET_COL:
                continue
            if comp in df.columns:
                baseline += df.loc[idx, comp].astype(float).fillna(0.0) * w

        df.loc[idx, "baseline_final_weighted"] = baseline

    df = df.drop(columns=["course_code_norm"])
    return df


# =============================
# 4.5. (OPTIONAL) Build course_profile – hiện tại không dùng
# =============================

def build_course_profile(behavior_path: str) -> pd.DataFrame:
    """
    Hàm này hiện tại KHÔNG được gọi trong load_resources.
    Để dành cho tương lai nếu muốn auto build behavior theo course_code.
    """
    if not os.path.exists(behavior_path):
        print(f"[WARN] Không tìm thấy behavior file: {behavior_path}")
        return pd.DataFrame(columns=["course_code"] + BEHAVIOR_FEATURE_BY_COURSE)

    df_beh = pd.read_csv(behavior_path)

    behavior_cols_raw = [
        "weekly_study_hours",
        "part_time_hours",
        "financial_support",
        "emotional_support",
    ]

    for c in behavior_cols_raw:
        if c not in df_beh.columns:
            raise RuntimeError(f"Thiếu cột '{c}' trong behavior file: {behavior_path}")

    for c in behavior_cols_raw:
        df_beh[c] = pd.to_numeric(df_beh[c], errors="coerce")

    course_profile = (
        df_beh
        .groupby("course_code")[behavior_cols_raw]
        .mean()
        .reset_index()
    )

    rename_map = {
        "weekly_study_hours": "weekly_study_hours_by_course",
        "part_time_hours": "part_time_hours_by_course",
        "financial_support": "financial_support_by_course",
        "emotional_support": "emotional_support_by_course",
    }
    course_profile = course_profile.rename(columns=rename_map)

    print("[INFO] Đã build course_profile từ behavior file.")
    print("[INFO] Số course_code trong profile:", course_profile.shape[0])

    return course_profile


def add_behavior_features_from_profile(
    df: pd.DataFrame,
    course_profile_scaled: Optional[pd.DataFrame]
) -> pd.DataFrame:
    """
    LEFT JOIN các behavior feature theo course_code vào df.
    Hiện tại chỉ dùng nếu course_profile_scaled không None & không empty.
    """
    if course_profile_scaled is None or course_profile_scaled.empty:
        return df

    df = df.merge(course_profile_scaled, on="course_code", how="left")
    return df


# =============================
# 5. Chuẩn hóa 1 file course (từ DataFrame) – giống notebook
# =============================

def process_course_df(df_raw: pd.DataFrame) -> pd.DataFrame:
    """
    Chuẩn hóa DataFrame giống notebook:
    - drop Unnamed
    - normalize col names
    - map alias
    - quiz1+quiz2 -> quiz, homework1+homework2 -> homework
    - tạo mask
    - loại dòng quá "rác"
    """
    df_raw = df_raw.copy()

    # Drop cột Unnamed
    unnamed_cols = [c for c in df_raw.columns if normalize_col_name(c).startswith("unnamed")]
    if unnamed_cols:
        df_raw = df_raw.drop(columns=unnamed_cols)

    # Normalize tên cột
    original_cols = list(df_raw.columns)
    col_norm_map = {c: normalize_col_name(c) for c in original_cols}
    df_raw = df_raw.rename(columns=col_norm_map)

    # Map alias student_id, course_code, no
    if "student_id" not in df_raw.columns:
        for c in list(df_raw.columns):
            if find_canonical_for_raw(c) == "student_id":
                df_raw = df_raw.rename(columns={c: "student_id"})
                break

    if "course_code" not in df_raw.columns:
        for c in list(df_raw.columns):
            if find_canonical_for_raw(c) == "course_code":
                df_raw = df_raw.rename(columns={c: "course_code"})
                break

    if "no" not in df_raw.columns:
        for c in list(df_raw.columns):
            if find_canonical_for_raw(c) == "no":
                df_raw = df_raw.rename(columns={c: "no"})
                break

    # student_id -> string
    if "student_id" in df_raw.columns:
        df_raw["student_id"] = df_raw["student_id"].astype(str)
    else:
        df_raw["student_id"] = df_raw.index.astype(str)

    # course_code: nếu không có thì set default
    if "course_code" not in df_raw.columns:
        df_raw["course_code"] = "UNKNOWN_COURSE"

    # Tạo df_out với schema chung
    df_out = pd.DataFrame(index=df_raw.index)
    df_out["student_id"] = df_raw["student_id"]
    df_out["course_code"] = df_raw["course_code"]
    df_out["no"] = df_raw["no"] if "no" in df_raw.columns else np.arange(len(df_raw)) + 1

    course_has_feature = {f: False for f in CANONICAL_FEATURES}
    temp_feature_cols: Dict[str, str] = {}

    for raw_col in df_raw.columns:
        canonical = find_canonical_for_raw(raw_col)
        if canonical in CANONICAL_FEATURES:
            temp_feature_cols[canonical] = raw_col
            course_has_feature[canonical] = True

    # quiz1+quiz2, homework1+homework2 -> quiz, homework
    if "quiz1" in df_raw.columns and "quiz2" in df_raw.columns:
        q1 = pd.to_numeric(df_raw["quiz1"], errors="coerce")
        q2 = pd.to_numeric(df_raw["quiz2"], errors="coerce")
        df_out["quiz"] = pd.concat([q1, q2], axis=1).mean(axis=1)
        course_has_feature["quiz"] = True

    if "homework1" in df_raw.columns and "homework2" in df_raw.columns:
        hw1 = pd.to_numeric(df_raw["homework1"], errors="coerce")
        hw2 = pd.to_numeric(df_raw["homework2"], errors="coerce")
        df_out["homework"] = pd.concat([hw1, hw2], axis=1).mean(axis=1)
        course_has_feature["homework"] = True

    # Copy từ raw -> canonical
    for feat in CANONICAL_FEATURES:
        if feat in df_out.columns:
            continue
        if feat in temp_feature_cols:
            raw_col = temp_feature_cols[feat]
            df_out[feat] = pd.to_numeric(df_raw[raw_col], errors="coerce")
        else:
            df_out[feat] = np.nan

    # Mask
    for feat in CANONICAL_FEATURES:
        mask_col = f"{feat}_mask"
        if course_has_feature[feat]:
            df_out[mask_col] = 1
        else:
            df_out[mask_col] = 0

    # Preserve behavior features nếu có trong df_raw (QUAN TRỌNG!)
    for behavior_feat in BEHAVIOR_FEATURE_BY_COURSE:
        if behavior_feat in df_raw.columns:
            df_out[behavior_feat] = pd.to_numeric(df_raw[behavior_feat], errors="coerce")

    # Loại dòng quá ít điểm (non-null < 2 trong toàn bộ features + final)
    non_null_count = df_out[CANONICAL_FEATURES].notnull().sum(axis=1)
    df_out = df_out[non_null_count >= 2].reset_index(drop=True)

    return df_out


# =============================
# 6. Build X cho inference từ df đã chuẩn hóa
# =============================

def build_X_from_df_for_inference(
    df: pd.DataFrame,
    artifacts: dict,
    weights_by_course: Dict[str, Dict[str, float]],
    course_profile_scaled: Optional[pd.DataFrame]
) -> (pd.DataFrame, pd.DataFrame):
    """
    - Tính baseline từ weights
    - KHÔNG auto gắn behavior từ clean_student_data_v1.csv.
      Nếu input đã có sẵn behavior (đúng tên feature_cols) thì dùng, ngược lại để NaN.
    - SCALE behavior features bằng scaler_behavior từ artifacts (QUAN TRỌNG!)
    - Bắt buộc đảm bảo đủ feature_cols trước khi build X.
    """
    feature_cols = artifacts["feature_cols"]
    mask_cols = artifacts["mask_cols"]
    course_dummy_cols = artifacts["course_dummy_cols"]
    baseline_fill_value = artifacts.get("baseline_fill_value", 5.0)
    scaler_behavior = artifacts.get("scaler_behavior", None)
    behavior_feature_cols = artifacts.get("behavior_feature_cols", BEHAVIOR_FEATURE_BY_COURSE)

    # 1) baseline từ weights
    df = add_baseline_from_weights(df, weights_by_course)

    if "baseline_final_weighted" not in df.columns:
        df["baseline_final_weighted"] = np.nan

    df["baseline_final_weighted"] = df["baseline_final_weighted"].fillna(baseline_fill_value)

    # 2) behavior feature: KHÔNG auto merge từ course_profile_scaled nữa.
    #    Chỉ merge nếu bạn chủ động truyền profile đã scale (future use).
    if course_profile_scaled is not None and not course_profile_scaled.empty:
        df = add_behavior_features_from_profile(df, course_profile_scaled)

    # 3) Đảm bảo tất cả feature_cols tồn tại (đặc biệt là behavior feature)
    for col in feature_cols:
        if col not in df.columns:
            df[col] = np.nan

    # 3.5) QUAN TRỌNG: Scale behavior features nếu có scaler
    if scaler_behavior is not None and behavior_feature_cols:
        behavior_raw = df[behavior_feature_cols].fillna(0.0)
        df[behavior_feature_cols] = scaler_behavior.transform(behavior_raw)
        print(f"[INFO] Đã scale {len(behavior_feature_cols)} behavior features")

    # 4) Numeric features
    X_num = df[feature_cols + mask_cols + ["baseline_final_weighted"]].copy()
    X_num = X_num.fillna(0.0)

    # 5) One-hot course
    course_dummies_new = pd.get_dummies(df["course_code"], prefix="course")

    for col in course_dummy_cols:
        if col not in course_dummies_new.columns:
            course_dummies_new[col] = 0
    course_dummies_new = course_dummies_new[course_dummy_cols]

    X_new = pd.concat([X_num, course_dummies_new], axis=1)
    return df, X_new


# =============================
# 6b. Fallback theo course R2 (giống notebook 8b)
# =============================

COURSE_R2_GB: Dict[str, float] = {}

def apply_fallback_with_course_r2(
    df_features: pd.DataFrame,
    pred_gb: np.ndarray
) -> pd.DataFrame:
    """
    Áp dụng fallback logic:
    - HIGH_R2: dùng model
    - MID_R2: blend model & baseline
    - LOW_R2 / course mới: dùng baseline
    """
    df = df_features.copy()
    df["pred_final_gb"] = pred_gb

    # Đảm bảo baseline có sẵn (build_X đã fill)
    if "baseline_final_weighted" not in df.columns:
        df["baseline_final_weighted"] = np.nan
    if df["baseline_final_weighted"].isna().all():
        # fallback rất an toàn nếu vì lý do gì baseline toàn NaN
        df["baseline_final_weighted"] = 5.0

    # Map course_R2_gb
    df["course_R2_gb"] = df["course_code"].map(COURSE_R2_GB)
    df["course_R2_gb"] = df["course_R2_gb"].fillna(-999)

    df["final_pred"] = np.nan
    df["pred_source"] = "unknown"
    df["confidence_level"] = "unknown"

    mask_high = df["course_R2_gb"] >= HIGH_R2
    mask_mid = (df["course_R2_gb"] >= MID_R2) & (df["course_R2_gb"] < HIGH_R2)
    mask_low = df["course_R2_gb"] < MID_R2

    # HIGH: dùng thẳng model
    df.loc[mask_high, "final_pred"] = df.loc[mask_high, "pred_final_gb"]
    df.loc[mask_high, "pred_source"] = "gb_model"
    df.loc[mask_high, "confidence_level"] = "high"

    # MID: blend model & baseline
    blend_mid = (
        BLEND_ALPHA * df.loc[mask_mid, "pred_final_gb"] +
        (1 - BLEND_ALPHA) * df.loc[mask_mid, "baseline_final_weighted"]
    )
    df.loc[mask_mid, "final_pred"] = blend_mid
    df.loc[mask_mid, "pred_source"] = "gb_baseline_blend"
    df.loc[mask_mid, "confidence_level"] = "medium"

    # LOW: fallback baseline
    df.loc[mask_low, "final_pred"] = df.loc[mask_low, "baseline_final_weighted"]
    df.loc[mask_low, "pred_source"] = "baseline_only"
    df.loc[mask_low, "confidence_level"] = "low"

    return df


# =============================
# 7. Load model artifacts & weights khi server start
# =============================

app = FastAPI(title="Final Score Prediction API", version="2.2.0")

ARTIFACTS: dict = {}
WEIGHTS_BY_COURSE: Dict[str, Dict[str, float]] = {}
SHAP_EXPLAINER = None  # TreeExplainer cho gb_model
COURSE_PROFILE_SCALED: Optional[pd.DataFrame] = None
MONGO_CLIENT: Optional[MongoClient] = None  # MongoDB client


@app.on_event("startup")
def load_resources():
    global ARTIFACTS, WEIGHTS_BY_COURSE, SHAP_EXPLAINER, COURSE_PROFILE_SCALED, COURSE_R2_GB, MONGO_CLIENT

    if not os.path.exists(ARTIFACTS_PATH):
        raise RuntimeError(f"Không tìm thấy artifacts: {ARTIFACTS_PATH}")

    ARTIFACTS = joblib.load(ARTIFACTS_PATH)
    print("[INFO] Đã load model artifacts:", ARTIFACTS.keys())

    # Kết nối MongoDB
    try:
        MONGO_CLIENT = MongoClient(MONGODB_URI, serverSelectionTimeoutMS=5000)
        # Test connection
        MONGO_CLIENT.server_info()
        print(f"[INFO] Đã kết nối MongoDB: {MONGODB_URI}")
        
        # Load weights từ MongoDB
        WEIGHTS_BY_COURSE = load_weights_from_mongodb(MONGO_CLIENT)
        
        # Fallback to CSV nếu MongoDB không có data
        if not WEIGHTS_BY_COURSE:
            print("[WARN] MongoDB không có weights, fallback sang CSV...")
            WEIGHTS_BY_COURSE = load_weights(WEIGHTS_FILE)
            
    except Exception as e:
        print(f"[ERROR] Không thể kết nối MongoDB: {e}")
        print("[WARN] Fallback sang CSV...")
        MONGO_CLIENT = None
        WEIGHTS_BY_COURSE = load_weights(WEIGHTS_FILE)

    # Behavior: KHÔNG auto build từ clean_student_data_v1.csv nữa
    COURSE_PROFILE_SCALED = None
    print("[INFO] Behavior features sẽ lấy từ input (nếu có), "
          "không auto gán từ clean_student_data_v1.csv.")

    # Load course metrics để fallback theo R2
    COURSE_R2_GB = {}
    if os.path.exists(COURSE_METRICS_PATH):
        try:
            df_metrics = pd.read_csv(COURSE_METRICS_PATH)
            if {"course_code", "R2"}.issubset(df_metrics.columns):
                COURSE_R2_GB = df_metrics.set_index("course_code")["R2"].to_dict()
                print("[INFO] Đã load course R2 metrics cho", len(COURSE_R2_GB), "course.")
            else:
                print("[WARN] course_metrics_gradient_boosting_update.csv không có cột (course_code, R2).")
        except Exception as e:
            print(f"[WARN] Lỗi khi load course_metrics_gradient_boosting_update.csv: {e}")
    else:
        print("[WARN] Không tìm thấy course_metrics_gradient_boosting_update.csv; "
              "fallback sẽ coi tất cả course là low-confidence.")

    # Khởi tạo SHAP TreeExplainer cho GradientBoosting
    try:
        gb_model = ARTIFACTS["gb_model"]
        SHAP_EXPLAINER = shap.TreeExplainer(gb_model)
        print("[INFO] Đã khởi tạo SHAP TreeExplainer cho gb_model.")
    except Exception as e:
        SHAP_EXPLAINER = None
        print(f"[WARN] Không khởi tạo được SHAP explainer: {e}")


@app.on_event("shutdown")
def shutdown_resources():
    """Đóng MongoDB connection khi server shutdown"""
    global MONGO_CLIENT
    if MONGO_CLIENT:
        MONGO_CLIENT.close()
        print("[INFO] Đã đóng MongoDB connection.")


# =============================
# 8. Endpoints
# =============================

@app.get("/health")
def health_check():
    return {"status": "ok"}


@app.post("/predict_csv")
async def predict_from_csv(file: UploadFile = File(...)):
    """
    Upload 1 file CSV điểm (giống các file training).
    Trả về list prediction cho từng sinh viên.
    Áp dụng fallback theo course R2 giống notebook.
    Behavior features:
      - Nếu input có sẵn (đã merge sau khảo sát) và trùng tên feature_cols -> model dùng.
      - Nếu không có -> để NaN -> fillna(0) khi build X (coi như “không thông tin”).
    """
    if not ARTIFACTS:
        raise HTTPException(status_code=500, detail="Model chưa được load.")

    # Đọc file vào DataFrame
    try:
        content = await file.read()
        df_raw = pd.read_csv(io.BytesIO(content))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Lỗi đọc CSV: {str(e)}")

    if df_raw.empty:
        raise HTTPException(status_code=400, detail="File CSV rỗng.")

    # Chuẩn hóa giống notebook
    df_course = process_course_df(df_raw)

    # Build X_new
    df_features, X_new = build_X_from_df_for_inference(
        df_course,
        artifacts=ARTIFACTS,
        weights_by_course=WEIGHTS_BY_COURSE,
        course_profile_scaled=COURSE_PROFILE_SCALED,
    )

    # Lấy model GB từ artifacts và dự đoán
    gb_model = ARTIFACTS["gb_model"]
    pred_gb = gb_model.predict(X_new)
    pred_gb = np.clip(pred_gb, 0.0, 10.0)

    # Áp dụng fallback theo course R2
    df_final = apply_fallback_with_course_r2(df_features, pred_gb)

    # Chuẩn bị output JSON gọn gàng
    records = []
    for _, row in df_final.iterrows():
        records.append({
            "student_id": row.get("student_id"),
            "course_code": row.get("course_code"),
            "no": row.get("no"),
            "final_pred": float(row.get("final_pred")) if not pd.isna(row.get("final_pred")) else None,
            "pred_final_gb": float(row.get("pred_final_gb")) if not pd.isna(row.get("pred_final_gb")) else None,
            "baseline_final_weighted": float(row.get("baseline_final_weighted")) if not pd.isna(row.get("baseline_final_weighted")) else None,
            "pred_source": row.get("pred_source"),
            "confidence_level": row.get("confidence_level"),
        })

    return JSONResponse(content={"n": len(records), "predictions": records})


@app.post("/predict_json")
async def predict_from_json(payload: PredictJSONRequest):
    """
    Nhận JSON:
    {
      "course_code": "DTE-IS 102",   # optional, nếu từng row không có course_code
      "rows": [
        {
          "student_id": "28211280315",
          "no": 1,
          "attend": 8.0,
          "quiz1": 7.5,
          "quiz2": 8.0,
          "midterm": 6.5,
          "project": 8.0,
          // optional: behavior feature nếu có, ví dụ:
          // "weekly_study_hours_by_course": 1.2,
          // "part_time_hours_by_course": -0.3,
          // ...
        },
        ...
      ]
    }
    Trả về prediction cho từng sinh viên, dùng cùng pipeline như /predict_csv.
    """
    if not ARTIFACTS:
        raise HTTPException(status_code=500, detail="Model chưa được load.")

    if not payload.rows:
        raise HTTPException(status_code=400, detail="rows rỗng.")

    # Convert list[dict] -> DataFrame
    df_raw = pd.DataFrame(payload.rows)

    # Nếu top-level có course_code mà df_raw chưa có cột này -> gán cho tất cả
    if payload.course_code is not None and "course_code" not in df_raw.columns:
        df_raw["course_code"] = payload.course_code

    if df_raw.empty:
        raise HTTPException(status_code=400, detail="DataFrame rỗng sau khi parse JSON.")

    # Chuẩn hóa giống notebook
    df_course = process_course_df(df_raw)

    # Build X_new
    df_features, X_new = build_X_from_df_for_inference(
        df_course,
        artifacts=ARTIFACTS,
        weights_by_course=WEIGHTS_BY_COURSE,
        course_profile_scaled=COURSE_PROFILE_SCALED,
    )

    # Dự đoán bằng GradientBoosting
    gb_model = ARTIFACTS["gb_model"]
    pred_gb = gb_model.predict(X_new)
    pred_gb = np.clip(pred_gb, 0.0, 10.0)

    # Áp dụng fallback
    df_final = apply_fallback_with_course_r2(df_features, pred_gb)

    # Chuẩn bị output JSON
    records = []
    for _, row in df_final.iterrows():
        records.append({
            "student_id": row.get("student_id"),
            "course_code": row.get("course_code"),
            "no": row.get("no"),
            "final_pred": float(row.get("final_pred")) if not pd.isna(row.get("final_pred")) else None,
            "pred_final_gb": float(row.get("pred_final_gb")) if not pd.isna(row.get("pred_final_gb")) else None,
            "baseline_final_weighted": float(row.get("baseline_final_weighted")) if not pd.isna(row.get("baseline_final_weighted")) else None,
            "pred_source": row.get("pred_source"),
            "confidence_level": row.get("confidence_level"),
        })

    return JSONResponse(content={"n": len(records), "predictions": records})


@app.post("/explain_json")
async def explain_from_json(payload: ExplainJSONRequest):
    """
    XAI cho giảng viên: giải thích prediction theo SHAP với caching.

    Request:
    {
      "course_code": "DTE-IS 102",   # optional
      "top_k": 8,                    # optional, default = 8
      "rows": [
        {
          "student_id": "28211280315",
          "no": 1,
          "attend": 8.0,
          "quiz1": 7.5,
          "quiz2": 8.0,
          "midterm": 6.5,
          "project": 8.0,
          // optional: behavior feature nếu có
        },
        ...
      ]
    }
    
    OPTIMIZATION: Cache SHAP results by request hash để tránh tính lại
    """
    if not ARTIFACTS:
        raise HTTPException(status_code=500, detail="Model chưa được load.")

    if not payload.rows:
        raise HTTPException(status_code=400, detail="rows rỗng.")

    top_k = payload.top_k or 8

    # Generate cache key from request data
    request_str = f"{payload.course_code}_{top_k}_{len(payload.rows)}"
    for row in payload.rows[:3]:  # Hash first 3 rows for key
        request_str += f"_{row.get('student_id', '')}_{row.get('attend', '')}_{row.get('midterm', '')}"
    
    cache_key = f"shap_{hashlib.md5(request_str.encode()).hexdigest()}"
    
    # Check cache first
    cached_result = SHAP_CACHE.get(cache_key)
    if cached_result is not None:
        return JSONResponse(content=cached_result)

    # Convert list[dict] -> DataFrame
    df_raw = pd.DataFrame(payload.rows)

    # Gán course_code từ top-level nếu thiếu
    if payload.course_code is not None and "course_code" not in df_raw.columns:
        df_raw["course_code"] = payload.course_code

    if df_raw.empty:
        raise HTTPException(status_code=400, detail="DataFrame rỗng sau khi parse JSON.")

    # 1) Chuẩn hóa giống notebook
    df_course = process_course_df(df_raw)

    # 2) Build X_new giống hệt pipeline inference
    df_features, X_new = build_X_from_df_for_inference(
        df_course,
        artifacts=ARTIFACTS,
        weights_by_course=WEIGHTS_BY_COURSE,
        course_profile_scaled=COURSE_PROFILE_SCALED,
    )

    # 3) Predict final trực tiếp bằng GradientBoosting
    #    (không áp dụng fallback để SHAP giải thích model thuần)
    gb_model = ARTIFACTS["gb_model"]
    y_pred = gb_model.predict(X_new)
    y_pred = np.clip(y_pred, 0.0, 10.0)

    df_features["final_pred"] = y_pred

    # 4) Tính SHAP values
    explainer = SHAP_EXPLAINER or shap.TreeExplainer(gb_model)
    shap_values = explainer.shap_values(X_new)   # shape: (n_samples, n_features)
    feature_names = list(X_new.columns)

    explanations = []
    for i in range(X_new.shape[0]):
        row_vals = X_new.iloc[i].values
        row_shap = shap_values[i]

        feats = []
        for fname, fval, sval in zip(feature_names, row_vals, row_shap):
            feats.append({
                "feature": fname,
                "value": float(fval),
                "shap_value": float(sval)
            })

        feats_sorted = sorted(
            feats,
            key=lambda d: abs(d["shap_value"]),
            reverse=True
        )[:top_k]

        explanations.append({
            "student_id": str(df_features.iloc[i].get("student_id")),
            "course_code": str(df_features.iloc[i].get("course_code")),
            "no": int(df_features.iloc[i].get("no")),
            "final_pred": float(df_features.iloc[i]["final_pred"]),
            "baseline_final_weighted": float(
                df_features.iloc[i].get("baseline_final_weighted", np.nan)
            ) if not pd.isna(df_features.iloc[i].get("baseline_final_weighted", np.nan)) else None,
            "top_features": feats_sorted
        })

    result = {
        "n": len(explanations),
        "model": "GradientBoostingRegressor",
        "top_k": top_k,
        "explanations": explanations
    }
    
    # Cache result for future requests
    SHAP_CACHE.set(cache_key, result)
    
    return JSONResponse(content=result)


@app.get("/cache/stats")
def get_cache_stats():
    """Endpoint để monitor cache status"""
    return JSONResponse(content={
        "shap_cache": SHAP_CACHE.get_stats()
    })


@app.post("/cache/clear")
def clear_cache():
    """Endpoint để clear cache (admin only in production)"""
    SHAP_CACHE.clear()
    return JSONResponse(content={"success": True, "message": "Cache cleared"})


if __name__ == "__main__":
    # Chạy: python predictscoreforteacheraddfeature.py
    uvicorn.run(
        "predictscoreforteacheraddfeature:app",
        host=APP_HOST,
        port=APP_PORT,
        workers=ML_WORKERS,
        reload=False,
    )
