import { generateKeyPair as curve25519GenerateKeyPair, sharedKey } from 'curve25519-js';
import seedrandom from 'seedrandom';
import {hexToBytes, bytesToHex} from './cryptoUtils';

/**
 * Generates a random 32-byte array for use as a seed
 * @param {string} seed - Optional seed for deterministic generation
 * @returns {Uint8Array} A 32-byte array
 */
const generateRandomBytes = (seed = null) => {
  const rng = seed ? seedrandom(seed) : seedrandom();
  const bytes = new Uint8Array(32);
  
  for (let i = 0; i < 32; i++) {
    bytes[i] = Math.floor(rng() * 256);
  }
  
  return bytes;
};

/**
 * Generates an ECC key pair (private and public keys) using curve25519
 * @param {string} seed - Optional seed for deterministic key generation
 * @returns {Object} An object containing the private key and public key
 */
export const generateKeyPair = (seed = null) => {
  try {
    // Generate random seed bytes
    const seedBytes = generateRandomBytes(seed);
    
    // Use the curve25519-js library to generate a key pair
    const keyPair = curve25519GenerateKeyPair(seedBytes);
    
    return {
      privateKeyBytes: keyPair.private,
      publicKeyBytes: keyPair.public
    };
  } catch (error) {
    console.error('Error generating key pair:', error);
    throw new Error('Failed to generate ECC key pair');
  }
};

/**
 * Derives a key from a password using Web Crypto API
 * @param {string} password - User's password
 * @param {Uint8Array} salt - Salt for key derivation
 * @returns {Promise<ArrayBuffer>} Derived key
 */
const deriveKeyFromPassword = async (password, salt) => {
  const encoder = new TextEncoder();
  const passwordData = encoder.encode(password);
  
  // Import the password as a key
  const baseKey = await window.crypto.subtle.importKey(
    'raw',
    passwordData,
    { name: 'PBKDF2' },
    false,
    ['deriveKey', 'deriveBits']
  );
  
  // Derive a key using PBKDF2
  return window.crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000,
      hash: 'SHA-256'
    },
    baseKey,
    256 // 32 bytes
  );
};

/**
 * Encrypts a private key using a password
 * @param {Uint8Array} privateKeyBytes - The private key as raw bytes
 * @param {string} password - User's password for encryption
 * @returns {Promise<Object>} Encrypted private key data with necessary parameters for decryption
 */
export const encryptPrivateKey = async (privateKeyBytes, password) => {
  try {
    // Generate salt and IV
    const salt = window.crypto.getRandomValues(new Uint8Array(16));
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    
    // Derive key from password
    const keyBuffer = await deriveKeyFromPassword(password, salt);
    
    // Import the derived key
    const key = await window.crypto.subtle.importKey(
      'raw',
      keyBuffer,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt']
    );
    
    // Encrypt the private key
    const privateKeyHex = bytesToHex(privateKeyBytes);
    const encoder = new TextEncoder();
    const encryptedBuffer = await window.crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      encoder.encode(privateKeyHex)
    );
    
    // Convert the encrypted data to hex
    const encryptedKey = bytesToHex(new Uint8Array(encryptedBuffer));
    
    return {
      key: encryptedKey,
      salt: bytesToHex(salt),
      iv: bytesToHex(iv),
      algorithm: 'AES-GCM'
    };
  } catch (error) {
    console.error('Error encrypting private key:', error);
    throw new Error('Failed to encrypt private key');
  }
};

/**
 * Decrypts an encrypted private key using a password
 * @param {Object} encryptedData - The encrypted private key data
 * @param {string} keyDecrypt - key for decryption
 * @returns {Promise<Uint8Array>} The decrypted private key bytes
 */
export const decryptPrivateKey = async (encryptedData, keyDecrypt) => {
  try {
    const { encryptedKey, salt, iv, algorithm } = encryptedData;
    console.log('encryptedData', encryptedData);
    // Convert hex strings to byte arrays
    const saltBytes = hexToBytes(salt);
    const ivBytes = hexToBytes(iv);
    const encryptedBytes = hexToBytes(encryptedKey);
    
    // Derive key from password
    const keyBuffer = await deriveKeyFromPassword(keyDecrypt, saltBytes);
    
    // Import the derived key
    const key = await window.crypto.subtle.importKey(
      'raw',
      keyBuffer,
      { name: algorithm, length: 256 },
      false,
      ['decrypt']
    );
    
    // Decrypt the private key
    const decryptedBuffer = await window.crypto.subtle.decrypt(
      { name: algorithm, iv: ivBytes },
      key,
      encryptedBytes
    );
    
    // Convert the decrypted data to hex string and then to bytes
    const decoder = new TextDecoder();
    const decryptedHex = decoder.decode(decryptedBuffer);
    
    return hexToBytes(decryptedHex);
  } catch (error) {
    console.error('Error decrypting private key:', error);
    throw new Error('Failed to decrypt private key. Incorrect password or corrupted data.');
  }
};

/**
 * Verifies that a public and private key pair match
 * @param {Uint8Array} privateKeyBytes - The private key as raw bytes
 * @param {Uint8Array} publicKeyBytes - The public key as raw bytes
 * @returns {boolean} True if the keys form a valid pair, false otherwise
 */
export const verifyKeyPair = (privateKeyBytes, publicKeyBytes) => {
  try {
    // Generate the public key from the private key
    const keyPair = curve25519GenerateKeyPair(privateKeyBytes);
    const derivedPublicKeyBytes = keyPair.public;
    
    // Compare the derived public key with the provided public key
    if (derivedPublicKeyBytes.length !== publicKeyBytes.length) {
      return false;
    }
    
    for (let i = 0; i < derivedPublicKeyBytes.length; i++) {
      if (derivedPublicKeyBytes[i] !== publicKeyBytes[i]) {
        return false;
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error verifying key pair:', error);
    return false;
  }
};

/**
 * Gets the public key from a private key
 * @param {Uint8Array} privateKeyBytes - The private key as raw bytes
 * @returns {Uint8Array} The corresponding public key as raw bytes
 */
export const getPublicKeyFromPrivate = (privateKeyBytes) => {
  try {
    const keyPair = curve25519GenerateKeyPair(privateKeyBytes);
    return keyPair.public;
  } catch (error) {
    console.error('Error extracting public key:', error);
    throw new Error('Failed to extract public key from private key');
  }
};

/**
 * Exports the public key to a compressed format (hex string)
 * @param {Uint8Array} publicKeyBytes - The public key as raw bytes
 * @returns {string} Compressed public key as a hex string
 */
export const exportCompressedPublicKey = (publicKeyBytes) => {
  try {
    return bytesToHex(publicKeyBytes);
  } catch (error) {
    console.error('Error exporting compressed public key:', error);
    throw new Error('Failed to export compressed public key');
  }
};

/**
 * Creates a shared secret between two parties
 * @param {Uint8Array} privateKeyBytes - Your private key as raw bytes
 * @param {Uint8Array} otherPublicKeyBytes - Other party's public key as raw bytes
 * @returns {Uint8Array} Shared secret bytes
 */
export const createSharedSecret = (privateKeyBytes, otherPublicKeyBytes) => {
  try {
    return sharedKey(privateKeyBytes, otherPublicKeyBytes);
  } catch (error) {
    console.error('Error creating shared secret:', error);
    throw new Error('Failed to create shared secret');
  }
};
