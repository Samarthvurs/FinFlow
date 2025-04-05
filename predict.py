import joblib
import pandas as pd
import os

# Load model with a verified path
def load_model():
    model_path = "limit_and_count_predictor.pkl"
    if not os.path.exists(model_path):
        raise FileNotFoundError(f"Model file not found at {model_path}. Please ensure it's in the correct location.")
    return joblib.load(model_path)

def predict_limits(income):
    categories = ['Food', 'Transport', 'Shopping', 'Utilities', 'Entertainment']
    results = []

    for category in categories:
        data = {f'category_{cat}': [1 if cat == category else 0] for cat in categories}
        data['monthly_income'] = [income]
        input_df = pd.DataFrame(data)

        # Ensure consistent column order
        ordered_columns = [f'category_{cat}' for cat in sorted(categories)] + ['monthly_income']
        input_df = input_df.reindex(columns=ordered_columns, fill_value=0)

        # Perform predictions
        prediction = model.predict(input_df)[0]
        results.append((category, prediction[0], prediction[1]))

    return results

# Main program
if __name__ == "__main__":
    try:
        # Load the model
        model = load_model()
        
        # Get user input
        income = int(input("💬 Enter your monthly income in ₹: "))

        # Predict limits
        predictions = predict_limits(income)

        # Display results
        print(f"\n💡 Smart Spending Predictions for ₹{income} per month:")
        for category, limit, count in predictions:
            print(f"📂 {category:13} → Monthly Limit: ₹{limit:.2f} | ~{round(count)} transactions")

    except FileNotFoundError as e:
        print(f"❌ {e}")
    except ValueError:
        print("❌ Invalid input. Please enter a valid number.")