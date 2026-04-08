# predictxgboost.py
# FastAPI service for raw_score prediction using XGBoost
# Aligned with your grouped XGB + preprocessing pipeline
# Requires these files in the SAME folder (recommended):
#  - preprocessing_pipeline.joblib
#  - xgb_model.json  (preferred) OR xgb_model.joblib
#  - feature_names.npy (optional but recommended)

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
from pydantic import BaseModel
import os
import joblib
import pandas as pd
import numpy as np

from xgboost import XGBRegressor
from fastapi.concurrency import run_in_threadpool
import asyncio
import json
import hashlib
import time
from collections import OrderedDict
from typing import Optional

# ───────────────────────────────────────────────────────────────
# App
# ───────────────────────────────────────────────────────────────
app = FastAPI(title="EdVision XGBoost Service", version="1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # change in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ───────────────────────────────────────────────────────────────
# Paths (all artifacts inside one folder)
# ───────────────────────────────────────────────────────────────
ARTIFACT_DIR = os.getenv("ARTIFACT_DIR", "artifacts_xgb_v1")

PREPROCESSOR_CANDIDATES = [
    "preprocessing_pipeline.joblib",
    # fallback nếu bạn muốn giữ tên cũ
    "preprocessing_pipeline_6_12_2025_New.joblib",
]

MODEL_JSON_CANDIDATES = [
    "xgb_model.json",
]

MODEL_JOBLIB_CANDIDATES = [
    "xgb_model.joblib",
]

FEATURE_NAMES_CANDIDATES = [
    "feature_names.npy",
]

def find_first_existing(cands, base_dir=ARTIFACT_DIR):
    for name in cands:
        p = os.path.join(base_dir, name)
        if os.path.exists(p):
            return p
    return None

# Resolve paths inside ARTIFACT_DIR
PREPROCESSOR_PATH = find_first_existing(PREPROCESSOR_CANDIDATES)
if PREPROCESSOR_PATH is None:
    raise FileNotFoundError(
        f"Missing preprocessor in '{ARTIFACT_DIR}'. Expected one of: "
        + ", ".join(PREPROCESSOR_CANDIDATES)
    )

MODEL_JSON_PATH = find_first_existing(MODEL_JSON_CANDIDATES)
MODEL_JOBLIB_PATH = find_first_existing(MODEL_JOBLIB_CANDIDATES)

if MODEL_JSON_PATH is None and MODEL_JOBLIB_PATH is None:
    raise FileNotFoundError(
        f"Missing XGBoost model in '{ARTIFACT_DIR}'. Expected one of: "
        + ", ".join(MODEL_JSON_CANDIDATES + MODEL_JOBLIB_CANDIDATES)
    )

FEATURE_NAMES_PATH = find_first_existing(FEATURE_NAMES_CANDIDATES)

# ───────────────────────────────────────────────────────────────
# Load preprocessor
# ───────────────────────────────────────────────────────────────
preprocessor_predict: Optional[object] = None

# ───────────────────────────────────────────────────────────────
# Load model
# ───────────────────────────────────────────────────────────────
xgb_model: Optional[XGBRegressor] = None
MODEL_PATH_ACTIVE: Optional[str] = None

# ───────────────────────────────────────────────────────────────
# Load feature names (optional)
# ───────────────────────────────────────────────────────────────
feature_names = None

# ───────────────────────────────────────────────────────────────
# Infer model expected dim
# ───────────────────────────────────────────────────────────────
predict_input_dim = None

def ensure_loaded():
    global preprocessor_predict, xgb_model, MODEL_PATH_ACTIVE, feature_names, predict_input_dim
    if preprocessor_predict is None:
        preprocessor_predict = joblib.load(PREPROCESSOR_PATH)
    if xgb_model is None:
        if MODEL_JSON_PATH:
            m = XGBRegressor()
            m.load_model(MODEL_JSON_PATH)
            xgb_model = m
            MODEL_PATH_ACTIVE = MODEL_JSON_PATH
        else:
            xgb_model = joblib.load(MODEL_JOBLIB_PATH)
            MODEL_PATH_ACTIVE = MODEL_JOBLIB_PATH
        try:
            predict_input_dim = int(xgb_model.get_booster().num_features())
        except Exception:
            predict_input_dim = None
    if feature_names is None and FEATURE_NAMES_PATH:
        try:
            feature_names = np.load(FEATURE_NAMES_PATH, allow_pickle=True)
        except Exception:
            feature_names = None

class TTLCache:
    def __init__(self, maxsize: int = 10000, ttl_seconds: int = 300):
        self.store = OrderedDict()
        self.maxsize = maxsize
        self.ttl = ttl_seconds
    def get(self, key: str):
        item = self.store.get(key)
        if not item:
            return None
        value, ts = item
        if time.time() - ts > self.ttl:
            try:
                del self.store[key]
            except KeyError:
                pass
            return None
        self.store.move_to_end(key)
        return value
    def set(self, key: str, value):
        self.store[key] = (value, time.time())
        self.store.move_to_end(key)
        while len(self.store) > self.maxsize:
            self.store.popitem(last=False)

prediction_cache = TTLCache(maxsize=10000, ttl_seconds=300)
pending_map: dict[str, asyncio.Task] = {}

# ───────────────────────────────────────────────────────────────
# Helper: read required raw columns from pipeline if available
# ───────────────────────────────────────────────────────────────
def get_required_raw_columns():
    # sklearn Pipeline may expose feature_names_in_
    if hasattr(preprocessor_predict, "feature_names_in_"):
        return list(preprocessor_predict.feature_names_in_)  # type: ignore

    # sometimes stored on inner ColumnTransformer
    if hasattr(preprocessor_predict, "named_steps"):
        prep = preprocessor_predict.named_steps.get("preprocessor")  # type: ignore
        if prep is not None and hasattr(prep, "feature_names_in_"):
            return list(prep.feature_names_in_)  # type: ignore

    return None

REQUIRED_RAW_COLS = get_required_raw_columns()
if REQUIRED_RAW_COLS:
    print(f"Pipeline expects {len(REQUIRED_RAW_COLS)} raw columns.")

# ───────────────────────────────────────────────────────────────
# Pydantic schema (aligned with your v6-style inputs)
# ───────────────────────────────────────────────────────────────
class PredictRequest(BaseModel):
    semester_number: int
    course_code: str
    study_format: str
    credits_unit: int

    # historical/behavioral
    last_score: float
    mean_prev_score: float
    score_trend: float
    score_stability: float
    score_stability_cv: float
    recent_improvement: float
    n_assessments: int
    study_load: float

    # current signals
    weekly_study_hours: float
    part_time_hours: float
    financial_support: int
    emotional_support: int

# ───────────────────────────────────────────────────────────────
# Simple health check
# ───────────────────────────────────────────────────────────────
@app.get("/health")
def health():
    return {
        "status": "ok",
        "artifact_dir": ARTIFACT_DIR,
        "preprocessor": PREPROCESSOR_PATH,
        "model": MODEL_PATH_ACTIVE,
        "model_expected_dim": predict_input_dim,
        "has_feature_names": feature_names is not None,
        "raw_columns_expected": len(REQUIRED_RAW_COLS) if REQUIRED_RAW_COLS else None,
    }

# ───────────────────────────────────────────────────────────────
# UI page to paste JSON
# ───────────────────────────────────────────────────────────────
@app.get("/", response_class=HTMLResponse)
def home():
    return """
<!doctype html>
<html lang="vi">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>EdVision XGBoost Predictor</title>
  <style>
    body { font-family: system-ui, sans-serif; margin: 24px; max-width: 980px; }
    textarea { width: 100%; height: 320px; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; }
    button { padding: 10px 16px; margin-top: 10px; cursor: pointer; }
    pre { background: #f6f8fa; padding: 12px; overflow: auto; min-height: 120px; }
    .row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    @media (max-width: 900px) { .row { grid-template-columns: 1fr; } }
    .muted { color: #666; font-size: 0.95rem; }
  </style>
</head>
<body>
  <h1>ML Service - Predict raw_score (XGBoost)</h1>
  <p class="muted">Dán JSON vào ô bên trái và bấm Predict. Endpoint chỉ hỗ trợ POST /predict.</p>

  <div class="row">
    <div>
      <h3>Request JSON</h3>
      <textarea id="jsonInput">
{
  "semester_number": 2,
  "course_code": "CHE 101",
  "study_format": "LEC",
  "credits_unit": 2,

  "last_score": 5.4,
  "mean_prev_score": 4.542857143,
  "score_trend": 0.142857143,
  "score_stability": 0.942424143,
  "score_stability_cv": 0.207451855,
  "recent_improvement": 1,
  "n_assessments": 7,
  "study_load": 1.0,

  "weekly_study_hours": 6,
  "part_time_hours": 40,
  "financial_support": 0,
  "emotional_support": 0
}
      </textarea>
      <button onclick="sendPredict()">Predict</button>
      <div class="muted">Tip: nếu API báo thiếu cột, nghĩa là preprocessor của bạn được fit với bộ feature khác.</div>
    </div>

    <div>
      <h3>Response</h3>
      <pre id="output">(Kết quả sẽ hiện ở đây)</pre>
    </div>
  </div>

  <script>
    async function sendPredict() {
      const output = document.getElementById("output");
      const raw = document.getElementById("jsonInput").value;

      let payload;
      try {
        payload = JSON.parse(raw);
      } catch (e) {
        output.textContent = "JSON không hợp lệ: " + e.message;
        return;
      }

      output.textContent = "Đang gọi /predict ...";

      try {
        const res = await fetch("/predict", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });

        const text = await res.text();
        try {
          const json = JSON.parse(text);
          output.textContent = JSON.stringify(json, null, 2);
        } catch {
          output.textContent = text;
        }

      } catch (err) {
        output.textContent = "Lỗi gọi API: " + err.message;
      }
    }
  </script>
</body>
</html>
    """

# ───────────────────────────────────────────────────────────────
# Endpoint: /predict
# ───────────────────────────────────────────────────────────────
@app.post("/predict")
async def predict_score(data: PredictRequest):
    ensure_loaded()
    study_hours_x_part_time_hours = data.weekly_study_hours * data.part_time_hours
    financial_support_x_part_time_hours = data.financial_support * data.part_time_hours
    study_hours_x_part_part_time_hours = study_hours_x_part_time_hours
    row = {
        "semester_number": data.semester_number,
        "course_code": data.course_code,
        "study_format": data.study_format,
        "credits_unit": data.credits_unit,
        "last_score": data.last_score,
        "mean_prev_score": data.mean_prev_score,
        "score_trend": data.score_trend,
        "score_stability": data.score_stability,
        "score_stability_cv": data.score_stability_cv,
        "recent_improvement": data.recent_improvement,
        "n_assessments": data.n_assessments,
        "study_load": data.study_load,
        "weekly_study_hours": data.weekly_study_hours,
        "part_time_hours": data.part_time_hours,
        "financial_support": data.financial_support,
        "emotional_support": data.emotional_support,
        "study_hours_x_part_time_hours": study_hours_x_part_time_hours,
        "study_hours_x_part_part_time_hours": study_hours_x_part_part_time_hours,
        "financial_support_x_part_time_hours": financial_support_x_part_time_hours,
    }
    key = hashlib.sha256(json.dumps(row, sort_keys=True, separators=(",", ":")).encode("utf-8")).hexdigest()
    cached = prediction_cache.get(key)
    if cached is not None:
        return {"mode": "raw_score_prediction", "model_type": "xgboost", "predicted_score": cached}
    existing = pending_map.get(key)
    if existing:
        try:
            result = await existing
            prediction_cache.set(key, result)
            return {"mode": "raw_score_prediction", "model_type": "xgboost", "predicted_score": result}
        except Exception as e:
            raise e
    async def work():
        df = pd.DataFrame([row])
        if REQUIRED_RAW_COLS:
            missing = [c for c in REQUIRED_RAW_COLS if c not in df.columns]
            if missing:
                raise HTTPException(status_code=422, detail={"error": "Missing required features for this preprocessor.", "missing_columns": missing})
            try:
                df = df[REQUIRED_RAW_COLS]
            except Exception:
                pass
        X_processed = await run_in_threadpool(preprocessor_predict.transform, df)
        if hasattr(X_processed, "toarray") and not isinstance(X_processed, np.ndarray):
            X_processed = X_processed.toarray()
        if predict_input_dim is not None and X_processed.shape[1] != predict_input_dim:
            raise HTTPException(status_code=500, detail={"error": "Feature dim mismatch between preprocessor and model.", "preprocessor_out_dim": int(X_processed.shape[1]), "model_expected_dim": int(predict_input_dim)})
        try:
            pred_arr = await run_in_threadpool(xgb_model.predict, X_processed)
            pred = float(pred_arr[0])
        except Exception as e:
            raise HTTPException(status_code=500, detail={"error": "Model prediction failed.", "message": str(e)})
        return round(pred, 4)
    task = asyncio.create_task(work())
    pending_map[key] = task
    try:
        result = await task
        prediction_cache.set(key, result)
        return {"mode": "raw_score_prediction", "model_type": "xgboost", "predicted_score": result}
    finally:
        pending_map.pop(key, None)
