import { useState, useEffect } from 'react';

export const useUserProfile = () => {
  const [userData, setUserData] = useState({
    username: '',
    name: '',
    surname: '',
    email: '',
    registrationDate: ''
  });
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:8080/api/users/profile', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch user data');
      }

      const data = await response.json();
      setUserData(data);
      setError(null);
    } catch (err) {
      setError('Error loading profile data. Please try again later.');
      console.error('Error fetching user data:', err);
    } finally {
      setLoading(false);
    }
  };

  return {
    userData,
    loading,
    error,
    fetchUserData
  };
}; 