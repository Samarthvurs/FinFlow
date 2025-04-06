import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  TextField,
  Grid,
  CircularProgress,
  Alert,
  IconButton,
  Divider,
  Stepper,
  Step,
  StepLabel,
  Tooltip,
  Paper
} from '@mui/material';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import CloseIcon from '@mui/icons-material/Close';
import InfoIcon from '@mui/icons-material/Info';
import AssistantIcon from '@mui/icons-material/Assistant';

const categories = ['Food', 'Transport', 'Shopping', 'Utilities', 'Entertainment'];

function LimitsSetupDialog({ open, onClose, income = null, isFirstTimeSetup = false }) {
  const { user, updateUser } = useAuth();
  const [currentIncome, setCurrentIncome] = useState(income || user?.income || '');
  const [incomeError, setIncomeError] = useState('');
  const [loading, setLoading] = useState(false);
  const [limits, setLimits] = useState({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeStep, setActiveStep] = useState(0);
  const [predictedLimits, setPredictedLimits] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Initialize limits from user data or from prediction
    if (open) {
      // Reset step for first-time users
      if (isFirstTimeSetup) {
        setActiveStep(0);
      } else {
        setActiveStep(1); // Skip income step for existing users
      }

      if (user?.limits) {
        const existingLimits = {};
        user.limits.forEach(limit => {
          existingLimits[limit[0]] = limit[1];
        });
        setLimits(existingLimits);
      } else {
        // Reset limits
        const defaultLimits = {};
        categories.forEach(category => {
          defaultLimits[category] = '';
        });
        setLimits(defaultLimits);
      }
      
      // Set income from props or user data
      setCurrentIncome(income || user?.income || '');
    }
  }, [open, user, income, isFirstTimeSetup]);

  const handlePredictLimits = async () => {
    if (!currentIncome || isNaN(parseFloat(currentIncome)) || parseFloat(currentIncome) <= 0) {
      setIncomeError('Please enter a valid income amount greater than 0');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      // First try with the 0.0.0.0 URL which is how the server identifies itself
      const apiUrl = `http://0.0.0.0:8000/predict-limits?income=${parseFloat(currentIncome)}`;
      console.log('Attempting AI prediction with URL:', apiUrl);
      
      const response = await axios.get(
        apiUrl,
        { timeout: 8000 } // Increase timeout to 8 seconds
      );
      
      console.log('Received AI prediction response:', response.data);
      
      if (response.data && response.data.predictions && Array.isArray(response.data.predictions)) {
        const predictedLimits = {};
        
        // Convert the predictions to the format we need
        response.data.predictions.forEach(item => {
          if (Array.isArray(item) && item.length >= 2 && item[0] && !isNaN(item[1])) {
            predictedLimits[item[0]] = parseFloat(item[1]);
          }
        });
        
        // Make sure we have values for all categories
        categories.forEach(category => {
          if (!predictedLimits[category] || isNaN(predictedLimits[category])) {
            // Default to 10% of income if prediction is missing or invalid
            predictedLimits[category] = parseFloat(currentIncome) * 0.1;
          }
        });
        
        console.log('Processed AI predictions:', predictedLimits);
        
        setPredictedLimits(predictedLimits);
        setLimits(predictedLimits);
        setSuccess('AI predicted limits based on your income');
        
        // Move to next step for first-time users
        if (isFirstTimeSetup && activeStep === 0) {
          setActiveStep(1);
        }
      } else {
        throw new Error('Invalid data format received from server');
      }
    } catch (err) {
      console.error('Error predicting limits:', err);
      
      try {
        // Try localhost as a fallback
        const fallbackUrl = `http://localhost:8000/predict-limits?income=${parseFloat(currentIncome)}`;
        console.log('Attempting with fallback URL:', fallbackUrl);
        
        const fallbackResponse = await axios.get(
          fallbackUrl,
          { timeout: 5000 }
        );
        
        if (fallbackResponse.data && fallbackResponse.data.predictions) {
          const predictedLimits = {};
          
          fallbackResponse.data.predictions.forEach(item => {
            if (Array.isArray(item) && item.length >= 2) {
              predictedLimits[item[0]] = parseFloat(item[1]);
            }
          });
          
          // Make sure we have values for all categories
          categories.forEach(category => {
            if (!predictedLimits[category] || isNaN(predictedLimits[category])) {
              predictedLimits[category] = parseFloat(currentIncome) * 0.1;
            }
          });
          
          setPredictedLimits(predictedLimits);
          setLimits(predictedLimits);
          setSuccess('AI predicted limits based on your income');
          
          if (isFirstTimeSetup && activeStep === 0) {
            setActiveStep(1);
          }
          
          return; // Exit early if fallback worked
        }
      } catch (fallbackErr) {
        console.error('Fallback prediction also failed:', fallbackErr);
      }
      
      // If we reach here, both attempts failed - use hardcoded calculations
      const fallbackLimits = {};
      const income = parseFloat(currentIncome);
      
      // Use fixed percentages based on typical spending patterns
      fallbackLimits['Food'] = income * 0.25;
      fallbackLimits['Transport'] = income * 0.15;
      fallbackLimits['Shopping'] = income * 0.20;
      fallbackLimits['Utilities'] = income * 0.15;
      fallbackLimits['Entertainment'] = income * 0.10;
      
      setPredictedLimits(fallbackLimits);
      setLimits(fallbackLimits);
      
      // Show a helpful message explaining we're using local calculations
      setError('Could not connect to AI prediction service. Using built-in calculations instead.');
      
      // Still move to next step despite the error
      if (isFirstTimeSetup && activeStep === 0) {
        setActiveStep(1);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLimitChange = (category, value) => {
    setLimits({
      ...limits,
      [category]: value
    });
  };

  const handleIncomeNext = () => {
    if (!currentIncome || isNaN(parseFloat(currentIncome)) || parseFloat(currentIncome) <= 0) {
      setIncomeError('Please enter a valid income amount greater than 0');
      return;
    }
    
    setActiveStep(1);
  };

  const handleSave = () => {
    if (!currentIncome || isNaN(parseFloat(currentIncome)) || parseFloat(currentIncome) <= 0) {
      setIncomeError('Please enter a valid income amount greater than 0');
      return;
    }
    
    // Validate all limits
    let hasError = false;
    Object.keys(limits).forEach(category => {
      if (!limits[category] || isNaN(parseFloat(limits[category])) || parseFloat(limits[category]) < 0) {
        hasError = true;
      }
    });
    
    if (hasError) {
      setError('Please enter valid amounts for all categories');
      return;
    }
    
    // Format limits for storage
    const formattedLimits = Object.keys(limits).map(category => [
      category,
      parseFloat(limits[category]),
      // Include transaction count from previous data or default to category-appropriate value
      user?.limits?.find(l => l[0] === category)?.[2] || 
      (category === 'Food' ? 15 : 
        category === 'Transport' ? 12 : 
        category === 'Shopping' ? 9 : 
        category === 'Utilities' ? 6 : 3)
    ]);
    
    try {
      // Show success message first
      setSuccess('Your spending limits have been saved successfully!');
      
      // Create the updated user data
      const updatedUserData = {
        ...user,
        income: parseFloat(currentIncome),
        limits: formattedLimits,
        limitsSource: predictedLimits ? 'ai' : 'custom',
        isFirstLogin: false // Mark setup as complete
      };
      
      // Save directly to localStorage first to ensure it persists
      localStorage.setItem('finflowUser', JSON.stringify(updatedUserData));
      
      // Then update via context
      updateUser(updatedUserData);
      
      // For first-time setup, show the success message briefly before closing
      if (isFirstTimeSetup) {
        setTimeout(() => {
          onClose();
          window.location.reload(); // Force a complete refresh of the page
        }, 1500);
      } else {
        // For regular updates, close immediately
        onClose();
      }
    } catch (error) {
      console.error('Error saving user data:', error);
      setError('Failed to save your settings. Please try again.');
    }
  };

  const renderIncomeStep = () => (
    <Box>
      <Typography variant="h6" gutterBottom>
        Let's Start With Your Income
      </Typography>
      <Typography variant="body2" color="textSecondary" paragraph>
        To help manage your finances better, we need to know your monthly income.
        This will help us create personalized spending limits for you.
      </Typography>
      
      <TextField
        label="Monthly Income"
        type="number"
        value={currentIncome}
        onChange={(e) => {
          setCurrentIncome(e.target.value);
          setIncomeError('');
        }}
        fullWidth
        required
        error={!!incomeError}
        helperText={incomeError}
        InputProps={{
          startAdornment: <Typography sx={{ mr: 1 }}>₹</Typography>,
        }}
        sx={{ mt: 3, mb: 2 }}
      />
      
      <Paper 
        elevation={0} 
        sx={{ 
          p: 2, 
          bgcolor: 'primary.light', 
          color: 'primary.contrastText',
          borderRadius: 2,
          mt: 2,
          display: 'flex',
          alignItems: 'center'
        }}
      >
        <AssistantIcon sx={{ mr: 1 }} />
        <Typography variant="body2">
          After entering your income, you can either proceed to set your own spending limits 
          or let our AI suggest limits based on your income.
        </Typography>
      </Paper>
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
        <Button 
          variant="outlined" 
          onClick={handlePredictLimits}
          disabled={loading}
          startIcon={<AssistantIcon />}
        >
          {loading ? <CircularProgress size={24} /> : 'Get AI Recommendations'}
        </Button>
        
        <Button 
          variant="contained" 
          onClick={handleIncomeNext}
          disabled={loading}
        >
          Set Limits Manually
        </Button>
      </Box>
    </Box>
  );

  const renderLimitsStep = () => (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">
          Monthly Spending Limits
        </Typography>
        
        <Box>
          <TextField
            label="Monthly Income"
            type="number"
            value={currentIncome}
            onChange={(e) => {
              setCurrentIncome(e.target.value);
              setIncomeError('');
            }}
            size="small"
            error={!!incomeError}
            helperText={incomeError}
            InputProps={{
              startAdornment: <Typography variant="body2" sx={{ mr: 0.5 }}>₹</Typography>,
            }}
            sx={{ width: 150 }}
          />
        </Box>
      </Box>
      
      <Typography variant="body2" color="textSecondary" paragraph>
        Set limits for each spending category to help you stay on budget.
      </Typography>
      
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 3 }}>
        <Tooltip title="Our AI will recommend spending limits based on your income">
          <Button
            variant="outlined"
            onClick={handlePredictLimits}
            disabled={loading}
            startIcon={<AssistantIcon />}
            size="small"
          >
            {loading ? <CircularProgress size={20} /> : 'AI Recommendations'}
          </Button>
        </Tooltip>
      </Box>
      
      <Grid container spacing={2}>
        {categories.map((category) => (
          <Grid item xs={12} key={category}>
            <TextField
              label={`${category} Limit`}
              type="number"
              value={limits[category] || ''}
              onChange={(e) => handleLimitChange(category, e.target.value)}
              fullWidth
              required
              InputProps={{
                startAdornment: <Typography sx={{ mr: 1 }}>₹</Typography>,
                endAdornment: predictedLimits && (
                  <Tooltip title="AI recommended limit">
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <InfoIcon fontSize="small" color="action" sx={{ mr: 0.5, opacity: 0.7 }} />
                      <Typography variant="caption" color="textSecondary">
                        Recommended: ₹{Math.round(predictedLimits[category])}
                      </Typography>
                    </Box>
                  </Tooltip>
                )
              }}
            />
          </Grid>
        ))}
      </Grid>
    </Box>
  );

  return (
    <Dialog 
      open={open} 
      onClose={!isFirstTimeSetup ? onClose : undefined} 
      fullWidth 
      maxWidth="sm"
      disableEscapeKeyDown={isFirstTimeSetup}
    >
      <DialogTitle>
        {isFirstTimeSetup ? 'Complete Your Setup' : 'Set Spending Limits'}
        {!isFirstTimeSetup && (
          <IconButton
            aria-label="close"
            onClick={onClose}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        )}
      </DialogTitle>
      
      {isFirstTimeSetup && (
        <Box sx={{ px: 3 }}>
          <Stepper activeStep={activeStep} alternativeLabel>
            <Step>
              <StepLabel>Income</StepLabel>
            </Step>
            <Step>
              <StepLabel>Spending Limits</StepLabel>
            </Step>
          </Stepper>
        </Box>
      )}
      
      <DialogContent>
        {activeStep === 0 && isFirstTimeSetup ? renderIncomeStep() : renderLimitsStep()}
      </DialogContent>
      
      <Divider />
      
      <DialogActions sx={{ px: 3, py: 2 }}>
        {activeStep === 1 && isFirstTimeSetup && (
          <Button onClick={() => setActiveStep(0)}>
            Back
          </Button>
        )}
        <Box sx={{ flex: '1 1 auto' }} />
        {(!isFirstTimeSetup || activeStep === 1) && (
          <>
            {!isFirstTimeSetup && (
              <Button onClick={onClose}>Cancel</Button>
            )}
            <Button
              onClick={handleSave}
              color="primary"
              variant="contained"
            >
              {isFirstTimeSetup ? 'Complete Setup' : 'Save Limits'}
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
}

export default LimitsSetupDialog; 