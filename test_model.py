import os
import sys
import traceback
import pandas as pd
import numpy as np

# Add the project root to the path
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.append(BASE_DIR)

print(f"Testing prediction model in {BASE_DIR}")
print("-" * 50)

# Check if model file exists
MODEL_PATH = os.path.join(BASE_DIR, "models", "limit_and_count_predictor.pkl")
print(f"Model path: {MODEL_PATH}")
print(f"Model exists: {os.path.exists(MODEL_PATH)}")
print(f"Model size: {os.path.getsize(MODEL_PATH) / (1024 * 1024):.2f} MB")
print("-" * 50)

# Try to import prediction function
try:
    from models.predict import predict_limits
    print("Successfully imported prediction function")
    
    # Try making predictions
    try:
        income = 50000
        print(f"Testing prediction with income: {income}")
        predictions = predict_limits(income)
        print("Predictions generated successfully:")
        for category, limit, count in predictions:
            print(f"  {category}: Limit = ₹{limit:.2f}, Count = {count:.2f}")
        
        print("\nPrediction test successful!")
    except Exception as e:
        print(f"Error making predictions: {str(e)}")
        traceback.print_exc()
    
except Exception as e:
    print(f"Error importing prediction function: {str(e)}")
    traceback.print_exc()
    
print("-" * 50)

# Try direct loading of the model
print("Attempting to load model directly:")
try:
    import joblib
    model = joblib.load(MODEL_PATH)
    print(f"Model loaded successfully, type: {type(model)}")
    
    # Try making a direct prediction
    try:
        # Sample input data
        categories = ['Food', 'Transport', 'Shopping', 'Utilities', 'Entertainment']
        sample_data = {
            'monthly_income': [50000],
            'category_Food': [1],
            'category_Transport': [0],
            'category_Shopping': [0],
            'category_Utilities': [0],
            'category_Entertainment': [0]
        }
        sample_df = pd.DataFrame(sample_data)
        
        # Make prediction
        prediction = model.predict(sample_df)[0]
        print(f"Direct prediction for Food: {prediction}")
    except Exception as e:
        print(f"Error making direct prediction: {str(e)}")
        traceback.print_exc()
except Exception as e:
    print(f"Error loading model: {str(e)}")
    traceback.print_exc()

print("-" * 50)
print("Test completed") 