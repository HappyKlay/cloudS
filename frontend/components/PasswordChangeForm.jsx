import React from 'react';
import { Eye, EyeOff, Save, Lock, CheckCircle, AlertCircle } from 'lucide-react';
import { PasswordRequirementsList } from './PasswordRequirements';

const PasswordChangeForm = ({
  passwordData,
  showCurrentPassword,
  showNewPassword,
  showConfirmPassword,
  showPasswordRequirements,
  passwordStrength,
  passwordValidation,
  isPasswordValid,
  passwordsMatch,
  handlePasswordChange,
  handlePasswordFocus,
  handlePasswordBlur,
  togglePasswordVisibility,
  submitLoading,
  error,
  success,
  onSubmit
}) => {
  const hasPasswordError = passwordData.confirmPassword && !passwordsMatch();

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden">
      <div className="px-6 py-4 bg-gradient-to-r from-indigo-50 to-white border-b border-gray-200">
        <div className="flex items-center">
          <div className="bg-indigo-100 p-2 rounded-lg mr-3">
            <Lock className="h-5 w-5 text-indigo-600" />
          </div>
          <div>
            <h2 className="text-lg font-medium text-gray-900">Password Settings</h2>
            <p className="text-sm text-gray-500 mt-1">Update your password to keep your account secure</p>
          </div>
        </div>
      </div>
      
      <div className="p-6">
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start animate-fade-in">
            <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" />
            <div className="text-red-600 text-sm">{error}</div>
          </div>
        )}
        
        {success && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start animate-fade-in">
            <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
            <div className="text-green-600 text-sm">{success}</div>
          </div>
        )}
        
        <form onSubmit={onSubmit} className="space-y-5">
          <div className="group">
            <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-1">
              Current Password
            </label>
            <div className="relative">
              <input
                type={showCurrentPassword ? "text" : "password"}
                name="currentPassword"
                id="currentPassword"
                value={passwordData.currentPassword}
                onChange={handlePasswordChange}
                className="block w-full pl-3 pr-10 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 text-sm"
                required
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-indigo-500 transition-colors duration-200"
                onClick={() => togglePasswordVisibility('currentPassword')}
                aria-label={showCurrentPassword ? "Hide password" : "Show password"}
              >
                {showCurrentPassword ? (
                  <EyeOff className="h-5 w-5 group-hover:scale-105 transition-transform duration-200" />
                ) : (
                  <Eye className="h-5 w-5 group-hover:scale-105 transition-transform duration-200" />
                )}
              </button>
            </div>
          </div>

          <div className="group">
            <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
              New Password
            </label>
            <div className="relative">
              <input
                type={showNewPassword ? "text" : "password"}
                name="newPassword"
                id="newPassword"
                value={passwordData.newPassword}
                onChange={handlePasswordChange}
                onFocus={() => handlePasswordFocus('newPassword')}
                onBlur={handlePasswordBlur}
                className="block w-full pl-3 pr-10 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 text-sm"
                required
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-indigo-500 transition-colors duration-200"
                onClick={() => togglePasswordVisibility('newPassword')}
                aria-label={showNewPassword ? "Hide password" : "Show password"}
              >
                {showNewPassword ? (
                  <EyeOff className="h-5 w-5 group-hover:scale-105 transition-transform duration-200" />
                ) : (
                  <Eye className="h-5 w-5 group-hover:scale-105 transition-transform duration-200" />
                )}
              </button>
            </div>
          </div>

          <div className="group">
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
              Confirm New Password
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                name="confirmPassword"
                id="confirmPassword"
                value={passwordData.confirmPassword}
                onChange={handlePasswordChange}
                onFocus={() => handlePasswordFocus('confirmPassword')}
                onBlur={handlePasswordBlur}
                className={`block w-full pl-3 pr-10 py-2.5 border ${hasPasswordError ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500'} rounded-lg shadow-sm focus:ring-2 transition-all duration-200 text-sm`}
                required
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-indigo-500 transition-colors duration-200"
                onClick={() => togglePasswordVisibility('confirmPassword')}
                aria-label={showConfirmPassword ? "Hide password" : "Show password"}
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-5 w-5 group-hover:scale-105 transition-transform duration-200" />
                ) : (
                  <Eye className="h-5 w-5 group-hover:scale-105 transition-transform duration-200" />
                )}
              </button>
            </div>
            {hasPasswordError && (
              <p className="mt-1 text-xs text-red-500 animate-fade-in">
                Passwords do not match
              </p>
            )}
          </div>

          {showPasswordRequirements && (
            <div className="mt-2 animate-fade-in">
              <PasswordRequirementsList 
                passwordValidation={passwordValidation}
                passwordStrength={passwordStrength}
                isPasswordValid={isPasswordValid()}
              />
            </div>
          )}

          <div className="pt-2">
            <button
              type="submit"
              disabled={!isPasswordValid() || hasPasswordError || submitLoading}
              className={`flex items-center justify-center w-full sm:w-auto py-2.5 px-5 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white ${isPasswordValid() && !hasPasswordError && !submitLoading ? 'bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 transform hover:-translate-y-0.5' : 'bg-indigo-300 cursor-not-allowed'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200`}
            >
              {submitLoading ? (
                <>
                  <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
                  Processing...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Update Password
                </>
              )}
            </button>
          </div>
        </form>
      </div>
      
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(5px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .animate-fade-in {
          animation: fadeIn 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default PasswordChangeForm; 