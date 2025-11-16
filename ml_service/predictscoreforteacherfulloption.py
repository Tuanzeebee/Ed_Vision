from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Dict, List, Optional, Any
import uvicorn

import os
import re
import io

import numpy as np
import pandas as pd
import joblib

# XAI
import shap  # pip install shap

# =============================
# 1. Config đường dẫn
# =============================

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

DATA_DIR = os.path.join(BASE_DIR, "data")  # nơi chứa weights_used.csv
OUTPUT_DIR = os.path.join(BASE_DIR, "output_final_v2")  # nơi chứa model_artifacts_gb_rf.joblib

ARTIFACTS_PATH = os.path.join(OUTPUT_DIR, "model_artifacts_gb_rf_update.joblib")
WEIGHTS_FILE = os.path.join(DATA_DIR, "weights_used.csv")

# =============================
# 2. Schema & alias (giống notebook)
# =============================

TARGET_COL = "final"

FEATURE_SCORE_COLS = [
    "attend",
    "quiz",
    "quiz1",
    "quiz2",
    "midterm",
    "homework",
    "homework1",
    "homework2",
    "group_project",
    "individual_project",
    "practice",
    "regular",
    "speech_and_discussion",
    "project"
]

CANONICAL_FEATURES = FEATURE_SCORE_COLS + [TARGET_COL]

COLUMN_ALIASES: Dict[str, List[str]] = {
    "no": ["no", "No"],
    "student_id": ["student id", "student_id", "id"],
    "course_code": ["course_code", "course code", "course"],

    "attend": ["attend", "attendance"],
    "quiz": ["quiz"],
    "quiz1": ["quiz1"],
    "quiz2": ["quiz2"],
    "homework": ["homework", "hw", "assignment"],
    "homework1": ["homework1", "hw1"],
    "homework2": ["homework2", "hw2"],
    "midterm": ["midterm", "mid term"],
    "group_project": ["group project", "group_project"],
    "individual_project": ["individual project", "individual_project"],
    "practice": ["practice", "lab", "exercise"],
    "regular": ["regular", "participation", "classwork"],
    "speech_and_discussion": ["speech and discussion", "speech_and_discussion"],
    "project": ["project"],
    "final": ["final", "final_exam"]
}

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
# 4. Load weights_used.csv
# =============================

def load_weights(weights_file: str) -> Dict[str, Dict[str, float]]:
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

    print(f"[INFO] Đã load weights cho {len(weights_by_course)} course.")
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
# 5. Chuẩn hóa 1 file course (từ DataFrame)
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

    # quiz1+quiz2, homework1+homework2
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
    weights_by_course: Dict[str, Dict[str, float]]
) -> (pd.DataFrame, pd.DataFrame):
    feature_cols = artifacts["feature_cols"]
    mask_cols = artifacts["mask_cols"]
    course_dummy_cols = artifacts["course_dummy_cols"]
    baseline_fill_value = artifacts.get("baseline_fill_value", 5.0)

    # baseline từ weights
    df = add_baseline_from_weights(df, weights_by_course)

    if "baseline_final_weighted" not in df.columns:
        df["baseline_final_weighted"] = np.nan

    df["baseline_final_weighted"] = df["baseline_final_weighted"].fillna(baseline_fill_value)

    # Numeric features
    X_num = df[feature_cols + mask_cols + ["baseline_final_weighted"]].copy()
    X_num = X_num.fillna(0.0)

    # One-hot course
    course_dummies_new = pd.get_dummies(df["course_code"], prefix="course")

    for col in course_dummy_cols:
        if col not in course_dummies_new.columns:
            course_dummies_new[col] = 0
    course_dummies_new = course_dummies_new[course_dummy_cols]

    X_new = pd.concat([X_num, course_dummies_new], axis=1)
    return df, X_new


# =============================
# 7. Load model artifacts & weights khi server start
# =============================

app = FastAPI(title="Final Score Prediction API", version="1.0.0")

ARTIFACTS: dict = {}
WEIGHTS_BY_COURSE: Dict[str, Dict[str, float]] = {}
SHAP_EXPLAINER = None  # TreeExplainer cho gb_model


