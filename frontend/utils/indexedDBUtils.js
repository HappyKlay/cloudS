// IndexedDB utility functions for storing and retrieving cryptographic keys

const DB_NAME = 'cloudSKeys';
const DB_VERSION = 1;
const KEY_STORE = 'cryptoKeys';

/**
 * Initialize the IndexedDB database
 * @returns {Promise<IDBDatabase>} The opened database
 */
export const initDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = (event) => {
      reject(`Database error: ${event.target.error}`);
    };
    
    request.onsuccess = (event) => {
      resolve(event.target.result);
    };
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      // Create an object store for the crypto keys if it doesn't exist
      if (!db.objectStoreNames.contains(KEY_STORE)) {
        db.createObjectStore(KEY_STORE, { keyPath: 'id' });
      }
    };
  });
};

/**
 * Store cryptographic keys in IndexedDB
 * @param {string} userId - User identifier (email)
 * @param {string} masterKeyHex - Master key in hex format
 * @param {Object} privateKeyJwk - Private key in JWK format
 * @returns {Promise<void>}
 */
export const storeKeys = async (userId, masterKeyHex, privateKeyJwk) => {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([KEY_STORE], 'readwrite');
      const store = transaction.objectStore(KEY_STORE);
      
      const keyData = {
        id: userId,
        masterKey: masterKeyHex,
        privateKey: privateKeyJwk,
        timestamp: new Date().toISOString()
      };
      
      const request = store.put(keyData);
      
      request.onerror = (event) => {
        reject(`Error storing keys: ${event.target.error}`);
      };
      
      request.onsuccess = () => {
        resolve();
      };
      
      transaction.oncomplete = () => {
        db.close();
      };
    });
  } catch (error) {
    console.error('Failed to store keys:', error);
    throw error;
  }
};

/**
 * Retrieve cryptographic keys from IndexedDB
 * @param {string} userId - User identifier (email)
 * @returns {Promise<{masterKey: string, privateKey: Object}>}
 */
export const getKeys = async (userId) => {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([KEY_STORE], 'readonly');
      const store = transaction.objectStore(KEY_STORE);
      
      const request = store.get(userId);
      
      request.onerror = (event) => {
        reject(`Error retrieving keys: ${event.target.error}`);
      };
      
      request.onsuccess = (event) => {
        const result = event.target.result;
        if (result) {
          resolve({
            masterKey: result.masterKey,
            privateKey: result.privateKey
          });
        } else {
          resolve(null);
        }
      };
      
      transaction.oncomplete = () => {
        db.close();
      };
    });
  } catch (error) {
    console.error('Failed to retrieve keys:', error);
    throw error;
  }
};

/**
 * Delete cryptographic keys from IndexedDB
 * @param {string} userId - User identifier (email)
 * @returns {Promise<void>}
 */
export const deleteKeys = async (userId) => {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([KEY_STORE], 'readwrite');
      const store = transaction.objectStore(KEY_STORE);
      
      const request = store.delete(userId);
      
      request.onerror = (event) => {
        reject(`Error deleting keys: ${event.target.error}`);
      };
      
      request.onsuccess = () => {
        resolve();
      };
      
      transaction.oncomplete = () => {
        db.close();
      };
    });
  } catch (error) {
    console.error('Failed to delete keys:', error);
    throw error;
  }
}; 