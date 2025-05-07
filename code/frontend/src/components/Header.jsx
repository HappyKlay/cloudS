import React from 'react';
import logo from '../assets/logo-long.png';
import { useNavigate, Link } from 'react-router-dom';
import NotificationsMenu from './Notification';
import { ArrowRight } from 'lucide-react';
import { useState } from 'react';


const Header = ({ user }) => {

  const navigate = useNavigate();

  user = true;
  const [isHovered, setIsHovered] = useState(false);

  const goToLogin = () => {
    navigate('/login');
  };

  const goToRegister = () => {
    navigate('/register');
  };

  const goToDashboard = () => {
    navigate('/');
  };

  const goToProfile = () => {
    navigate('/profile');
  };

  return (
    <header className="fixed top-0 left-0 right-0 bg-white shadow-sm z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div onClick={goToDashboard} className="flex-shrink-0 cursor-pointer">
            <img src={logo} alt="logo" className="h-30 w-auto" />
          </div>
          <div className="flex items-center space-x-4">
            {!user ? (
              <>
                <button onClick={goToLogin} 
                className="cursor-pointer text-sm text-gray-600 hover:text-gray-900 transition-colors">
                  Log in
                </button>
                <button onClick={goToRegister} 
                className="cursor-pointer text-sm text-white bg-gray-900 hover:bg-gray-800 px-4 py-2 rounded-md transition-colors">
                  Sign up
                </button>
              </>
            ) : (
              <>
                <NotificationsMenu />
                <span 
                  onClick={goToProfile} 
                  className="text-sm text-gray-700 bg-gray-100 px-3 py-1 rounded-md flex items-center gap-2 cursor-pointer relative transition-all duration-300 ease-in-out"
                  onMouseEnter={() => setIsHovered(true)}
                  onMouseLeave={() => setIsHovered(false)}
                >
                  <svg className="w-4 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A9 9 0 0112 15c2.21 0 4.21.8 5.879 2.121M15 11a3 3 0 10-6 0 3 3 0 006 0z" />
                  </svg>
                  <span>nickname</span>
                  {/* <span>{user.username}</span> */}
                  
                  <div 
                    className={`transition-all duration-300 flex items-center ml-1 ${
                      isHovered ? 'opacity-100 max-w-6' : 'opacity-0 max-w-0 overflow-hidden'
                    }`}
                  >
                    <ArrowRight className="w-4 h-4 text-blue-500" />
                  </div>
                </span>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
