import requests
import json

# Test data
payload = {
    "rows": [{
        "student_id": "test123",
        "course_code": "CHE 101",
        "homework": 10,
        "midterm": 5,  # Giảm từ 10 xuống 5
        "speech_and_discussion": 10,
        "weekly_study_hours_by_course": 20,
        "part_time_hours_by_course": 5,
        "financial_support_by_course": 2,
        "emotional_support_by_course": 2
    }]
}

try:
    response = requests.post(
        "http://localhost:8000/predict_json",
        json=payload,
        timeout=10
    )
    print(f"Status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
except Exception as e:
    print(f"Error: {e}")
