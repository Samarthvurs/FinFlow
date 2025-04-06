from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import pandas as pd
import os

CSV_PATH = "/mnt/data/classified_transactions.csv"

app = FastAPI()

# Allow requests from frontend (React)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Data model
class Transaction(BaseModel):
    category: str
    amount: float

@app.get("/transactions")
def get_transactions():
    if os.path.exists(CSV_PATH):
        df = pd.read_csv(CSV_PATH)
        return df.to_dict(orient="records")
    return []

@app.post("/add-transaction")
def add_transaction(txn: Transaction):
    # Read existing CSV
    if os.path.exists(CSV_PATH):
        df = pd.read_csv(CSV_PATH)
    else:
        df = pd.DataFrame(columns=["id", "category", "amount"])
    
    # Generate new ID
    new_id = df["id"].max() + 1 if not df.empty else 1

    # Add new transaction
    new_row = {"id": int(new_id), "category": txn.category, "amount": txn.amount}
    df = pd.concat([df, pd.DataFrame([new_row])], ignore_index=True)

    # Save back to CSV
    df.to_csv(CSV_PATH, index=False)

    return {"message": "Transaction added", "data": new_row}
