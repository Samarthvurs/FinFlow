# run_pipeline.py

from fetch_data_mock import fetch_mock_data
from clean_data import clean_transaction_data
from classify_data import load_model_and_encoder, classify_transactions
import pandas as pd
import os

# Load Model, Encoder, Vectorizer
MODEL_PATH = "model/transaction_classifier_model.h5"
ENCODER_PATH = "model/label_encoder.pkl"
VOCAB_PATH = "model/vectorizer_vocab.txt"

model, label_encoder, vectorizer = load_model_and_encoder(MODEL_PATH, ENCODER_PATH, VOCAB_PATH)

# Fetch + clean data
raw_df = fetch_mock_data(50)
clean_df = clean_transaction_data(raw_df)
clean_df["description"] = clean_df["description"].astype(str)

# Classify
predicted_labels = classify_transactions(clean_df["description"], model, vectorizer, label_encoder)
clean_df["predicted_category"] = predicted_labels

# Save output
clean_df.to_csv("classified_transactions.csv", index=False)
