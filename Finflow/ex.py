import csv
from datetime import datetime
import joblib
import pandas as pd

# --- Load CSV Transactions ---
def load_transactions_from_csv(filename):
    transactions = []
    with open(filename, 'r', encoding='utf-8') as file:
        reader = csv.DictReader(file)
        for row in reader:
            txn = {
                "id": row.get("id", ""),
                "amount": float(row.get("amount", 0)),
                "method": row.get("method", "N/A"),
                "description": row.get("description", ""),
                "created_at": row.get("created_at", "")
            }
            # Only add category if it exists in the row
            if "category" in row:
                txn["category"] = row["category"]
            transactions.append(txn)
    return transactions

# --- Summary Function ---
def generate_summary(transactions, monthly_budget=5000):
    now = datetime.now()
    current_month = now.month
    current_week = now.isocalendar().week

    monthly_spent = 0
    weekly_spent = 0
    total_trans = 0

    for txn in transactions:
        total_trans += 1
        try:
            date_obj = datetime.strptime(txn["created_at"], "%d-%m-%Y %H:%M")
        except ValueError:
            try:
                date_obj = datetime.strptime(txn["created_at"], "%Y-%m-%d")
            except ValueError:
                print(f"⚠️ Skipping invalid date format: {txn['created_at']}")
                continue

        if date_obj.month == current_month:
            monthly_spent += txn["amount"]
        if date_obj.isocalendar().week == current_week:
            weekly_spent += txn["amount"]

    amount_left = monthly_budget - monthly_spent

    print("\n📊 Summary")
    print("+----------------+----------------+----------------+")
    print("| Transactions   | Weekly Spend   | Monthly Spend  |")
    print("+----------------+----------------+----------------+")
    print(f"| {total_trans:<14} | ₹{weekly_spent:<14.2f} | ₹{monthly_spent:<14.2f} |")
    print("+----------------+----------------+----------------+")
    print(f"\n💰 Amount Left: ₹{amount_left:.2f}")

# --- Transactions on Date ---
def transactions_on_date(transactions, target_date_str):
    print(f"\n🔎 Transactions on {target_date_str}:")
    try:
        target_date = datetime.strptime(target_date_str, "%d-%m-%Y").date()
    except ValueError:
        print("❌ Invalid date format. Use DD-MM-YYYY.")
        return

    found = False
    for txn in transactions:
        try:
            date_obj = datetime.strptime(txn["created_at"], "%d-%m-%Y %H:%M").date()
        except ValueError:
            try:
                date_obj = datetime.strptime(txn["created_at"], "%Y-%m-%d").date()
            except ValueError:
                continue

        if date_obj == target_date:
            found = True
            category = txn.get("category", "Uncategorized")
            print(f"🧾 {txn['description']} → ₹{txn['amount']} via {txn['method']} in {category} at {txn['created_at']}")

    if not found:
        print("❌ No transactions found on this date.")

# --- Main Entry ---
if __name__ == "__main__":
    filename = "classified_transactions.csv"
    transactions = load_transactions_from_csv(filename)
    generate_summary(transactions, monthly_budget=5000)

    try:
        income = int(input("\n💬 Enter your monthly income in ₹: "))
        categories = ['Food', 'Transport', 'Shopping', 'Utilities', 'Entertainment']
        model = joblib.load("limit_and_count_predictor.pkl")
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
    except FileNotFoundError:
        print("❌ Model file 'limit_and_count_predictor.pkl' not found.")

    date_input = input("\n📆 Enter a date to check transactions (DD-MM-YYYY): ")
    transactions_on_date(transactions, date_input)
