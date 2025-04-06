import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Alert,
  TextField,
  Paper,
} from '@mui/material';
import axios from 'axios';

function ApiTest() {
  const [apiStatus, setApiStatus] = useState(null);
  const [endpoint, setEndpoint] = useState('http://localhost:8000/');
  const [loading, setLoading] = useState(false);

  const testConnection = async () => {
    setLoading(true);
    try {
      const response = await axios.get(endpoint);
      setApiStatus({
        status: 'success',
        data: JSON.stringify(response.data, null, 2),
        statusCode: response.status
      });
    } catch (error) {
      setApiStatus({
        status: 'error',
        message: error.message,
        details: error.response ? JSON.stringify(error.response.data, null, 2) : 'No response data'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper sx={{ p: 2, mt: 2 }}>
      <Typography variant="h6" gutterBottom>API Connection Test</Typography>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <TextField
          label="API Endpoint"
          value={endpoint}
          onChange={(e) => setEndpoint(e.target.value)}
          sx={{ flex: 1, mr: 2 }}
        />
        <Button
          variant="contained"
          onClick={testConnection}
          disabled={loading}
        >
          {loading ? 'Testing...' : 'Test Connection'}
        </Button>
      </Box>

      {apiStatus && (
        <Box sx={{ mt: 2 }}>
          <Alert severity={apiStatus.status === 'success' ? 'success' : 'error'}>
            {apiStatus.status === 'success'
              ? `Connected successfully! Status code: ${apiStatus.statusCode}`
              : `Connection failed: ${apiStatus.message}`}
          </Alert>
          <Typography variant="subtitle2" sx={{ mt: 1 }}>Response:</Typography>
          <Box 
            component="pre" 
            sx={{ 
              backgroundColor: '#f5f5f5', 
              p: 1, 
              borderRadius: 1,
              overflow: 'auto',
              maxHeight: '200px'
            }}
          >
            {apiStatus.status === 'success' ? apiStatus.data : apiStatus.details}
          </Box>
        </Box>
      )}
    </Paper>
  );
}

export default ApiTest; 