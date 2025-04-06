import csv
import random
from datetime import datetime, timedelta

# Categories
CATEGORIES = ['Food', 'Transport', 'Shopping', 'Utilities', 'Entertainment']

# Generate random transactions for the past month
def generate_transactions(count=30):
    transactions = []
    today = datetime.now()
    
    for i in range(1, count + 1):
        # Random date within the last 30 days
        days_ago = random.randint(0, 30)
        date = (today - timedelta(days=days_ago)).strftime("%Y-%m-%d")
        
        # Random category and amount
        category = random.choice(CATEGORIES)
        
        # Different range of amounts for different categories
        if category == "Food":
            amount = random.randint(100, 500)
        elif category == "Transport":
            amount = random.randint(50, 300)
        elif category == "Shopping":
            amount = random.randint(500, 2000)
        elif category == "Utilities":
            amount = random.randint(200, 1000)
        else:  # Entertainment
            amount = random.randint(300, 800)
            
        transactions.append({
            "id": i,
            "category": category,
            "amount": amount,
            "created_at": date
        })
    
    return transactions

# Create and save demo transactions
transactions = generate_transactions()

# Write to CSV
with open("classified_transactions.csv", "w", newline="") as f:
    writer = csv.DictWriter(f, fieldnames=["id", "category", "amount", "created_at"])
    writer.writeheader()
    writer.writerows(transactions)

print(f"Generated {len(transactions)} demo transactions and saved to classified_transactions.csv") 