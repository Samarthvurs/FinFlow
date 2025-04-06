from flask import Flask, render_template, jsonify, request, redirect, url_for, make_response
import csv
import os
import json
from datetime import datetime
import uuid
import random
import base64
import database  # Import our database module

# Sample Razorpay integration
# In a production app, you would use the actual Razorpay SDK
# pip install razorpay
try:
    import razorpay
    razorpay_available = True
except ImportError:
    razorpay_available = False

app = Flask(__name__, 
            static_folder='static',
            template_folder='templates')

CSV_PATH = "classified_transactions.csv"
RAZORPAY_CREDS_PATH = "razorpay_credentials.json"
CATEGORIES = ['Food', 'Transport', 'Shopping', 'Utilities', 'Entertainment']

# Razorpay credentials (replace with your actual test credentials)
RAZORPAY_KEY_ID = "rzp_test_yourkeyid"
RAZORPAY_KEY_SECRET = "yoursecretkey"

# Initialize database
database.init_db()

# Initialize Razorpay client if available
razorpay_client = None
if razorpay_available:
    try:
        razorpay_client = razorpay.Client(auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET))
    except Exception as e:
        print(f"Error initializing Razorpay: {e}")

# Create CSV if it doesn't exist
if not os.path.exists(CSV_PATH):
    with open(CSV_PATH, "w", newline="") as f:
        writer = csv.writer(f)
        writer.writerow(["id", "category", "amount", "created_at", "payment_id", "payment_status", "description", "source", "user_id"])

# Helper function to read CSV
def read_csv(user_id=None):
    transactions = []
    try:
        with open(CSV_PATH, "r", newline="") as f:
            reader = csv.DictReader(f)
            for row in reader:
                # Filter by user_id if provided
                if user_id is not None and 'user_id' in row and row['user_id'] and int(row['user_id']) != user_id:
                    continue
                    
                transaction = {
                    "id": int(row["id"]),
                    "category": row["category"],
                    "amount": float(row["amount"]),
                    "created_at": row["created_at"]
                }
                # Add optional fields if they exist
                for field in ["payment_id", "payment_status", "description", "source", "user_id"]:
                    if field in row and row[field]:
                        transaction[field] = row[field]
                    
                transactions.append(transaction)
    except Exception as e:
        print(f"Error reading CSV: {e}")
    return transactions

# Get current user from cookie
def get_current_user():
    token = request.cookies.get('session_token')
    if token:
        return database.get_user_by_token(token)
    return None

# Helper function to get Razorpay credentials
def get_razorpay_credentials():
    if os.path.exists(RAZORPAY_CREDS_PATH):
        try:
            with open(RAZORPAY_CREDS_PATH, "r") as f:
                return json.load(f)
        except Exception as e:
            print(f"Error reading Razorpay credentials: {e}")
    return None

# Helper function to save Razorpay credentials
def save_razorpay_credentials(key_id, key_secret):
    try:
        # Simple encryption - in production use a proper encryption method
        secret_b64 = base64.b64encode(key_secret.encode()).decode()
        creds = {
            "key_id": key_id,
            "key_secret_b64": secret_b64,
            "connected_at": datetime.now().isoformat()
        }
        with open(RAZORPAY_CREDS_PATH, "w") as f:
            json.dump(creds, f)
        return True
    except Exception as e:
        print(f"Error saving Razorpay credentials: {e}")
        return False

# Helper function to initialize Razorpay client with saved credentials
def initialize_razorpay_client():
    global razorpay_client
    if not razorpay_available:
        return None
        
    creds = get_razorpay_credentials()
    if creds:
        try:
            # Decode secret
            key_secret = base64.b64decode(creds["key_secret_b64"].encode()).decode()
            razorpay_client = razorpay.Client(auth=(creds["key_id"], key_secret))
            return razorpay_client
        except Exception as e:
            print(f"Error initializing Razorpay client: {e}")
    
    return None

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

@app.route('/payment')
def payment_page():
    return render_template('payment.html')

@app.route('/service-worker.js')
def serve_service_worker():
    return app.send_static_file('service-worker.js')

# --- API Routes ---

