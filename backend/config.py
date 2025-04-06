import os
from dotenv import load_dotenv

# Try to load environment variables from .env file
load_dotenv()

# Define paths relative to the project root
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CSV_PATH = os.path.join(BASE_DIR, "backend", "data", "classified_transactions.csv")
MODEL_PATH = os.path.join(BASE_DIR, "models", "limit_and_count_predictor.pkl")

# Razorpay Configuration (replace with your actual keys in production)
# In production, use environment variables for these values
RAZORPAY_KEY_ID = os.getenv("RAZORPAY_KEY_ID", "rzp_test_yourkeyid")
RAZORPAY_KEY_SECRET = os.getenv("RAZORPAY_KEY_SECRET", "yoursecretkey")
RAZORPAY_WEBHOOK_SECRET = os.getenv("RAZORPAY_WEBHOOK_SECRET", "yourhmacsecret")

# Application settings
APP_NAME = "FinFlow"
CURRENCY = "INR" 