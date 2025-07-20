import React from 'react';
import { Cloud } from 'lucide-react';
import { motion } from 'framer-motion';

const AuthLayout = ({ children, title, isBlur = false }) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-gray-50 p-4 sm:p-6">
      <div className="absolute top-8 left-1/2 transform -translate-x-1/2">
        <motion.div 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex items-center justify-center space-x-2"
        >
          <Cloud className="h-8 w-8 text-indigo-600" />
          <span className="text-2xl font-bold text-indigo-700 bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-indigo-500">CloudS</span>
        </motion.div>
      </div>
      
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.4 }}
        className={`w-full max-w-md px-8 py-10 bg-white rounded-xl border border-gray-200 shadow-xl ${isBlur ? 'backdrop-blur-md' : ''}`}
      >
        <h1 className="text-2xl font-bold text-center mb-8 bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-indigo-500">{title}</h1>
        {children}
      </motion.div>
      
      <div className="absolute bottom-4 text-center w-full text-gray-500 text-xs">
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          Secure end-to-end encrypted cloud storage
        </motion.p>
      </div>
    </div>
  );
};

export default AuthLayout;