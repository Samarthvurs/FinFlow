from fastapi import FastAPI
from pydantic import BaseModel
import pandas as pd
from api.crypto_utils import decrypt_message
from scripts.classify_data import load_model_and_encoder, classify_transactions
from scripts.predict import predict_limits
import joblib

from app.auth import auth_routes
from app.dashboard import dashboard_routes
from app.payments import payments_routes
from app.limits import limits_routes

app = FastAPI(title="FinFlow API")

# Paths to model files
CLASSIFIER_PATH = "model/transaction_classifier.pkl"
ENCODER_PATH = "model/label_encoder.pkl"
VECTORIZER_PATH = "model/vectorizer.pkl"
PREDICTOR_MODEL_PATH = "ml_model/limit_and_count_predictor.pkl"

# Load models
classifier, label_encoder, vectorizer = load_model_and_encoder(
    CLASSIFIER_PATH, ENCODER_PATH, VECTORIZER_PATH
)
predictor_model = joblib.load(PREDICTOR_MODEL_PATH)

# Input schema
class EncryptedInput(BaseModel):
    encrypted_income: str

@app.post("/classify-transactions")
def classify_endpoint(transactions: list):
    """Classify transactions by description."""
    descriptions = pd.Series([t["description"] for t in transactions])
    predicted_labels = classify_transactions(descriptions, classifier, vectorizer, label_encoder)
    for i, t in enumerate(transactions):
        t["category"] = predicted_labels[i]
    return {"classified_transactions": transactions}

@app.post("/predict-limits")
def predict_endpoint(payload: EncryptedInput):
    """Predict spending limits."""
    decrypted_income = decrypt_message(payload.encrypted_income)
    income = int(decrypted_income)
    predictions = predict_limits(income, predictor_model)
    return {"income": income, "recommendations": predictions}

# Include submodules

app.include_router(auth_routes, prefix="/auth")
app.include_router(dashboard_routes, prefix="/dashboard")
app.include_router(payments_routes, prefix="/payments")
app.include_router(limits_routes, prefix="/limits")
