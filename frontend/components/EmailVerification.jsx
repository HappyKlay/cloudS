import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { CheckCircle, XCircle } from 'lucide-react';

/**
 * Email Verification component that processes token from URL and sends verification request
 * Used when a user clicks on the email verification link
 */
const EmailVerification = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [verificationStatus, setVerificationStatus] = useState('verifying');
  const [error, setError] = useState('');
  
  useEffect(() => {
    // Parse the email and token from URL or query parameters
    const queryParams = new URLSearchParams(location.search);
    const token = queryParams.get('token');
    const email = queryParams.get('email');
    
    if (!token) {
      setVerificationStatus('failed');
      setError('Verification token is missing');
      return;
    }
    
    // Perform verification with or without email
    verifyEmail(email, token);
  }, [location]);
  
  const verifyEmail = async (email, token) => {
    try {
      // If we don't have an email, we'll just send the token 
      // and let the backend find the associated user
      const verificationData = {
        verificationCode: token
      };
      
      // Add email to the request if it's available
      if (email) {
        verificationData.email = email;
      }
      
      const response = await fetch('http://sloud-s-beanstalk-env.eba-iibpdtfm.us-east-1.elasticbeanstalk.com/api/auth/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(verificationData),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setVerificationStatus('success');
        // Redirect to login page after 3 seconds
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      } else {
        setVerificationStatus('failed');
        setError(data.error || 'Verification failed. Please try again.');
      }
    } catch (error) {
      setVerificationStatus('failed');
      setError('An error occurred during verification. Please try again.');
      console.error('Verification error:', error);
    }
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full p-8 bg-white rounded-lg shadow-lg text-center">
        <h1 className="text-2xl font-semibold mb-4">Email Verification</h1>
        
        {verificationStatus === 'verifying' && (
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            <p className="mt-4 text-gray-600">Verifying your email...</p>
          </div>
        )}
        
        {verificationStatus === 'success' && (
          <div className="flex flex-col items-center">
            <CheckCircle className="h-16 w-16 text-green-500" />
            <h2 className="text-xl font-medium mt-4 text-green-600">Verification Successful!</h2>
            <p className="mt-2 text-gray-600">Your email has been verified. You will be redirected to the login page shortly.</p>
            <button 
              onClick={() => navigate('/login')} 
              className="mt-6 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Go to Login
            </button>
          </div>
        )}
        
        {verificationStatus === 'failed' && (
          <div className="flex flex-col items-center">
            <XCircle className="h-16 w-16 text-red-500" />
            <h2 className="text-xl font-medium mt-4 text-red-600">Verification Failed</h2>
            <p className="mt-2 text-gray-600">{error}</p>
            <button 
              onClick={() => navigate('/login')} 
              className="mt-6 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Go to Login
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmailVerification; 