@app.on_event("startup")
def load_resources():
    global ARTIFACTS, WEIGHTS_BY_COURSE, SHAP_EXPLAINER

    if not os.path.exists(ARTIFACTS_PATH):
        raise RuntimeError(f"Không tìm thấy artifacts: {ARTIFACTS_PATH}")

    ARTIFACTS = joblib.load(ARTIFACTS_PATH)
    print("[INFO] Đã load model artifacts:", ARTIFACTS.keys())

    WEIGHTS_BY_COURSE = load_weights(WEIGHTS_FILE)

    # Khởi tạo SHAP TreeExplainer cho GradientBoosting
    try:
        gb_model = ARTIFACTS["gb_model"]
        SHAP_EXPLAINER = shap.TreeExplainer(gb_model)
        print("[INFO] Đã khởi tạo SHAP TreeExplainer cho gb_model.")
    except Exception as e:
        SHAP_EXPLAINER = None
        print(f"[WARN] Không khởi tạo được SHAP explainer: {e}")


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
    Luôn dùng pred_final_gb (GradientBoosting) làm final_pred.
    """
    if ARTIFACTS == {}:
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
        weights_by_course=WEIGHTS_BY_COURSE
    )

    # Lấy model GB từ artifacts và dự đoán
    gb_model = ARTIFACTS["gb_model"]
    pred_gb = gb_model.predict(X_new)
    pred_gb = np.clip(pred_gb, 0.0, 10.0)

    # Gán thẳng final_pred = pred_final_gb
    df_features["pred_final_gb"] = pred_gb
    df_features["final_pred"] = pred_gb
    df_features["pred_source"] = "gb_model"
    df_features["confidence_level"] = "high"

    # Chuẩn bị output JSON gọn gàng
    records = []
    for _, row in df_features.iterrows():
        records.append({
            "student_id": row.get("student_id"),
            "course_code": row.get("course_code"),
            "no": row.get("no"),
            "final_pred": float(row.get("final_pred")) if not pd.isna(row.get("final_pred")) else None,
            "pred_final_gb": float(row.get("pred_final_gb")) if not pd.isna(row.get("pred_final_gb")) else None,
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
          "project": 8.0
        },
        ...
      ]
    }
    Trả về prediction cho từng sinh viên, dùng cùng pipeline như /predict_csv.
    """
    if ARTIFACTS == {}:
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
        weights_by_course=WEIGHTS_BY_COURSE
    )

    # Dự đoán bằng GradientBoosting
    gb_model = ARTIFACTS["gb_model"]
    pred_gb = gb_model.predict(X_new)
    pred_gb = np.clip(pred_gb, 0.0, 10.0)

    df_features["pred_final_gb"] = pred_gb
    df_features["final_pred"] = pred_gb
    df_features["pred_source"] = "gb_model"
    df_features["confidence_level"] = "high"

    # Chuẩn bị output JSON
    records = []
    for _, row in df_features.iterrows():
        records.append({
            "student_id": row.get("student_id"),
            "course_code": row.get("course_code"),
            "no": row.get("no"),
            "final_pred": float(row.get("final_pred")) if not pd.isna(row.get("final_pred")) else None,
            "pred_source": row.get("pred_source"),
            "confidence_level": row.get("confidence_level"),
        })

    return JSONResponse(content={"n": len(records), "predictions": records})


@app.post("/explain_json")
async def explain_from_json(payload: ExplainJSONRequest):
    """
    XAI endpoint:
    - Input giống /predict_json, thêm tham số top_k (số feature cần giải thích).
    - Output: prediction + top_k features theo SHAP cho từng sinh viên.
    """
    if ARTIFACTS == {}:
        raise HTTPException(status_code=500, detail="Model chưa được load.")

    if not payload.rows:
        raise HTTPException(status_code=400, detail="rows rỗng.")

    if payload.top_k <= 0:
        raise HTTPException(status_code=400, detail="top_k phải > 0.")

    # Convert list[dict] -> DataFrame
    df_raw = pd.DataFrame(payload.rows)

    # Nếu có course_code chung mà thiếu trong từng row -> gán
    if payload.course_code is not None and "course_code" not in df_raw.columns:
        df_raw["course_code"] = payload.course_code

    if df_raw.empty:
        raise HTTPException(status_code=400, detail="DataFrame rỗng sau khi parse JSON.")

    # Chuẩn hóa
    df_course = process_course_df(df_raw)

    # Build X
    df_features, X_new = build_X_from_df_for_inference(
        df_course,
        artifacts=ARTIFACTS,
        weights_by_course=WEIGHTS_BY_COURSE
    )

    gb_model = ARTIFACTS["gb_model"]
    pred_gb = gb_model.predict(X_new)
    pred_gb = np.clip(pred_gb, 0.0, 10.0)

    # Chọn explainer: ưu tiên dùng SHAP_EXPLAINER global
    global SHAP_EXPLAINER
    explainer = SHAP_EXPLAINER
    if explainer is None:
        # fallback: tạo mới (ít khi xảy ra nếu startup đã ok)
        explainer = shap.TreeExplainer(gb_model)

    shap_values = explainer.shap_values(X_new)  # shape: (n_samples, n_features)
    feature_names = list(X_new.columns)

    explanations = []
    top_k = payload.top_k

    for i, (idx, row) in enumerate(df_features.iterrows()):
        row_shap = shap_values[i]
        row_feat_vals = X_new.iloc[i]

        # Sắp xếp theo |shap_value| giảm dần
        order = np.argsort(np.abs(row_shap))[::-1]
        top_idx = order[:top_k]

        top_features = []
        for j in top_idx:
            fname = feature_names[j]
            fval = float(row_feat_vals.iloc[j])
            sval = float(row_shap[j])
            top_features.append({
                "feature": fname,
                "value": fval,
                "shap_value": sval
            })

        explanations.append({
            "student_id": row.get("student_id"),
            "course_code": row.get("course_code"),
            "no": row.get("no"),
            "final_pred": float(pred_gb[i]),
            "top_features": top_features
        })

    return JSONResponse(content={
        "n": len(explanations),
        "model": "GradientBoostingRegressor",
        "top_k": top_k,
        "explanations": explanations
    })


if __name__ == "__main__":
    # Chạy: python main.py
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
