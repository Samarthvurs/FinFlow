import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Paper,
  Grid,
  Drawer,
  IconButton,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { DataGrid } from '@mui/x-data-grid';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import LimitsSetupDialog from '../components/LimitsSetupDialog';
import SpendingProgress from '../components/SpendingProgress';

function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [open, setOpen] = useState(false);
  const [categories, setCategories] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newTransaction, setNewTransaction] = useState({
    category: '',
    amount: '',
    description: '',
    method: '',
  });
  const [openLimitsDialog, setOpenLimitsDialog] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [txnResponse, catResponse, methodResponse] = await Promise.all([
          axios.get('http://localhost:8000/transactions'),
          axios.get('http://localhost:8000/categories'),
          axios.get('http://localhost:8000/payment-methods'),
        ]);
        setTransactions(txnResponse.data || []);
        setCategories(catResponse.data.categories || []);
        setPaymentMethods(methodResponse.data.methods || []);
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to load transaction data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const handleSubmit = async () => {
    if (!newTransaction.category || !newTransaction.amount || !newTransaction.method) {
      alert('Please fill in all required fields');
      return;
    }
    
    try {
      // Ensure amount is a number
      const transactionData = {
        ...newTransaction,
        amount: parseFloat(newTransaction.amount)
      };
      
      await axios.post('http://localhost:8000/add-transaction', transactionData);
      const response = await axios.get('http://localhost:8000/transactions');
      setTransactions(response.data || []);
      handleClose();
      setNewTransaction({
        category: '',
        amount: '',
        description: '',
        method: '',
      });
    } catch (error) {
      console.error('Error adding transaction:', error);
      alert('Failed to add transaction. Please try again.');
    }
  };

  const columns = [
    { field: 'category', headerName: 'Category', width: 130 },
    { 
      field: 'amount', 
      headerName: 'Amount (₹)', 
      width: 130,
      valueFormatter: (params) => {
        if (typeof params.value === 'number') {
          return params.value.toFixed(2);
        }
        return params.value;
      }
    },
    { field: 'description', headerName: 'Description', width: 200 },
    { field: 'method', headerName: 'Payment Method', width: 130 },
    {
      field: 'created_at',
      headerName: 'Date',
      width: 180,
      valueFormatter: (params) => new Date(params.value).toLocaleString(),
    },
  ];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, flexWrap: 'wrap', gap: 1 }}>
        <Typography variant="h4">Transactions</Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button 
            variant="outlined" 
            color="secondary" 
            onClick={() => setDrawerOpen(true)}
          >
            Budget Status
          </Button>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={handleOpen}
          >
            Add Transaction
          </Button>
        </Box>
      </Box>

      {error && (
        <Typography color="error" sx={{ mb: 2 }}>{error}</Typography>
      )}

      <Paper sx={{ height: 400, width: '100%' }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <Typography>Loading transactions...</Typography>
          </Box>
        ) : (
        <DataGrid
          rows={transactions}
          columns={columns}
          pageSize={5}
          rowsPerPageOptions={[5, 10, 25]}
          disableSelectionOnClick
          getRowId={(row) => row.id || transactions.indexOf(row)}
          sx={{ border: 'none' }}
        />
        )}
      </Paper>

      {/* Add Transaction Dialog */}
      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>Add New Transaction</DialogTitle>
        <DialogContent>
          <TextField
            select
            label="Category"
            value={newTransaction.category}
            onChange={(e) => setNewTransaction({ ...newTransaction, category: e.target.value })}
            fullWidth
            margin="normal"
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
          >
            {paymentMethods.map((method) => (
              <MenuItem key={method} value={method}>
                {method}
              </MenuItem>
            ))}
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleSubmit} color="primary">
            Add
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Limits Setup Dialog */}
      <LimitsSetupDialog 
        open={openLimitsDialog} 
        onClose={() => setOpenLimitsDialog(false)} 
      />

      {/* Budget Status Drawer */}
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      >
        <Box sx={{ width: 320, p: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Budget Status</Typography>
            <IconButton onClick={() => setDrawerOpen(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
          <SpendingProgress 
            transactions={transactions}
            onSetLimits={() => {
              setDrawerOpen(false);
              setOpenLimitsDialog(true);
            }}
          />
        </Box>
      </Drawer>
    </Box>
  );
}

export default Transactions; 