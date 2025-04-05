import pandas as pd

def clean_transaction_data(df):
    df = df[['id', 'amount', 'currency', 'method', 'description', 'created_at']].copy()
    df['amount'] = df['amount'] / 100  # convert from paise to rupees
    df['created_at'] = pd.to_datetime(df['created_at'], unit='s')
    df['description'] = df['description'].fillna("No description")
    return df
