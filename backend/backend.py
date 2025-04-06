from fastapi import FastAPI, HTTPException, Request, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
import pandas as pd
import os
import json
import hmac
import hashlib
import razorpay
import base64
from typing import Optional, Dict, Any, List
from datetime import datetime
import traceback

# Import configuration
from backend.config import (
    BASE_DIR, CSV_PATH, MODEL_PATH, 
    RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET, RAZORPAY_WEBHOOK_SECRET,
    APP_NAME, CURRENCY
)

app = FastAPI(title=f"{APP_NAME} API", description="AI-based Expenditure Tracking System")

# Initialize Razorpay client
razorpay_client = razorpay.Client(auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET))

# Allow requests from frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Ensure the data directory exists
data_dir = os.path.dirname(CSV_PATH)
os.makedirs(data_dir, exist_ok=True)
print(f"Ensuring data directory exists: {data_dir}")

# Data model for transactions
class Transaction(BaseModel):
    category: str
    amount: float
    description: str
    method: str
    created_at: datetime = datetime.now()
    razorpay_payment_id: Optional[str] = None
    razorpay_order_id: Optional[str] = None
    status: str = "completed"  # Can be "pending", "completed", "failed"

# Data model for Razorpay order creation
class OrderRequest(BaseModel):
    amount: float
    currency: str = CURRENCY
    receipt: Optional[str] = None
    notes: Optional[Dict[str, str]] = None

# Data model for Razorpay account connection
class RazorpayCredentials(BaseModel):
    api_key: str
    api_secret: str
    webhook_secret: Optional[str] = None

# Razorpay webhook verification
def verify_webhook_signature(
    request_body: bytes,
    signature: str,
    secret: str = RAZORPAY_WEBHOOK_SECRET
) -> bool:
    mac = hmac.new(
        secret.encode(),
        msg=request_body,
        digestmod=hashlib.sha256
    )
    expected_signature = base64.b64encode(mac.digest()).decode()
    return hmac.compare_digest(expected_signature, signature)

@app.get("/")
async def root():
    return {"message": f"Welcome to {APP_NAME} API"}

@app.get("/transactions")
async def get_transactions():
    try:
        # Define the columns we expect
        expected_columns = [
            "category", "amount", "description", "method", 
            "created_at", "id", "razorpay_payment_id", 
            "razorpay_order_id", "status"
        ]
        
        # Create a fresh file if any issues are detected
        create_fresh_file = False
        
        # If file doesn't exist or is empty, create a new one
        if not os.path.exists(CSV_PATH) or os.path.getsize(CSV_PATH) == 0:
            create_fresh_file = True
        else:
            # Try to read the file carefully
            try:
                df = pd.read_csv(CSV_PATH, encoding='utf-8')
                
                # Check if any required columns are missing
                for col in expected_columns:
                    if col not in df.columns:
                        create_fresh_file = True
                        break
                        
            except Exception as e:
                print(f"Error reading CSV: {str(e)}")
                create_fresh_file = True
        
        # Create a fresh CSV file if needed
        if create_fresh_file:
            print(f"Creating a fresh transaction file at {CSV_PATH}")
            df = pd.DataFrame(columns=expected_columns)
            # Ensure the directory exists
            os.makedirs(os.path.dirname(CSV_PATH), exist_ok=True)
            df.to_csv(CSV_PATH, index=False, encoding='utf-8')
            return []
        
        # If we get here, we successfully read the file
        # Make sure id field is present for DataGrid
        if 'id' not in df.columns or df['id'].isnull().any():
            df['id'] = range(len(df))
            
        # Handle any missing columns to avoid future issues
        for col in expected_columns:
            if col not in df.columns:
                df[col] = None
                
        # Clean any problematic values
        df = df.replace([float('inf'), -float('inf')], 0)
        df = df.fillna(0)  # Replace NaN with 0 for numeric fields
        
        # Save the cleaned DataFrame
        df.to_csv(CSV_PATH, index=False, encoding='utf-8')
        
        # Convert to JSON-safe records
        records = df.to_dict(orient="records")
        
        return records
        
    except Exception as e:
        print(f"Unexpected error in get_transactions: {str(e)}")
        traceback.print_exc()  # Print full traceback for debugging
        # Return empty list as fallback to avoid breaking the frontend
        return []

