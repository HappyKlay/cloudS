import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthLayout from './AuthLayout';
import { motion } from 'framer-motion';
import { Eye, EyeOff } from 'lucide-react';

const Login = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    remember: false
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleLogin = async (email, password) => {
    try {
      setError('');
      const response = await fetch('http://localhost:8080/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();
      
      if (response.ok) {
        console.log('Login successful:', data);
        
        // Store the token if it's returned from the backend
        if (data.token) {
          localStorage.setItem('token', data.token);
        }
        localStorage.setItem('username', data.username);
        localStorage.setItem('elo', data.elo);
        localStorage.setItem('id', data.id);
        
        // If remember me is checked, save email in localStorage
        if (formData.remember) {
          localStorage.setItem('rememberedEmail', email);
        } else {
          localStorage.removeItem('rememberedEmail');
        }
        
        navigate('/lobby');
      } else {
        setError(data.message || 'Login failed. Please check your credentials.');
        console.error('Login error:', data);
      }
    } catch (error) {
      setError('An error occurred during login. Please try again.');
      console.error('Login error:', error);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(prev => !prev);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handleLogin(formData.email, formData.password);
  };

  return (
    <AuthLayout title="Login">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="backdrop-blur-sm bg-white/90 p-6 rounded-lg border border-gray-200 shadow-xl"
      >
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-600 text-sm">
            {error}
          </div>
        )}
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-1">
            <label className="block text-xs font-medium text-gray-600 uppercase tracking-wider">Email</label>
            <div className="relative">
              <input 
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full bg-gray-50 border-b border-gray-200 focus:border-blue-500 outline-none pb-2 px-3 pt-2 text-gray-700 placeholder-gray-400 transition-colors rounded-t-md"
                placeholder="your@email.com"
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-medium text-gray-600 uppercase tracking-wider">Password</label>
            <div className="relative">
              <input 
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full bg-gray-50 border-b border-gray-200 focus:border-blue-500 outline-none pb-2 px-3 pt-2 text-gray-700 placeholder-gray-400 transition-colors rounded-t-md"
                placeholder="••••••••"
                required
              />
              <button 
                type="button" 
                onClick={togglePasswordVisibility}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-700 transition-colors"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center">
              <div className="relative">
                <input 
                  type="checkbox"
                  id="remember"
                  name="remember"
                  checked={formData.remember}
                  onChange={handleChange}
                  className="w-4 h-4 appearance-none bg-gray-100 border border-gray-300 rounded checked:bg-blue-500 transition-colors"
                />
                {formData.remember && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
              </div>
              <label htmlFor="remember" className="ml-2 text-xs text-gray-600 cursor-pointer">
                Remember me
              </label>
            </div>
            <a href="#" className="text-xs text-gray-600 hover:text-blue-600 transition-colors">
              Forgot password?
            </a>
          </div>

          <motion.button 
            type="submit" 
            className="w-full py-3 mt-6 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 border border-blue-700/50 transition-all duration-300"
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
          >
            Log In
          </motion.button>

          <div className="text-center text-xs text-gray-500 mt-6">
            Don't have an account? <Link to="/register" className="text-blue-600 hover:text-blue-700 transition-colors">Register</Link>
          </div>
        </form>
      </motion.div>
    </AuthLayout>
  );
};

export default Login;