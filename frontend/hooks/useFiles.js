import { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { hexToBytes, bytesToHex } from '../utils/cryptoUtils';
import { getKeys } from '../utils/indexedDBUtils';
import { createSharedSecret } from '../utils/EccCryptoUtils';

// Helper functions for cryptography
const decryptWrappedKey = async (wrappedKey, keyIv, masterKey) => {
  try {
    console.log('Decrypting wrapped key:', {
      wrappedKeyLength: wrappedKey.byteLength,
      keyIvLength: keyIv.byteLength,
      masterKeyAlgorithm: masterKey.algorithm,
    });
    
    const decryptedKey = await crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: keyIv,
        tagLength: 128
      },
      masterKey,
      wrappedKey
    );
    
    console.log('Successfully decrypted wrapped key, length:', decryptedKey.byteLength);
    return new Uint8Array(decryptedKey);
  } catch (error) {
    console.error('Error decrypting wrapped key:', error);
    throw new Error('Failed to decrypt file key: ' + (error.message || 'Unknown error'));
  }
};

// Decrypt wrapped key with private key (for transferred files)
const decryptWrappedKeyWithPrivateKey = async (wrappedKey, keyIv, privateKeyBytes, senderPublicKeyHex) => {
  try {
    console.log('Attempting to decrypt transferred file key using ECC');
    
    // Step 1: Verify we have the recipient's private key
    if (!privateKeyBytes) {
      throw new Error('Invalid private key format');
    }
    
    // Step 2: Get the sender's public key (passed from file metadata)
    if (!senderPublicKeyHex) {
      throw new Error('Sender public key not available - cannot decrypt transferred file');
    }
    
    const senderPublicKeyBytes = hexToBytes(senderPublicKeyHex);
    console.log('Sender public key retrieved for shared secret generation');
    
    // Step 3: Create the same shared secret using recipient's private key and sender's public key
    const sharedSecret = createSharedSecret(privateKeyBytes, senderPublicKeyBytes);
    console.log('Shared secret recreated for decryption');
    
    // Step 4: Generate the KEK by hashing the shared secret with SHA-256
    const sharedSecretHash = await crypto.subtle.digest('SHA-256', sharedSecret);
    console.log('Generated KEK from shared secret using SHA-256');
    
    // Step 5: Import the KEK as an AES key for decryption
    const kekKey = await crypto.subtle.importKey(
      "raw",
      sharedSecretHash,
      { name: "AES-GCM", length: 256 },
      false,
      ["decrypt"]
    );
    console.log('KEK imported as AES key for decryption');
    
    // Step 6: Decrypt the wrapped key using the KEK
    const decryptedKey = await crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: keyIv,
        tagLength: 128
      },
      kekKey,
      wrappedKey
    );
    
    console.log('Successfully decrypted file key with KEK, length:', decryptedKey.byteLength);
    return new Uint8Array(decryptedKey);
  } catch (error) {
    console.error('Error decrypting transferred file key:', error);
    throw new Error('Failed to decrypt transferred file key: ' + (error.message || 'Unknown error'));
  }
};

const decryptFile = async (encryptedData, iv, fileKey, tagBytes) => {
  try {
    console.log('Decrypting file with size:', encryptedData.byteLength);
    
    const decryptedData = await crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: iv,
        tagLength: 128
      },
      fileKey,
      encryptedData
    );
    
    console.log('Successfully decrypted file, size:', decryptedData.byteLength);
    return new Uint8Array(decryptedData);
  } catch (error) {
    console.error("Decryption failed:", error);
    throw error;
  }
};

