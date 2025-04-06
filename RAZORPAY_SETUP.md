# Razorpay Integration Guide for FinFlow

This guide will help you set up and use the Razorpay payment gateway integration in the FinFlow application.

## Getting Razorpay Keys

1. Sign up for a Razorpay account at [https://razorpay.com](https://razorpay.com)
2. After signing up and logging in, navigate to the Dashboard
3. Go to Settings > API Keys
4. Generate a new API key pair
5. You will receive a Key ID and a Secret Key

## Setting up the keys in FinFlow

### Option 1: Environment Variables (Recommended for Production)

Set the following environment variables:

```
RAZORPAY_KEY_ID=your_key_id_here
RAZORPAY_KEY_SECRET=your_key_secret_here
```

### Option 2: .env File (Development)

1. Navigate to the `backend` directory
2. Edit the `.env` file with your Razorpay credentials:

```
RAZORPAY_KEY_ID=your_key_id_here
RAZORPAY_KEY_SECRET=your_key_secret_here
```

## Using Test Keys

If you're in development mode, you can use Razorpay test keys:

- Test Key ID: `rzp_test_FxeI4gN0A2CTnw`
- Test Secret Key: `2Pj3irpoYaQzYIxVpkbBgW0f`

These keys are already included in the .env file but should be replaced with your actual keys for production.

## Testing the Integration

1. Start the application with `./startup.bat` or `./startup.sh`
2. Navigate to the "Razorpay" section in the sidebar
3. Fill in the payment form and click "Pay with Razorpay"
4. For test payments, use the following card details:
   - Card Number: 4111 1111 1111 1111
   - Expiry: Any future date
   - CVV: Any 3 digits
   - Name: Any name

## Syncing Transactions

Click the "Sync Razorpay Transactions" button in the Razorpay page to import your recent payment transactions into FinFlow.

## Troubleshooting

If you encounter issues with the Razorpay integration:

1. Check that your API keys are correctly set up
2. Ensure the backend server is running
3. Check the browser console for any JavaScript errors
4. Verify that the Razorpay script is loading correctly

For further assistance, refer to the [Razorpay Documentation](https://razorpay.com/docs/). 