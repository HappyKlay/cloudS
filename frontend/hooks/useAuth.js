import { useState, useEffect, useCallback } from 'react';

export const useAuth = () => {
  const [userEmail, setUserEmail] = useState('');
  const [userAuthKey, setUserAuthKey] = useState('');
  const [, forceUpdate] = useState();

  const checkAuth = useCallback(() => {
    const rememberedEmail = localStorage.getItem('rememberEmail');
    const storedAuthKey = localStorage.getItem('userAuthKey');
    
    // Only update if values have changed
    if (rememberedEmail !== userEmail) {
      setUserEmail(rememberedEmail || '');
    }
    
    if (storedAuthKey !== userAuthKey) {
      setUserAuthKey(storedAuthKey || '');
      // Force re-render to ensure components update
      forceUpdate({});
    }
  }, [userEmail, userAuthKey]);

  useEffect(() => {
    // Initial check
    checkAuth();

    // Listen for localStorage changes from other tabs/windows
    const handleStorageChange = (e) => {
      if (e.key === 'userAuthKey' || e.key === 'rememberEmail') {
        checkAuth();
      }
    };

    // Listen for auth change events dispatched within the same window
    const handleAuthChange = () => {
      console.log('Auth change event received');
      // Force immediate check of auth state
      setTimeout(checkAuth, 0);
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('authChange', handleAuthChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('authChange', handleAuthChange);
    };
  }, [checkAuth]);

  return {
    userEmail,
    userAuthKey,
    isAuthenticated: !!userAuthKey
  };
};
