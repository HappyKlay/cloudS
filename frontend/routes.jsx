import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Dashboard from './pages/Dashboard';      
import Header from './components/Header';
import Footer from './components/Footer';
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import ProfilePage from './pages/StoragePage';
import EmailVerification from './components/EmailVerification';
import LoadingScreen from './pages/Loading';
import Settings from './pages/Settings';
import TestPage from './pages/TestPage';
import ProtectedRoute from './components/ProtectedRoute';
import PublicRoute from './components/PublicRoute';

const AppRoutes = () => {
  return (
    <>
      <Header />
      <Routes>
        {/* Initial loading route - will redirect based on auth state and last location */}
        <Route path="/" element={<InitialRoute />} />
        
        {/* Auth routes - public */}
        <Route path="/login" element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        } />
        <Route path="/register" element={
          <PublicRoute>
            <Register />
          </PublicRoute>
        } />
        <Route path="/verify-email" element={
          <PublicRoute>
            <EmailVerification />
          </PublicRoute>
        } />
        
        {/* Protected routes - require authentication */}
        <Route path="/hm" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />
        <Route path="/profile" element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        } />
        <Route path="/settings" element={
          <ProtectedRoute>
            <Settings />
          </ProtectedRoute>
        } />
        <Route path="/test" element={<TestPage />} />
        
        {/* Catch-all route - redirect to login */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
      <Footer />
    </>
  );
};

// Component to handle initial routing based on auth state and last location
const InitialRoute = () => {
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const location = useLocation();

  useEffect(() => {
    // Save current path when navigating to non-root routes
    if (location.pathname !== '/') {
      localStorage.setItem('lastPath', location.pathname);
    }

    // Check if user is authenticated
    const checkAuth = () => {
      const token = localStorage.getItem('userAuthKey');
      setIsAuthenticated(!!token);
      setLoading(false);
    };

    checkAuth();
  }, [location]);

  if (loading) {
    return <LoadingScreen />;
  }

  if (isAuthenticated) {
    // Redirect to last visited path or dashboard
    const lastPath = localStorage.getItem('lastPath');
    return <Navigate to={lastPath || '/hm'} replace />;
  } else {
    // Not authenticated, redirect to login
    return <Navigate to="/login" replace />;
  }
};

export default AppRoutes;
