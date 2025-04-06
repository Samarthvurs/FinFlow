import React, { useEffect } from 'react';
import { Box, Typography } from '@mui/material';
import RazorpayIntegration from '../components/RazorpayIntegration';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

function RazorpayPage() {
  const { user, isFirstLogin, updateUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // If it's first login, we'll show a welcome message
    // After they set up Razorpay, we'll mark isFirstLogin as false
    if (user && isFirstLogin()) {
      // This will be handled by the onConnect callback in RazorpayIntegration
    }
  }, [user, isFirstLogin]);

  const handleRazorpayConnected = () => {
    // If this was the first login, update the user's status
    if (isFirstLogin()) {
      updateUser({ isFirstLogin: false });
    }
  };

  return (
    <Box>
      {isFirstLogin() ? (
        <Box mb={4}>
          <Typography variant="h4" gutterBottom>
            Welcome to FinFlow!
          </Typography>
          <Typography variant="body1" paragraph>
            To get started, please connect your Razorpay account. This will allow you to process payments and track transactions.
          </Typography>
          <Typography variant="body1" paragraph>
            Don't worry, you can skip this step and connect later if you prefer.
          </Typography>
        </Box>
      ) : (
        <Typography variant="h4" gutterBottom>
          Razorpay Integration
        </Typography>
      )}

      <RazorpayIntegration onConnect={handleRazorpayConnected} isFirstSetup={isFirstLogin()} />
    </Box>
  );
}

export default RazorpayPage; 