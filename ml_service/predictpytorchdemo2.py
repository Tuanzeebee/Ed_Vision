from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import joblib
import pandas as pd
import torch
from torch import nn

app = FastAPI()

# ───────────────────────────────────────────────────────────────
# CORS config (mở rộng cho local dev, nhớ cấu hình kỹ khi production)
# ───────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Thay đổi khi deploy production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

# ─── Load 2 preprocessor ──────────────────────────────
preprocessor_predict = joblib.load("preprocessing_pipeline_2_8_2025.joblib")  # For /predict
preprocessor_reverse = joblib.load("preprocessing_pipeline_reverse_2_8_2025_1.joblib")  # For /reverse

# ─── Dummy input cho reverse ──────────────────────────
reverse_dummy = pd.DataFrame([{
    "semester_number": 1,
    "course_code": "MATH101",
    "study_format": "LEC",
    "credits_unit": 3,
    "raw_score": 5.0,
    "part_time_hours": 10.0,
    "financial_support": 2,
    "emotional_support": 2,
    "financial_support_x_part_time_hours": 20.0,
    "raw_score_x_part_time_hours": 50.0,
    "raw_score_x_financial_support": 10.0,
    "raw_score_x_emotional_support": 10.0,
    "raw_score_x_part_time_financial": 20.0
}])
reverse_input_dim = preprocessor_reverse.transform(reverse_dummy).shape[1]

# ─── Dummy input cho predict ──────────────────────────
predict_dummy = pd.DataFrame([{
    "semester_number": 1,
    "course_code": "MATH101",
    "study_format": "LEC",
    "credits_unit": 3,
    "weekly_study_hours": 5.0,
    "attendance_percentage": 90.0,
    "part_time_hours": 10.0,
    "financial_support": 2,
    "emotional_support": 2,
    "study_hours_x_attendance": 4.5,
    "study_hours_x_part_part_time_hours": 50.0,
    "financial_support_x_part_time_hours": 20.0,
    "attendance_x_emotional_support": 1.8,
    "full_interaction_feature": 45.0
}])
predict_input_dim = preprocessor_predict.transform(predict_dummy).shape[1]

class MLPDeep(nn.Module):
    def __init__(self, input_dim, output_dim=1):
        super().__init__()
        self.model = nn.Sequential(
            nn.Linear(input_dim, 512),
            nn.BatchNorm1d(512),
            nn.SiLU(),
            nn.Dropout(0.3),
            nn.Linear(512, 256),
            nn.BatchNorm1d(256),
            nn.SiLU(),
            nn.Dropout(0.3),
            nn.Linear(256, 128),
            nn.SiLU(),
            nn.Dropout(0.2),
            nn.Linear(128, 64),
            nn.SiLU(),
            nn.Linear(64, 32),
            nn.SiLU(),
            nn.Linear(32, output_dim)  #sửa thành output_dim
        )

    def forward(self, x):
        return self.model(x)


# ─── MLP model kiến trúc chuẩn ────────────────────────
class MLPDeepFull(nn.Module):
    def __init__(self, input_dim):
        super().__init__()
        self.model = nn.Sequential(
            nn.Linear(input_dim, 512),
            nn.BatchNorm1d(512),
            nn.SiLU(),
            nn.Dropout(0.3),
            nn.Linear(512, 256),
            nn.BatchNorm1d(256),
            nn.SiLU(),
            nn.Dropout(0.3),
            nn.Linear(256, 128),
            nn.SiLU(),
            nn.Dropout(0.2),
            nn.Linear(128, 64),
            nn.SiLU(),
            nn.Linear(64, 32),
            nn.SiLU(),
            nn.Linear(32, 1)
        )

    def forward(self, x):
        return self.model(x)

# ─── Load reverse model ───────────────────────────────
model_reverse = MLPDeep(reverse_input_dim, output_dim=2)  # output_dim = 2
model_reverse.load_state_dict(torch.load("best_mlp_model_2output_2_8_2025.pt", map_location=device))
model_reverse.to(device)
model_reverse.eval()

