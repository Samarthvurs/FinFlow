# fetch_data_mock.py

import pandas as pd
from datetime import datetime, timedelta
import random

def fetch_mock_data(num_records=10):
    methods = ["card", "upi", "netbanking", "wallet"]
    descriptions = [
        "Starbucks Coffee", "Amazon Purchase", "Swiggy Order",
        "Zomato", "Uber Ride", "Netflix Subscription",
        "Recharge", "Electricity Bill", "BigBasket", "PhonePe"
    ]
    
    data = []
    now = datetime.now()

    for i in range(num_records):
        created_at = int((now - timedelta(days=random.randint(0, 30))).timestamp())
        amount = random.randint(1000, 50000)  # in paise
        entry = {
            "id": f"pay_mock_{i}",
            "amount": amount,
            "currency": "INR",
            "method": random.choice(methods),
            "description": random.choice(descriptions),
            "created_at": created_at
        }
        data.append(entry)

    return pd.DataFrame(data)
