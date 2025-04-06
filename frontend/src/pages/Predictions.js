import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Card,
  CardContent,
  Grid,
  Paper,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import axios from 'axios';

function Predictions() {
  const [income, setIncome] = useState('');
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const validateData = (data) => {
    if (!data || !Array.isArray(data)) {
      console.error('Invalid data format:', data);
      return false;
    }
    
    // Make sure each prediction has the required format
    for (const pred of data) {
      if (!Array.isArray(pred) || pred.length < 3) {
        console.error('Invalid prediction format:', pred);
        return false;
      }
      
      // Make sure values are numbers or can be converted to numbers
      if (isNaN(Number(pred[1])) || isNaN(Number(pred[2]))) {
        console.error('Invalid prediction values:', pred);
        return false;
      }
    }
    
    return true;
  };

  const handlePredict = async () => {
    if (!income || isNaN(income) || parseFloat(income) <= 0) {
      setError('Please enter a valid income amount greater than 0');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);
    
    try {
      // Try with 0.0.0.0 URL first
      console.log('Sending prediction request for income:', income);
      const apiUrl = `http://0.0.0.0:8000/predict-limits?income=${parseFloat(income)}`;
      console.log('Attempting with URL:', apiUrl);
      
      const response = await axios.get(
        apiUrl,
        { timeout: 8000 } // 8 second timeout
      );
      
      console.log('Prediction response:', response.data);
      
      if (response.data && response.data.predictions && validateData(response.data.predictions)) {
        setPredictions(response.data.predictions);
        setSuccess(true);
      } else {
        throw new Error('Invalid data format received from server');
      }
    } catch (error) {
      console.error('First attempt error:', error);
      
      try {
        // Try with localhost as fallback
        const fallbackUrl = `http://localhost:8000/predict-limits?income=${parseFloat(income)}`;
        console.log('Attempting with fallback URL:', fallbackUrl);
        
        const fallbackResponse = await axios.get(
          fallbackUrl,
          { timeout: 5000 }
        );
        
        if (fallbackResponse.data && fallbackResponse.data.predictions && 
            validateData(fallbackResponse.data.predictions)) {
          setPredictions(fallbackResponse.data.predictions);
          setSuccess(true);
          return; // Exit early if fallback worked
        } else {
          throw new Error('Invalid data format from fallback server');
        }
      } catch (fallbackError) {
        console.error('Fallback attempt error:', fallbackError);
        setError('Could not connect to AI prediction service. Using built-in calculations instead.');
        createFallbackPredictions();
      }
    } finally {
      setLoading(false);
    }
  };

  // Generate fallback predictions based on income percentages
  const createFallbackPredictions = () => {
    if (!income || isNaN(parseFloat(income)) || parseFloat(income) <= 0) {
      return;
    }
    
    const incomeValue = parseFloat(income);
    const fallbackPredictions = [
      ['Food', incomeValue * 0.25, 15],
      ['Transport', incomeValue * 0.15, 12],
      ['Shopping', incomeValue * 0.20, 9],
      ['Utilities', incomeValue * 0.15, 6],
      ['Entertainment', incomeValue * 0.10, 3]
    ];
    
    setPredictions(fallbackPredictions);
    setSuccess(true);
  };

  const processChartData = (preds) => {
    return preds.map(([category, limit, count]) => {
      // Ensure values are numbers
      const safeLimit = typeof limit === 'number' ? limit : parseFloat(limit || 0);
      const safeCount = typeof count === 'number' ? count : parseFloat(count || 0);
      
      return {
        category,
        limit: safeLimit,
        count: safeCount,
      };
    });
  };

  // Process data for chart
  const chartData = processChartData(predictions);

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Spending Predictions
      </Typography>

      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <TextField
            label="Monthly Income (₹)"
            type="number"
            value={income}
            onChange={(e) => {
              setIncome(e.target.value);
              setError(null);
            }}
            variant="outlined"
            sx={{ width: 200 }}
            error={!!error}
            disabled={loading}
          />
          <Button
            variant="contained"
            color="primary"
            onClick={handlePredict}
            disabled={loading || !income}
            startIcon={loading && <CircularProgress size={20} color="inherit" />}
          >
            {loading ? 'Predicting...' : 'Get Predictions'}
          </Button>
        </Box>
        {error && <Alert severity="error" sx={{ mt: 1 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mt: 1 }}>Predictions generated successfully!</Alert>}
      </Paper>

      {predictions.length > 0 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Spending Limits by Category
              </Typography>
              <Box sx={{ height: 400 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="category" />
                    <YAxis />
                    <Tooltip formatter={(value) => `₹${value.toFixed(2)}`} />
                    <Legend />
                    <Bar dataKey="limit" fill="#2196f3" name="Limit (₹)" />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </Paper>
          </Grid>

          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Category-wise Predictions
              </Typography>
              <Grid container spacing={2}>
                {predictions.map(([category, limit, count], index) => {
                  // Ensure values are numbers and handle potential errors
                  const safeLimit = typeof limit === 'number' ? limit : parseFloat(limit || 0);
                  const safeCount = typeof count === 'number' ? count : parseFloat(count || 0);
                  
                  return (
                    <Grid item xs={12} key={category || `category-${index}`}>
                      <Card>
                        <CardContent>
                          <Typography variant="h6" component="div">
                            {category || `Category ${index + 1}`}
                          </Typography>
                          <Typography color="text.secondary">
                            Monthly Limit: ₹{safeLimit.toFixed(2)}
                          </Typography>
                          <Typography color="text.secondary">
                            Expected Transactions: ~{Math.round(safeCount)}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  );
                })}
              </Grid>
            </Paper>
          </Grid>
        </Grid>
      )}
    </Box>
  );
}

export default Predictions; 