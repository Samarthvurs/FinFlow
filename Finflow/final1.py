import pandas as pd

def process_transactions(csv_path, initial_balance=100000):
    # Load data
    df = pd.read_csv(csv_path)

    # Try to identify date column
    date_col = next((col for col in df.columns if 'date' in col.lower()), None)
    if date_col:
        df[date_col] = pd.to_datetime(df[date_col], errors='coerce')
        df = df.sort_values(by=date_col)
        df['Month'] = df[date_col].dt.to_period('M')
        df['Week'] = df[date_col].dt.to_period('W')
    else:
        raise ValueError("No valid date column found in the CSV.")

    # Validate Amount column
    if 'Amount' not in df.columns:
        raise ValueError("The 'Amount' column is missing in the CSV.")

    # Running balance
    df['Balance'] = initial_balance - df['Amount'].cumsum()

    # Stats dictionary to return
    stats = {
        'total_spent': df['Amount'].sum(),
        'average_spent': df['Amount'].mean(),
        'max_transaction': df['Amount'].max(),
        'min_transaction': df['Amount'].min(),
        'category_counts': None,
        'category_totals': None,
        'monthly_spending': None,
        'weekly_spending': None,
    }

    # Category stats if column exists
    if 'Category' in df.columns:
        stats['category_counts'] = df['Category'].value_counts().to_dict()
        stats['category_totals'] = df.groupby('Category')['Amount'].sum().to_dict()

    # Time-based summaries
    stats['monthly_spending'] = df.groupby('Month')['Amount'].sum().to_dict()
    stats['weekly_spending'] = df.groupby('Week')['Amount'].sum().to_dict()

    return df, stats
from stats_processor import process_transactions

csv_path = 'classified_transactions.csv'
df, stats = process_transactions(csv_path)

# Example usage
print("💸 Total Spent:", stats['total_spent'])
print("📊 Monthly Spend:", stats['monthly_spending'])
print("📂 Spend by Category:", stats['category_totals'])

# Optionally write the new file with balance column
df.to_csv("classified_transactions_with_balance.csv", index=False)
