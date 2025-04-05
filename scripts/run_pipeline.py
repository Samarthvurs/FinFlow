from fetch_data_mock import fetch_mock_data
from clean_data import clean_transaction_data
from classify_data import load_model_and_encoder, classify_transactions
from predict import predict_limits
import pandas as pd
import joblib

# Paths to model files
CLASSIFIER_PATH = "model/transaction_classifier.pkl"
ENCODER_PATH = "model/label_encoder.pkl"
VECTORIZER_PATH = "model/vectorizer.pkl"
PREDICTOR_MODEL_PATH = "ml_model/limit_and_count_predictor.pkl"

# Load classification models
classifier, label_encoder, vectorizer = load_model_and_encoder(
    CLASSIFIER_PATH, ENCODER_PATH, VECTORIZER_PATH
)
# Load prediction model
predictor_model = joblib.load(PREDICTOR_MODEL_PATH)

# Run pipeline
raw_data = fetch_mock_data(50)  # Generate mock data
clean_data = clean_transaction_data(raw_data)  # Clean the data

# Classify transactions
clean_data["predicted_category"] = classify_transactions(
    clean_data["description"], classifier, vectorizer, label_encoder
)

# Predict limits for an example income
income = 50000  # Replace with user-provided income
limit_predictions = predict_limits(income, predictor_model)

# Save the results
clean_data.to_csv("classified_transactions.csv", index=False)
print("Pipeline executed successfully.")