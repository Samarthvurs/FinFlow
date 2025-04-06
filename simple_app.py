from flask import Flask, render_template, jsonify, request
import csv
import os
import json
from datetime import datetime

app = Flask(__name__, 
            static_folder='static',
            template_folder='templates')

CSV_PATH = "classified_transactions.csv"
CATEGORIES = ['Food', 'Transport', 'Shopping', 'Utilities', 'Entertainment']

# Create CSV if it doesn't exist
if not os.path.exists(CSV_PATH):
    with open(CSV_PATH, "w", newline="") as f:
        writer = csv.writer(f)
        writer.writerow(["id", "category", "amount", "created_at"])

# Helper function to read CSV
def read_csv():
    transactions = []
    try:
        with open(CSV_PATH, "r", newline="") as f:
            reader = csv.DictReader(f)
            for row in reader:
                transactions.append({
                    "id": int(row["id"]),
                    "category": row["category"],
                    "amount": float(row["amount"]),
                    "created_at": row["created_at"]
                })
    except Exception as e:
        print(f"Error reading CSV: {e}")
    return transactions

# --- Web Routes ---
@app.route('/')
def home():
    return render_template('home.html')

@app.route('/login')
def login():
    return render_template('login.html')

@app.route('/signup')
def signup():
    return render_template('signup.html')

@app.route('/page1')
def page1():
    return render_template('page1.html')

@app.route('/page2')
def page2():
    return render_template('page2.html')

@app.route('/summary')
def summary_page():
    return render_template('summary.html')

# --- API Routes ---
@app.route("/api/summary", methods=["GET"])
def summary():
    transactions = read_csv()
    now = datetime.now()
    current_month = now.month
    current_week = now.isocalendar()[1]  # Week number

    monthly_spent = 0
    weekly_spent = 0
    total_trans = len(transactions)

    for txn in transactions:
        try:
            date_str = txn.get("created_at", "")
            if not date_str:
                continue
            date_obj = datetime.strptime(date_str, "%Y-%m-%d")
        except ValueError:
            continue

        if date_obj.month == current_month and date_obj.year == now.year:
            monthly_spent += txn["amount"]
            if date_obj.isocalendar()[1] == current_week:
                weekly_spent += txn["amount"]

    return jsonify({
        "monthly_spent": monthly_spent,
        "weekly_spent": weekly_spent,
        "transactions": total_trans,
        "amount_left": 5000 - monthly_spent  # Default budget
    })

@app.route("/api/transactions", methods=["GET"])
def get_transactions():
    try:
        transactions = read_csv()
        return jsonify(transactions)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/add-transaction", methods=["POST"])
def add_transaction():
    data = request.json
    category = data.get("category")
    amount = data.get("amount")
    
    if not category or not amount:
        return jsonify({"error": "Missing category or amount"}), 400
    
    # Read existing transactions
    transactions = read_csv()
    
    # Generate new ID
    new_id = max([txn["id"] for txn in transactions]) + 1 if transactions else 1

    # Add new transaction
    now = datetime.now().strftime("%Y-%m-%d")
    new_row = {"id": int(new_id), "category": category, "amount": float(amount), "created_at": now}
    
    # Append to CSV
    with open(CSV_PATH, "a", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=["id", "category", "amount", "created_at"])
        if os.path.getsize(CSV_PATH) == 0:
            writer.writeheader()
        writer.writerow(new_row)

    return jsonify({"message": "Transaction added", "data": new_row})

@app.route("/api/predict", methods=["GET"])
def predict():
    try:
        income = int(request.args.get("income", 5000))
    except:
        return jsonify({"error": "Invalid income value"}), 400

    # Generate some simple spending recommendations based on income
    results = []
    base_values = {
        "Food": (0.25, 15),
        "Transport": (0.15, 20),
        "Shopping": (0.20, 5),
        "Utilities": (0.20, 4),
        "Entertainment": (0.10, 8)
    }
    
    for category in CATEGORIES:
        percent, count = base_values.get(category, (0.1, 5))
        limit = round(income * percent, 2)
        count_adj = max(1, round(count * income / 5000))
        
        results.append({
            "category": category,
            "limit": limit,
            "count": count_adj
        })

    return jsonify(results)

if __name__ == "__main__":
    app.run(debug=True) 