# Authentication routes
@app.route("/api/signup", methods=["POST"])
def api_signup():
    data = request.json
    email = data.get("email")
    password = data.get("password")
    full_name = data.get("name")
    monthly_income = float(data.get("income", 0))
    
    if not email or not password or not full_name or monthly_income <= 0:
        return jsonify({"success": False, "message": "Missing required fields"}), 400
    
    user_id = database.create_user(email, password, full_name, monthly_income)
    if not user_id:
        return jsonify({"success": False, "message": "Email already registered"}), 400
    
    # Log the user in
    user = database.login_user(email, password)
    
    # Set cookie
    response = jsonify({
        "success": True,
        "message": "Account created successfully",
        "user": {
            "email": user["email"],
            "full_name": user["full_name"],
            "monthly_income": user["monthly_income"]
        }
    })
    
    # Set secure cookie (in production, add secure=True, httponly=True)
    response.set_cookie(
        'session_token', user["token"], 
        max_age=30*24*60*60, # 30 days
        path='/'
    )
    
    return response

@app.route("/api/login", methods=["POST"])
def api_login():
    data = request.json
    email = data.get("email")
    password = data.get("password")
    
    if not email or not password:
        return jsonify({"success": False, "message": "Email and password are required"}), 400
    
    user = database.login_user(email, password)
    if not user:
        return jsonify({"success": False, "message": "Invalid email or password"}), 401
    
    response = jsonify({
        "success": True,
        "user": {
            "email": user["email"],
            "full_name": user["full_name"],
            "monthly_income": user["monthly_income"],
            "monthly_limit": user["monthly_limit"]
        }
    })
    
    # Set session cookie
    response.set_cookie(
        'session_token', user["token"], 
        max_age=30*24*60*60, # 30 days
        path='/'
    )
    
    return response

@app.route("/api/logout", methods=["POST"])
def api_logout():
    token = request.cookies.get('session_token')
    if token:
        database.logout_user(token)
    
    response = jsonify({"success": True})
    response.delete_cookie('session_token')
    
    return response

@app.route("/api/me", methods=["GET"])
def api_me():
    user = get_current_user()
    if not user:
        return jsonify({"authenticated": False}), 401
    
    return jsonify({
        "authenticated": True,
        "user": {
            "email": user["email"],
            "full_name": user["full_name"],
            "monthly_income": user["monthly_income"],
            "monthly_limit": user["monthly_limit"]
        }
    })

@app.route("/api/update-limit", methods=["POST"])
def update_limit():
    user = get_current_user()
    if not user:
        return jsonify({"success": False, "message": "Authentication required"}), 401
    
    data = request.json
    monthly_limit = data.get("monthly_limit")
    
    if not monthly_limit or float(monthly_limit) <= 0:
        return jsonify({"success": False, "message": "Valid monthly limit required"}), 400
    
    database.update_user_limit(user["id"], float(monthly_limit))
    
    return jsonify({
        "success": True,
        "message": "Monthly limit updated successfully"
    })

@app.route("/api/summary", methods=["GET"])
def summary():
    user = get_current_user()
    user_id = user["id"] if user else None
    
    transactions = read_csv(user_id)
    now = datetime.now()
    current_month = now.month
    current_week = now.isocalendar()[1]  # Week number

    monthly_spent = 0
    weekly_spent = 0
    total_trans = len(transactions)
    
    # Default budget (client-side will use localStorage value)
    default_budget = user["monthly_limit"] if user and user["monthly_limit"] > 0 else 5000

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

    response = jsonify({
        "monthly_spent": monthly_spent,
        "weekly_spent": weekly_spent,
        "transactions": total_trans,
        "amount_left": default_budget - monthly_spent,  # Client will adjust this based on localStorage
        "monthly_limit": default_budget,
        "monthly_income": user["monthly_income"] if user else 5000
    })
    
    # Add cache control headers for offline support
    response.headers['Cache-Control'] = 'public, max-age=600'  # 10 minutes
    
    return response

@app.route("/api/transactions", methods=["GET"])
def get_transactions():
    try:
        user = get_current_user()
        user_id = user["id"] if user else None
        
        transactions = read_csv(user_id)
        
        # Add cache control headers for offline support
        response = jsonify(transactions)
        response.headers['Cache-Control'] = 'public, max-age=600'  # 10 minutes
        
        return response
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/add-transaction", methods=["POST"])
def add_transaction():
    user = get_current_user()
    if not user:
        return jsonify({"success": False, "message": "Authentication required"}), 401
    
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
    new_row = {
        "id": int(new_id), 
        "category": category, 
        "amount": float(amount), 
        "created_at": now,
        "payment_id": "",
        "payment_status": "manual",
        "description": data.get("description", ""),
        "source": "manual",
        "user_id": user["id"]
    }
    
    # Append to CSV
    with open(CSV_PATH, "a", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=["id", "category", "amount", "created_at", "payment_id", "payment_status", "description", "source", "user_id"])
        if os.path.getsize(CSV_PATH) == 0:
            writer.writeheader()
        writer.writerow(new_row)

    return jsonify({"success": True, "message": "Transaction added", "data": new_row})

