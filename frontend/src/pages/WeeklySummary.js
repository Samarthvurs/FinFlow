import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  LinearProgress,
  Divider,
  Button,
  CircularProgress,
  useTheme,
  Avatar,
  Tooltip,
  Badge,
} from '@mui/material';
import { 
  ArrowBack, 
  EmojiEvents, 
  TrendingUp, 
  TrendingDown,
  Savings,
  MoneyOff,
  CheckCircle,
  Warning,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

function WeeklySummary() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [weeklyPoints, setWeeklyPoints] = useState(0);
  const [weeklyLimit, setWeeklyLimit] = useState(0);
  const [weeklySpent, setWeeklySpent] = useState(0);
  const [bonusPoints, setBonusPoints] = useState(0);
  const [categoryInsights, setCategoryInsights] = useState([]);
  const { user } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await axios.get('http://localhost:8000/transactions');
        setTransactions(response.data || []);
        
        // Calculate this week's transactions
        const currentWeekTransactions = filterTransactionsForCurrentWeek(response.data || []);
        
        // Calculate weekly spending and set limit
        const weeklySpending = calculateWeeklySpending(currentWeekTransactions);
        setWeeklySpent(weeklySpending);
        
        // Set weekly limit (25% of monthly income or user-defined)
        if (user?.income) {
          const estimatedWeeklyLimit = user.income / 4;
          setWeeklyLimit(estimatedWeeklyLimit);
          
          // Calculate points based on spending vs limit
          const pointsData = calculateWeeklyPoints(weeklySpending, estimatedWeeklyLimit);
          setWeeklyPoints(pointsData.basePoints);
          setBonusPoints(pointsData.bonusPoints);
          
          // Generate category insights
          const insights = generateCategoryInsights(currentWeekTransactions, user.limits);
          setCategoryInsights(insights);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to load transaction data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  // Filter transactions for current week
  const filterTransactionsForCurrentWeek = (txns) => {
    const now = new Date();
    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
    startOfWeek.setHours(0, 0, 0, 0);
    
    const endOfWeek = new Date(now);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);
    
    return txns.filter(txn => {
      const txnDate = new Date(txn.created_at);
      return txnDate >= startOfWeek && txnDate <= endOfWeek;
    });
  };

  // Calculate weekly spending
  const calculateWeeklySpending = (weeklyTxns) => {
    return weeklyTxns.reduce((sum, txn) => {
      const amount = typeof txn.amount === 'number' ? txn.amount : parseFloat(txn.amount || 0);
      return sum + amount;
    }, 0);
  };

  // Calculate weekly points based on spending vs limit with bonus
  const calculateWeeklyPoints = (spent, limit) => {
    let basePoints = 0;
    let bonusPoints = 0;
    
    // Base points for tracking expenses
    basePoints += 50;
    
    // Bonus points for staying under budget
    if (spent <= limit) {
      // The further under budget, the more points
      const savingsPercentage = ((limit - spent) / limit) * 100;
      
      if (savingsPercentage >= 30) {
        basePoints += 100; // Good base points
        bonusPoints += 100; // Amazing savings bonus
      } else if (savingsPercentage >= 20) {
        basePoints += 75; 
        bonusPoints += 75; // Great savings bonus
      } else if (savingsPercentage >= 10) {
        basePoints += 50;
        bonusPoints += 50; // Good savings bonus
      } else {
        basePoints += 25; // Under budget
        bonusPoints += 25; // Small bonus
      }
    } else {
      // Reduced points but still some for tracking
      basePoints += 10;
      bonusPoints = 0; // No bonus when over budget
    }
    
    return { basePoints, bonusPoints };
  };

  // Generate insights for each spending category
  const generateCategoryInsights = (weeklyTxns, userLimits) => {
    if (!userLimits) return [];
    
    // Group transactions by category and calculate totals
    const categorySpendings = {};
    weeklyTxns.forEach(txn => {
      const category = txn.category || 'Uncategorized';
      const amount = typeof txn.amount === 'number' ? txn.amount : parseFloat(txn.amount || 0);
      
      if (!categorySpendings[category]) {
        categorySpendings[category] = 0;
      }
      
      categorySpendings[category] += amount;
    });
    
    // Match with user limits and calculate weekly limits (25% of monthly)
    const insights = userLimits.map(limitData => {
      const category = limitData[0];
      const monthlyLimit = limitData[1];
      const weeklyLimit = monthlyLimit / 4; // 25% of monthly limit
      const spent = categorySpendings[category] || 0;
      const percentage = weeklyLimit > 0 ? Math.min(100, Math.round((spent / weeklyLimit) * 100)) : 0;
      
      // Status and points allocation
      let status = 'good';
      let points = 0;
      
      if (percentage > 100) {
        status = 'over';
        points = 0; // No points for over budget
      } else if (percentage > 85) {
        status = 'warning';
        points = 5; // Some points for being close
      } else if (percentage > 70) {
        status = 'good';
        points = 10; // Good points
      } else {
        status = 'excellent';
        points = 15; // Excellent points for significant savings
      }
      
      return {
        category,
        spent,
        weeklyLimit,
        percentage,
        status,
        points
      };
    });
    
    // Sort by percentage (highest first)
    return insights.sort((a, b) => b.percentage - a.percentage);
  };

  // Get spending by category for this week
  const getWeeklyCategorySpending = () => {
    const weeklyTransactions = filterTransactionsForCurrentWeek(transactions);
    const categorySpending = {};
    
    weeklyTransactions.forEach(txn => {
      const category = txn.category || 'Uncategorized';
      const amount = typeof txn.amount === 'number' ? txn.amount : parseFloat(txn.amount || 0);
      
      if (!categorySpending[category]) {
        categorySpending[category] = 0;
      }
      
      categorySpending[category] += amount;
    });
    
    // Sort categories by amount spent (descending)
    return Object.entries(categorySpending)
      .sort((a, b) => b[1] - a[1])
      .map(([category, amount]) => ({ category, amount }));
  };

  // Calculate weekly budget utilization percentage
  const getBudgetUtilizationPercentage = () => {
    if (weeklyLimit <= 0) return 0;
    return Math.min(100, Math.round((weeklySpent / weeklyLimit) * 100));
  };

  // Determine status color based on budget utilization
  const getStatusColor = (percentage) => {
    if (percentage > 100) return theme.palette.error.main;
    if (percentage > 80) return theme.palette.warning.main;
    return theme.palette.success.main;
  };

  // Get category status icon
  const getCategoryStatusIcon = (status) => {
    switch (status) {
      case 'over':
        return <MoneyOff color="error" />;
      case 'warning':
        return <Warning color="warning" />;
      case 'good':
        return <CheckCircle color="success" />;
      case 'excellent':
        return <Savings color="primary" />;
      default:
        return <CheckCircle color="success" />;
    }
  };

  // Get total potential points for the week
  const getTotalPotentialPoints = () => {
    return weeklyPoints + bonusPoints + categoryInsights.reduce((sum, cat) => sum + cat.points, 0);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box>
        <Typography variant="h4" gutterBottom>Weekly Summary</Typography>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  const utilizationPercentage = getBudgetUtilizationPercentage();
  const statusColor = getStatusColor(utilizationPercentage);
  const categorySpending = getWeeklyCategorySpending();
  const totalPotentialPoints = getTotalPotentialPoints();

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Button 
          startIcon={<ArrowBack />} 
          onClick={() => navigate('/dashboard')}
          sx={{ mr: 2 }}
        >
          Back
        </Button>
        <Typography variant="h4">Weekly Summary</Typography>
        
        <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center' }}>
          <Badge 
            badgeContent={`+${bonusPoints}`} 
            color="secondary"
            sx={{ 
              '& .MuiBadge-badge': { 
                fontSize: '0.8rem', 
                fontWeight: 'bold',
                padding: '0 6px' 
              } 
            }}
          >
            <EmojiEvents sx={{ fontSize: 32, color: 'gold', mr: 1 }} />
          </Badge>
          <Typography variant="h6" color="secondary">
            {totalPotentialPoints} points this week
          </Typography>
        </Box>
      </Box>
      
      <Grid container spacing={3}>
        {/* Weekly Budget Progress */}
        <Grid item xs={12}>
          <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
            <Box sx={{ mb: 2 }}>
              <Typography variant="h6" gutterBottom>Weekly Budget</Typography>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body1">
                  ₹{weeklySpent.toFixed(2)} of ₹{weeklyLimit.toFixed(2)}
                </Typography>
                <Typography variant="body1" sx={{ color: statusColor, fontWeight: 'bold' }}>
                  {utilizationPercentage}%
                </Typography>
              </Box>
              <LinearProgress 
                variant="determinate" 
                value={utilizationPercentage} 
                sx={{ 
                  height: 10, 
                  borderRadius: 5,
                  backgroundColor: 'rgba(0,0,0,0.1)',
                  '& .MuiLinearProgress-bar': {
                    backgroundColor: statusColor
                  }
                }} 
              />
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'center', mt: 3 }}>
              <Avatar
                sx={{ 
                  bgcolor: utilizationPercentage <= 100 ? 'success.main' : 'error.main',
                  width: 56,
                  height: 56,
                  mr: 2
                }}
              >
                {utilizationPercentage <= 100 ? <TrendingDown /> : <TrendingUp />}
              </Avatar>
              <Box>
                <Typography variant="h6">
                  {utilizationPercentage <= 100 
                    ? `₹${(weeklyLimit - weeklySpent).toFixed(2)} remaining` 
                    : `₹${(weeklySpent - weeklyLimit).toFixed(2)} over budget`}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  {utilizationPercentage <= 100 
                    ? "You're doing great! Keep it up!" 
                    : "Try to reduce spending to stay within budget."}
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>
        
        {/* Category Breakdown with Insights */}
        <Grid item xs={12}>
          <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
            <Typography variant="h6" gutterBottom>Category Performance</Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
              Stay within category limits to earn bonus points at the end of the week
            </Typography>
            
            {categoryInsights.length > 0 ? (
              <Grid container spacing={2}>
                {categoryInsights.map((insight, index) => (
                  <Grid item xs={12} md={6} key={index}>
                    <Card
                      elevation={1}
                      sx={{ 
                        p: 2, 
                        borderLeft: `4px solid ${
                          insight.status === 'over' ? theme.palette.error.main :
                          insight.status === 'warning' ? theme.palette.warning.main :
                          insight.status === 'excellent' ? theme.palette.primary.main :
                          theme.palette.success.main
                        }`,
                        display: 'flex',
                        flexDirection: 'column'
                      }}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Typography variant="subtitle1" fontWeight="bold">
                          {insight.category}
                        </Typography>
                        <Tooltip title={`${insight.points} points for this category`}>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            {getCategoryStatusIcon(insight.status)}
                            <Typography variant="body2" sx={{ ml: 0.5 }}>
                              +{insight.points}
                            </Typography>
                          </Box>
                        </Tooltip>
                      </Box>
                      
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2" color="textSecondary">
                          ₹{insight.spent.toFixed(0)} of ₹{insight.weeklyLimit.toFixed(0)}
                        </Typography>
                        <Typography 
                          variant="body2" 
                          fontWeight="medium"
                          color={
                            insight.status === 'over' ? 'error.main' :
                            insight.status === 'warning' ? 'warning.main' :
                            insight.status === 'excellent' ? 'primary.main' :
                            'success.main'
                          }
                        >
                          {insight.percentage}%
                        </Typography>
                      </Box>
                      
                      <LinearProgress 
                        variant="determinate" 
                        value={insight.percentage} 
                        sx={{ 
                          height: 6, 
                          borderRadius: 3,
                          backgroundColor: 'rgba(0,0,0,0.1)',
                          '& .MuiLinearProgress-bar': {
                            backgroundColor: 
                              insight.status === 'over' ? theme.palette.error.main :
                              insight.status === 'warning' ? theme.palette.warning.main :
                              insight.status === 'excellent' ? theme.palette.primary.main :
                              theme.palette.success.main
                          }
                        }} 
                      />
                      
                      <Typography variant="caption" sx={{ mt: 1 }}>
                        {insight.status === 'over' ? 'Over budget for this week!' :
                         insight.status === 'warning' ? 'Getting close to your weekly limit' :
                         insight.status === 'excellent' ? 'Excellent budget management!' :
                         'Within your weekly budget'}
                      </Typography>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            ) : (
              <Typography variant="body1" sx={{ mt: 4, textAlign: 'center' }}>
                No category data available for this week
              </Typography>
            )}
          </Paper>
        </Grid>
        
        {/* Weekly Points Breakdown */}
        <Grid item xs={12} md={4}>
          <Card sx={{ 
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            p: 2,
            backgroundColor: theme.palette.secondary.light,
            borderRadius: 2
          }}>
            <Typography variant="h6" gutterBottom>Weekly Points Breakdown</Typography>
            <Divider sx={{ mb: 2 }} />
            
            <Box sx={{ flex: 1 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2">Base tracking points</Typography>
                <Typography variant="body2" fontWeight="medium">+{weeklyPoints}</Typography>
              </Box>
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2">Budget bonus</Typography>
                <Typography variant="body2" color="primary" fontWeight="medium">+{bonusPoints}</Typography>
              </Box>
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2">Category performance</Typography>
                <Typography variant="body2" color="primary" fontWeight="medium">
                  +{categoryInsights.reduce((sum, cat) => sum + cat.points, 0)}
                </Typography>
              </Box>
              
              <Divider sx={{ my: 1 }} />
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                <Typography variant="subtitle2">Total potential points</Typography>
                <Typography variant="subtitle2" color="secondary.dark" fontWeight="bold">
                  {totalPotentialPoints}
                </Typography>
              </Box>
            </Box>
            
            <Box sx={{ mt: 2, textAlign: 'center' }}>
              <Typography variant="caption" color="textSecondary">
                Points awarded at the end of the week
              </Typography>
            </Box>
          </Card>
        </Grid>
        
        {/* Tips & Insights */}
        <Grid item xs={12} md={8}>
          <Paper elevation={3} sx={{ p: 3, borderRadius: 2, height: '100%' }}>
            <Typography variant="h6" gutterBottom>Weekly Tips & Insights</Typography>
            <Divider sx={{ mb: 2 }} />
            
            {utilizationPercentage > 100 ? (
              <Box>
                <Typography variant="body1" paragraph>
                  You're currently over your weekly budget. Here are some tips to help:
                </Typography>
                <ul>
                  <li>
                    <Typography variant="body1">
                      Consider reducing discretionary spending for the rest of the week
                    </Typography>
                  </li>
                  <li>
                    <Typography variant="body1">
                      Review your highest spending categories and look for alternatives
                    </Typography>
                  </li>
                  <li>
                    <Typography variant="body1">
                      You might miss out on bonus points this week, but you can still earn some from categories that are under budget
                    </Typography>
                  </li>
                </ul>
              </Box>
            ) : utilizationPercentage > 80 ? (
              <Box>
                <Typography variant="body1" paragraph>
                  You're approaching your weekly budget. Consider these suggestions:
                </Typography>
                <ul>
                  <li>
                    <Typography variant="body1">
                      Be mindful of additional expenses for the rest of the week
                    </Typography>
                  </li>
                  <li>
                    <Typography variant="body1">
                      Prioritize essential spending and postpone discretionary purchases
                    </Typography>
                  </li>
                  <li>
                    <Typography variant="body1">
                      You're on track to earn most of your potential points for this week!
                    </Typography>
                  </li>
                </ul>
              </Box>
            ) : (
              <Box>
                <Typography variant="body1" paragraph>
                  Great job managing your budget this week! Here's how to keep it up:
                </Typography>
                <ul>
                  <li>
                    <Typography variant="body1">
                      Continue tracking all expenses to maintain awareness
                    </Typography>
                  </li>
                  <li>
                    <Typography variant="body1">
                      You're on track to earn all your potential points this week!
                    </Typography>
                  </li>
                  <li>
                    <Typography variant="body1">
                      Consider saving some of your remaining budget for future goals
                    </Typography>
                  </li>
                </ul>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}

export default WeeklySummary; 