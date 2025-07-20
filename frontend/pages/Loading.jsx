import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { verifySession } from '../services/authService';

export default function LoadingScreen() {
  const [loadingText, setLoadingText] = useState('Loading');
  const navigate = useNavigate();
  
  // Simulate loading dots animation
  useEffect(() => {
    const interval = setInterval(() => {
      setLoadingText(prev => {
        if (prev === 'Loading...') return 'Loading';
        return prev + '.';
      });
    }, 500);
    
    return () => clearInterval(interval);
  }, []);
  
  // Verify session and redirect accordingly
  useEffect(() => {
    const checkSession = async () => {
      try {
        // Add a small delay to ensure loading screen is visible
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const isValid = await verifySession();
        
        if (isValid) {
          // Get the last path from localStorage or default to dashboard
          const lastPath = localStorage.getItem('lastPath') || '/hm';
          navigate(lastPath);
        } else {
          navigate('/login');
        }
      } catch (error) {
        console.error('Session check failed:', error);
        navigate('/login');
      }
    };
    
    checkSession();
  }, [navigate]);
  
  return (
    <div className="flex items-center justify-center w-screen h-screen bg-gray-100">
      <div className="flex flex-col items-center space-y-6">
        {/* Loading spinner */}
        <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin"></div>
        
        {/* Loading text */}
        <div className="text-2xl font-medium text-blue-500">
          {loadingText}
        </div>
      </div>
    </div>
  );
}