import React from 'react';
import { LogOut } from 'lucide-react';

const LogoutSection = ({ onLogout, isLoggingOut }) => {
  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
        <h2 className="text-lg font-medium text-gray-900">Session Management</h2>
        <p className="text-sm text-gray-500 mt-1">Manage your current session</p>
      </div>
      
      <div className="p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-base font-medium text-gray-900 mb-2">End Current Session</h3>
            <p className="text-sm text-gray-600 mb-4 md:mb-0">
              Log out from your account and end your current session. You will need to log in again to access your account.
            </p>
          </div>
          
          <button
            onClick={onLogout}
            disabled={isLoggingOut}
            className="inline-flex items-center justify-center py-2.5 px-5 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isLoggingOut ? (
              <>
                <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
                Logging out...
              </>
            ) : (
              <>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LogoutSection; 