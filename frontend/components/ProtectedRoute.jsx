import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import LoadingScreen from '../pages/Loading';

const ProtectedRoute = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const location = useLocation();

  useEffect(() => {
    // Save current path to localStorage when accessing a protected route
    if (location.pathname !== '/') {
      localStorage.setItem('lastPath', location.pathname);
    }

    // Check if the user is authenticated
    const checkAuthentication = async () => {
      try {
        setIsLoading(true);
        
        // First, check if we have the authentication key in localStorage
        const authKey = localStorage.getItem('userAuthKey');
        
        if (!authKey) {
          // No auth key in storage, user is not authenticated
          setIsAuthenticated(false);
          setIsLoading(false);
          return;
        }

        // Verify the session on the server
        const response = await fetch('http://localhost:8080/api/auth/verify-session', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include'
        });
        
        const data = await response.json();
        
        // Set authenticated based on the server response
        setIsAuthenticated(data.valid === true);
      } catch (error) {
        console.error('Session verification error:', error);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthentication();
  }, [location.pathname]);

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    // Redirect to login page with the return url
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

export default ProtectedRoute; 