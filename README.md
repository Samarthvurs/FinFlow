# FinFlow - AI-Based Expenditure Tracking Software

FinFlow is a web-based application that helps you track and manage your finances with AI-powered insights and Razorpay integration.

## New & Enhanced Features

- **Progressive Web App (PWA)**: Install FinFlow on your mobile or desktop device for offline access
- **True User Authentication**: Secure backend authentication with session management
- **Automated Transaction Import**: Connect Razorpay to automatically import your transactions
- **Auto-categorization**: Smart transaction categorization based on descriptions
- **Recurring Expenses**: Set up and track monthly recurring expenses
- **Data Persistence**: Data stored securely in SQLite database and protected with password hashing

## Features

- **Expenditure Tracking**: Monitor your spending by category
- **AI-Powered Insights**: Get personalized spending recommendations based on your income
- **Razorpay Integration**: Connect your Razorpay account to automatically import transactions
- **Visual Analytics**: View your spending patterns with interactive charts
- **Budget Management**: Set monthly expenditure limits and track your remaining budget

## Quick Start

### Running the Application

1. **Double-click** the `run_finflow.bat` file to start the application
2. Open your browser and go to **http://127.0.0.1:5000**
3. Create an account or log in to start tracking your finances

### First-time Setup

When you sign up for the first time:

1. Enter your personal details and monthly income
2. You'll be guided to set your monthly expenditure limit (using AI or manually)
3. Connect your Razorpay account to import your transactions automatically (optional)
4. Set up recurring expenses to automatically track regular bills
5. You'll be taken to your financial dashboard

## Pages Overview

- **Home**: Overview of your financial status
- **Weekly Summary**: Detailed breakdown of your weekly spending with category chart
- **Monthly Summary**: Monthly spending overview with AI recommendations
- **Connect Razorpay**: Link your Razorpay account and sync transactions

## Using as a Mobile App

1. Open FinFlow in Chrome on your mobile device
2. Tap the menu icon (three dots)
3. Select "Add to Home Screen"
4. FinFlow will now be available as an app on your device with offline functionality

## Automatic Expense Tracking

To enable automatic processing of recurring expenses:
1. Set up your recurring expenses in the app
2. Schedule `process_recurring.py` to run daily:
   - Windows: Use Task Scheduler
   - Linux/Mac: Use cron

## Requirements

- Python 3.6 or higher
- Flask
- SQLite
- A modern web browser

## Manual Setup (if not using run_finflow.bat)

```bash
# Install required packages
pip install -r requirements.txt

# Run the application
python simple_app.py
```

## Data Storage

- Transaction data is stored in a CSV file
- User accounts and authentication data stored in SQLite database
- Razorpay credentials stored securely with basic encryption
- Recurring expenses synchronized with user accounts

## Security Note

While this version includes improved security features like password hashing and session management, it's still designed for personal use. For production use, implement HTTPS, additional security measures, and proper data backup procedures.

## Note for Developers

This is a demo application using client-side storage for session management. For production use, implement proper backend authentication and secure storage.
