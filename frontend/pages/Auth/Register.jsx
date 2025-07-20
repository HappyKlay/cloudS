import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AuthLayout from './AuthLayout';
import { motion } from 'framer-motion';
import { Eye, EyeOff, User, Mail, UserPlus, AlertCircle } from 'lucide-react';
import EmailRequestForConfirmationForm from '../../components/EmailRequestForConfirmationForm';
import { hashPassword } from '../../utils/Argon2';
import { generateKeyPair, encryptPrivateKey } from '../../utils/EccCryptoUtils';
import { 
  bufferToHex, 
  generateRandomSalt, 
  encryptDataAESGCM, 
  bytesToHex 
} from '../../utils/cryptoUtils';
import { hkdf } from '../../utils/Hkdf';
import zxcvbn from 'zxcvbn';
import { PasswordRequirementsList } from '../../components/PasswordRequirements';

// Password validation criteria
const PASSWORD_REQUIREMENTS = {
  MIN_LENGTH: 12,
  HAS_UPPERCASE: /[A-Z]/,
  HAS_LOWERCASE: /[a-z]/,
  HAS_NUMBER: /[0-9]/,
  MIN_STRENGTH_SCORE: 3
};

const FormField = ({ label, type, name, value, onChange, placeholder, required = true, autoComplete, icon }) => {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        {label}
      </label>
      <div className="relative group">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          {icon}
        </div>
        <input 
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          autoComplete={autoComplete}
          className="w-full pl-10 pr-3 py-3 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-700 transition-all duration-200"
          placeholder={placeholder}
          required={required}
        />
      </div>
    </div>
  );
};

