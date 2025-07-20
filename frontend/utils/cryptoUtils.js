/**
 * Convert an ArrayBuffer to a hexadecimal string.
 * @param {ArrayBuffer} buffer - The buffer to convert.
 * @returns {string} Hexadecimal string representation.
 */
export function bufferToHex(buffer) {
    return Array.from(new Uint8Array(buffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

/**
 * Convert a hexadecimal string to an ArrayBuffer.
 * @param {string} hex - The hex string to convert.
 * @returns {ArrayBuffer} The resulting ArrayBuffer.
 */
export function hexToBuffer(hex) {
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < hex.length; i += 2) {
        bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
    }
    return bytes.buffer;
}

/**
 * Convert a hex string to Uint8Array
 * @param {string} hexString - Hex string to convert
 * @returns {Uint8Array} The resulting byte array
 */
export const hexToBytes = (hexString) => {
  const bytes = new Uint8Array(hexString.length / 2);
  for (let i = 0; i < hexString.length; i += 2) {
    bytes[i / 2] = parseInt(hexString.substr(i, 2), 16);
  }
  return bytes;
};

/**
 * Convert Uint8Array to hex string
 * @param {Uint8Array} bytes - Byte array to convert
 * @returns {string} Hex string representation
 */
export const bytesToHex = (bytes) => {
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
};

/**
 * Generate a random master key.
 * @param {number} [size=32] - The size (bytes) of the master key to generate. Defaults to 32 bytes (256 bits).
 * @returns {ArrayBuffer} The resulting ArrayBuffer.
 */
export function generateMasterKey(size = 32) {
    return generateKey(size);
}

/**
 * Generates a base64-encoded random salt
 * @returns {string}
 */
export function generateRandomSalt() {
    const array = new Uint8Array(16);
    if (typeof window !== 'undefined' && window.crypto?.getRandomValues) {
      window.crypto.getRandomValues(array);
    } else {
      throw new Error('Secure random number generation is not available.');
    }
    return btoa(String.fromCharCode(...array));
}

/**
 * Encrypts data using the AES-GCM algorithm.
 * 
 * @param {string} plaintext - The data to be encrypted.
 * @param {CryptoKey} key - The AES-GCM encryption key.
 * @returns {Promise<{ciphertext: Uint8Array, iv: Uint8Array}>} - The encrypted data and IV.
 */
export async function encryptDataAESGCM(plaintext, key) {
    const encoder = new TextEncoder();
    const data = encoder.encode(plaintext);
    
    const iv = crypto.getRandomValues(new Uint8Array(12)); // AES-GCM typically uses a 12-byte IV

    const encryptedData = await crypto.subtle.encrypt(
        {
            name: "AES-GCM",
            iv: iv
        },
        key,
        data
    );

    return {
        ciphertext: new Uint8Array(encryptedData),
        iv: iv
    };
}

/**
 * Decrypts data encrypted with the AES-GCM algorithm.
 * 
 * @param {Uint8Array} ciphertext - The encrypted data.
 * @param {Uint8Array} iv - The initialization vector used for encryption.
 * @param {CryptoKey} key - The AES-GCM decryption key.
 * @returns {Promise<string>} - The decrypted plaintext.
 */
export async function decryptDataAESGCM(ciphertext, iv, key) {
    const decryptedData = await crypto.subtle.decrypt(
        {
            name: "AES-GCM",
            iv: iv
        },
        key,
        ciphertext
    );

    const decoder = new TextDecoder();
    return decoder.decode(decryptedData);
}

/**
 * Generates a cryptographic key for AES-GCM encryption.
 * 
 * @param {number} size - The size (bytes) of the master key to generate.
 * @returns {Promise<CryptoKey>} - The generated AES-GCM key.
 */
async function generateKey(size) {
    return crypto.subtle.generateKey(
        {
            name: "AES-GCM",
            length: size
        },
        true,
        ["encrypt", "decrypt"]
    );
}