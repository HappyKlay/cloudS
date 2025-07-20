import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { 
  Cloud, 
  Settings, 
  User, 
  Home,
  Database,
  Menu,
  X
} from 'lucide-react';

const Header = () => {
  const { isAuthenticated, userAuthKey } = useAuth();
  const [authState, setAuthState] = useState(isAuthenticated);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  
  // Track active nav item
  const isActive = (path) => {
    return location.pathname === path;
  };
  
  // Update local auth state when the auth hook value changes
  useEffect(() => {
    setAuthState(isAuthenticated);
    console.log('Header auth state updated:', isAuthenticated, 'userAuthKey:', !!userAuthKey);
  }, [isAuthenticated, userAuthKey]);
  
  useEffect(() => {
    // Close mobile menu when location changes
    setIsMenuOpen(false);
  }, [location]);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <header className="fixed top-0 left-0 right-0 bg-white shadow-md z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo & Brand */}
          <div className="flex-shrink-0 flex items-center">
            <Link 
              to={authState ? "/hm" : "/"} 
              className="group flex items-center text-xl font-bold text-indigo-600 hover:text-indigo-700 transition-colors duration-300"
            >
              <Cloud className="h-6 w-6 mr-1 transform group-hover:scale-110 transition-transform duration-300" />
              <span className="hidden sm:block relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-indigo-600 after:transition-all after:duration-300 group-hover:after:w-full">CloudS</span>
            </Link>
          </div>
          
          {/* Desktop Navigation - Centered */}
          <div className="hidden md:flex md:flex-1 md:justify-center">
            {authState && (
              <nav className="flex space-x-4">
                <Link 
                  to="/hm" 
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-all duration-300 flex items-center ${
                    isActive('/hm') 
                      ? 'bg-indigo-100 text-indigo-700 scale-105' 
                      : 'text-gray-700 hover:bg-gray-100 hover:text-indigo-600 hover:scale-105'
                  }`}
                >
                  <Home className="w-4 h-4 mr-1" />
                  <span>Home</span>
                </Link>
                <Link 
                  to="/profile" 
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-all duration-300 flex items-center ${
                    isActive('/profile') 
                      ? 'bg-indigo-100 text-indigo-700 scale-105' 
                      : 'text-gray-700 hover:bg-gray-100 hover:text-indigo-600 hover:scale-105'
                  }`}
                >
                  <Database className="w-4 h-4 mr-1" />
                  <span>Storage</span>
                </Link>
                <Link 
                  to="/settings" 
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-all duration-300 flex items-center ${
                    isActive('/settings') 
                      ? 'bg-indigo-100 text-indigo-700 scale-105' 
                      : 'text-gray-700 hover:bg-gray-100 hover:text-indigo-600 hover:scale-105'
                  }`}
                >
                  <Settings className="w-4 h-4 mr-1" />
                  <span>Settings</span>
                </Link>
              </nav>
            )}
          </div>
          
          {/* Auth & User Tools */}
          <div className="flex items-center space-x-2">
            {!authState ? (
              <div className="flex space-x-2">
                <Link 
                  to="/login" 
                  className="text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium transition-all duration-300 hover:bg-gray-50"
                >
                  Login
                </Link>
                <Link 
                  to="/register" 
                  className="bg-indigo-600 text-white hover:bg-indigo-700 px-3 py-2 rounded-md text-sm font-medium transition-all duration-300 shadow-sm hover:shadow-md transform hover:-translate-y-0.5"
                >
                  Register
                </Link>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                {/* User Profile */}
                <Link 
                  to="/profile" 
                  className="relative flex items-center justify-center h-8 w-8 rounded-full bg-indigo-100 text-indigo-600 hover:bg-indigo-200 transition-all duration-300 transform hover:scale-110 hover:rotate-3"
                >
                  <User className="w-4 h-4" />
                </Link>
                
              </div>
            )}
            
            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <button 
                onClick={toggleMenu}
                className="p-1 rounded-md text-gray-600 hover:bg-gray-100 hover:text-indigo-600 transition-all duration-300"
                aria-label={isMenuOpen ? "Close menu" : "Open menu"}
              >
                {isMenuOpen ? (
                  <X className="h-6 w-6 animate-spin-once" />
                ) : (
                  <Menu className="h-6 w-6 hover:rotate-6 transition-transform duration-300" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Mobile Menu with Slide-Down Animation */}
      <div 
        className={`md:hidden bg-white border-t border-gray-200 py-2 px-4 shadow-inner transform transition-all duration-300 overflow-hidden ${
          isMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        {authState && (
          <div className="flex flex-col space-y-2">
            <Link 
              to="/hm" 
              className={`px-3 py-2 rounded-md text-sm font-medium transition-all duration-300 flex items-center ${
                isActive('/hm') 
                  ? 'bg-indigo-100 text-indigo-700' 
                  : 'text-gray-700 hover:bg-gray-100 hover:text-indigo-600'
              }`}
            >
              <Home className="w-4 h-4 mr-2" />
              <span>Home</span>
            </Link>
            <Link 
              to="/profile" 
              className={`px-3 py-2 rounded-md text-sm font-medium transition-all duration-300 flex items-center ${
                isActive('/profile') 
                  ? 'bg-indigo-100 text-indigo-700' 
                  : 'text-gray-700 hover:bg-gray-100 hover:text-indigo-600'
              }`}
            >
              <Database className="w-4 h-4 mr-2" />
              <span>Storage</span>
            </Link>
            <Link 
              to="/settings" 
              className={`px-3 py-2 rounded-md text-sm font-medium transition-all duration-300 flex items-center ${
                isActive('/settings') 
                  ? 'bg-indigo-100 text-indigo-700' 
                  : 'text-gray-700 hover:bg-gray-100 hover:text-indigo-600'
              }`}
            >
              <Settings className="w-4 h-4 mr-2" />
              <span>Settings</span>
            </Link>
          </div>
        )}
      </div>

      {/* CSS for custom animations */}
      <style jsx>{`
        @keyframes spin-once {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .animate-spin-once {
          animation: spin-once 0.5s ease-in-out;
        }
      `}</style>
    </header>
  );
};

export default Header;