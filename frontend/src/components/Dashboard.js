import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Dashboard = () => {
  const [summary, setSummary] = useState({});

  useEffect(() => {
    const fetchSummary = async () => {
      const response = await axios.get('/dashboard/summary?period=monthly');
      setSummary(response.data);
    };
    fetchSummary();
  }, []);

  return (
    <div>
      <h1>Dashboard</h1>
      <p>Account Balance: {summary.balance}</p>
      <p>Net Income: {summary.net_income}</p>
      <p>Net Expense: {summary.net_expense}</p>
      {/* Progress bars for categories */}
    </div>
  );
};

export default Dashboard;