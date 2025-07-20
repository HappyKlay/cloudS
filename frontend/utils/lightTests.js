import { hashPassword } from './Argon2';
import { generateKeyPair, encryptPrivateKey, exportCompressedPublicKey, decryptPrivateKey } from './EccCryptoUtils';
import { bufferToHex, hexToBuffer, generateMasterKey, generateRandomSalt, encryptDataAESGCM, decryptDataAESGCM, bytesToHex } from './cryptoUtils';
import { hkdf } from './Hkdf';

// Test function for encryption and decryption
export const testEncryptionDecryption = async (password, salt) => {
    try {
      console.log("🔐 Starting encryption/decryption test...");
      
      // 1. Hash the password (encryption step)
      console.log("Step 1: Hashing password");
      const hashedPassword = await hashPassword(password, salt, {
        iterations: 6,
        memory: 131072,
        parallelism: 4,
        hashLength: 32,
        hashType: 'argon2id'
      });
      
      // 2. Derive authentication and encryption keys (encryption step)
      console.log("Step 2: Deriving keys from password hash");
      const authSalt = generateRandomSalt();
      const encSalt = generateRandomSalt();
      const authenticationKey = await hkdf(hashedPassword.encoded, authSalt, 'authentication', 32);
      const encryptionKey = await hkdf(hashedPassword.encoded, encSalt, 'encryption', 32);
      
      // 3. Generate master key (encryption step)
      console.log("Step 3: Generating master key");
      // Generate a random master key as raw bytes instead of CryptoKey
      const masterKeyBytes = new Uint8Array(32);
      window.crypto.getRandomValues(masterKeyBytes);
      console.log("Master key generated:", masterKeyBytes);
      
      // 4. Generate ECC key pair (encryption step)
      console.log("Step 4: Generating ECC key pair");
      const keyPair = generateKeyPair();
      console.log("Key pair generated:", keyPair);
      
      // 5. Encrypt private key with master key (encryption step)
      console.log("Step 5: Encrypting private key with master key");
      // Use master key bytes directly for encryption
      const masterKeyHex = bytesToHex(masterKeyBytes);
      const encryptedPrivateKey = await encryptPrivateKey(keyPair.privateKeyBytes, masterKeyHex);
      console.log("Private key encrypted:", encryptedPrivateKey);
      
      // 6. Encrypt master key with encryption key (encryption step)
      console.log("Step 6: Encrypting master key with encryption key");
      // Import encryption key into a CryptoKey
      const encKeyImport = await window.crypto.subtle.importKey(
        'raw',
        encryptionKey,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt', 'decrypt']
      );
      
      // Encrypt the master key hex string
      const encryptedMasterKey = await encryptDataAESGCM(masterKeyHex, encKeyImport);
      console.log("Master key encrypted:", encryptedMasterKey);
      
      console.log("✅ Encryption completed successfully");
      
      // ---- DECRYPTION PROCESS ----
      
      // 7. Regenerate the password hash (decryption step)
      console.log("\n🔓 Starting decryption test...");
      console.log("Step 7: Regenerating password hash");
      const regeneratedHash = await hashPassword(password, salt, {
        iterations: 6,
        memory: 131072,
        parallelism: 4,
        hashLength: 32,
        hashType: 'argon2id'
      });
      
      // 8. Regenerate encryption key (decryption step)
      console.log("Step 8: Regenerating encryption key");
      const regeneratedEncKey = await hkdf(regeneratedHash.encoded, encSalt, 'encryption', 32);
      
      // 9. Decrypt master key (decryption step)
      console.log("Step 9: Decrypting master key");
      // Import the regenerated encryption key
      const decKeyImport = await window.crypto.subtle.importKey(
        'raw',
        regeneratedEncKey,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt', 'decrypt']
      );

      // Decrypt the master key
      const decryptedMasterKeyHex = await decryptDataAESGCM(
        encryptedMasterKey.ciphertext, 
        encryptedMasterKey.iv, 
        decKeyImport
      );
      console.log("Decrypted master key:", decryptedMasterKeyHex);
      
      // 10. Decrypt private key (decryption step)
      console.log("Step 10: Decrypting private key");
      const decryptedPrivateKey = await decryptPrivateKey({
        encryptedKey: encryptedPrivateKey.key,
        salt: encryptedPrivateKey.salt,
        iv: encryptedPrivateKey.iv,
        algorithm: encryptedPrivateKey.algorithm
      }, decryptedMasterKeyHex);
      console.log("Decrypted private key:", decryptedPrivateKey);
      
      // 11. Verify decryption success
      console.log("Step 11: Verifying decryption success");
      let privateKeysMatch = true;
      if (keyPair.privateKeyBytes.length !== decryptedPrivateKey.length) {
        privateKeysMatch = false;
      } else {
        for (let i = 0; i < keyPair.privateKeyBytes.length; i++) {
          if (keyPair.privateKeyBytes[i] !== decryptedPrivateKey[i]) {
            privateKeysMatch = false;
            break;
          }
        }
      }
      
      if (privateKeysMatch) {
        console.log("✅ Success! Decrypted private key matches the original private key");
      } else {
        console.error("❌ Error: Decrypted private key does not match the original private key");
        console.log("Original:", keyPair.privateKeyBytes);
        console.log("Decrypted:", decryptedPrivateKey);
      }
      
      return { success: privateKeysMatch };
    } catch (error) {
      console.error("❌ Error in encryption/decryption test:", error);
      console.error("Error details:", error.message, error.stack);
      return { success: false, error };
    }
  };