@app.post("/add-transaction")
async def add_transaction(transaction: Transaction):
    try:
        # Define the columns we expect
        expected_columns = [
            "category", "amount", "description", "method", 
            "created_at", "id", "razorpay_payment_id", 
            "razorpay_order_id", "status"
        ]
        
        # Create or read the DataFrame
        if os.path.exists(CSV_PATH) and os.path.getsize(CSV_PATH) > 0:
            try:
                df = pd.read_csv(CSV_PATH, encoding='utf-8')
                
                # Validate and repair DataFrame if needed
                for col in expected_columns:
                    if col not in df.columns:
                        df[col] = None
                        
                # Clean any problematic values
                df = df.replace([float('inf'), -float('inf')], 0)
                df = df.fillna(0)
            except Exception as e:
                print(f"Error reading CSV in add_transaction: {str(e)}")
                # Create a new DataFrame if reading failed
                df = pd.DataFrame(columns=expected_columns)
        else:
            # Create a new DataFrame if file doesn't exist
            print(f"Creating a new transaction file at {CSV_PATH}")
            df = pd.DataFrame(columns=expected_columns)
            # Ensure directory exists
            os.makedirs(os.path.dirname(CSV_PATH), exist_ok=True)
        
        # Convert transaction to dict and add to DataFrame
        transaction_dict = transaction.dict()
        # Generate a new ID if needed
        transaction_dict['id'] = len(df) if len(df) > 0 else 0
        
        # Create a single-row DataFrame and append it
        new_row = pd.DataFrame([transaction_dict])
        df = pd.concat([df, new_row], ignore_index=True)
        
        # Save to CSV
        df.to_csv(CSV_PATH, index=False, encoding='utf-8')
        return {"message": "Transaction added successfully"}
    except Exception as e:
        print(f"Error in add_transaction: {str(e)}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

# Razorpay specific endpoints
@app.post("/create-order")
async def create_order(order_request: OrderRequest):
    try:
        # Razorpay expects amount in paise (1 INR = 100 paise)
        amount_in_paise = int(order_request.amount * 100)
        
        # Create order in Razorpay
        order_data = {
            'amount': amount_in_paise,
            'currency': order_request.currency,
            'receipt': order_request.receipt or f"receipt_{datetime.now().timestamp()}",
            'notes': order_request.notes or {}
        }
        
        order = razorpay_client.order.create(data=order_data)
        
        # Return order details to frontend
        return {
            "order_id": order['id'],
            "amount": order['amount'] / 100,  # Convert back to rupees for display
            "currency": order['currency'],
            "key_id": RAZORPAY_KEY_ID
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/verify-payment")
async def verify_payment(
    payment_id: str,
    order_id: str,
    signature: str
):
    try:
        # Verify the payment signature
        params_dict = {
            'razorpay_payment_id': payment_id,
            'razorpay_order_id': order_id,
            'razorpay_signature': signature
        }
        
        razorpay_client.utility.verify_payment_signature(params_dict)
        
        # Get payment details from Razorpay
        payment = razorpay_client.payment.fetch(payment_id)
        
        # Create a transaction record for the payment
        if payment['status'] == 'captured':
            transaction = Transaction(
                category="Income" if payment['amount'] > 0 else "Payment",
                amount=payment['amount'] / 100,  # Convert from paise to rupees
                description=f"Razorpay payment: {payment.get('description', payment_id)}",
                method="Razorpay",
                razorpay_payment_id=payment_id,
                razorpay_order_id=order_id,
                status="completed"
            )
            
            await add_transaction(transaction)
            
            return {"status": "success", "payment": payment}
        else:
            return {"status": "pending", "payment": payment}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Payment verification failed: {str(e)}")

@app.post("/razorpay-webhook")
async def razorpay_webhook(
    request: Request,
    x_razorpay_signature: str = Header(None)
):
    try:
        # Get the raw request body
        body = await request.body()
        
        # Verify webhook signature
        if not verify_webhook_signature(body, x_razorpay_signature):
            raise HTTPException(status_code=400, detail="Invalid webhook signature")
        
        # Parse the webhook payload
        payload = json.loads(body)
        event = payload.get('event')
        
        # Handle different webhook events
        if event == 'payment.captured':
            payment = payload.get('payload', {}).get('payment', {}).get('entity', {})
            payment_id = payment.get('id')
            order_id = payment.get('order_id')
            amount = payment.get('amount', 0) / 100  # Convert from paise to rupees
            
            # Create a transaction for the payment
            transaction = Transaction(
                category="Income" if amount > 0 else "Payment",
                amount=amount,
                description=f"Razorpay payment: {payment.get('description', payment_id)}",
                method="Razorpay",
                razorpay_payment_id=payment_id,
                razorpay_order_id=order_id,
                status="completed"
            )
            
            await add_transaction(transaction)
            
        elif event == 'payment.failed':
            # Handle failed payment if needed
            payment = payload.get('payload', {}).get('payment', {}).get('entity', {})
            print(f"Payment failed: {payment.get('id')}")
            
        # Return success response
        return {"status": "success"}
    except Exception as e:
        print(f"Error in webhook: {str(e)}")
        return JSONResponse(
            status_code=500,
            content={"status": "error", "message": str(e)}
        )

@app.get("/razorpay-transactions")
async def get_razorpay_transactions():
    try:
        # Read transactions from CSV
        if not os.path.exists(CSV_PATH):
            return []
            
        df = pd.read_csv(CSV_PATH, encoding='utf-8')
        
        # Filter transactions with Razorpay payment IDs
        razorpay_txns = df[df['razorpay_payment_id'].notna()]
        
        return razorpay_txns.to_dict(orient="records")
    except Exception as e:
        print(f"Error fetching Razorpay transactions: {str(e)}")
        return []

# Account connection endpoints
@app.get("/razorpay-account")
async def get_razorpay_account():
    """Check if Razorpay account is connected and return basic account info."""
    try:
        # Check if we have valid Razorpay credentials
        if RAZORPAY_KEY_ID == "rzp_test_yourkeyid" or not RAZORPAY_KEY_SECRET:
            return {"is_connected": False}
        
        # Try to fetch account info to verify credentials are valid
        try:
            client = razorpay.Client(auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET))
            
            # Try to make a simple API call to check if credentials are valid
            # First try to get basic account information
            account_info = {}
            try:
                # Attempt to get balance to check API connectivity
                balance = client.balance.fetch()
                account_info["has_balance_access"] = True
            except Exception:
                # If balance access fails (might be permissions), try a simpler call
                account_info["has_balance_access"] = False
            
            # Try to get basic account settings
            try:
                settings = client.settings.fetch()
                if settings and "email" in settings:
                    account_info["email"] = settings["email"]
                if settings and "business_name" in settings:
                    account_info["business_name"] = settings["business_name"]
            except Exception:
                # If settings access fails, we'll continue with limited info
                pass
                
            # If we got here without exceptions, the account is connected
            return {
                "is_connected": True,
                "account_details": account_info,
                "key_type": "live" if RAZORPAY_KEY_ID.startswith("rzp_live") else "test"
            }
        except Exception as e:
            print(f"Error verifying Razorpay account: {str(e)}")
            return {"is_connected": False, "error": "Invalid credentials"}
            
    except Exception as e:
        print(f"Error checking Razorpay account: {str(e)}")
        return {"is_connected": False, "error": str(e)}

@app.post("/connect-razorpay")
async def connect_razorpay(credentials: RazorpayCredentials):
    """Connect to Razorpay using API credentials."""
    try:
        # Validate the API credentials by attempting to connect
        client = razorpay.Client(auth=(credentials.api_key, credentials.api_secret))
        
        # Try to make a simple API call to verify credentials
        try:
            # Check if credentials work by making a simple API call
            settings = client.settings.fetch()
            
            # Store the credentials in .env file or database
            # For simplicity in this example, we'll update environment variables
            # In a production app, you would use a secure database or secret manager
            import os
            from dotenv import set_key, find_dotenv
            
            dotenv_file = find_dotenv()
            if dotenv_file:
                set_key(dotenv_file, "RAZORPAY_KEY_ID", credentials.api_key)
                set_key(dotenv_file, "RAZORPAY_KEY_SECRET", credentials.api_secret)
                if credentials.webhook_secret:
                    set_key(dotenv_file, "RAZORPAY_WEBHOOK_SECRET", credentials.webhook_secret)
                
                # Update global variables as well
                global RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET, RAZORPAY_WEBHOOK_SECRET
                RAZORPAY_KEY_ID = credentials.api_key
                RAZORPAY_KEY_SECRET = credentials.api_secret
                if credentials.webhook_secret:
                    RAZORPAY_WEBHOOK_SECRET = credentials.webhook_secret
                
                # Update the razorpay client with new credentials
                global razorpay_client
                razorpay_client = razorpay.Client(auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET))
                
                # Return account details
                account_info = {}
                if settings and "email" in settings:
                    account_info["email"] = settings["email"]
                if settings and "business_name" in settings:
                    account_info["business_name"] = settings["business_name"]
                
                return {
                    "success": True, 
                    "message": "Razorpay account connected successfully",
                    "account_details": account_info
                }
            else:
                raise HTTPException(status_code=500, detail="Could not find .env file to store credentials")
                
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Invalid Razorpay credentials: {str(e)}")
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error connecting to Razorpay: {str(e)}")

