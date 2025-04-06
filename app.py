from flask import Flask, render_template, jsonify, request, send_from_directory
import pandas as pd
import os
import joblib
from datetime import datetime

app = Flask(__name__, 
            static_folder='static',
            template_folder='templates')

# Load model if available
MODEL_PATH = "limit_and_count_predictor.pkl"
CATEGORIES = ['Food', 'Transport', 'Shopping', 'Utilities', 'Entertainment']
CSV_PATH = "classified_transactions.csv"

# Create CSV if it doesn't exist
if not os.path.exists(CSV_PATH):
    df = pd.DataFrame(columns=["id", "category", "amount", "created_at"])
    df.to_csv(CSV_PATH, index=False)

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
    transactions = pd.read_csv(CSV_PATH).to_dict(orient="records")
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
        df = pd.read_csv(CSV_PATH)
        return jsonify(df.to_dict(orient="records"))
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/add-transaction", methods=["POST"])
def add_transaction():
    data = request.json
    category = data.get("category")
    amount = data.get("amount")
    
    if not category or not amount:
        return jsonify({"error": "Missing category or amount"}), 400
    
    # Read existing CSV
    if os.path.exists(CSV_PATH):
        df = pd.read_csv(CSV_PATH)
    else:
        df = pd.DataFrame(columns=["id", "category", "amount", "created_at"])
    
    # Generate new ID
    new_id = df["id"].max() + 1 if not df.empty else 1

    # Add new transaction
    now = datetime.now().strftime("%Y-%m-%d")
    new_row = {"id": int(new_id), "category": category, "amount": float(amount), "created_at": now}
    df = pd.concat([df, pd.DataFrame([new_row])], ignore_index=True)

    # Save back to CSV
    df.to_csv(CSV_PATH, index=False)

    return jsonify({"message": "Transaction added", "data": new_row})

@app.route("/api/predict", methods=["GET"])
def predict():
    try:
        income = int(request.args.get("income", 5000))
    except:
        return jsonify({"error": "Invalid income value"}), 400

    if os.path.exists(MODEL_PATH):
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
    else:
        return jsonify({"error": "Model not found"}), 404

if __name__ == "__main__":
    app.run(debug=True) 