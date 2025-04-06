import joblib
import pandas as pd
import os
import numpy as np
import traceback
import warnings

# Suppress scikit-learn version warnings
warnings.filterwarnings("ignore", category=UserWarning)

# Define paths
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODEL_PATH = os.path.join(BASE_DIR, "models", "limit_and_count_predictor.pkl")

def load_model():
    """Load the prediction model."""
    try:
        if not os.path.exists(MODEL_PATH):
            raise FileNotFoundError(f"Model file not found at {MODEL_PATH}")
            
        # Load the model with error handling
        try:
            with warnings.catch_warnings():
                warnings.simplefilter("ignore")
                model = joblib.load(MODEL_PATH)
            return model
        except Exception as e:
            print(f"Error loading model: {str(e)}")
            traceback.print_exc()
            raise ValueError(f"Failed to load model: {str(e)}")
    except Exception as e:
        print(f"Error in load_model: {str(e)}")
        raise

def predict_limits(income):
    """Predict spending limits and transaction counts based on income."""
    try:
        # Convert income to float
        income_value = float(income)
        
        # Define categories and their spending percentage of income
        categories = ['Food', 'Transport', 'Shopping', 'Utilities', 'Entertainment']
        percentages = {
            'Food': 0.3,        # 30% of income
            'Transport': 0.15,  # 15% of income
            'Shopping': 0.2,    # 20% of income
            'Utilities': 0.25,  # 25% of income
            'Entertainment': 0.1 # 10% of income
        }
        
        # Define expected transaction counts per month
        counts = {
            'Food': 15,         # daily/bi-daily purchases
            'Transport': 12,    # commute and occasional trips
            'Shopping': 9,      # bi-weekly purchases
            'Utilities': 6,     # monthly bills
            'Entertainment': 3  # occasional recreation
        }
        
        # Generate predictions
        results = []
        for category in categories:
            limit = income_value * percentages.get(category, 0.1)
            count = counts.get(category, 5)
            results.append([category, limit, count])
            
        print(f"Generated predictions for income {income_value}")
        return results
        
    except Exception as e:
        print(f"Error in predict_limits: {e}")
        traceback.print_exc()
        
        # Fallback predictions if anything fails
        fallback = []
        cats = ['Food', 'Transport', 'Shopping', 'Utilities', 'Entertainment']
        percs = [0.3, 0.15, 0.2, 0.25, 0.1]
        
        for i, cat in enumerate(cats):
            try:
                inc = float(income)
            except:
                inc = 50000  # Default income if conversion fails
                
            limit = inc * percs[i]
            count = 15 - (i * 3)
            fallback.append([cat, limit, count])
            
        return fallback

def get_category_percentage(category):
    """Get a reasonable percentage of income for a category."""
    percentages = {
        'Food': 0.3,
        'Transport': 0.15,
        'Shopping': 0.2,
        'Utilities': 0.25,
        'Entertainment': 0.1
    }
    return percentages.get(category, 0.1)

def get_category_count(category):
    """Get a reasonable expected count of transactions for a category."""
    counts = {
        'Food': 15,
        'Transport': 10,
        'Shopping': 5,
        'Utilities': 4,
        'Entertainment': 3
    }
    return counts.get(category, 5)

def generate_fallback_predictions(income, categories):
    """Generate fallback predictions based on percentages."""
    results = []
    income_value = float(income)
    
    for category in categories:
        limit = income_value * get_category_percentage(category)
        count = get_category_count(category)
        results.append([category, limit, count])
    
    print(f"Generated fallback predictions for income {income_value}")
    return results