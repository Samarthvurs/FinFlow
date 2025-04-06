import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  Card,
  CardContent,
  Alert,
  CircularProgress,
  Divider,
  Paper,
  List,
  ListItem,
  ListItemText,
  Chip,
  Grid,
  FormControl,
  InputLabel,
  OutlinedInput,
  InputAdornment,
  IconButton
} from '@mui/material';
import axios from 'axios';
import { Visibility, VisibilityOff } from '@mui/icons-material';

function loadRazorpayScript() {
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => {
      resolve(true);
    };
    script.onerror = () => {
      resolve(false);
    };
    document.body.appendChild(script);
  });
}

function RazorpayIntegration({ onConnect, isFirstSetup = false }) {
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [razorpayKey, setRazorpayKey] = useState('');
  const [razorpayTransactions, setRazorpayTransactions] = useState([]);
  const [loadingTransactions, setLoadingTransactions] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionLoading, setConnectionLoading] = useState(true);
  
  // Connection form state
  const [apiKey, setApiKey] = useState('');
  const [apiSecret, setApiSecret] = useState('');
  const [showSecret, setShowSecret] = useState(false);
  const [webhookSecret, setWebhookSecret] = useState('');
  const [connectLoading, setConnectLoading] = useState(false);

  useEffect(() => {
    // Fetch Razorpay key and connection status when component mounts
    const fetchData = async () => {
      try {
        // Check connection status
        const accountResponse = await axios.get('http://localhost:8000/razorpay-account');
        const isConnected = accountResponse.data && accountResponse.data.is_connected;
        setIsConnected(isConnected);
        
        if (isConnected) {
          // If connected, get the key and transactions
          const keyResponse = await axios.get('http://localhost:8000/razorpay-key');
          setRazorpayKey(keyResponse.data.key_id);
          fetchTransactions();
        }
      } catch (err) {
        console.error('Error fetching Razorpay data:', err);
        setError('Failed to load Razorpay configuration. Please try again later.');
      } finally {
        setConnectionLoading(false);
      }
    };

    fetchData();
  }, []);

  const fetchTransactions = async () => {
    setLoadingTransactions(true);
    try {
      const response = await axios.get('http://localhost:8000/razorpay-transactions');
      setRazorpayTransactions(response.data);
    } catch (err) {
      console.error('Error fetching Razorpay transactions:', err);
    } finally {
      setLoadingTransactions(false);
    }
  };

  const handlePayment = async () => {
    if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount greater than 0');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // 1. Load the Razorpay script
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        throw new Error('Razorpay SDK failed to load');
      }

      // 2. Create an order in Razorpay
      const orderResponse = await axios.post('http://localhost:8000/create-order', {
        amount: parseFloat(amount),
        notes: {
          source: 'FinFlow App',
        }
      });

      const { order_id, key_id } = orderResponse.data;

      // 3. Open Razorpay checkout
      const options = {
        key: key_id,
        amount: parseFloat(amount) * 100, // Amount in paise
        currency: 'INR',
        name: 'FinFlow',
        description: 'Payment for services',
        order_id: order_id,
        handler: async function (response) {
          try {
            // 4. Verify the payment on the server
            const verifyResponse = await axios.post('http://localhost:8000/verify-payment', {
              payment_id: response.razorpay_payment_id,
              order_id: response.razorpay_order_id,
              signature: response.razorpay_signature,
            });

            if (verifyResponse.data.status === 'success') {
              setSuccess('Payment successful! Transaction added.');
              setAmount('');
              // Refresh transactions list
              fetchTransactions();
            } else {
              setError('Payment is pending verification. Please wait.');
            }
          } catch (err) {
            console.error('Payment verification error:', err);
            setError('Payment verification failed. Please contact support.');
          }
        },
        prefill: {
          name: 'FinFlow User',
          email: 'user@example.com',
          contact: '9999999999',
        },
        theme: {
          color: '#2196f3',
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
      rzp.on('payment.failed', function (response) {
        setError(`Payment failed: ${response.error.description}`);
      });
    } catch (err) {
      console.error('Razorpay error:', err);
      setError(`Failed to initiate payment: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  const handleConnect = async () => {
    if (!apiKey.trim()) {
      setError('API Key is required');
      return;
    }
    
    if (!apiSecret.trim()) {
      setError('API Secret is required');
      return;
    }
    
    setConnectLoading(true);
    setError(null);
    
    try {
      const response = await axios.post('http://localhost:8000/connect-razorpay', {
        api_key: apiKey,
        api_secret: apiSecret,
        webhook_secret: webhookSecret
      });
      
      if (response.data.success) {
        setSuccess('Razorpay account connected successfully!');
        setIsConnected(true);
        
        // Reload the key
        const keyResponse = await axios.get('http://localhost:8000/razorpay-key');
        setRazorpayKey(keyResponse.data.key_id);
        
        // Clear form
        setApiKey('');
        setApiSecret('');
        setWebhookSecret('');
        
        // Call onConnect callback if provided
        if (onConnect) {
          onConnect();
        }
      } else {
        setError('Failed to connect Razorpay account');
      }
    } catch (err) {
      console.error('Error connecting Razorpay:', err);
      setError(err.response?.data?.detail || 'Failed to connect Razorpay account. Please check your credentials.');
    } finally {
      setConnectLoading(false);
    }
  };
  
  const handleDisconnect = async () => {
    setConnectLoading(true);
    try {
      const response = await axios.post('http://localhost:8000/disconnect-razorpay');
      if (response.data.success) {
        setIsConnected(false);
        setSuccess('Razorpay account disconnected successfully');
      } else {
        setError('Failed to disconnect Razorpay account');
      }
    } catch (err) {
      console.error('Error disconnecting Razorpay:', err);
      setError('Failed to disconnect Razorpay account');
    } finally {
      setConnectLoading(false);
    }
  };
  
  const handleSkip = () => {
    if (onConnect) {
      onConnect();
    }
  };

  if (connectionLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ mb: 4 }}>
      {/* Connection Form */}
      {!isConnected && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Connect Your Razorpay Account
          </Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                label="Razorpay API Key"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                fullWidth
                required
                margin="normal"
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth margin="normal" variant="outlined">
                <InputLabel htmlFor="api-secret">Razorpay API Secret</InputLabel>
                <OutlinedInput
                  id="api-secret"
                  type={showSecret ? 'text' : 'password'}
                  value={apiSecret}
                  onChange={(e) => setApiSecret(e.target.value)}
                  required
                  endAdornment={
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowSecret(!showSecret)}
                        edge="end"
                      >
                        {showSecret ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  }
                  label="Razorpay API Secret"
                />
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Webhook Secret (Optional)"
                value={webhookSecret}
                onChange={(e) => setWebhookSecret(e.target.value)}
                fullWidth
                margin="normal"
              />
            </Grid>
            
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleConnect}
                  disabled={connectLoading}
                >
                  {connectLoading ? <CircularProgress size={24} /> : 'Connect Account'}
                </Button>
                
                {isFirstSetup && (
                  <Button
                    variant="outlined"
                    onClick={handleSkip}
                  >
                    Skip for now
                  </Button>
                )}
              </Box>
            </Grid>
          </Grid>
          
          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}
          
          {success && (
            <Alert severity="success" sx={{ mt: 2 }}>
              {success}
            </Alert>
          )}
        </Paper>
      )}

      {/* Show payment form only if connected */}
      {isConnected && (
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3 }}>
          {/* Payment form */}
          <Paper sx={{ p: 3, flex: 1 }}>
            <Typography variant="h6" gutterBottom>
              Make a Payment
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 2 }}>
              <TextField
                label="Amount (₹)"
                type="number"
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value);
                  setError(null);
                }}
                variant="outlined"
                fullWidth
                error={!!error}
                disabled={loading}
              />
              <Button
                variant="contained"
                color="primary"
                onClick={handlePayment}
                disabled={loading || !amount}
                startIcon={loading && <CircularProgress size={20} color="inherit" />}
                fullWidth
              >
                {loading ? 'Processing...' : 'Pay with Razorpay'}
              </Button>
            </Box>

            {error && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {error}
              </Alert>
            )}

            {success && (
              <Alert severity="success" sx={{ mt: 2 }}>
                {success}
              </Alert>
            )}
            
            <Box sx={{ mt: 3 }}>
              <Button
                variant="outlined"
                color="secondary"
                onClick={handleDisconnect}
                disabled={connectLoading}
                size="small"
              >
                Disconnect Razorpay
              </Button>
            </Box>
          </Paper>

          {/* Transactions list */}
          <Paper sx={{ p: 3, flex: 1 }}>
            <Typography variant="h6" gutterBottom>
              Razorpay Transactions
            </Typography>
            
            {loadingTransactions ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                <CircularProgress />
              </Box>
            ) : razorpayTransactions.length > 0 ? (
              <List>
                {razorpayTransactions.map((txn) => (
                  <React.Fragment key={txn.id}>
                    <ListItem>
                      <ListItemText
                        primary={`₹${txn.amount} - ${txn.description}`}
                        secondary={`Date: ${new Date(txn.created_at).toLocaleString()}`}
                      />
                      <Chip 
                        label={txn.status} 
                        color={txn.status === 'completed' ? 'success' : 'warning'} 
                        size="small"
                      />
                    </ListItem>
                    <Divider />
                  </React.Fragment>
                ))}
              </List>
            ) : (
              <Box sx={{ py: 2 }}>
                <Typography variant="body2" color="text.secondary" align="center">
                  No Razorpay transactions found
                </Typography>
              </Box>
            )}
            
            <Button 
              variant="outlined" 
              size="small" 
              onClick={fetchTransactions} 
              sx={{ mt: 2 }}
            >
              Refresh
            </Button>
          </Paper>
        </Box>
      )}
    </Box>
  );
}

export default RazorpayIntegration; 