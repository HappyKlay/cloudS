import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Send, CheckCircle, AlertCircle, Link } from 'lucide-react';
import AuthLayout from './Auth/AuthLayout'; // Assuming same layout component

const TestPage = () => {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const handleLocalTestRequest = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      const response = await fetch('http://localhost:8080/test/hi', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const data = await response.json();
      console.log('Response from local endpoint:', data);
      setSuccess('Local request sent successfully! Check console for response details.');
    } catch (error) {
      console.error('Error sending local test request:', error);
      setError('Error sending request to local server. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoteTestRequest = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      const response = await fetch('http://sloud-s-beanstalk-env.eba-iibpdtfm.us-east-1.elasticbeanstalk.com/test/hi', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const data = await response.json();
      console.log('Response from remote endpoint:', data);
      setSuccess('Remote request sent successfully! Check console for response details.');
    } catch (error) {
      console.error('Error sending remote test request:', error);
      setError('Error sending request to remote server. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="API Test">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="w-full"
      >
        {error && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start animate-shake"
          >
            <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" />
            <div className="text-red-600 text-sm">{error}</div>
          </motion.div>
        )}

        {success && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start"
          >
            <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
            <div className="text-green-600 text-sm">{success}</div>
          </motion.div>
        )}

        <div className="space-y-6">
          <div className="text-center space-y-2">
            <h3 className="text-lg font-medium text-gray-900">API Connection Test</h3>
            <p className="text-sm text-gray-600">
              Test the connection to your backend API endpoints
            </p>
          </div>

          <div className="space-y-4">
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="flex items-center space-x-2 text-sm text-gray-600 mb-3">
                <Link className="h-4 w-4" />
                <span className="font-semibold">Local Development</span>
              </div>
              <div className="font-mono text-xs text-gray-500 break-all">
                GET http://localhost:8080/test/hi
              </div>
            </div>

            <motion.button 
              onClick={handleLocalTestRequest}
              className={`w-full py-3 px-4 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white font-medium rounded-lg shadow-sm hover:shadow transition-all duration-200 flex items-center justify-center ${loading ? 'opacity-70 cursor-not-allowed' : 'transform hover:-translate-y-0.5'}`}
              whileHover={loading ? {} : { scale: 1.01 }}
              whileTap={loading ? {} : { scale: 0.99 }}
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="inline-block animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></span>
                  <span>Sending Request...</span>
                </>
              ) : (
                <>
                  <Send className="h-5 w-5 mr-2" />
                  <span>Test Local Server</span>
                </>
              )}
            </motion.button>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="flex items-center space-x-2 text-sm text-gray-600 mb-3">
                <Link className="h-4 w-4" />
                <span className="font-semibold">Production Environment</span>
              </div>
              <div className="font-mono text-xs text-gray-500 break-all">
                GET https://sloud-s-beanstalk-env.eba-iibpdtfm.us-east-1.elasticbeanstalk.com/test/hi
              </div>
            </div>

            <motion.button 
              onClick={handleRemoteTestRequest}
              className={`w-full py-3 px-4 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-medium rounded-lg shadow-sm hover:shadow transition-all duration-200 flex items-center justify-center ${loading ? 'opacity-70 cursor-not-allowed' : 'transform hover:-translate-y-0.5'}`}
              whileHover={loading ? {} : { scale: 1.01 }}
              whileTap={loading ? {} : { scale: 0.99 }}
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="inline-block animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></span>
                  <span>Sending Request...</span>
                </>
              ) : (
                <>
                  <Send className="h-5 w-5 mr-2" />
                  <span>Test Production Server</span>
                </>
              )}
            </motion.button>
          </div>

          <div className="text-center mt-6">
            <p className="text-sm text-gray-600">
              Need to authenticate? <Link to="/login" className="font-medium text-indigo-600 hover:text-indigo-700 transition-colors duration-200">Go to Login</Link>
            </p>
            <p className="text-sm text-gray-600 mt-2">
              Don't have an account? <Link to="/register" className="font-medium text-indigo-600 hover:text-indigo-700 transition-colors duration-200">Register</Link>
            </p>
          </div>
        </div>
      </motion.div>
      
      <style jsx>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
          20%, 40%, 60%, 80% { transform: translateX(5px); }
        }
        
        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
      `}</style>
    </AuthLayout>
  );
};

export default TestPage;