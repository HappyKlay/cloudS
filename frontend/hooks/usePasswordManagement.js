import { useState } from 'react';
import { hashPassword } from '../utils/Argon2';
import { hkdf } from '../utils/Hkdf';
import { bufferToHex, hexToBuffer, encryptDataAESGCM, decryptDataAESGCM } from '../utils/cryptoUtils';
import { useNavigate } from 'react-router-dom';

export const usePasswordManagement = (userData) => {
  const navigate = useNavigate();
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Helper function to generate random salt
  const generateRandomSalt = () => {
    const array = new Uint8Array(16);
    window.crypto.getRandomValues(array);
    return bufferToHex(array);
  };

  const changePassword = async (passwordData, isPasswordValid) => {
    if (!isPasswordValid()) {
      setError('Please ensure your password meets all security requirements.');
      return;
    }
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    
    setSubmitLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      // Step 1: Initialize password change by fetching salt values
      const initResponse = await fetch('http://localhost:8080/api/auth/init', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: userData.email })
      });
      
      const challengeData = await initResponse.json();
      
      if (!initResponse.ok) {
        throw new Error(challengeData.error || 'Password change initialization failed');
      }
      
      const { salt, authSalt } = challengeData;
      
      // Verify current password using same logic as login
      const hashedCurrentPassword = await hashPassword(passwordData.currentPassword, salt, {
        iterations: 6,
        memory: 131072,
        parallelism: 4,
        hashLength: 32,
        hashType: 'argon2id'
      });
      
      const currentAuthKey = await hkdf(hashedCurrentPassword.encoded, authSalt, 'authentication', 32);
      const currentAuthKeyHex = bufferToHex(currentAuthKey);
      
      const hashedCurrentAuthKey = await hashPassword(bufferToHex(currentAuthKey), authSalt, {
        iterations: 2,
        memory: 65536,
        parallelism: 2,
        hashLength: 32,
        hashType: 'argon2id'
      });
      
      // Verify current password
      const verifyResponse = await fetch('http://localhost:8080/api/auth/verify-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          email: userData.email,
          authHash: hashedCurrentAuthKey.hex
        })
      });
      
      const verifyData = await verifyResponse.json();
      
      if (!verifyResponse.ok) {
        if (verifyResponse.status === 401) {
          throw new Error('Wrong password');
        }
        throw new Error(verifyData.error || 'Password verification failed');
      }
      
      // Step 2: Generate new crypto material for the new password
      // Create encryption key from current password to decrypt master key
      const currentEncryptionKey = await hkdf(hashedCurrentPassword.encoded, verifyData.saltEncryption, 'encryption', 32);
      
      const importedCurrentEncryptionKey = await window.crypto.subtle.importKey(
        'raw',
        currentEncryptionKey,
        { name: 'AES-GCM', length: 256 },
        false,
        ['decrypt']
      );
      
      // Decrypt master key using current password
      const masterKeyHex = await decryptDataAESGCM(
        hexToBuffer(verifyData.encryptedMasterKey),
        hexToBuffer(verifyData.encryptedMasterKeyIv),
        importedCurrentEncryptionKey
      );
      
      // Generate new salt values
      const newSalt = generateRandomSalt();
      const newAuthSalt = generateRandomSalt();
      const newEncSalt = generateRandomSalt();
      
      // Hash new password
      const hashedNewPassword = await hashPassword(passwordData.newPassword, newSalt, {
        iterations: 6,
        memory: 131072,
        parallelism: 4,
        hashLength: 32,
        hashType: 'argon2id'
      });
      
      // Generate new authentication key
      const newAuthenticationKey = await hkdf(hashedNewPassword.encoded, newAuthSalt, 'authentication', 32);
      const newAuthKeyHex = bufferToHex(newAuthenticationKey);
      
      const hashedNewAuthKey = await hashPassword(newAuthKeyHex, newAuthSalt, {
        iterations: 2,
        memory: 65536,
        parallelism: 2,
        hashLength: 32,
        hashType: 'argon2id'
      });
      
      // Generate new encryption key
      const newEncryptionKey = await hkdf(hashedNewPassword.encoded, newEncSalt, 'encryption', 32);
      
      // Import new encryption key
      const importedNewEncryptionKey = await window.crypto.subtle.importKey(
        'raw',
        newEncryptionKey,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt']
      );
      
      // Re-encrypt master key with new encryption key
      const newEncryptedMasterKey = await encryptDataAESGCM(masterKeyHex, importedNewEncryptionKey);
      
      // Step 3: Update password and crypto materials
      const updateResponse = await fetch('http://localhost:8080/api/auth/update-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          email: userData.email,
          currentAuthHash: hashedCurrentAuthKey.hex,
          salt: newSalt,
          authSalt: newAuthSalt,
          encSalt: newEncSalt,
          hashedAuthenticationKey: hashedNewAuthKey.hex,
          encryptedMasterKey: bufferToHex(newEncryptedMasterKey.ciphertext),
          encryptedMasterKeyIv: bufferToHex(newEncryptedMasterKey.iv)
        })
      });
      
      const updateData = await updateResponse.json();
      
      if (!updateResponse.ok) {
        throw new Error(updateData.error || 'Password update failed');
      }
      
      setSuccess('Password updated successfully. Redirecting to login page...');
      
      // Clear stored auth key
      localStorage.removeItem('userAuthKey');
      
      // Redirect to login after a brief delay
      setTimeout(() => {
        navigate('/login');
      }, 2000);
      
    } catch (err) {
      console.error('Password change error:', err);
      setError(err.message || 'An error occurred while changing password.');
    } finally {
      setSubmitLoading(false);
    }
  };

  return {
    submitLoading,
    error,
    success,
    changePassword,
    setError,
    setSuccess
  };
}; 