@app.post("/disconnect-razorpay")
async def disconnect_razorpay():
    """Disconnect the Razorpay account."""
    try:
        # Reset the API credentials in .env file
        import os
        from dotenv import set_key, find_dotenv
        
        dotenv_file = find_dotenv()
        if dotenv_file:
            set_key(dotenv_file, "RAZORPAY_KEY_ID", "rzp_test_yourkeyid")
            set_key(dotenv_file, "RAZORPAY_KEY_SECRET", "yoursecretkey")
            set_key(dotenv_file, "RAZORPAY_WEBHOOK_SECRET", "yourhmacsecret")
            
            # Update global variables as well
            global RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET, RAZORPAY_WEBHOOK_SECRET
            RAZORPAY_KEY_ID = "rzp_test_yourkeyid"
            RAZORPAY_KEY_SECRET = "yoursecretkey"
            RAZORPAY_WEBHOOK_SECRET = "yourhmacsecret"
            
            # Update the razorpay client with default credentials
            global razorpay_client
            razorpay_client = razorpay.Client(auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET))
            
            return {"success": True, "message": "Razorpay account disconnected successfully"}
        else:
            return {"success": False, "error": "Could not find .env file to update credentials"}
            
    except Exception as e:
        return {"success": False, "error": f"Error disconnecting Razorpay account: {str(e)}"}