# ─── Load predict model ───────────────────────────────
model_predict = MLPDeepFull(predict_input_dim)
model_predict.load_state_dict(torch.load("best_mlp_model_weighted_2_8_2025_1.pt", map_location=device))
model_predict.to(device)
model_predict.eval()
# ───────────────────────────────────────────────────────────────
# Pydantic schemas
# ───────────────────────────────────────────────────────────────
class ReverseRequest(BaseModel):
    semester_number: int
    course_code: str
    study_format: str
    credits_unit: int
    raw_score: float
    part_time_hours: float
    financial_support: int
    emotional_support: int

class PredictRequest(BaseModel):
    semester_number: int
    course_code: str
    study_format: str
    credits_unit: int
    weekly_study_hours: float
    attendance_percentage: float
    part_time_hours: float
    financial_support: int
    emotional_support: int

# ───────────────────────────────────────────────────────────────
# Endpoint: /reverse
# ───────────────────────────────────────────────────────────────
@app.post("/reverse")
def reverse_predict(data: ReverseRequest):
    """Dự đoán weekly_study_hours và attendance_percentage từ raw_score và các đặc trưng còn lại."""

    financial_support_x_part_time_hours = data.financial_support * data.part_time_hours

    input_df = pd.DataFrame([{
        "semester_number": data.semester_number,
        "course_code": data.course_code,
        "study_format": data.study_format,
        "credits_unit": data.credits_unit,
        "raw_score": data.raw_score,
        "part_time_hours": data.part_time_hours,
        "financial_support": data.financial_support,
        "emotional_support": data.emotional_support,
        "financial_support_x_part_time_hours": financial_support_x_part_time_hours,
        "raw_score_x_part_time_hours": data.raw_score * data.part_time_hours,
        "raw_score_x_financial_support": data.raw_score * data.financial_support,
        "raw_score_x_emotional_support": data.raw_score * data.emotional_support,
        "raw_score_x_part_time_financial": data.raw_score * financial_support_x_part_time_hours,
    }])

    df_processed = preprocessor_reverse.transform(input_df)
    if hasattr(df_processed, "toarray"):
        df_processed = df_processed.toarray()

    input_tensor = torch.tensor(df_processed, dtype=torch.float32).to(device)
    with torch.no_grad():
        prediction = model_reverse(input_tensor).squeeze().cpu().numpy()

    return {
        "mode": "reverse_prediction",
        "predicted_weekly_study_hours": round(float(prediction[0]), 4),
        "predicted_attendance_percentage": round(float(prediction[1]), 4)
    }


# ───────────────────────────────────────────────────────────────
# Endpoint: /predict
# ───────────────────────────────────────────────────────────────
@app.post("/predict")
def predict_score(data: PredictRequest):
    study_hours_x_attendance = data.weekly_study_hours * (data.attendance_percentage / 100)
    study_hours_x_part_part_time_hours = data.weekly_study_hours * data.part_time_hours
    financial_support_x_part_time_hours = data.financial_support * data.part_time_hours
    attendance_x_emotional_support = (data.attendance_percentage / 100) * data.emotional_support
    full_interaction_feature = (
        data.weekly_study_hours
        * (data.attendance_percentage / 100)
        * data.part_time_hours
        * data.financial_support
        * data.emotional_support
    )

    df = pd.DataFrame([{
        "semester_number": data.semester_number,
        "course_code": data.course_code,
        "study_format": data.study_format,
        "credits_unit": data.credits_unit,
        "weekly_study_hours": data.weekly_study_hours,
        "attendance_percentage": data.attendance_percentage,
        "part_time_hours": data.part_time_hours,
        "financial_support": data.financial_support,
        "emotional_support": data.emotional_support,
        "study_hours_x_attendance": study_hours_x_attendance,
        "study_hours_x_part_part_time_hours": study_hours_x_part_part_time_hours,
        "financial_support_x_part_time_hours": financial_support_x_part_time_hours,
        "attendance_x_emotional_support": attendance_x_emotional_support,
        "full_interaction_feature": full_interaction_feature
    }])

    df_processed = preprocessor_predict.transform(df)
    if hasattr(df_processed, "toarray"):
        df_processed = df_processed.toarray()

    input_tensor = torch.tensor(df_processed, dtype=torch.float32).to(device)
    with torch.no_grad():
        prediction = model_predict(input_tensor).squeeze().cpu().item()

    return {
        "mode": "raw_score_prediction",
        "predicted_score": round(prediction, 4)
    }
