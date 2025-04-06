from flask import Flask, jsonify, request
from your_existing_module import (
    load_transactions_from_csv,
    generate_summary,
    train_dummy_model_if_missing,
    transactions_on_date,
    parse_date
)
import joblib
import pandas as pd
import os
from datetime import datetime

app = Flask(__name__)

FILENAME = "classified_transactions.csv"
MODEL_PATH = "limit_and_count_predictor.pkl"
CATEGORIES = ['Food', 'Transport', 'Shopping', 'Utilities', 'Entertainment']

# --- Endpoint: Basic Summary ---
@app.route("/summary", methods=["GET"])
def summary():
    transactions = load_transactions_from_csv(FILENAME)
    now = datetime.now()
    current_month = now.month
    current_week = now.isocalendar().week

    monthly_spent = 0
    weekly_spent = 0
    total_trans = 0

    for txn in transactions:
        try:
            date_obj = parse_date(txn["created_at"])
        except ValueError:
            continue

        if date_obj.month == current_month and date_obj.year == now.year:
            monthly_spent += txn["amount"]
            if date_obj.isocalendar().week == current_week:
                weekly_spent += txn["amount"]
        total_trans += 1

    return jsonify({
        "monthly_spent": monthly_spent,
        "weekly_spent": weekly_spent,
        "transactions": total_trans,
        "amount_left": 5000 - monthly_spent  # or pass budget from client
    })

# --- Endpoint: Spending Prediction ---
@app.route("/predict", methods=["GET"])
def predict():
    try:
        income = int(request.args.get("income", 5000))
    except:
        return jsonify({"error": "Invalid income value"}), 400

    train_dummy_model_if_missing(CATEGORIES, MODEL_PATH)
    model = joblib.load(MODEL_PATH)

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
            "limit": round(prediction[0], 2),
            "count": int(round(prediction[1]))
        })

    return jsonify(results)

# --- Endpoint: Transactions on a Date ---
@app.route("/transactions", methods=["GET"])
def transactions_by_date():
    date_str = request.args.get("date", None)
    if not date_str:
        return jsonify({"error": "No date provided"}), 400

    transactions = load_transactions_from_csv(FILENAME)
    try:
        target_date = parse_date(date_str).date()
    except ValueError:
        return jsonify({"error": "Invalid date format. Use DD-MM-YYYY"}), 400

    filtered = []
    for txn in transactions:
        try:
            txn_date = parse_date(txn["created_at"]).date()
            if txn_date == target_date:
                filtered.append(txn)
        except:
            continue

    return jsonify(filtered)

# --- Run Server ---
if __name__ == "__main__":
    app.run(debug=True)