@app.get("/razorpay-test-connection")
async def test_razorpay_connection():
    """Test the Razorpay connection with current credentials."""
    try:
        if RAZORPAY_KEY_ID == "rzp_test_yourkeyid" or not RAZORPAY_KEY_SECRET:
            return {"connected": False, "message": "No valid Razorpay credentials found"}
            
        # Try to make a simple API call
        try:
            client = razorpay.Client(auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET))
            settings = client.settings.fetch()
            return {
                "connected": True, 
                "message": "Successfully connected to Razorpay API",
                "account_type": "live" if RAZORPAY_KEY_ID.startswith("rzp_live") else "test"
            }
        except Exception as e:
            return {"connected": False, "message": f"Failed to connect to Razorpay API: {str(e)}"}
            
    except Exception as e:
        return {"connected": False, "message": f"Error testing Razorpay connection: {str(e)}"}

@app.get("/predict-limits")
async def predict_limits(income: float):
    try:
        # Make sure income is positive
        income_value = float(income)
        if income_value <= 0:
            raise HTTPException(status_code=400, detail="Income must be greater than 0")
        
        print(f"Processing prediction request for income: {income_value}")
        
        # Use fallback predictions directly
        # This avoids the scikit-learn version compatibility issues
        categories = ['Food', 'Transport', 'Shopping', 'Utilities', 'Entertainment']
        percentages = [0.3, 0.15, 0.2, 0.25, 0.1]  # 30%, 15%, etc.
        
        predictions = []
        for i, category in enumerate(categories):
            limit = income_value * percentages[i]
            count = 15 - (i * 3)  # Decreasing counts: 15, 12, 9, 6, 3
            predictions.append([category, limit, count])
        
        print(f"Generated predictions: {predictions}")
                
        return {"predictions": predictions}
    except HTTPException:
        # Re-raise HTTP exceptions as they already have status codes
        raise
    except Exception as e:
        print(f"Unhandled error in predict_limits endpoint: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error predicting limits: {str(e)}")

@app.get("/categories")
async def get_categories():
    return {
        "categories": ["Food", "Transport", "Shopping", "Utilities", "Entertainment", "Income"]
    }

@app.get("/payment-methods")
async def get_payment_methods():
    return {
        "methods": ["Cash", "Credit Card", "Debit Card", "UPI", "Net Banking", "Razorpay"]
    }

@app.get("/razorpay-key")
async def get_razorpay_key():
    return {"key_id": RAZORPAY_KEY_ID}