const PasswordField = ({ value, onChange, isValid, onFocus, showPassword, toggleVisibility }) => (
  <div className="space-y-2">
    <label className="block text-sm font-medium text-gray-700">Password</label>
    <div className="relative group">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <svg className="h-5 w-5 text-gray-400 group-focus-within:text-indigo-500 transition-colors duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      </div>
      <input 
        type={showPassword ? "text" : "password"}
        name="password"
        value={value}
        onChange={onChange}
        onFocus={onFocus}
        autoComplete="new-password"
        className={`w-full pl-10 pr-10 py-3 bg-white border ${isValid ? 'border-green-500' : 'border-gray-300'} rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-700 transition-all duration-200`}
        placeholder="Create a strong password"
        required
      />
      <button 
        type="button" 
        onClick={toggleVisibility}
        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-indigo-600 transition-colors duration-200"
        aria-label={showPassword ? "Hide password" : "Show password"}
      >
        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </div>
  </div>
);

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    surname: '',
    username: '',
    email: '',
    password: '',
    remember: false
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showEmailRequestForm, setShowEmailRequestForm] = useState(false);
  const [showPasswordTips, setShowPasswordTips] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({ score: 0, feedback: {} });
  const [passwordValidation, setPasswordValidation] = useState({
    minLength: false,
    hasUppercase: false,
    hasLowercase: false,
    hasNumber: false
  });

  useEffect(() => {
    validatePassword(formData.password);
  }, [formData.password]);

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
    return Object.values(passwordValidation).every(criteria => criteria === true) && 
           passwordStrength.score >= PASSWORD_REQUIREMENTS.MIN_STRENGTH_SCORE;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const togglePasswordVisibility = () => {
    setShowPassword(prev => !prev);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    const { username, email, password } = formData;
    
    try {
      if (!isPasswordValid()) {
        setError('Please ensure your password meets all security requirements.');
        return;
      }

      setError('');
      setIsLoading(true);
      
      await generateCryptographicMaterials(username, email, password);
      
      setShowEmailRequestForm(true);
    } catch (error) {
      setError('An error occurred during registration. Please try again.');
      console.error('Registration error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateCryptographicMaterials = async (username, email, password) => {
    const salt = generateRandomSalt();
    
    const hashedPassword = await hashPassword(password, salt, {
      iterations: 6,
      memory: 131072,
      parallelism: 4,
      hashLength: 32,
      hashType: 'argon2id'
    });

    console.log('password:', password);
    console.log('salt:', salt);
    console.log('hashedPassword:', hashedPassword.hex);

    const masterKeyBytes = new Uint8Array(32);
    window.crypto.getRandomValues(masterKeyBytes);
    const masterKeyHex = bytesToHex(masterKeyBytes);

    const authSalt = generateRandomSalt();
    const encSalt = generateRandomSalt();
    const encMKSalt = generateRandomSalt();

    const authenticationKey = await hkdf(hashedPassword.encoded, authSalt, 'authentication', 32);
    const encryptionKey = await hkdf(hashedPassword.encoded, encSalt, 'encryption', 32);

    const hashedAuthKey = await hashPassword(bufferToHex(authenticationKey), authSalt, {
      iterations: 2,
      memory: 65536,
      parallelism: 2,
      hashLength: 32,
      hashType: 'argon2id'
    });
    
    const encKeyImport = await window.crypto.subtle.importKey(
      'raw',
      encryptionKey,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
    
    const encryptedMasterKey = await encryptDataAESGCM(masterKeyHex, encKeyImport);
    
    const keyPair = generateKeyPair();
    
    const encryptedPrivateKey = await encryptPrivateKey(keyPair.privateKeyBytes, masterKeyHex);
    
    const ipResponse = await fetch('https://api.ipify.org?format=json');
    const ipData = await ipResponse.json();
    const userIp = ipData.ip;

    const registrationData = {
      name: formData.name,
      surname: formData.surname,
      username,
      email,
      salt,
      authSalt,
      encSalt,
      encMKSalt,
      ip: userIp,
      role: 'USER',
      encryptedMasterKey:       bytesToHex(encryptedMasterKey.ciphertext),
      encryptedMasterKeyIv:     bytesToHex(encryptedMasterKey.iv),
      publicKey:                bufferToHex(keyPair.publicKeyBytes),
      encryptedPrivateKey:      encryptedPrivateKey.key,
      encryptedPrivateKeyIv:    encryptedPrivateKey.iv,
      encryptedPrivateKeySalt:  encryptedPrivateKey.salt,
      hashedAuthenticationKey:  hashedAuthKey.hex
    };

    console.log(registrationData);

    const response = await fetch('http://localhost:8080/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(registrationData)
    });

    if (!response.ok) {
      let errorMessage = 'Registration failed';
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorData.message || errorMessage;
      } catch (jsonError) {
        // If response is not valid JSON, use the status text
        errorMessage = `Registration failed: ${response.status} ${response.statusText}`;
      }
      throw new Error(errorMessage);
    }

    const userData = await response.json();
    console.log('Registration successful:', userData);
  };

  return (
    <AuthLayout title="Create Account" isBlur={showEmailRequestForm}>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="w-full"
      >
        {error && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start animate-shake"
          >
            <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" />
            <div className="text-red-600 text-sm">{error}</div>
          </motion.div>
        )}
        
        <form className="space-y-5" onSubmit={handleRegister}>
          {/* Name and Surname fields in one row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              label="First Name"
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter your first name"
              autoComplete="given-name"
              icon={<User className="h-5 w-5 text-gray-400 group-focus-within:text-indigo-500 transition-colors duration-200" />}
            />
            <FormField
              label="Last Name"
              type="text"
              name="surname"
              value={formData.surname}
              onChange={handleChange}
              placeholder="Enter your last name"
              autoComplete="family-name"
              icon={<User className="h-5 w-5 text-gray-400 group-focus-within:text-indigo-500 transition-colors duration-200" />}
            />
          </div>

          <FormField
            label="Username"
            type="text"
            name="username"
            value={formData.username}
            onChange={handleChange}
            placeholder="Choose a username"
            autoComplete="username"
            icon={<User className="h-5 w-5 text-gray-400 group-focus-within:text-indigo-500 transition-colors duration-200" />}
          />

          <FormField
            label="Email Address"
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="your@email.com"
            autoComplete="email"
            icon={<Mail className="h-5 w-5 text-gray-400 group-focus-within:text-indigo-500 transition-colors duration-200" />}
          />

          <PasswordField
            value={formData.password}
            onChange={handleChange}
            isValid={isPasswordValid()}
            onFocus={() => setShowPasswordTips(true)}
            showPassword={showPassword}
            toggleVisibility={togglePasswordVisibility}
          />

          {showPasswordTips && (
            <PasswordRequirementsList 
              passwordValidation={{
                minLength: passwordValidation.minLength,
                hasUppercase: passwordValidation.hasUppercase,
                hasLowercase: passwordValidation.hasLowercase,
                hasNumber: passwordValidation.hasNumber
              }}
              passwordStrength={passwordStrength}
              isPasswordValid={isPasswordValid()}
            />
          )}

          <motion.button 
            type="submit" 
            className={`w-full mt-2 py-3 px-4 ${isPasswordValid() ? 'bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 shadow-sm hover:shadow' : 'bg-indigo-300 cursor-not-allowed'} text-white font-medium rounded-lg transition-all duration-200 flex items-center justify-center ${isPasswordValid() && !isLoading ? 'transform hover:-translate-y-0.5' : ''}`}
            whileHover={isPasswordValid() && !isLoading ? { scale: 1.01 } : {}}
            whileTap={isPasswordValid() && !isLoading ? { scale: 0.99 } : {}}
            disabled={!isPasswordValid() || isLoading}
          >
            {isLoading ? (
              <>
                <span className="inline-block animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></span>
                <span>Creating Account...</span>
              </>
            ) : (
              <>
                <UserPlus className="h-5 w-5 mr-2" />
                <span>Create Account</span>
              </>
            )}
          </motion.button>

          <div className="text-center mt-6">
            <p className="text-sm text-gray-600">
              Already have an account? <Link to="/login" className="font-medium text-indigo-600 hover:text-indigo-700 transition-colors duration-200">Log In</Link>
            </p>
          </div>
        </form>
        
        {showEmailRequestForm && (
          <EmailRequestForConfirmationForm email={formData.email} />
        )}
      </motion.div>
      
      <style jsx>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
          20%, 40%, 60%, 80% { transform: translateX(5px); }
        }
        
        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
      `}</style>
    </AuthLayout>
  );
};

export default Register;