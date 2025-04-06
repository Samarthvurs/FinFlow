#!/usr/bin/env python3
"""
Process recurring expenses for FinFlow
This script checks for recurring expenses that are due today and adds them to the transactions
Run as a daily scheduled task for automatic expense tracking
"""

import csv
import os
import json
import sqlite3
from datetime import datetime, timedelta

# Paths
CSV_PATH = "classified_transactions.csv"
DB_PATH = "finflow.db"

def read_csv():
    """Read the transactions CSV file"""
    transactions = []
    try:
        with open(CSV_PATH, "r", newline="") as f:
            reader = csv.DictReader(f)
            for row in reader:
                transactions.append(row)
    except Exception as e:
        print(f"Error reading CSV: {e}")
    return transactions

def write_transaction(user_id, name, category, amount):
    """Add a transaction to the CSV file"""
    transactions = read_csv()
    
    # Generate new ID
    new_id = max([int(txn["id"]) for txn in transactions]) + 1 if transactions else 1
    
    # Create new transaction
    now = datetime.now().strftime("%Y-%m-%d")
    new_transaction = {
        "id": new_id,
        "category": category,
        "amount": amount,
        "created_at": now,
        "payment_id": "",
        "payment_status": "recurring",
        "description": f"Recurring: {name}",
        "source": "recurring",
        "user_id": user_id
    }
    
    # Append to CSV
    with open(CSV_PATH, "a", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=["id", "category", "amount", "created_at", "payment_id", "payment_status", "description", "source", "user_id"])
        if os.path.getsize(CSV_PATH) == 0:
            writer.writeheader()
        writer.writerow(new_transaction)
    
    return new_transaction

def get_recurring_expenses():
    """Get recurring expenses from all users"""
    if not os.path.exists(DB_PATH):
        print("Database not found")
        return []
    
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    try:
        cursor.execute("SELECT id, monthly_income FROM users")
        users = cursor.fetchall()
        
        all_expenses = []
        for user in users:
            user_id = user["id"]
            
            # Get recurring expenses from recurring_expenses table
            cursor.execute("SELECT * FROM recurring_expenses WHERE user_id = ?", (user_id,))
            expenses = cursor.fetchall()
            
            for expense in expenses:
                all_expenses.append(dict(expense))
        
        return all_expenses
    except sqlite3.OperationalError:
        # Table doesn't exist yet
        return []
    finally:
        conn.close()

def process_expenses():
    """Process expenses that are due today"""
    today = datetime.now().strftime("%Y-%m-%d")
    day_of_month = datetime.now().day
    
    expenses = get_recurring_expenses()
    processed = 0
    
    for expense in expenses:
        # Check if this expense should be processed today
        if int(expense["day_of_month"]) == day_of_month:
            # Add transaction
            write_transaction(
                expense["user_id"],
                expense["name"],
                expense["category"],
                expense["amount"]
            )
            processed += 1
            print(f"Processed recurring expense: {expense['name']} (₹{expense['amount']})")
    
    print(f"Total processed: {processed}")

if __name__ == "__main__":
    print("FinFlow - Processing recurring expenses")
    print(f"Date: {datetime.now().strftime('%Y-%m-%d')}")
    process_expenses() 