@app.route("/api/connect-razorpay", methods=["POST"])
def connect_razorpay():
    data = request.json
    key_id = data.get("key_id")
    key_secret = data.get("key_secret")
    
    if not key_id or not key_secret:
        return jsonify({"success": False, "message": "Missing API credentials"}), 400
    
    # Check if Razorpay SDK is available
    if not razorpay_available:
        return jsonify({
            "success": False, 
            "message": "Razorpay SDK not available. Please install using: pip install razorpay"
        }), 500
    
    # Validate credentials by attempting to create a client
    try:
        test_client = razorpay.Client(auth=(key_id, key_secret))
        
        # Try to make a test API call
        balance = test_client.balance.fetch()
        
        # If we got here, credentials are valid
        # Save credentials securely
        if save_razorpay_credentials(key_id, key_secret):
            # Initialize global client
            initialize_razorpay_client()
            
            return jsonify({
                "success": True,
                "message": "Successfully connected to Razorpay"
            })
        else:
            return jsonify({
                "success": False,
                "message": "Failed to save credentials"
            }), 500
            
    except Exception as e:
        # Invalid credentials or other error
        return jsonify({
            "success": False,
            "message": f"Failed to validate Razorpay credentials: {str(e)}"
        }), 400

@app.route("/api/disconnect-razorpay", methods=["POST"])
def disconnect_razorpay():
    # Remove credentials file
    if os.path.exists(RAZORPAY_CREDS_PATH):
        try:
            os.remove(RAZORPAY_CREDS_PATH)
            return jsonify({
                "success": True,
                "message": "Successfully disconnected Razorpay account"
            })
        except Exception as e:
            return jsonify({
                "success": False,
                "message": f"Error disconnecting account: {str(e)}"
            }), 500
    else:
        return jsonify({
            "success": True,
            "message": "No Razorpay account was connected"
        })

@app.route("/api/sync-razorpay-transactions", methods=["GET"])
def sync_razorpay_transactions():
    # Get Razorpay client
    client = initialize_razorpay_client()
    
    if not client:
        return jsonify({
            "success": False,
            "message": "Razorpay client not initialized. Please connect your account first."
        }), 400
    
    try:
        # Get existing transactions
        existing_transactions = read_csv()
        existing_payment_ids = set(txn.get("payment_id", "") for txn in existing_transactions if "payment_id" in txn and txn["payment_id"])
        
        # Fetch payments from Razorpay (in real app, you'd use pagination)
        payments = client.payment.all({
            "count": 100,  # Limit to 100 most recent payments
        })
        
        # Check if we have payments data
        if not payments or "items" not in payments:
            return jsonify({
                "success": False,
                "message": "No payments data received from Razorpay"
            }), 500
        
        # Generate new ID
        new_id = max([txn["id"] for txn in existing_transactions]) + 1 if existing_transactions else 1
        
        # Process payments and add new ones
        new_transactions = []
        for payment in payments.get("items", []):
            payment_id = payment.get("id")
            
            # Skip if already imported
            if payment_id in existing_payment_ids:
                continue
                
            # Get payment details
            amount = float(payment.get("amount", 0)) / 100  # Convert from paise to rupees
            status = payment.get("status")
            created_at = datetime.fromtimestamp(payment.get("created_at", 0)).strftime("%Y-%m-%d")
            
            # Determine category based on description or notes
            description = payment.get("description", "")
            notes = payment.get("notes", {})
            category = notes.get("category", "")
            
            # If no category found, try to determine from description
            if not category:
                description_lower = description.lower()
                if "food" in description_lower or "restaurant" in description_lower:
                    category = "Food"
                elif "transport" in description_lower or "uber" in description_lower or "cab" in description_lower:
                    category = "Transport"
                elif "shopping" in description_lower or "store" in description_lower:
                    category = "Shopping"
                elif "utility" in description_lower or "bill" in description_lower:
                    category = "Utilities"
                elif "movie" in description_lower or "entertainment" in description_lower:
                    category = "Entertainment"
                else:
                    category = "Other"
            
            # Create transaction record
            transaction = {
                "id": new_id,
                "category": category,
                "amount": amount,
                "created_at": created_at,
                "payment_id": payment_id,
                "payment_status": status,
                "description": description,
                "source": "razorpay"
            }
            
            new_transactions.append(transaction)
            existing_payment_ids.add(payment_id)
            new_id += 1
            
        # Save new transactions to CSV
        if new_transactions:
            with open(CSV_PATH, "a", newline="") as f:
                writer = csv.DictWriter(f, fieldnames=["id", "category", "amount", "created_at", "payment_id", "payment_status", "description", "source"])
                if os.path.getsize(CSV_PATH) == 0:
                    writer.writeheader()
                writer.writerows(new_transactions)
        
        return jsonify({
            "success": True,
            "message": f"Successfully synced {len(new_transactions)} transactions from Razorpay",
            "count": len(new_transactions)
        })
        
    except Exception as e:
        return jsonify({
            "success": False,
            "message": f"Error syncing transactions: {str(e)}"
        }), 500

