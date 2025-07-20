import { useState, useEffect } from 'react';
import zxcvbn from 'zxcvbn';

// Password validation criteria
export const PASSWORD_REQUIREMENTS = {
  MIN_LENGTH: 12,
  HAS_UPPERCASE: /[A-Z]/,
  HAS_LOWERCASE: /[a-z]/,
  HAS_NUMBER: /[0-9]/,
  MIN_STRENGTH_SCORE: 3
};

export const usePasswordValidation = () => {
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showPasswordRequirements, setShowPasswordRequirements] = useState(false);
  
  const [passwordStrength, setPasswordStrength] = useState({ score: 0, feedback: {} });
  const [passwordValidation, setPasswordValidation] = useState({
    minLength: false,
    hasUppercase: false,
    hasLowercase: false,
    hasNumber: false
  });

  useEffect(() => {
    validatePassword(passwordData.newPassword);
  }, [passwordData.newPassword]);

  const validatePassword = (password) => {
    const strength = zxcvbn(password);
    setPasswordStrength(strength);
    
    setPasswordValidation({
      minLength: password.length >= PASSWORD_REQUIREMENTS.MIN_LENGTH,
      hasUppercase: PASSWORD_REQUIREMENTS.HAS_UPPERCASE.test(password),
      hasLowercase: PASSWORD_REQUIREMENTS.HAS_LOWERCASE.test(password),
      hasNumber: PASSWORD_REQUIREMENTS.HAS_NUMBER.test(password)
    });
  };

  const isPasswordValid = () => {
    return passwordData.newPassword && 
           Object.values(passwordValidation).every(criteria => criteria === true) && 
           passwordStrength.score >= PASSWORD_REQUIREMENTS.MIN_STRENGTH_SCORE;
  };

  const passwordsMatch = () => passwordData.newPassword === passwordData.confirmPassword;

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePasswordFocus = () => {
    setShowPasswordRequirements(true);
  };

  const handlePasswordBlur = (e) => {
    // Check if the related target is not a password field
    if (!e.relatedTarget || !e.relatedTarget.name?.includes('Password')) {
      setShowPasswordRequirements(false);
    }
  };

  const togglePasswordVisibility = (field) => {
    switch (field) {
      case 'currentPassword':
        setShowCurrentPassword(!showCurrentPassword);
        break;
      case 'newPassword':
        setShowNewPassword(!showNewPassword);
        break;
      case 'confirmPassword':
        setShowConfirmPassword(!showConfirmPassword);
        break;
      default:
        break;
    }
  };

  return {
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
    togglePasswordVisibility
  };
}; 