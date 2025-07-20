import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { User, Mail, Lock, LogOut, Shield, ChevronRight, Settings as SettingsIcon } from 'lucide-react';
import { useUserProfile } from '../hooks/useUserProfile';
import { usePasswordValidation } from '../hooks/usePasswordValidation';
import { usePasswordManagement } from '../hooks/usePasswordManagement';
import { useAccountDeletion } from '../hooks/useAccountDeletion';
import { useLogout } from '../hooks/useLogout';
import ProfileInfo from '../components/ProfileInfo';
import PasswordChangeForm from '../components/PasswordChangeForm';
import DangerZone from '../components/DangerZone';
import LogoutSection from '../components/LogoutSection';

const Settings = () => {
  const { userAuthKey } = useAuth();
  const { userData, loading, error } = useUserProfile();
  const [activeTab, setActiveTab] = useState('profile');
  const [animate, setAnimate] = useState(false);
  
  const passwordValidation = usePasswordValidation();
  const passwordManagement = usePasswordManagement(userData);
  const accountDeletion = useAccountDeletion();
  const { logout, isLoggingOut } = useLogout();

  useEffect(() => {
    // Scroll to top when component mounts
    window.scrollTo(0, 0);
    // Start animations after component mounts
    setTimeout(() => setAnimate(true), 100);
  }, []);

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    passwordManagement.changePassword(
      passwordValidation.passwordData, 
      passwordValidation.isPasswordValid
    );
  };
  
  const handleTabChange = (tab) => {
    if (tab !== activeTab) {
      setActiveTab(tab);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-20 pb-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className={`transform transition-all duration-700 ease-out mb-8 ${animate ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
          <div className="flex items-center">
            <div className="bg-indigo-100 p-2 rounded-full mr-3">
              <SettingsIcon className="h-6 w-6 text-indigo-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-indigo-500">Account Settings</h1>
              <p className="mt-1 text-gray-600 text-sm">Manage your account preferences and security settings</p>
            </div>
          </div>
        </div>

        <div className={`bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100 transform transition-all duration-700 ease-out ${animate ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'} hover:shadow-md transition-shadow duration-300`}>
          {/* Tabs */}
          <div className="flex border-b border-gray-200 bg-gray-50 p-1">
            <button
              onClick={() => handleTabChange('profile')}
              className={`px-6 py-3 text-sm font-medium rounded-lg flex items-center mr-2 transition-all duration-200 ${
                activeTab === 'profile'
                  ? 'text-indigo-700 bg-white shadow-sm'
                  : 'text-gray-600 hover:text-indigo-600 hover:bg-white/60'
              }`}
            >
              <User className={`h-4 w-4 mr-2 ${activeTab === 'profile' ? 'text-indigo-500' : 'text-gray-400'}`} />
              <span>Profile</span>
            </button>
            <button
              onClick={() => handleTabChange('security')}
              className={`px-6 py-3 text-sm font-medium rounded-lg flex items-center mr-2 transition-all duration-200 ${
                activeTab === 'security'
                  ? 'text-indigo-700 bg-white shadow-sm'
                  : 'text-gray-600 hover:text-indigo-600 hover:bg-white/60'
              }`}
            >
              <Shield className={`h-4 w-4 mr-2 ${activeTab === 'security' ? 'text-indigo-500' : 'text-gray-400'}`} />
              <span>Security</span>
            </button>
            <button
              onClick={() => handleTabChange('session')}
              className={`px-6 py-3 text-sm font-medium rounded-lg flex items-center transition-all duration-200 ${
                activeTab === 'session'
                  ? 'text-indigo-700 bg-white shadow-sm'
                  : 'text-gray-600 hover:text-indigo-600 hover:bg-white/60'
              }`}
            >
              <LogOut className={`h-4 w-4 mr-2 ${activeTab === 'session' ? 'text-indigo-500' : 'text-gray-400'}`} />
              <span>Session</span>
            </button>
          </div>

          <div className="p-6">
            {activeTab === 'profile' && (
              <div key="profile" className="animate-tab-enter space-y-8">
                <ProfileInfo 
                  userData={userData}
                  loading={loading}
                  error={error}
                />
              </div>
            )}

            {activeTab === 'security' && (
              <div key="security" className="animate-tab-enter space-y-8">
                <PasswordChangeForm
                  passwordData={passwordValidation.passwordData}
                  showCurrentPassword={passwordValidation.showCurrentPassword}
                  showNewPassword={passwordValidation.showNewPassword}
                  showConfirmPassword={passwordValidation.showConfirmPassword}
                  showPasswordRequirements={passwordValidation.showPasswordRequirements}
                  passwordStrength={passwordValidation.passwordStrength}
                  passwordValidation={passwordValidation.passwordValidation}
                  isPasswordValid={passwordValidation.isPasswordValid}
                  passwordsMatch={passwordValidation.passwordsMatch}
                  handlePasswordChange={passwordValidation.handlePasswordChange}
                  handlePasswordFocus={passwordValidation.handlePasswordFocus}
                  handlePasswordBlur={passwordValidation.handlePasswordBlur}
                  togglePasswordVisibility={passwordValidation.togglePasswordVisibility}
                  submitLoading={passwordManagement.submitLoading}
                  error={passwordManagement.error}
                  success={passwordManagement.success}
                  onSubmit={handlePasswordSubmit}
                />

                <DangerZone
                  showDeleteConfirm={accountDeletion.showDeleteConfirm}
                  deleteConfirmText={accountDeletion.deleteConfirmText}
                  setShowDeleteConfirm={accountDeletion.setShowDeleteConfirm}
                  handleDeleteConfirmChange={accountDeletion.handleDeleteConfirmChange}
                  resetDeleteConfirm={accountDeletion.resetDeleteConfirm}
                  handleDeleteAccount={accountDeletion.handleDeleteAccount}
                  isDeleting={accountDeletion.isDeleting}
                  deletionStep={accountDeletion.deletionStep}
                  deletionError={accountDeletion.deletionError}
                />
              </div>
            )}
            
            {activeTab === 'session' && (
              <div key="session" className="animate-tab-enter space-y-8">
                <LogoutSection 
                  onLogout={logout}
                  isLoggingOut={isLoggingOut}
                />
              </div>
            )}
          </div>
        </div>
        

      </div>
      
      {/* Custom animations */}
      <style jsx>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        
        @keyframes tab-enter {
          0% { opacity: 0; transform: translateY(8px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        
        .animate-fade-in-up {
          animation: fadeInUp 0.3s ease-out forwards;
        }
        
        .animate-pulse-slow {
          animation: pulse 3s ease-in-out infinite;
        }
        
        .animate-tab-enter {
          animation: tab-enter 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default Settings;