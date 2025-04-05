from fastapi import APIRouter, HTTPException
import razorpay
from app.utils import validate_api_keys

payments_routes = APIRouter()

razorpay_client = razorpay.Client(auth=("YOUR_API_KEY_ID", "YOUR_API_SECRET"))

@payments_routes.get("/fetch-transactions")
def fetch_transactions():
    try:
        payments = razorpay_client.payment.all({"status": "captured", "count": 100})
        return {"transactions": payments["items"]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching transactions: {str(e)}")