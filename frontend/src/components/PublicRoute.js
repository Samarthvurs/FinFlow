import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Box, CircularProgress } from '@mui/material';

// Component for public routes (like login, signup)
const PublicRoute = ({ restricted = false }) => {
  const { isAuthenticated, loading, isFirstLogin } = useAuth();
  
  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh'
        }}
      >
        <CircularProgress />
      </Box>
    );
  }
  
  // If user is authenticated and it's a restricted route (like login/signup)
  if (isAuthenticated && restricted) {
    // Always go to dashboard - will handle income dialog there
    return <Navigate to="/dashboard" />;
  }
  
  return <Outlet />;
};

export default PublicRoute; 