import React from 'react';
import { Check, X, Shield, AlertTriangle, Lock } from 'lucide-react';
import { PASSWORD_REQUIREMENTS } from '../hooks/usePasswordValidation';

// Component for showing password requirements
export const PasswordRequirement = ({ met, text }) => (
  <div className="flex items-center space-x-2 text-sm transition-all duration-200 group">
    <div className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center transition-all duration-200 ${met ? 'bg-green-100 group-hover:bg-green-200' : 'bg-red-50 group-hover:bg-red-100'}`}>
      {met ? 
        <Check size={14} className="text-green-600" /> : 
        <X size={14} className="text-red-500" />
      }
    </div>
    <span className={`transition-colors duration-200 ${met ? "text-green-700" : "text-gray-600"}`}>{text}</span>
  </div>
);

// Component for showing password strength
export const PasswordStrength = ({ score, feedback }) => {
  const getStrengthColor = (score) => {
    switch (score) {
      case 0: return { text: 'text-red-600', bg: 'bg-red-100', border: 'border-red-200' };
      case 1: return { text: 'text-orange-600', bg: 'bg-orange-100', border: 'border-orange-200' };
      case 2: return { text: 'text-yellow-600', bg: 'bg-yellow-100', border: 'border-yellow-200' };
      case 3: return { text: 'text-green-600', bg: 'bg-green-100', border: 'border-green-200' };
      case 4: return { text: 'text-indigo-600', bg: 'bg-indigo-100', border: 'border-indigo-200' };
      default: return { text: 'text-gray-600', bg: 'bg-gray-100', border: 'border-gray-200' };
    }
  };

  const getStrengthText = (score) => {
    switch (score) {
      case 0: return 'Very Weak';
      case 1: return 'Weak';
      case 2: return 'Fair';
      case 3: return 'Strong';
      case 4: return 'Very Strong';
      default: return 'Unknown';
    }
  };

  const strengthColors = getStrengthColor(score);
  const barWidths = ['20%', '40%', '60%', '80%', '100%'];

  return (
    <div className="mt-3 pt-3 border-t border-gray-200">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center">
          <Shield size={16} className={strengthColors.text} />
          <span className={`ml-2 font-medium ${strengthColors.text}`}>
            {getStrengthText(score)}
          </span>
        </div>
        <span className="text-xs text-gray-500">Password Strength</span>
      </div>
      
      <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
        <div 
          className={`h-full rounded-full transition-all duration-500 ease-out ${score >= 0 ? 'bg-red-500' : 'bg-gray-300'} ${score >= 1 ? 'bg-orange-500' : ''} ${score >= 2 ? 'bg-yellow-500' : ''} ${score >= 3 ? 'bg-green-500' : ''} ${score >= 4 ? 'bg-indigo-500' : ''}`}
          style={{ width: barWidths[score] }}
        ></div>
      </div>
      
      {score < 3 && feedback.warning && (
        <div className="mt-2 flex items-start space-x-2 text-sm text-orange-600 bg-orange-50 p-2 rounded-md">
          <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" />
          <span>{feedback.warning}</span>
        </div>
      )}
      {feedback.suggestions && feedback.suggestions.length > 0 && (
        <div className="mt-2 text-sm text-gray-600 bg-gray-50 p-2 rounded-md space-y-1">
          {feedback.suggestions.map((suggestion, index) => (
            <div key={index} className="flex items-center space-x-2">
              <span className="text-indigo-400">•</span>
              <span>{suggestion}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export const PasswordRequirementsList = ({ passwordValidation, passwordStrength, isPasswordValid }) => (
  <div className="mt-3 p-4 bg-gradient-to-r from-gray-50 to-white border border-gray-200 rounded-lg shadow-sm animate-fade-in">
    <div className="flex items-center mb-3">
      <div className="bg-indigo-100 p-1.5 rounded-md mr-2">
        <Lock size={14} className="text-indigo-600" />
      </div>
      <p className="text-sm font-medium text-gray-700">Password Requirements</p>
    </div>
    
    <div className="space-y-2 mt-2">
      <PasswordRequirement 
        met={passwordValidation.minLength} 
        text={`At least ${PASSWORD_REQUIREMENTS.MIN_LENGTH} characters`}
      />
      <PasswordRequirement 
        met={passwordValidation.hasUppercase} 
        text="At least one uppercase letter (A-Z)" 
      />
      <PasswordRequirement 
        met={passwordValidation.hasLowercase} 
        text="At least one lowercase letter (a-z)" 
      />
      <PasswordRequirement 
        met={passwordValidation.hasNumber} 
        text="At least one number (0-9)" 
      />
    </div>
    
    <PasswordStrength score={passwordStrength.score} feedback={passwordStrength.feedback} />
    
    {isPasswordValid && (
      <div className="mt-3 text-sm text-green-600 font-medium flex items-center p-2 bg-green-50 rounded-md animate-pulse-once">
        <Check size={16} className="mr-2" /> Your password meets all requirements!
      </div>
    )}
    
    <style jsx>{`
      @keyframes pulseOnce {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.8; }
      }
      
      .animate-pulse-once {
        animation: pulseOnce 2s ease-in-out;
      }
      
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