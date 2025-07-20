// Authentication service for handling session management

/**
 * Verifies the current session with the server
 * @returns {Promise<boolean>} True if session is valid, false otherwise
 */
export const verifySession = async () => {
  try {
    const response = await fetch('http://localhost:8080/api/auth/verify-session', {
      method: 'GET',
      credentials: 'include', // Important for sending cookies
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      return false;
    }
    
    const data = await response.json();
    return data.valid === true;
  } catch (error) {
    console.error('Session verification error:', error);
    return false;
  }
};

/**
 * Logs out the user by invalidating the session
 * @returns {Promise<boolean>} True if logout succeeded
 */
export const logout = async () => {
  try {
    // const response = await fetch('http://localhost:8080/api/auth/logout', {
    const response = await fetch('http://localhost:8080/api/auth/logout', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    return response.ok;
  } catch (error) {
    console.error('Logout error:', error);
    return false;
  }
};
