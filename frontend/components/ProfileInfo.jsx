import React from 'react';
import { Mail, LogOut } from 'lucide-react';
import { useLogout } from '../hooks/useLogout';

const ProfileInfo = ({ userData, loading, error }) => {
  const { logout, isLoggingOut } = useLogout();

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-100">
      {loading ? (
        <div className="flex justify-center items-center h-40">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      ) : error ? (
        <div className="text-red-500 text-center p-4">
          {error}
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <div className="h-16 w-16 rounded-full bg-gradient-to-r from-blue-400 to-indigo-500 flex items-center justify-center text-white text-xl font-bold">
                {userData.username?.substring(0, 2)?.toUpperCase() || 'U'}
              </div>
              <div className="ml-4">
                <h2 className="text-xl font-semibold text-gray-800">{userData.username}</h2>
              </div>
            </div>
            <button
              onClick={logout}
              disabled={isLoggingOut}
              className="inline-flex items-center text-gray-700 hover:text-red-600 transition-colors"
            >
              {isLoggingOut ? (
                <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-500 mr-2"></span>
              ) : (
                <LogOut className="h-4 w-4 mr-2" />
              )}
              <span className="text-sm">Logout</span>
            </button>
          </div>
          
          <div className="grid md:grid-cols-2 gap-x-8 gap-y-4">
            <div className="space-y-1">
              <label className="block text-xs font-medium uppercase tracking-wide text-gray-500">Full Name</label>
              <div className="flex items-center py-2 px-3 bg-white rounded-md border border-gray-200">
                <span className="text-gray-800">{userData.name} {userData.surname}</span>
              </div>
            </div>
            
            <div className="space-y-1">
              <label className="block text-xs font-medium uppercase tracking-wide text-gray-500">Email Address</label>
              <div className="flex items-center py-2 px-3 bg-white rounded-md border border-gray-200">
                <Mail className="h-4 w-4 text-gray-400 mr-2" />
                <span className="text-gray-800">{userData.email}</span>
              </div>
            </div>
            
            <div className="space-y-1">
              <label className="block text-xs font-medium uppercase tracking-wide text-gray-500">Member Since</label>
              <div className="flex items-center py-2 px-3 bg-white rounded-md border border-gray-200">
                <span className="text-gray-800">{userData.registrationDate}</span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ProfileInfo; 