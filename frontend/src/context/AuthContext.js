import React, { createContext, useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';

// Create context
const AuthContext = createContext(null);

// Session timeout in milliseconds (30 minutes)
const SESSION_TIMEOUT = 30 * 60 * 1000;

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sessionTimer, setSessionTimer] = useState(null);
  const navigate = useNavigate();

  // Load user from localStorage on component mount
  useEffect(() => {
    const loadUser = async () => {
      try {
        const storedUser = localStorage.getItem('finflowUser');
        if (storedUser) {
          setUser(JSON.parse(storedUser));
          resetSessionTimer(); // Start the session timer
        }
      } catch (error) {
        console.error('Error loading user from storage:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUser();

    // Add event listeners for user activity
    const resetTimerOnActivity = () => resetSessionTimer();
    window.addEventListener('click', resetTimerOnActivity);
    window.addEventListener('keypress', resetTimerOnActivity);
    window.addEventListener('scroll', resetTimerOnActivity);
    window.addEventListener('mousemove', resetTimerOnActivity);

    // Clean up event listeners
    return () => {
      window.removeEventListener('click', resetTimerOnActivity);
      window.removeEventListener('keypress', resetTimerOnActivity);
      window.removeEventListener('scroll', resetTimerOnActivity);
      window.removeEventListener('mousemove', resetTimerOnActivity);
      clearTimeout(sessionTimer);
    };
  }, []);

  // Function to reset the session timer
  const resetSessionTimer = () => {
    // Clear any existing timer
    if (sessionTimer) {
      clearTimeout(sessionTimer);
    }
    
    // If user is logged in, set a new timer
    if (user) {
      const timer = setTimeout(() => {
        // Auto logout after timeout
        logout();
        alert('Your session has expired. Please log in again.');
      }, SESSION_TIMEOUT);
      
      setSessionTimer(timer);
    }
  };

  // Login function
  const login = (userData) => {
    // Ensure all required fields are present with default values if needed
    const completeUserData = {
      name: userData.name || '',
      email: userData.email || '',
      phoneNumber: userData.phoneNumber || '',
      income: userData.income || 0,
      occupation: userData.occupation || '',
      preferredPaymentMethods: userData.preferredPaymentMethods || [],
      isFirstLogin: userData.isFirstLogin ?? true,
      limits: userData.limits || null,
      createdAt: userData.createdAt || new Date().toISOString(),
      lastLogin: new Date().toISOString()
    };

    localStorage.setItem('finflowUser', JSON.stringify(completeUserData));
    setUser(completeUserData);
    resetSessionTimer(); // Start session timer on login
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem('finflowUser');
    setUser(null);
    // Clear session timer on logout
    if (sessionTimer) {
      clearTimeout(sessionTimer);
      setSessionTimer(null);
    }
    navigate('/login');
  };

  // Update user function with explicit handling of isFirstLogin changes
  const updateUser = (updatedData) => {
    // Create the updated user data
    const updatedUser = { ...user, ...updatedData };
    
    // Always ensure the change is persisted to localStorage
    localStorage.setItem('finflowUser', JSON.stringify(updatedUser));
    
    // Update the user state in context
    setUser(updatedUser);
    
    // Reset the session timer
    resetSessionTimer();
  };

  // Check if user is on first login - we'll keep this but won't automatically show setup
  const isFirstLogin = () => {
    return false; // Always return false since we no longer use automatic setup
  };

  // Check if user has completed the income and limits setup
  const hasCompletedSetup = () => {
    return user?.income > 0 && Array.isArray(user?.limits) && user.limits.length > 0;
  };

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        loading, 
        login, 
        logout, 
        updateUser,
        isFirstLogin,
        hasCompletedSetup,
        isAuthenticated: !!user,
        resetSessionTimer,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext; 