export const useFiles = (userAuthKey) => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMoreFiles, setHasMoreFiles] = useState(false);
  const [totalFiles, setTotalFiles] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [downloadingFileId, setDownloadingFileId] = useState(null);
  const [deletingFileId, setDeletingFileId] = useState(null);
  const [isPolling, setIsPolling] = useState(true);
  const pollingIntervalRef = useRef(null);
  const filesHashRef = useRef('');

  // Generate a hash for the files array to compare and detect changes
  const generateFilesHash = useCallback((filesArray) => {
    return filesArray.map(file => file.id).sort().join(',');
  }, []);

  const fetchUserFiles = useCallback(async (page, silent = false) => {
    if (page === 0 && !silent) {
      setLoading(true);
      setError(null);
    } else if (!silent) {
      setLoadingMore(true);
    }

    try {
      const response = await axios.get(`http://localhost:8080/api/files?page=${page}`, {
        withCredentials: true
      });
      
      if (page === 0) {
        const newFiles = response.data.files;
        setFiles(newFiles);
        
        // Update files hash for comparison
        const newHash = generateFilesHash(newFiles);
        filesHashRef.current = newHash;
      } else {
        setFiles(prevFiles => {
          const updatedFiles = [...prevFiles, ...response.data.files];
          
          // Update files hash for comparison
          const newHash = generateFilesHash(updatedFiles);
          filesHashRef.current = newHash;
          
          return updatedFiles;
        });
      }
      
      setHasMoreFiles(response.data.hasMoreFiles);
      setCurrentPage(response.data.currentPage);
      setTotalFiles(response.data.totalFiles);
      
      if (response.data.hasMoreFiles && page === 0 && !silent) {
        fetchUserFiles(1);
      }
    } catch (err) {
      console.error('Error fetching files:', err);
      if (!silent) {
        setError('Failed to load files. Please try again later.');
      }
    } finally {
      if (page === 0 && !silent) setLoading(false);
      else if (!silent) setLoadingMore(false);
    }
  }, [generateFilesHash]);

  // Check for updates to files (polling function)
  const checkForUpdates = useCallback(async () => {
    if (!isPolling) return;
    
    try {
      const response = await axios.get('http://localhost:8080/api/files?page=0', {
        withCredentials: true
      });
      
      const newFilesHash = generateFilesHash(response.data.files);
      
      // If the hash is different, update the files
      if (newFilesHash !== filesHashRef.current) {
        console.log('Files updated, refreshing file list');
        
        // Reset to first page and reload all files
        setCurrentPage(0);
        setFiles(response.data.files);
        setHasMoreFiles(response.data.hasMoreFiles);
        setTotalFiles(response.data.totalFiles);
        filesHashRef.current = newFilesHash;
        
        // If there are more pages, load them silently
        if (response.data.hasMoreFiles) {
          fetchUserFiles(1, true);
        }
      }
    } catch (err) {
      console.error('Error checking for file updates:', err);
      // Don't set error state here to avoid UI interruptions during polling
    }
  }, [fetchUserFiles, generateFilesHash, isPolling]);

  // Start and stop polling
  const startPolling = useCallback(() => {
    setIsPolling(true);
  }, []);

  const stopPolling = useCallback(() => {
    setIsPolling(false);
  }, []);

  const loadMoreFiles = useCallback(() => {
    if (hasMoreFiles && !loadingMore) {
      fetchUserFiles(currentPage + 1);
    }
  }, [hasMoreFiles, loadingMore, currentPage, fetchUserFiles]);

  const handleDownload = useCallback(async (fileId) => {
    try {
      setDownloadingFileId(fileId);
      const selectedFile = files.find(file => file.id === fileId);
      console.log('Starting download for file:', selectedFile?.fileName);
      
      // Fetch file details and content
      const { fileDetails, encryptedContent } = await fetchFileDetailsAndContent(fileId);
      
      // Validate authentication key and get keys
      if (!userAuthKey) {
        throw new Error('Authentication key not found. Please login again.');
      }
      
      const keys = await getKeys(userAuthKey);
      if (!keys) {
        throw new Error('Keys not found. Please login again.');
      }
      
      console.log('Retrieved keys from IndexedDB:', {
        hasMasterKey: !!keys.masterKey,
        hasPrivateKey: !!keys.privateKey,
      });
      
      // Convert hex parameters to bytes
      const cryptoParams = prepareCryptoParams(fileDetails);
      
      // Determine if this is the user's own file or a transferred file
      const isTransferredFile = selectedFile && selectedFile.owner !== 'You';
      
      // Decrypt file key based on file type
      const fileKeyBytes = await decryptFileKey(isTransferredFile, keys, cryptoParams, fileDetails);
      
      // Decrypt and download the file
      await decryptAndDownloadFile(fileKeyBytes, encryptedContent, cryptoParams, fileDetails);
      
      console.log('File download complete');
      return true;
    } catch (error) {
      console.error('Error downloading file:', error);
      alert(`Error downloading file: ${error.message}`);
      throw error;
    } finally {
      setDownloadingFileId(null);
    }
  }, [files, userAuthKey]);

  // Helper function to fetch file details and content
  const fetchFileDetailsAndContent = async (fileId) => {
    const fileDetailsResponse = await axios.get(`http://localhost:8080/api/files/${fileId}`, {
      withCredentials: true
    });
    
    const fileDetails = fileDetailsResponse.data;
    console.log('File details received:', {
      fileName: fileDetails.fileName,
      fileSize: fileDetails.fileSize,
      contentType: fileDetails.contentType,
      hasWrappedKey: !!fileDetails.wrappedKey,
      hasIv: !!fileDetails.iv,
      hasKeyIv: !!fileDetails.keyIv,
      hasTag: !!fileDetails.tag,
    });
    
    const fileContentResponse = await axios.get(`http://localhost:8080/api/files/${fileId}/content`, {
      withCredentials: true,
      responseType: 'arraybuffer'
    });
    
    const encryptedContent = new Uint8Array(fileContentResponse.data);
    console.log('Received encrypted file content, size:', encryptedContent.byteLength);
    
    return { fileDetails, encryptedContent };
  };

  // Helper function to prepare crypto parameters
  const prepareCryptoParams = (fileDetails) => {
    const wrappedKeyBytes = hexToBytes(fileDetails.wrappedKey);
    const fileIvBytes = hexToBytes(fileDetails.iv);
    const keyIvBytes = hexToBytes(fileDetails.keyIv);
    const tagBytes = hexToBytes(fileDetails.tag);
    
    console.log('Converted hex parameters to bytes:', {
      wrappedKeySize: wrappedKeyBytes.byteLength,
      fileIvSize: fileIvBytes.byteLength,
      keyIvSize: keyIvBytes.byteLength,
      tagSize: tagBytes.byteLength,
    });
    
    return { wrappedKeyBytes, fileIvBytes, keyIvBytes, tagBytes };
  };

  // Helper function to decrypt the file key
  const decryptFileKey = async (isTransferredFile, keys, cryptoParams, fileDetails) => {
    const { wrappedKeyBytes, keyIvBytes } = cryptoParams;
    let fileKeyBytes;
    
    console.log(`Downloading file: ${fileDetails.fileName}, Is transferred: ${isTransferredFile}`);
    
    if (isTransferredFile) {
      fileKeyBytes = await decryptTransferredFileKey(keys, wrappedKeyBytes, keyIvBytes, fileDetails);
    } else {
      fileKeyBytes = await decryptOwnFileKey(keys, wrappedKeyBytes, keyIvBytes);
    }
    
    return fileKeyBytes;
  };

  // Helper function to decrypt transferred file key
  const decryptTransferredFileKey = async (keys, wrappedKeyBytes, keyIvBytes, fileDetails) => {
    console.log('Attempting to decrypt transferred file');
    
    // For shared files, use the private key
    if (!keys.privateKey) {
      throw new Error('Private key not found. Please login again.');
    }
    
    try {
      // Get the private key bytes for decryption
      console.log('Getting private key bytes for decryption');
      const privateKeyBytes = keys.privateKey;
      console.log('Private key bytes available:', !!privateKeyBytes);
      
      // Decrypt the wrapped key with private key
      const fileKeyBytes = await decryptWrappedKeyWithPrivateKey(
        wrappedKeyBytes, 
        keyIvBytes, 
        privateKeyBytes, 
        fileDetails.senderPublicKeyHex
      );
      console.log('Successfully decrypted file key with private key, length:', fileKeyBytes.byteLength);
      return fileKeyBytes;
    } catch (privateKeyError) {
      console.error('Error decrypting with private key:', privateKeyError);
      throw new Error('Failed to decrypt file key. This file may have been shared with a different user.');
    }
  };

  // Helper function to decrypt own file key
  const decryptOwnFileKey = async (keys, wrappedKeyBytes, keyIvBytes) => {
    // For the user's own files, use the master key
    if (!keys.masterKey) {
      throw new Error('Master key not found. Please login again.');
    }
    
    console.log('Decrypting own file with master key');
    const masterKeyBytes = hexToBytes(keys.masterKey);
    console.log('Master key bytes length:', masterKeyBytes.byteLength);
    
    const importedMasterKey = await crypto.subtle.importKey(
      "raw",
      masterKeyBytes,
      { name: "AES-GCM", length: 256 },
      false,
      ["decrypt"]
    );
    console.log('Master key imported successfully');
    
    const fileKeyBytes = await decryptWrappedKey(wrappedKeyBytes, keyIvBytes, importedMasterKey);
    console.log('Successfully decrypted file key with master key, length:', fileKeyBytes.byteLength);
    return fileKeyBytes;
  };

  // Helper function to decrypt and download the file
  const decryptAndDownloadFile = async (fileKeyBytes, encryptedContent, cryptoParams, fileDetails) => {
    const { fileIvBytes, tagBytes } = cryptoParams;
    
    // Import the file key for decryption
    console.log('Importing file key for content decryption');
    const fileKey = await crypto.subtle.importKey(
      "raw",
      fileKeyBytes,
      { name: "AES-GCM", length: 256 },
      false,
      ["decrypt"]
    );
    console.log('File key imported successfully');
    
    // Decrypt the file content with the file key
    const decryptedContent = await decryptFile(encryptedContent, fileIvBytes, fileKey, tagBytes);
    console.log('Successfully decrypted file content, size:', decryptedContent.byteLength);
    
    // Create a download link
    const blob = new Blob([decryptedContent], { type: fileDetails.contentType || 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileDetails.fileName;
    document.body.appendChild(a);
    a.click();
    
    // Clean up
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
  };

  const handleDelete = useCallback(async (fileId) => {
    try {
      setDeletingFileId(fileId);
      
      await axios.delete(`http://localhost:8080/api/files/${fileId}`, {
        withCredentials: true
      });
      
      setFiles(files.filter(file => file.id !== fileId));
      setTotalFiles(prev => prev - 1);
      
      return true;
    } catch (error) {
      console.error('Error deleting file:', error);
      throw error;
    } finally {
      setDeletingFileId(null);
    }
  }, [files]);

  // Set up polling interval
  useEffect(() => {
    // Initial fetch
    fetchUserFiles(0);
    
    // Set up polling every 3 seconds
    pollingIntervalRef.current = setInterval(() => {
      checkForUpdates();
    }, 3000);
    
    // Clean up on unmount
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [fetchUserFiles, checkForUpdates]);

  // Handle polling state changes
  useEffect(() => {
    if (isPolling && !pollingIntervalRef.current) {
      pollingIntervalRef.current = setInterval(() => {
        checkForUpdates();
      }, 3000);
    } else if (!isPolling && pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [isPolling, checkForUpdates]);

  return {
    files,
    loading,
    error,
    currentPage,
    hasMoreFiles,
    totalFiles,
    loadingMore,
    downloadingFileId,
    deletingFileId,
    fetchUserFiles,
    loadMoreFiles,
    handleDownload,
    handleDelete,
    startPolling,
    stopPolling,
    isPolling
  };
}; 