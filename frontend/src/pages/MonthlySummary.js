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
  Celebration,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

function MonthlySummary() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [monthlyPoints, setMonthlyPoints] = useState(0);
  const [monthlyLimit, setMonthlyLimit] = useState(0);
  const [monthlySpent, setMonthlySpent] = useState(0);
  const [bonusPoints, setBonusPoints] = useState(0);
  const [categoryInsights, setCategoryInsights] = useState([]);
  const [monthName, setMonthName] = useState('');
  const { user } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Try to fetch transactions from API with fallback to demo data
        let transactionData = [];
        try {
          const response = await axios.get('http://localhost:8000/transactions', { timeout: 8000 });
          transactionData = response.data || [];
        } catch (apiError) {
          console.warn('Could not fetch transactions from API, using demo data:', apiError);
          // Use demo transactions as fallback
          transactionData = generateDemoTransactions();
        }
        
        setTransactions(transactionData);
        
        // Calculate this month's transactions
        const currentMonthTransactions = filterTransactionsForCurrentMonth(transactionData);
        
        // Calculate monthly spending and set limit
        const monthlySpending = calculateMonthlySpending(currentMonthTransactions);
        setMonthlySpent(monthlySpending);
        
        // Set month name
        const date = new Date();
        setMonthName(date.toLocaleString('default', { month: 'long' }));
        
        // Set monthly limit (user income)
        if (user?.income) {
          setMonthlyLimit(user.income);
          
          // Calculate points based on spending vs limit
          const pointsData = calculateMonthlyPoints(monthlySpending, user.income);
          setMonthlyPoints(pointsData.basePoints);
          setBonusPoints(pointsData.bonusPoints);
          
          // Generate category insights
          const insights = generateCategoryInsights(currentMonthTransactions, user.limits);
          setCategoryInsights(insights);
        }
      } catch (error) {
        console.error('Error processing transaction data:', error);
        setError('Failed to process transaction data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  // Filter transactions for current month
  const filterTransactionsForCurrentMonth = (txns) => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    
    const startOfMonth = new Date(year, month, 1);
    const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59, 999);
    
    return txns.filter(txn => {
      const txnDate = new Date(txn.created_at);
      return txnDate >= startOfMonth && txnDate <= endOfMonth;
    });
  };

  // Calculate monthly spending
  const calculateMonthlySpending = (monthlyTxns) => {
    return monthlyTxns.reduce((sum, txn) => {
      const amount = typeof txn.amount === 'number' ? txn.amount : parseFloat(txn.amount || 0);
      // Only count transactions that are expenses (not income)
      // Consider "Income" as a category that should be excluded from spending calculations
      if (txn.category !== 'Income') {
        return sum + amount;
      }
      return sum;
    }, 0);
  };

  // Calculate monthly points based on spending vs limit with bonus
  const calculateMonthlyPoints = (spent, limit) => {
    let basePoints = 0;
    let bonusPoints = 0;
    
    // Base points for tracking expenses throughout the month
    basePoints += 100;
    
    // Bonus points for staying under budget
    if (spent <= limit) {
      // The further under budget, the more points
      const savingsPercentage = ((limit - spent) / limit) * 100;
      
      if (savingsPercentage >= 30) {
        basePoints += 150; // Excellent base points
        bonusPoints += 200; // Amazing savings bonus for the month
      } else if (savingsPercentage >= 20) {
        basePoints += 100; 
        bonusPoints += 150; // Great savings bonus
      } else if (savingsPercentage >= 10) {
        basePoints += 75;
        bonusPoints += 100; // Good savings bonus
      } else {
        basePoints += 50; // Under budget
        bonusPoints += 50; // Small bonus
      }
    } else {
      // Reduced points but still some for tracking
      basePoints += 25;
      bonusPoints = 0; // No bonus when over budget
    }
    
    return { basePoints, bonusPoints };
  };

  // Generate insights for each spending category
  const generateCategoryInsights = (monthlyTxns, userLimits) => {
    if (!userLimits) return [];
    
    // Group transactions by category and calculate totals
    const categorySpendings = {};
    monthlyTxns.forEach(txn => {
      const category = txn.category || 'Uncategorized';
      // Skip income transactions for spending tracking
      if (category === 'Income') return;
      
      const amount = typeof txn.amount === 'number' ? txn.amount : parseFloat(txn.amount || 0);
      
      if (!categorySpendings[category]) {
        categorySpendings[category] = 0;
      }
      
      categorySpendings[category] += amount;
    });
    
    // Match with user limits
    const insights = userLimits
      .filter(limitData => limitData[0] !== 'Income') // Exclude Income category from insights
      .map(limitData => {
        const category = limitData[0];
        const monthlyLimit = limitData[1];
        const spent = categorySpendings[category] || 0;
        const percentage = monthlyLimit > 0 ? Math.min(100, Math.round((spent / monthlyLimit) * 100)) : 0;
        
        // Status and points allocation
        let status = 'good';
        let points = 0;
        
        if (percentage > 100) {
          status = 'over';
          points = 0; // No points for over budget
        } else if (percentage > 85) {
          status = 'warning';
          points = 15; // Some points for being close
        } else if (percentage > 70) {
          status = 'good';
          points = 25; // Good points
        } else {
          status = 'excellent';
          points = 40; // Excellent points for significant savings
        }
        
        return {
          category,
          spent,
          monthlyLimit,
          percentage,
          status,
          points
        };
      });
    
    // Sort by percentage (highest first)
    return insights.sort((a, b) => b.percentage - a.percentage);
  };

  // Get spending by category for this month
  const getMonthlyCategorySpending = () => {
    const monthlyTransactions = filterTransactionsForCurrentMonth(transactions);
    const categorySpending = {};
    let incomeAmount = 0;
    
    monthlyTransactions.forEach(txn => {
      const category = txn.category || 'Uncategorized';
      const amount = typeof txn.amount === 'number' ? txn.amount : parseFloat(txn.amount || 0);
      
      if (category === 'Income') {
        incomeAmount += amount;
        return;
      }
      
      if (!categorySpending[category]) {
        categorySpending[category] = 0;
      }
      
      categorySpending[category] += amount;
    });
    
    // Convert to array and sort categories by amount spent (descending)
    const spendingArray = Object.entries(categorySpending)
      .sort((a, b) => b[1] - a[1])
      .map(([category, amount]) => ({ category, amount }));
    
    // Add income as a separate category if there is any
    if (incomeAmount > 0) {
      return [{ category: 'Income', amount: incomeAmount, isIncome: true }, ...spendingArray];
    }
    
    return spendingArray;
  };

  // Calculate monthly budget utilization percentage
  const getBudgetUtilizationPercentage = () => {
    if (monthlyLimit <= 0) return 0;
    return Math.min(100, Math.round((monthlySpent / monthlyLimit) * 100));
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
  
  // Calculate how many days left in the month
  const getDaysLeftInMonth = () => {
    const now = new Date();
    const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    return lastDayOfMonth - now.getDate();
  };

  // Get total potential points for the month
  const getTotalPotentialPoints = () => {
    return monthlyPoints + bonusPoints + categoryInsights.reduce((sum, cat) => sum + cat.points, 0);
  };

  // Generate demo transactions when API is unavailable
  const generateDemoTransactions = () => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    // Create transactions spanning the current month
    const demoTransactions = [];
    const categories = ['Food', 'Transport', 'Shopping', 'Utilities', 'Entertainment'];
    
    // Create 20-30 random transactions
    const numTransactions = Math.floor(Math.random() * 11) + 20;
    
    for (let i = 0; i < numTransactions; i++) {
      const date = new Date(startOfMonth.getTime() + Math.random() * (now.getTime() - startOfMonth.getTime()));
      const category = categories[Math.floor(Math.random() * categories.length)];
      
      // Amount based on category
      let amount;
      switch (category) {
        case 'Food':
          amount = Math.round(Math.random() * 2000) + 500; // 500-2500
          break;
        case 'Transport':
          amount = Math.round(Math.random() * 1500) + 300; // 300-1800
          break;
        case 'Shopping':
          amount = Math.round(Math.random() * 5000) + 1000; // 1000-6000
          break;
        case 'Utilities':
          amount = Math.round(Math.random() * 3000) + 1000; // 1000-4000
          break;
        case 'Entertainment':
          amount = Math.round(Math.random() * 2500) + 500; // 500-3000
          break;
        default:
          amount = Math.round(Math.random() * 1000) + 500; // 500-1500
      }
      
      demoTransactions.push({
        id: `demo-${i}`,
        category,
        amount,
        description: `Demo ${category} Transaction`,
        method: 'Card',
        created_at: date.toISOString(),
        status: 'completed'
      });
    }
    
    return demoTransactions;
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
        <Typography variant="h4" gutterBottom>Monthly Summary</Typography>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  const utilizationPercentage = getBudgetUtilizationPercentage();
  const statusColor = getStatusColor(utilizationPercentage);
  const categorySpending = getMonthlyCategorySpending();
  const daysLeft = getDaysLeftInMonth();
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
        <Typography variant="h4">{monthName} Summary</Typography>
        
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
            {totalPotentialPoints} points this month
          </Typography>
        </Box>
      </Box>
      
      <Grid container spacing={3}>
        {/* Monthly Budget Progress */}
        <Grid item xs={12}>
          <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
            <Box sx={{ mb: 2 }}>
              <Typography variant="h6" gutterBottom>Monthly Budget</Typography>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body1">
                  ₹{monthlySpent.toFixed(2)} of ₹{monthlyLimit.toFixed(2)}
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
            
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
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
                      ? `₹${(monthlyLimit - monthlySpent).toFixed(2)} remaining` 
                      : `₹${(monthlySpent - monthlyLimit).toFixed(2)} over budget`}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    {utilizationPercentage <= 100 
                      ? `You're doing well on your monthly budget!` 
                      : "You've exceeded your monthly budget."}
                  </Typography>
                </Box>
              </Box>
              
              <Box sx={{ textAlign: 'right' }}>
                <Typography variant="h6" color="text.secondary">
                  {daysLeft} days left
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  {daysLeft > 0 
                    ? `Until the end of ${monthName}` 
                    : "Today is the last day of the month"}
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
              Stay within your monthly limits to earn maximum bonus points
            </Typography>
            
            {categoryInsights.length > 0 ? (
              <Grid container spacing={2}>
                {categoryInsights.map((insight, index) => (
                  <Grid item xs={12} md={6} lg={4} key={index}>
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
                          ₹{insight.spent.toFixed(0)} of ₹{insight.monthlyLimit.toFixed(0)}
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
                        {insight.status === 'over' ? 'Exceeded monthly budget for this category!' :
                         insight.status === 'warning' ? 'Close to your monthly limit' :
                         insight.status === 'excellent' ? 'Excellent budget management!' :
                         'Within your monthly budget'}
                      </Typography>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            ) : (
              <Typography variant="body1" sx={{ mt: 4, textAlign: 'center' }}>
                No category data available for this month
              </Typography>
            )}
          </Paper>
        </Grid>
        
        {/* Monthly Spending Breakdown */}
        <Grid item xs={12}>
          <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
            <Typography variant="h6" gutterBottom>Monthly Spending Breakdown</Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
              Your spending by category for {monthName}
            </Typography>
            
            {categorySpending.length > 0 ? (
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                    {categorySpending.map((item, index) => (
                      <Card
                        key={index}
                        elevation={1}
                        sx={{ 
                          minWidth: 180,
                          p: 2, 
                          flex: '1 1 auto',
                          borderLeft: `4px solid ${item.isIncome ? theme.palette.success.main : theme.palette.primary.main}`,
                          borderRadius: 2
                        }}
                      >
                        <Typography variant="subtitle1" fontWeight="medium">
                          {item.category}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'flex-end', mt: 1 }}>
                          <Typography variant="h5" fontWeight="medium" color={item.isIncome ? 'success.main' : 'text.primary'}>
                            ₹{item.amount.toFixed(0)}
                          </Typography>
                          {item.isIncome && (
                            <Typography variant="caption" color="text.secondary" sx={{ ml: 1, mb: 0.5 }}>
                              Income
                            </Typography>
                          )}
                        </Box>
                      </Card>
                    ))}
                  </Box>
                </Grid>
                
                <Grid item xs={12}>
                  <Divider sx={{ my: 2 }} />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="subtitle1">Total Monthly Spending:</Typography>
                    <Typography variant="h6" color="primary.main" fontWeight="medium">
                      ₹{monthlySpent.toFixed(0)}
                    </Typography>
                  </Box>
                  {/* Show total income if we have an income category */}
                  {categorySpending.some(item => item.isIncome) && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
                      <Typography variant="subtitle1">Total Monthly Income:</Typography>
                      <Typography variant="h6" color="success.main" fontWeight="medium">
                        ₹{categorySpending.find(item => item.isIncome)?.amount.toFixed(0) || '0'}
                      </Typography>
                    </Box>
                  )}
                </Grid>
              </Grid>
            ) : (
              <Typography variant="body1" sx={{ mt: 4, textAlign: 'center' }}>
                No spending data available for this month
              </Typography>
            )}
          </Paper>
        </Grid>
        
        {/* Monthly Points Breakdown */}
        <Grid item xs={12} md={4}>
          <Card sx={{ 
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            p: 2,
            backgroundColor: theme.palette.secondary.light,
            borderRadius: 2
          }}>
            <Typography variant="h6" gutterBottom>Monthly Points Breakdown</Typography>
            <Divider sx={{ mb: 2 }} />
            
            <Box sx={{ flex: 1 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2">Base tracking points</Typography>
                <Typography variant="body2" fontWeight="medium">+{monthlyPoints}</Typography>
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
                Points awarded at the end of the month
              </Typography>
            </Box>
          </Card>
        </Grid>
        
        {/* Monthly Insights */}
        <Grid item xs={12} md={8}>
          <Paper elevation={3} sx={{ p: 3, borderRadius: 2, height: '100%' }}>
            <Typography variant="h6" gutterBottom>Monthly Insights</Typography>
            <Divider sx={{ mb: 2 }} />
            
            {utilizationPercentage > 100 ? (
              <Box>
                <Typography variant="body1" paragraph>
                  You've exceeded your monthly budget. Here are some recommendations:
                </Typography>
                <ul>
                  <li>
                    <Typography variant="body1">
                      Review your spending in high-expense categories and identify areas to cut back
                    </Typography>
                  </li>
                  <li>
                    <Typography variant="body1">
                      Consider adjusting your budget for next month if your current limit isn't realistic
                    </Typography>
                  </li>
                  <li>
                    <Typography variant="body1">
                      Focus on essential expenses for the remaining {daysLeft} days of the month
                    </Typography>
                  </li>
                </ul>
              </Box>
            ) : utilizationPercentage > 80 ? (
              <Box>
                <Typography variant="body1" paragraph>
                  You're approaching your monthly budget limit. Consider these tips:
                </Typography>
                <ul>
                  <li>
                    <Typography variant="body1">
                      Be mindful of your spending for the remaining {daysLeft} days of the month
                    </Typography>
                  </li>
                  <li>
                    <Typography variant="body1">
                      Prioritize essential expenses and postpone discretionary purchases
                    </Typography>
                  </li>
                  <li>
                    <Typography variant="body1">
                      You're on track to earn most of your potential points for this month!
                    </Typography>
                  </li>
                </ul>
              </Box>
            ) : (
              <Box>
                <Typography variant="body1" paragraph>
                  Excellent job managing your budget this month! Here's how to keep it up:
                </Typography>
                <ul>
                  <li>
                    <Typography variant="body1">
                      Continue tracking all expenses consistently
                    </Typography>
                  </li>
                  <li>
                    <Typography variant="body1">
                      You're on track to earn all your potential points this month!
                    </Typography>
                  </li>
                  <li>
                    <Typography variant="body1">
                      Consider allocating some of your savings toward long-term financial goals
                    </Typography>
                  </li>
                </ul>
              </Box>
            )}
            
            {daysLeft <= 5 && (
              <Box sx={{ mt: 3, p: 2, bgcolor: 'info.lighter', borderRadius: 2, display: 'flex', alignItems: 'center' }}>
                <Celebration color="primary" sx={{ mr: 2 }} />
                <Box>
                  <Typography variant="subtitle1" color="primary.main">Month-End Approaching</Typography>
                  <Typography variant="body2">
                    Only {daysLeft} {daysLeft === 1 ? 'day' : 'days'} left in this month. 
                    Your performance will be evaluated and points will be awarded at the end of the month!
                  </Typography>
                </Box>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}

export default MonthlySummary; 