import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import AuthLayout from './AuthLayout';
import { motion } from 'framer-motion';
import { Eye, EyeOff, LogIn, Mail, AlertCircle, Lock } from 'lucide-react';
import { hashPassword } from '../../utils/Argon2';
import { hkdf } from '../../utils/Hkdf';
import { bufferToHex, hexToBuffer, decryptDataAESGCM } from '../../utils/cryptoUtils';
import { decryptPrivateKey } from '../../utils/EccCryptoUtils';
import { storeKeys } from '../../utils/indexedDBUtils';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || localStorage.getItem('lastPath') || '/hm';
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    remember: false
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError('');
      
      const initResponse = await fetch('http://localhost:8080/api/auth/init', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: formData.email })
      });
      
      const challengeData = await initResponse.json();
      
      if (!initResponse.ok) {
        throw new Error(challengeData.error || 'Login initialization failed');
      }
      
      if (challengeData.message === "No account found for that email.") {
        throw new Error(challengeData.message);
      }
      
      const { salt, authSalt } = challengeData;
      
      const hashedPassword = await hashPassword(formData.password, salt, {
        iterations: 6,
        memory: 131072,
        parallelism: 4,
        hashLength: 32,
        hashType: 'argon2id'
      });
      
      const authenticationKey = await hkdf(hashedPassword.encoded, authSalt, 'authentication', 32);
      const authKeyHex = bufferToHex(authenticationKey);
      
      const hashedAuthKey = await hashPassword(bufferToHex(authenticationKey), authSalt, {
        iterations: 2,
        memory: 65536,
        parallelism: 2,
        hashLength: 32,
        hashType: 'argon2id'
      });
      const authResponse = await fetch('http://localhost:8080/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          email: formData.email,
          authHash: hashedAuthKey.hex
        })
      });
      
      const authData = await authResponse.json();
      
      if (!authResponse.ok) {
        throw new Error(authData.error || 'Authentication failed');
      }
      
      const encryptionKey = await hkdf(hashedPassword.encoded, authData.saltEncryption, 'encryption', 32);
      
      const importedEncryptionKey = await window.crypto.subtle.importKey(
        'raw',
        encryptionKey,
        { name: 'AES-GCM', length: 256 },
        false,
        ['decrypt']
      );
      
      const masterKeyHex = await decryptDataAESGCM(
        hexToBuffer(authData.encryptedMasterKey),
        hexToBuffer(authData.encryptedMasterKeyIv),
        importedEncryptionKey
      );
      
      const privateKeyData = {
        encryptedKey: authData.encryptedPrivateKey,
        salt: authData.encryptedPrivateKeySalt,
        iv: authData.encryptedPrivateKeyIv,
        algorithm: 'AES-GCM'
      };
      
      const decryptedPrivateKey = await decryptPrivateKey(privateKeyData, masterKeyHex);
      
      // Store keys in IndexedDB for later use
      try {
        // Use authentication key as the user identifier instead of email
        await storeKeys(authKeyHex, masterKeyHex, decryptedPrivateKey);
        
        // Store the mapping between email and auth key for retrieval purposes
        localStorage.setItem('userAuthKey', authKeyHex);
        // Dispatch an event to notify components about the authentication change
        window.dispatchEvent(new Event('authChange'));
        console.log('Cryptographic keys successfully stored in IndexedDB');
      } catch (dbError) {
        console.error('Failed to store keys in IndexedDB:', dbError);
        // Continue even if storage fails - this is not critical for login
      }
      
      if (formData.remember) {
        localStorage.setItem('rememberEmail', formData.email);
      } else {
        localStorage.removeItem('rememberEmail');
      }

      navigate("/hm");
      
    } catch (error) {
      console.error('Login error:', error);
      setError(error.message || 'An error occurred during login. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    const rememberedEmail = localStorage.getItem('rememberEmail');
    if (rememberedEmail) {
      setFormData(prev => ({
        ...prev,
        email: rememberedEmail,
        remember: true
      }));
    }
  }, []);

  return (
    <AuthLayout title="Login">
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
            className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start animate-shake"
          >
            <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" />
            <div className="text-red-600 text-sm">{error}</div>
          </motion.div>
        )}

        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-gray-400 group-focus-within:text-indigo-500 transition-colors duration-200" />
              </div>
              <input 
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full pl-10 pr-3 py-3 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-700 transition-all duration-200"
                placeholder="your@email.com"
                required
                disabled={loading}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-indigo-500 transition-colors duration-200" />
              </div>
              <input 
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full pl-10 pr-10 py-3 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-700 transition-all duration-200"
                placeholder="••••••••"
                required
                disabled={loading}
              />
              <button 
                type="button" 
                onClick={togglePasswordVisibility}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-indigo-600 transition-colors duration-200"
                disabled={loading}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>


          <motion.button 
            type="submit" 
            className={`w-full mt-2 py-3 px-4 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white font-medium rounded-lg shadow-sm hover:shadow transition-all duration-200 flex items-center justify-center ${loading ? 'opacity-70 cursor-not-allowed' : 'transform hover:-translate-y-0.5'}`}
            whileHover={loading ? {} : { scale: 1.01 }}
            whileTap={loading ? {} : { scale: 0.99 }}
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="inline-block animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></span>
                <span>Processing...</span>
              </>
            ) : (
              <>
                <LogIn className="h-5 w-5 mr-2" />
                <span>Log In</span>
              </>
            )}
          </motion.button>

          <div className="text-center mt-6">
            <p className="text-sm text-gray-600">
               Don't have an account? <Link to="/register" className="font-medium text-indigo-600 hover:text-indigo-700 transition-colors duration-200">Register</Link>
            </p>
            <p className="text-sm text-gray-600 mt-2">
              Want to try our test page? <Link to="/test" className="font-medium text-indigo-600 hover:text-indigo-700 transition-colors duration-200">Go to Test</Link>
            </p>
          </div>
        </form>
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

export default Login;