import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export const useLogout = () => {
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const navigate = useNavigate();

  const logout = async () => {
    try {
      setIsLoggingOut(true);
      
      const response = await fetch('http://localhost:8080/api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });
      
      // Clear stored user data regardless of response
      localStorage.removeItem('userAuthKey');
      localStorage.removeItem('rememberEmail');
      
      // Dispatch auth change event to update UI
      console.log('Dispatching authChange event from useLogout');
      window.dispatchEvent(new Event('authChange'));
      
      // Give the UI a moment to update before navigating
      setTimeout(() => {
        // Redirect to login page
        navigate('/login');
        setIsLoggingOut(false);
      }, 100);
      
    } catch (error) {
      console.error('Logout error:', error);
      // Still redirect and clear data even if the request fails
      localStorage.removeItem('userAuthKey');
      localStorage.removeItem('rememberEmail');
      
      // Dispatch auth change event to update UI
      console.log('Dispatching authChange event from useLogout');
      window.dispatchEvent(new Event('authChange'));
      
      // Give the UI a moment to update before navigating
      setTimeout(() => {
        navigate('/login');
        setIsLoggingOut(false);
      }, 100);
    }
  };

  return {
    logout,
    isLoggingOut
  };
}; 