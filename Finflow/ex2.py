import csv
from collections import defaultdict
from datetime import datetime
import joblib
import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor
from sklearn.multioutput import MultiOutputRegressor
from sklearn.model_selection import train_test_split
import os

# --- Parse Date Helper ---
def parse_date(date_str):
    for fmt in ("%d-%m-%Y %H:%M", "%Y-%m-%d", "%d/%m/%Y", "%d-%m-%Y"):
        try:
            return datetime.strptime(date_str, fmt)
        except ValueError:
            continue
    raise ValueError(f"No valid date format found for {date_str}")

# --- Load CSV Transactions ---
def load_transactions_from_csv(filename):
    transactions = []
    with open(filename, 'r') as file:
        reader = csv.DictReader(file)
        for row in reader:
            transactions.append({
                "id": row.get("id", ""),
                "amount": float(row.get("amount", 0)),
                "method": row.get("method", ""),
                "description": row.get("description", ""),
                "created_at": row.get("created_at", ""),
                "category": row.get("category", "Misc")
            })
    return transactions

# --- Generate Model if not Exists ---
def train_dummy_model_if_missing(categories, model_path):
    if os.path.exists(model_path):
        return
    print("⚙️ Generating dummy model...")
    X = []
    y = []
    for cat in categories:
        for income in range(10000, 100001, 5000):
            cat_vec = [1 if c == cat else 0 for c in categories]
            X.append(cat_vec + [income])
            y.append([income * 0.1, income / 1000])

    X = np.array(X)
    y = np.array(y)

    model = MultiOutputRegressor(RandomForestRegressor())
    model.fit(X, y)
    joblib.dump(model, model_path)
    print("✅ Dummy model saved.")

# --- Get Summary Table Based on Sketch ---
def generate_summary(transactions, monthly_budget=5000):
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
            print(f"⚠️ Skipping invalid date: {txn['created_at']}")
            continue

        if date_obj.month == current_month and date_obj.year == now.year:
            monthly_spent += txn["amount"]
            if date_obj.isocalendar().week == current_week:
                weekly_spent += txn["amount"]
        total_trans += 1

    amount_left = monthly_budget - monthly_spent

    print("\n📊 Summary")
    print("+----------------+----------------+----------------+")
    print("| Transactions   | Weekly Spend   | Monthly Spend  |")
    print("+----------------+----------------+----------------+")
    print(f"| {total_trans:<14} | ₹{weekly_spent:<14.2f} | ₹{monthly_spent:<14.2f} |")
    print("+----------------+----------------+----------------+")
    print(f"\n💰 Amount Left: ₹{amount_left:.2f}")
    print("🕐 How much you spent now → today’s total not tracked in this basic view")
    print("📅 How much this week → ₹{:.2f}".format(weekly_spent))
    print("🗓️ This month → ₹{:.2f}".format(monthly_spent))

# --- Get Transactions on a Specific Date ---
def transactions_on_date(transactions, target_date_str):
    print(f"\n🔎 Transactions on {target_date_str}:")
    try:
        target_date = parse_date(target_date_str).date()
    except ValueError:
        print("❌ Invalid date format. Use DD-MM-YYYY.")
        return

    found = False
    for txn in transactions:
        try:
            date_obj = parse_date(txn["created_at"]).date()
        except ValueError:
            continue

        if date_obj == target_date:
            found = True
            print(f"🧾 {txn['description']} → ₹{txn['amount']} via {txn['method']} at {txn['created_at']}")

    if not found:
        print("❌ No transactions found on this date.")

# --- Main Runner ---
if __name__ == "__main__":
    filename = "classified_transactions.csv"
    model_path = "limit_and_count_predictor.pkl"
    transactions = load_transactions_from_csv(filename)
    generate_summary(transactions, monthly_budget=5000)

    try:
        income = int(input("\n💬 Enter your monthly income in ₹: "))

        categories = ['Food', 'Transport', 'Shopping', 'Utilities', 'Entertainment']
        train_dummy_model_if_missing(categories, model_path)
        model = joblib.load(model_path)
        results = []

        for category in categories:
            data = {f'category_{cat}': [1 if cat == category else 0] for cat in categories}
            data['monthly_income'] = [income]
            input_df = pd.DataFrame(data)

            ordered_columns = [f'category_{cat}' for cat in sorted(categories)] + ['monthly_income']
            input_df = input_df.reindex(columns=ordered_columns, fill_value=0)

            prediction = model.predict(input_df)[0]
            results.append((category, prediction[0], prediction[1]))

        print(f"\n💡 Smart Spending Predictions for ₹{income} per month:")
        for category, limit, count in results:
            print(f"📂 {category:13} → Monthly Limit: ₹{limit:.2f} | ~{round(count)} transactions")

    except ValueError:
        print("❌ Invalid input. Please enter a valid number.")

    # Check specific date transactions
    date_input = input("\n📆 Enter a date to check transactions (DD-MM-YYYY): ")
    transactions_on_date(transactions, date_input)
