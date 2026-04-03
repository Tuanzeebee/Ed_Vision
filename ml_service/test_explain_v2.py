import requests
import json

# Test SHAP explanation để xem midterm impact
def test_explain(midterm_score, label):
    payload = {
        "rows": [{
            "student_id": f"test_{label}",
            "course_code": "CHE 101",
            "homework": 10,
            "midterm": midterm_score,
            "speech_and_discussion": 10,
            "weekly_study_hours_by_course": 20,
            "part_time_hours_by_course": 5,
            "financial_support_by_course": 2,
            "emotional_support_by_course": 2
        }],
        "top_k": 10
    }
    
    print("=" * 70)
    print(f"TEST: Midterm = {midterm_score} ({label.upper()})")
    print("=" * 70)
    
    try:
        response = requests.post(
            "http://localhost:8000/explain_json",
            json=payload,
            timeout=30
        )
        
        if response.status_code == 200:
            result = response.json()
            
            if result.get("explanations"):
                exp = result["explanations"][0]
                print(f"\n Student: {exp['student_id']}")
                print(f" Course: {exp['course_code']}")
                print(f" Prediction: {exp['final_pred']:.2f}")
                print(f" Baseline: {exp.get('baseline_final_weighted', 'N/A'):.2f}")
                
                if 'top_features' in exp:
                    print(f"\n Top {len(exp['top_features'])} Feature Contributions:")
                    print("-" * 70)
                    
                    total_abs_shap = sum(abs(c['shap_value']) for c in exp['top_features'])
                    
                    for i, contrib in enumerate(exp['top_features'], 1):
                        feature = contrib['feature']
                        value = contrib['value']
                        shap = contrib['shap_value']
                        impact = "" if shap > 0 else ""
                        pct = abs(shap) / total_abs_shap * 100 if total_abs_shap > 0 else 0
                        
                        print(f"{i:2d}. {feature:30s} = {value:7.2f} | "
                              f"SHAP: {shap:+7.3f} {impact} | "
                              f"Importance: {pct:5.1f}%")
                    
                    return exp['final_pred'], exp['top_features']
        else:
            print(f"Error: Status {response.status_code}")
            print(response.text)
            
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()
    
    return None, None

# Test với midterm thấp
pred_low, features_low = test_explain(5, "THẤP")

print("\n")

# Test với midterm cao  
pred_high, features_high = test_explain(10, "CAO")

# So sánh
if pred_low and pred_high:
    print("\n" + "=" * 70)
    print(" COMPARISON: Impact of Midterm")
    print("=" * 70)
    print(f"\n Midterm = 5  → Prediction: {pred_low:.2f}")
    print(f" Midterm = 10 → Prediction: {pred_high:.2f}")
    print(f"\n Difference: {pred_high - pred_low:.2f} points ({(pred_high - pred_low)/pred_low*100:.1f}% increase)")
    
    # Tìm midterm trong top features
    midterm_low = next((f for f in features_low if 'midterm' in f['feature'].lower()), None)
    midterm_high = next((f for f in features_high if 'midterm' in f['feature'].lower()), None)
    
    if midterm_low and midterm_high:
        print(f"\n Midterm SHAP value:")
        print(f"   - When midterm=5:  SHAP = {midterm_low['shap_value']:+.3f}")
        print(f"   - When midterm=10: SHAP = {midterm_high['shap_value']:+.3f}")
        print(f"   - SHAP difference: {midterm_high['shap_value'] - midterm_low['shap_value']:.3f}")
