from fastapi import FastAPI
from pydantic import BaseModel
import joblib
import pandas as pd

app = FastAPI(title="Smart Spending Predictor API")

model = joblib.load("limit_and_count_predictor.pkl")
CATEGORIES = ['Food', 'Transport', 'Shopping', 'Utilities', 'Entertainment']

class IncomeInput(BaseModel):
    monthly_income: int

def predict_limits(income: int):
    results = []

    for category in CATEGORIES:
        data = {f'category_{cat}': [1 if cat == category else 0] for cat in CATEGORIES}
        data['monthly_income'] = [income]
        input_df = pd.DataFrame(data)
        ordered_columns = [f'category_{cat}' for cat in sorted(CATEGORIES)] + ['monthly_income']
        input_df = input_df.reindex(columns=ordered_columns, fill_value=0)
        prediction = model.predict(input_df)[0]

        results.append({
            "category": category,
            "monthly_limit": round(prediction[0], 2),
            "expected_transactions": round(prediction[1])
        })

    return results

@app.post("/predict-limits")
def get_smart_limits(income_input: IncomeInput):
    predictions = predict_limits(income_input.monthly_income)
    return {
        "monthly_income": income_input.monthly_income,
        "recommendations": predictions
    }
