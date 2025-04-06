import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  CircularProgress,
  Grid,
  LinearProgress,
  Card,
  CardContent,
  Divider,
  Tooltip,
  IconButton,
} from '@mui/material';
import { 
  InfoOutlined, 
  TrendingUp, 
  TrendingDown, 
  CheckCircle,
  Warning,
  ErrorOutline,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';

function SpendingProgress({ transactions, limits, compact = false, onSetLimits }) {
  const { user } = useAuth();

  // Calculate spending by category
  const categorySpending = {};
  transactions.forEach((txn) => {
    const category = txn.category || 'Uncategorized';
    // Skip income transactions - they're not expenses
    if (category === 'Income') return;
    
    const amount = typeof txn.amount === 'number' ? txn.amount : parseFloat(txn.amount || 0);
    categorySpending[category] = (categorySpending[category] || 0) + amount;
  });

  // Calculate limit utilization
  const getLimitUtilization = () => {
    const userLimits = limits || user?.limits;
    if (!userLimits) return [];
    
    return userLimits
      .filter(limit => limit[0] !== 'Income') // Exclude Income category from spending limits
      .map(limit => {
        const category = limit[0];
        const limitAmount = limit[1];
        const spent = categorySpending[category] || 0;
        const percentage = Math.min(100, Math.round((spent / limitAmount) * 100));
        
        return {
          category,
          limit: limitAmount,
          spent,
          percentage,
          remaining: Math.max(0, limitAmount - spent),
          overspent: spent > limitAmount ? spent - limitAmount : 0,
          status: percentage > 90 ? 'danger' : percentage > 75 ? 'warning' : 'good'
        };
      });
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'danger': return 'error.main';
      case 'warning': return 'warning.main';
      case 'good': return 'success.main';
      default: return 'success.main';
    }
  };

  // Get status icon 
  const getStatusIcon = (status) => {
    switch (status) {
      case 'danger': return <ErrorOutline color="error" />;
      case 'warning': return <Warning color="warning" />;
      case 'good': return <CheckCircle color="success" />;
      default: return <CheckCircle color="success" />;
    }
  };

  // Get status text
  const getStatusText = (status, remaining, overspent) => {
    switch (status) {
      case 'danger': 
        return `₹${overspent.toFixed(0)} over limit`;
      case 'warning': 
        return `₹${remaining.toFixed(0)} remaining (${100 - Math.min(100, Math.round(remaining))}% used)`;
      case 'good': 
        return `₹${remaining.toFixed(0)} remaining`;
      default: 
        return `₹${remaining.toFixed(0)} remaining`;
    }
  };

  if (!user) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress size={24} />
      </Box>
    );
  }

  const limitData = getLimitUtilization();

  if (compact) {
    // Compact view for dashboard widgets
    return (
      <Box>
        {limitData.length > 0 ? (
          <Box>
            {limitData.map((item, index) => (
              <Box key={index} sx={{ mb: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography variant="caption" fontWeight="medium">
                    {item.category}
                  </Typography>
                  <Typography variant="caption">
                    ₹{item.spent.toFixed(0)} / ₹{item.limit.toFixed(0)}
                  </Typography>
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={item.percentage} 
                  sx={{ 
                    height: 6, 
                    borderRadius: 3,
                    '& .MuiLinearProgress-bar': {
                      backgroundColor: getStatusColor(item.status)
                    }
                  }} 
                />
              </Box>
            ))}
          </Box>
        ) : (
          <Box sx={{ textAlign: 'center', py: 2 }}>
            <Typography color="textSecondary" variant="body2">
              No spending limits set
            </Typography>
            {onSetLimits && (
              <Button 
                variant="contained" 
                size="small"
                sx={{ mt: 1 }}
                onClick={onSetLimits}
              >
                Set Limits
              </Button>
            )}
          </Box>
        )}
      </Box>
    );
  }

  // Full view with cards
  return (
    <Box>
      {limitData.length > 0 ? (
        <Grid container spacing={2}>
          {limitData.map((item, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <Card 
                elevation={2} 
                sx={{ 
                  height: '100%',
                  borderLeft: `4px solid ${getStatusColor(item.status)}`,
                  borderRadius: 2
                }}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="subtitle1" fontWeight="medium">
                      {item.category}
                    </Typography>
                    <Tooltip title={item.status === 'danger' ? 'Over limit' : item.status === 'warning' ? 'Approaching limit' : 'Within budget'}>
                      <Box>
                        {getStatusIcon(item.status)}
                      </Box>
                    </Tooltip>
                  </Box>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Box>
                      <Typography variant="caption" color="text.secondary">Spent</Typography>
                      <Typography variant="h6">₹{item.spent.toFixed(0)}</Typography>
                    </Box>
                    <Box sx={{ textAlign: 'right' }}>
                      <Typography variant="caption" color="text.secondary">Limit</Typography>
                      <Typography variant="h6">₹{item.limit.toFixed(0)}</Typography>
                    </Box>
                  </Box>
                  
                  <LinearProgress 
                    variant="determinate" 
                    value={item.percentage} 
                    sx={{ 
                      my: 1.5, 
                      height: 8, 
                      borderRadius: 4,
                      backgroundColor: 'rgba(0,0,0,0.1)',
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: getStatusColor(item.status)
                      }
                    }} 
                  />
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Typography variant="caption" color="text.secondary">
                      {item.percentage}% used
                    </Typography>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        color: getStatusColor(item.status),
                        fontWeight: 'medium',
                        display: 'flex',
                        alignItems: 'center'
                      }}
                    >
                      {item.status === 'danger' ? <TrendingUp fontSize="small" sx={{ mr: 0.5 }} /> : <TrendingDown fontSize="small" sx={{ mr: 0.5 }} />}
                      {getStatusText(item.status, item.remaining, item.overspent)}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      ) : (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography color="textSecondary" variant="body1" paragraph>
            No spending limits set. Set up limits to track your spending progress.
          </Typography>
          {onSetLimits && (
            <Button 
              variant="contained" 
              size="medium"
              sx={{ mt: 2 }}
              onClick={onSetLimits}
            >
              Set Spending Limits
            </Button>
          )}
        </Box>
      )}
    </Box>
  );
}

export default SpendingProgress; 