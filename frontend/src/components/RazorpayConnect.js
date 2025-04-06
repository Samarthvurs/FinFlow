import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  Alert,
  Paper,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Switch,
  FormControlLabel,
} from '@mui/material';
import axios from 'axios';

function RazorpayConnect({ onConnected }) {
  const [activeStep, setActiveStep] = useState(0);
  const [apiKey, setApiKey] = useState('');
  const [apiSecret, setApiSecret] = useState('');
  const [webhookSecret, setWebhookSecret] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [accountDetails, setAccountDetails] = useState(null);
  const [showSecrets, setShowSecrets] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);

  useEffect(() => {
    // Check if Razorpay is already connected
    checkConnection();
  }, []);

  const checkConnection = async () => {
    setLoading(true);
    try {
      const response = await axios.get('http://localhost:8000/razorpay-account');
      if (response.data && response.data.is_connected) {
        setIsConnected(true);
        setAccountDetails(response.data.account_details);
      }
    } catch (err) {
      console.error('Error checking Razorpay connection:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async () => {
    if (!apiKey || !apiSecret) {
      setError('API Key and Secret are required');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await axios.post('http://localhost:8000/connect-razorpay', {
        api_key: apiKey,
        api_secret: apiSecret,
        webhook_secret: webhookSecret
      });

      if (response.data.success) {
        setSuccess('Razorpay account connected successfully!');
        setActiveStep(2);
        setIsConnected(true);
        setAccountDetails(response.data.account_details);
        if (onConnected && typeof onConnected === 'function') {
          onConnected();
        }
      } else {
        setError(response.data.error || 'Failed to connect Razorpay account');
      }
    } catch (err) {
      console.error('Error connecting Razorpay:', err);
      setError(err.response?.data?.detail || 'Failed to connect to Razorpay. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    setOpenDialog(false);
    setLoading(true);
    
    try {
      const response = await axios.post('http://localhost:8000/disconnect-razorpay');
      if (response.data.success) {
        setSuccess('Razorpay account disconnected');
        setIsConnected(false);
        setAccountDetails(null);
        setActiveStep(0);
        setApiKey('');
        setApiSecret('');
        setWebhookSecret('');
      }
    } catch (err) {
      console.error('Error disconnecting Razorpay:', err);
      setError('Failed to disconnect Razorpay account');
    } finally {
      setLoading(false);
    }
  };

  const steps = ['Get API Credentials', 'Connect Account', 'Verification'];

  return (
    <Paper sx={{ p: 3, mb: 4 }}>
      <Typography variant="h5" gutterBottom>
        Connect Razorpay Account
      </Typography>

      {!isConnected ? (
        <>
          <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          {activeStep === 0 && (
            <Box>
              <Typography variant="body1" gutterBottom>
                To connect your Razorpay account, you'll need to get API credentials from the Razorpay Dashboard.
              </Typography>
              
              <Box sx={{ my: 3 }}>
                <Typography variant="subtitle1" fontWeight="bold">How to get your API credentials:</Typography>
                <ol>
                  <li>Log in to your Razorpay Dashboard at <a href="https://dashboard.razorpay.com/" target="_blank" rel="noopener noreferrer">dashboard.razorpay.com</a></li>
                  <li>Go to Settings &gt; API Keys</li>
                  <li>Generate a new API key pair</li>
                  <li>Copy the Key ID and Secret</li>
                </ol>
              </Box>
              
              <Button
                variant="contained"
                color="primary"
                onClick={() => setActiveStep(1)}
              >
                I have my API credentials
              </Button>
            </Box>
          )}

          {activeStep === 1 && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Typography variant="body1" gutterBottom>
                Enter your Razorpay API credentials below.
              </Typography>
              
              <TextField
                label="API Key ID"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                fullWidth
                margin="normal"
                placeholder="rzp_test_xxxxxxxxxxxx or rzp_live_xxxxxxxxxxxx"
              />
              
              <TextField
                label="API Secret"
                value={apiSecret}
                onChange={(e) => setApiSecret(e.target.value)}
                fullWidth
                margin="normal"
                type={showSecrets ? "text" : "password"}
                placeholder="Enter your Razorpay API Secret"
              />
              
              <TextField
                label="Webhook Secret (Optional)"
                value={webhookSecret}
                onChange={(e) => setWebhookSecret(e.target.value)}
                fullWidth
                margin="normal"
                type={showSecrets ? "text" : "password"}
                placeholder="Enter webhook secret if you have one"
                helperText="This is optional and only needed if you've configured webhooks"
              />
              
              <FormControlLabel
                control={
                  <Switch 
                    checked={showSecrets} 
                    onChange={() => setShowSecrets(!showSecrets)} 
                  />
                }
                label="Show secrets"
              />
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                <Button
                  variant="outlined"
                  onClick={() => setActiveStep(0)}
                >
                  Back
                </Button>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleConnect}
                  disabled={loading || !apiKey || !apiSecret}
                >
                  {loading ? <CircularProgress size={24} /> : 'Connect Account'}
                </Button>
              </Box>
            </Box>
          )}

          {activeStep === 2 && (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', my: 3 }}>
              <Typography variant="h6" gutterBottom>
                Razorpay Account Connected!
              </Typography>
              
              <Typography variant="body1" align="center" sx={{ mt: 2 }}>
                Your Razorpay account has been successfully connected to FinFlow. You can now process payments and track transactions.
              </Typography>
              
              <Button
                variant="contained"
                color="primary"
                sx={{ mt: 3 }}
                onClick={() => {
                  if (onConnected && typeof onConnected === 'function') {
                    onConnected();
                  }
                }}
              >
                Start Using Razorpay
              </Button>
            </Box>
          )}

          {error && (
            <Alert severity="error" sx={{ mt: 3 }}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity="success" sx={{ mt: 3 }}>
              {success}
            </Alert>
          )}
        </>
      ) : (
        <Box>
          <Alert severity="success" sx={{ mb: 3 }}>
            Your Razorpay account is connected
          </Alert>
          
          {accountDetails && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" fontWeight="bold">Account Details:</Typography>
              <Typography><strong>Account Name:</strong> {accountDetails.business_name || 'Not available'}</Typography>
              <Typography><strong>Email:</strong> {accountDetails.email || 'Not available'}</Typography>
              <Typography><strong>Account Type:</strong> {apiKey?.startsWith('rzp_live') ? 'Live' : 'Test'}</Typography>
              <Typography><strong>Webhook Configured:</strong> {webhookSecret ? 'Yes' : 'No'}</Typography>
            </Box>
          )}
          
          <Button
            variant="outlined"
            color="error"
            onClick={() => setOpenDialog(true)}
          >
            Disconnect Account
          </Button>
        </Box>
      )}
      
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle>Confirm Disconnection</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to disconnect your Razorpay account? You will need to reconnect it to use Razorpay features.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button onClick={handleDisconnect} color="error">Disconnect</Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}

export default RazorpayConnect; 