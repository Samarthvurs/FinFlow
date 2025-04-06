# FinFlow - Smart Financial Management

A personal finance management application focused on helping users track expenses, set budget limits, and receive insights into their spending patterns.

## Features

### User Authentication
- Secure login and signup
- User profile management
- First-time user onboarding flow

### Financial Management
- **Dashboard**: Displays account balance, upcoming income and expenses, summary sections, and spending progress
- **Spending Limits**: Set monthly spending limits for different categories
- **AI Recommendations**: Get AI-recommended spending limits based on income
- **Transaction Tracking**: Record and categorize all financial transactions

### Analytics and Insights
- **Weekly Summary**: Track weekly expenses vs limits with progress bars and category-wise analysis
- **Monthly Summary**: Monitor monthly spending patterns with detailed breakdown by category
- **Points System**: Earn reward points for responsible financial habits:
  - Staying within budget limits (weekly and monthly)
  - Consistent tracking of expenses
  - Category-wise performance
  - Points are calculated at the end of each week and month

### Reward System
- Points awarded for good financial habits
- Performance tracking over time
- Weekly and monthly bonus point opportunities

## Dashboard Layout
The dashboard provides a comprehensive overview of the user's financial status:
- **Account Balance**: Displayed prominently at the top
- **Transactions Section**: Shows upcoming income and expenses
- **Summary Section**: Quick access to Weekly and Monthly summaries
- **Spending Progress**: Visual representation of spending against set limits

## Weekly and Monthly Summaries
- **Budget Progress**: Visual indicators showing spending against limits
- **Category Performance**: Detailed breakdown of spending by category
- **Points Breakdown**: Shows how points are being earned and total potential points
- **Financial Insights**: Personalized tips based on spending patterns
- **Status Tracking**: Color-coded indicators for budget status (good, warning, over)

## Technology Stack
- **Frontend**: React.js with Material UI
- **Backend**: Python with FastAPI
- **Authentication**: JWT-based authentication
- **Database**: SQLite
- **Prediction**: Scikit-learn based models for limit predictions
- **Payments Integration**: Razorpay payment gateway for financial transactions

## Getting Started

### Prerequisites
- Node.js and npm
- Python 3.7 or higher
- pip package manager

### Installation
1. Clone the repository
2. Set up the backend:
   ```
   cd backend
   pip install -r requirements.txt
   python main.py
   ```
3. Set up the frontend:
   ```
   cd frontend
   npm install
   npm start
   ```

## User Onboarding Process
1. **Sign Up**: Users create an account with personal details, phone number, and preferred payment methods
2. **Income Setup**: Users provide monthly income information
3. **Spending Limits**: Users set spending limits (manually or using AI recommendations)
4. **Dashboard**: After setup, users are directed to the dashboard to begin tracking their finances

## Future Enhancements
- Mobile application development
- Integration with multiple bank accounts
- Advanced analytics and forecasting
- Personalized financial tips and recommendations
- Social features for financial goal sharing

## License
This project is licensed under the MIT License - see the LICENSE file for details.

## Quick Start

The easiest way to start both frontend and backend servers is to use the included startup script:

```bash
# On Windows
startup.bat

# On macOS/Linux
chmod +x startup.sh  # Make the script executable (first time only)
./startup.sh
```

This script will:
1. Create a Python virtual environment (if it doesn't exist)
2. Install all required Python packages
3. Start the backend server on http://localhost:8000
4. Install frontend dependencies (if not already installed)
5. Start the frontend server on http://localhost:3000

## Manual Setup

If you prefer to start the servers manually, follow these steps:

### Backend

```bash
# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows
venv\Scripts\activate

# On macOS/Linux
# source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run the server
python main.py
```

The backend server will be available at http://localhost:8000

### Frontend

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start development server
npm start
```

The frontend will be available at http://localhost:3000

## Features

- **Transaction Tracking**: Log and categorize your financial transactions
- **Expense Analysis**: Visualize your spending patterns across different categories
- **AI-Powered Recommendations**: Get personalized spending limits based on your income
- **User-Friendly Interface**: Simple and intuitive design for easy financial management
- **Razorpay Integration**: Connect with Razorpay to automatically track payments and transactions

## Razorpay Integration

FinFlow integrates with Razorpay to help you track your transactions. To set up Razorpay:

1. Create a Razorpay account at [razorpay.com](https://razorpay.com)
2. Navigate to the Razorpay section in FinFlow
3. Follow the step-by-step guide to connect your account:
   - Get your API keys from the Razorpay Dashboard (Settings > API Keys)
   - Enter the Key ID and Secret Key in the connection form
   - Optionally provide your Webhook Secret if you have webhooks configured

Once connected, you can:
- Make payments through Razorpay
- Automatically record transactions in FinFlow
- See your payment history
- Reconcile transactions with your spending categories

### Manual Setup (Alternative)

If you prefer to set up manually instead of using the UI:
1. Copy `.env.example` to `.env` and update with your Razorpay credentials
2. Restart the application

## API Endpoints

- `/transactions` - Get all transactions or add a new one
- `/predict-limits` - Get AI-powered spending limit recommendations
- `/categories` - List of supported expense categories
- `/payment-methods` - List of supported payment methods
- `/create-order` - Create a new Razorpay order
- `/verify-payment` - Verify a Razorpay payment
- `/razorpay-transactions` - Get Razorpay transactions
- `/razorpay-webhook` - Webhook for Razorpay events
- `/razorpay-account` - Check if Razorpay account is connected
- `/connect-razorpay` - Connect a Razorpay account with API credentials
- `/disconnect-razorpay` - Disconnect the Razorpay account
- `/razorpay-test-connection` - Test Razorpay API connection

## Project Structure

```
FinFlow/
│
├── backend/              # Backend API
│   ├── __init__.py       # Package initialization
│   ├── backend.py        # FastAPI application
│   ├── data/             # CSV storage
│   ├── models/           # ML models
│   └── pipelines/        # Data processing
│
├── frontend/             # React frontend
│   ├── public/           # Static assets
│   └── src/              # React components and pages
│
├── models/               # Prediction models
│   ├── predict.py        # Prediction logic
│   └── limit_and_count_predictor.pkl
│
├── requirements.txt      # Python dependencies
└── main.py               # Entry point for backend
```

## Technology Stack

- **Backend**: FastAPI, Pandas, ML models
- **Frontend**: React, Material-UI, Recharts
- **Data Storage**: CSV (with future database integration) 