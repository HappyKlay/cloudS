import React from 'react';
import logo from '../assets/logo-long.png';

const Header = ({ user }) => {
  return (
    <header className="fixed top-0 left-0 right-0 bg-white shadow-sm z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex-shrink-0">
            <img src={logo} alt="logo" className="h-30 w-auto" />
          </div>
          <div className="flex items-center space-x-4">
            {!user ? (
              <>
                <button className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                  Log in
                </button>
                <button className="text-sm text-white bg-gray-900 hover:bg-gray-800 px-4 py-2 rounded-md transition-colors">
                  Sign up
                </button>
              </>
            ) : (
              <span className="text-sm text-gray-700 bg-gray-100 px-3 py-1 rounded-md flex items-center gap-2">
                <svg className="w-4 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A9 9 0 0112 15c2.21 0 4.21.8 5.879 2.121M15 11a3 3 0 10-6 0 3 3 0 006 0z" />
                </svg>
                {user.username} 
              </span>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