@app.route("/api/razorpay-transactions", methods=["GET"])
def get_razorpay_transactions():
    try:
        # Get all transactions
        transactions = read_csv()
        
        # Filter transactions from Razorpay
        razorpay_transactions = [txn for txn in transactions if txn.get("source") == "razorpay"]
        
        # Sort by created_at date, most recent first
        razorpay_transactions.sort(key=lambda x: x.get("created_at", ""), reverse=True)
        
        return jsonify(razorpay_transactions)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/create-payment", methods=["POST"])
def create_payment():
    data = request.json
    category = data.get("category")
    amount = data.get("amount")
    
    if not category or not amount:
        return jsonify({"error": "Missing category or amount"}), 400
    
    # Convert amount to paise (Razorpay uses smallest currency unit)
    amount_paise = int(float(amount) * 100)
    
    if razorpay_client:
        try:
            # Create Razorpay order
            payment_data = {
                'amount': amount_paise,
                'currency': 'INR',
                'receipt': f'receipt_{uuid.uuid4().hex[:8]}',
                'notes': {
                    'category': category
                }
            }
            order = razorpay_client.order.create(data=payment_data)
            
            return jsonify({
                "order_id": order["id"],
                "amount": amount,
                "key_id": RAZORPAY_KEY_ID
            })
        except Exception as e:
            return jsonify({"error": str(e)}), 500
    else:
        # Mock Razorpay order for testing when SDK is not available
        mock_order_id = f"order_{uuid.uuid4().hex[:16]}"
        return jsonify({
            "order_id": mock_order_id,
            "amount": amount,
            "key_id": RAZORPAY_KEY_ID
        })

@app.route("/api/verify-payment", methods=["POST"])
def verify_payment():
    data = request.json
    payment_id = data.get("payment_id")
    order_id = data.get("order_id")
    signature = data.get("signature")
    category = data.get("category")
    amount = data.get("amount")
    
    if not payment_id or not order_id or not category or not amount:
        return jsonify({"error": "Missing payment details"}), 400
    
    # In a real app, verify the payment signature using Razorpay
    # For demo, we'll assume the payment is successful
    
    # Read existing transactions
    transactions = read_csv()
    
    # Generate new ID
    new_id = max([txn["id"] for txn in transactions]) + 1 if transactions else 1

    # Add new transaction
    now = datetime.now().strftime("%Y-%m-%d")
    new_row = {
        "id": int(new_id), 
        "category": category, 
        "amount": float(amount), 
        "created_at": now,
        "payment_id": payment_id,
        "payment_status": "paid",
        "description": f"Payment for {category}",
        "source": "razorpay-manual"
    }
    
    # Append to CSV
    with open(CSV_PATH, "a", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=["id", "category", "amount", "created_at", "payment_id", "payment_status", "description", "source"])
        if os.path.getsize(CSV_PATH) == 0:
            writer.writeheader()
        writer.writerow(new_row)

    return jsonify({
        "status": "success",
        "message": "Payment verified and transaction added",
        "transaction": new_row
    })

@app.route("/api/predict", methods=["GET"])
def predict():
    user = get_current_user()
    
    # Get income from query param or user account if logged in
    try:
        income = int(request.args.get("income", 0))
        if income <= 0 and user:
            income = user["monthly_income"]
        
        if income <= 0:
            income = 5000  # Default
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

    # Add cache control headers for offline support
    response = jsonify(results)
    response.headers['Cache-Control'] = 'public, max-age=3600'  # 1 hour
    
    return response

if __name__ == "__main__":
    # Try to initialize Razorpay client on startup
    initialize_razorpay_client()
    
    app.run(debug=True) 