# FinFlow
An AI-based Expenditure tracking software

## Overview
FinFlow is a web-based financial tracking application that helps users monitor their spending, categorize transactions, and get AI-powered spending recommendations based on their income.

## Features
- Track and categorize financial transactions
- View weekly and monthly spending summaries
- Get personalized spending recommendations using machine learning
- Simple and intuitive user interface

## Installation
1. Clone this repository
2. Install the required dependencies:
   ```
   pip install -r requirements.txt
   ```
3. Generate demo data (optional):
   ```
   python generate_demo_data.py
   ```

## Running the Application
1. Start the Flask server:
   ```
   python app.py
   ```
2. Open your browser and navigate to `http://localhost:5000`

## Project Structure
- `app.py`: Main application file with web routes and API endpoints
- `templates/`: HTML template files for the web interface
- `static/`: Static assets like CSS and images
- `generate_demo_data.py`: Script to generate sample transaction data
- `limit_and_count_predictor.pkl`: Machine learning model for spending recommendations

## Technologies Used
- Flask: Web framework
- Pandas: Data processing
- scikit-learn: Machine learning for spending recommendations
- HTML/CSS/JavaScript: Front-end interface
