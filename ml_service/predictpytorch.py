# predictpytorch.py
# FastAPI service for raw_score prediction
# Aligned with your grouped MLP + preprocessing pipeline
# Requires these files in the SAME folder:
#  - preprocessing_pipeline_6_12_2025_New.joblib
#  - best_mlp_grouped_v6.pt

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
from pydantic import BaseModel
import os
import joblib
import pandas as pd
import torch
from torch import nn

# ───────────────────────────────────────────────────────────────
# App
# ───────────────────────────────────────────────────────────────
app = FastAPI(title="EdVision MLP Service", version="1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # change in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

# ───────────────────────────────────────────────────────────────
# Paths (hard-paired to avoid mismatch)
# ───────────────────────────────────────────────────────────────
PREPROCESSOR_PATH = "preprocessing_pipeline_6_12_2025_New.joblib"
MODEL_PATH = "best_mlp_grouped_v6.pt"

if not os.path.exists(PREPROCESSOR_PATH):
    raise FileNotFoundError(
        f"Missing preprocessor: {PREPROCESSOR_PATH}. "
        "Export from your preprocessing cell and place it next to this file."
    )

if not os.path.exists(MODEL_PATH):
    raise FileNotFoundError(
        f"Missing model: {MODEL_PATH}. "
        "Export from your training cell and place it next to this file."
    )

preprocessor_predict = joblib.load(PREPROCESSOR_PATH)
print(f"Loaded preprocessor: {PREPROCESSOR_PATH}")

state = torch.load(MODEL_PATH, map_location=device)
print(f"Loaded model weights: {MODEL_PATH}")

# ───────────────────────────────────────────────────────────────
# Infer input_dim from checkpoint (no dummy needed)
# ───────────────────────────────────────────────────────────────
first_weight_key = None
for k, v in state.items():
    # common patterns for first Linear
    if k.endswith("net.0.weight") or k.endswith("model.0.weight") or k.endswith("0.weight"):
        first_weight_key = k
        break

if first_weight_key is None:
    first_weight_key = next(iter(state.keys()))

predict_input_dim = state[first_weight_key].shape[1]
print(f"Inferred input_dim from checkpoint: {predict_input_dim}")

# ───────────────────────────────────────────────────────────────
# MLP architecture (Notebook version)
# 256 -> 128 -> 64 -> 32 -> 1
# ───────────────────────────────────────────────────────────────
class MLPDeepNotebook(nn.Module):
    def __init__(self, input_dim: int):
        super().__init__()
        self.net = nn.Sequential(
            nn.Linear(input_dim, 256),
            nn.BatchNorm1d(256),
            nn.SiLU(),
            nn.Dropout(0.25),

            nn.Linear(256, 128),
            nn.BatchNorm1d(128),
            nn.SiLU(),
            nn.Dropout(0.25),

            nn.Linear(128, 64),
            nn.SiLU(),
            nn.Dropout(0.15),

            nn.Linear(64, 32),
            nn.SiLU(),

            nn.Linear(32, 1)
        )

    def forward(self, x):
        return self.net(x)

model_predict = MLPDeepNotebook(predict_input_dim).to(device)
model_predict.load_state_dict(state, strict=True)
model_predict.eval()
print("Model loaded with Notebook architecture.")

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
# Pydantic schema (full-feature input aligned with your earlier v6 logic)
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
        "device": str(device),
        "preprocessor": PREPROCESSOR_PATH,
        "model": MODEL_PATH,
        "inferred_input_dim": predict_input_dim,
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
  <title>EdVision MLP Predictor</title>
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
  <h1>ML Service - Predict raw_score</h1>
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
def predict_score(data: PredictRequest):
    # Feature engineering aligned with your v6-style inputs
    study_hours_x_part_part_time_hours = data.weekly_study_hours * data.part_time_hours
    study_hours_x_part_time_hours = data.weekly_study_hours * data.part_time_hours
    financial_support_x_part_time_hours = data.financial_support * data.part_time_hours

    df = pd.DataFrame([{
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

        "study_hours_x_part_part_time_hours": study_hours_x_part_part_time_hours,
        "study_hours_x_part_time_hours": study_hours_x_part_time_hours,
        "financial_support_x_part_time_hours": financial_support_x_part_time_hours,
    }])

    # Strict raw-column check if pipeline exposes expected inputs
    if REQUIRED_RAW_COLS:
        missing = [c for c in REQUIRED_RAW_COLS if c not in df.columns]
        if missing:
            raise HTTPException(
                status_code=422,
                detail={
                    "error": "Missing required features for this preprocessor.",
                    "missing_columns": missing
                }
            )
        # reorder to match training raw layout
        try:
            df = df[REQUIRED_RAW_COLS]
        except Exception:
            pass

    # Transform
    df_processed = preprocessor_predict.transform(df)
    if hasattr(df_processed, "toarray"):
        df_processed = df_processed.toarray()

    # Guard dimension match with model
    if df_processed.shape[1] != predict_input_dim:
        raise HTTPException(
            status_code=500,
            detail={
                "error": "Feature dim mismatch between preprocessor and model.",
                "preprocessor_out_dim": int(df_processed.shape[1]),
                "model_expected_dim": int(predict_input_dim),
                "hint": "Ensure .joblib and .pt are exported from the same notebook run."
            }
        )

    # Predict
    input_tensor = torch.tensor(df_processed, dtype=torch.float32).to(device)
    with torch.no_grad():
        pred = model_predict(input_tensor).squeeze().cpu().item()

    return {
        "mode": "raw_score_prediction",
        "predicted_score": round(float(pred), 4)
    }
