import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  AppBar,
  Box,
  CssBaseline,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  Avatar,
  Menu,
  MenuItem,
  Divider,
  Button,
  Fab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  Receipt as ReceiptIcon,
  TrendingUp as TrendingUpIcon,
  Payment as PaymentIcon,
  AccountCircle as AccountCircleIcon,
  ExitToApp as LogoutIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const drawerWidth = 240;

function Layout({ children }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, isAuthenticated } = useAuth();
  
  // States for Add Transaction dialog
  const [openAddTransaction, setOpenAddTransaction] = useState(false);
  const [categories, setCategories] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [newTransaction, setNewTransaction] = useState({
    category: '',
    amount: '',
    description: '',
    method: '',
  });
  const [loading, setLoading] = useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    handleMenuClose();
    logout();
  };

  const handleProfile = () => {
    handleMenuClose();
    // Navigate to profile page (if you create one)
    // navigate('/profile');
  };

  // Add Transaction Dialog handlers
  const handleOpenAddTransaction = async () => {
    try {
      const [catResponse, methodResponse] = await Promise.all([
        axios.get('http://localhost:8000/categories'),
        axios.get('http://localhost:8000/payment-methods'),
      ]);
      setCategories(catResponse.data.categories || []);
      setPaymentMethods(methodResponse.data.methods || []);
      setOpenAddTransaction(true);
    } catch (error) {
      console.error('Error fetching data:', error);
      // Open dialog anyway, but with empty categories/methods
      setCategories([]);
      setPaymentMethods([]);
      setOpenAddTransaction(true);
    }
  };

  const handleCloseAddTransaction = () => {
    setOpenAddTransaction(false);
    setNewTransaction({
      category: '',
      amount: '',
      description: '',
      method: '',
    });
  };

  const handleSubmitTransaction = async () => {
    if (!newTransaction.category || !newTransaction.amount || !newTransaction.method) {
      alert('Please fill in all required fields');
      return;
    }
    
    setLoading(true);
    try {
      // Ensure amount is a number
      const transactionData = {
        ...newTransaction,
        amount: parseFloat(newTransaction.amount)
      };
      
      await axios.post('http://localhost:8000/add-transaction', transactionData);
      handleCloseAddTransaction();
      // Optionally refresh the current page or show a success message
      alert('Transaction added successfully!');
    } catch (error) {
      console.error('Error adding transaction:', error);
      alert('Failed to add transaction. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const menuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
    { text: 'Transactions', icon: <ReceiptIcon />, path: '/transactions' },
    { text: 'Predictions', icon: <TrendingUpIcon />, path: '/predictions' },
    { text: 'Razorpay', icon: <PaymentIcon />, path: '/razorpay' },
  ];

  // Check if we're on a public page where we don't want to show the full layout
  const isPublicPage = ['/login', '/signup', '/landing', '/'].includes(location.pathname);

  // If we're on a public page, just render the children without layout
  if (isPublicPage) {
    return children;
  }

  const drawer = (
    <div>
      <Toolbar />
      <List>
        {menuItems.map((item) => (
          <ListItem
            button
            key={item.text}
            onClick={() => navigate(item.path)}
            selected={location.pathname === item.path}
          >
            <ListItemIcon>{item.icon}</ListItemIcon>
            <ListItemText primary={item.text} />
          </ListItem>
        ))}
      </List>
    </div>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            FinFlow
          </Typography>
          
          {isAuthenticated ? (
            <>
              <IconButton
                size="large"
                edge="end"
                aria-label="account of current user"
                aria-controls="menu-appbar"
                aria-haspopup="true"
                onClick={handleMenuOpen}
                color="inherit"
              >
                <Avatar sx={{ width: 32, height: 32, bgcolor: 'secondary.main' }}>
                  {user?.name?.charAt(0) || 'U'}
                </Avatar>
              </IconButton>
              <Menu
                id="menu-appbar"
                anchorEl={anchorEl}
                anchorOrigin={{
                  vertical: 'bottom',
                  horizontal: 'right',
                }}
                keepMounted
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
              >
                <MenuItem onClick={handleProfile}>
                  <ListItemIcon>
                    <AccountCircleIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText primary={user?.name || 'User'} secondary={user?.email} />
                </MenuItem>
                <Divider />
                <MenuItem onClick={handleLogout}>
                  <ListItemIcon>
                    <LogoutIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText primary="Logout" />
                </MenuItem>
              </Menu>
            </>
          ) : (
            <>
              <Button color="inherit" onClick={() => navigate('/login')}>Login</Button>
              <Button color="inherit" onClick={() => navigate('/signup')}>Sign Up</Button>
            </>
          )}
        </Toolbar>
      </AppBar>
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
        aria-label="mailbox folders"
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile.
          }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      <Box
        component="main"
        sx={{ flexGrow: 1, p: 3, width: { sm: `calc(100% - ${drawerWidth}px)` } }}
      >
        <Toolbar />
        {children}
        
        {/* Floating Action Button for Adding Transactions */}
        {isAuthenticated && (
          <Fab
            color="primary"
            aria-label="add transaction"
            sx={{
              position: 'fixed',
              bottom: 16,
              right: 16,
            }}
            onClick={handleOpenAddTransaction}
          >
            <AddIcon />
          </Fab>
        )}
        
        {/* Add Transaction Dialog */}
        <Dialog open={openAddTransaction} onClose={handleCloseAddTransaction}>
          <DialogTitle>Add New Transaction</DialogTitle>
          <DialogContent>
            <TextField
              select
              label="Category"
              value={newTransaction.category}
              onChange={(e) => setNewTransaction({ ...newTransaction, category: e.target.value })}
              fullWidth
              margin="normal"
              SelectProps={{
                native: false,
              }}
            >
              {categories.map((category) => (
                <MenuItem key={category} value={category}>
                  {category}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Amount"
              type="number"
              value={newTransaction.amount}
              onChange={(e) => setNewTransaction({ ...newTransaction, amount: e.target.value })}
              fullWidth
              margin="normal"
            />
            <TextField
              label="Description"
              value={newTransaction.description}
              onChange={(e) => setNewTransaction({ ...newTransaction, description: e.target.value })}
              fullWidth
              margin="normal"
            />
            <TextField
              select
              label="Payment Method"
              value={newTransaction.method}
              onChange={(e) => setNewTransaction({ ...newTransaction, method: e.target.value })}
              fullWidth
              margin="normal"
              SelectProps={{
                native: false,
              }}
            >
              {paymentMethods.map((method) => (
                <MenuItem key={method} value={method}>
                  {method}
                </MenuItem>
              ))}
            </TextField>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseAddTransaction}>Cancel</Button>
            <Button 
              onClick={handleSubmitTransaction} 
              color="primary"
              disabled={loading}
            >
              {loading ? 'Adding...' : 'Add'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Box>
  );
}

export default Layout; 