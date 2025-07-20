import { useState } from 'react';
import axios from 'axios';
import { bytesToHex, hexToBytes } from '../utils/cryptoUtils';
import { getKeys } from '../utils/indexedDBUtils';

export const useFileUpload = (userAuthKey) => {
  const [fileStatuses, setFileStatuses] = useState({});

  const readFileAsArrayBuffer = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  };

  const uploadFileMetadata = async (file) => {
    setFileStatuses(prev => ({
      ...prev,
      [file.name]: { status: 'pending' }
    }));

    try {
      const fileData = {
        fileName: file.name,
        fileSizeBytes: file.size,
        contentType: file.type
      };

      const response = await axios.post('http://localhost:8080/api/files/upload', fileData, {
        withCredentials: true
      });
      
      if (response.data.success) {
        setFileStatuses(prev => ({
          ...prev,
          [file.name]: { 
            status: 'encrypting',
            fileId: response.data.fileId
          }
        }));
        
        await encryptAndUploadFile(file, response.data.fileId);
      } else {
        setFileStatuses(prev => ({
          ...prev,
          [file.name]: { status: 'error' }
        }));
      }
    } catch (error) {
      setFileStatuses(prev => ({
        ...prev,
        [file.name]: { status: 'error' }
      }));
    }
  };

  const encryptAndUploadFile = async (file, fileId) => {
    try {
      const fileKey = await crypto.subtle.generateKey(
        {
          name: "AES-GCM",
          length: 256
        },
        true,
        ["encrypt", "decrypt"]
      );
      
      const rawFileKey = await crypto.subtle.exportKey("raw", fileKey);
      const fileContent = await readFileAsArrayBuffer(file.file);
      
      const iv = crypto.getRandomValues(new Uint8Array(12));
      const encryptedContent = await crypto.subtle.encrypt(
        {
          name: "AES-GCM",
          iv: iv,
          tagLength: 128
        },
        fileKey,
        fileContent
      );
      
      const encryptedData = new Uint8Array(encryptedContent);
      const contentLength = encryptedData.length;
      const authTag = encryptedData.slice(contentLength - 16);
      
      if (!userAuthKey) {
        throw new Error('Authentication key not found. Please login again.');
      }
      
      const keys = await getKeys(userAuthKey);
      if (!keys || !keys.masterKey) {
        throw new Error('Master key not found. Please login again.');
      }
      
      const masterKeyBytes = hexToBytes(keys.masterKey);
      const masterKey = await crypto.subtle.importKey(
        "raw",
        masterKeyBytes,
        { name: "AES-GCM", length: 256 },
        false,
        ["encrypt", "decrypt"]
      );

      const keyIv = crypto.getRandomValues(new Uint8Array(12));
      const encryptedKey = await crypto.subtle.encrypt(
        {
          name: "AES-GCM",
          iv: keyIv
        },
        masterKey,
        rawFileKey
      );
      
      const ivHex = bytesToHex(iv);
      const keyIvHex = bytesToHex(keyIv);
      const authTagHex = bytesToHex(authTag);
      const encryptedKeyHex = bytesToHex(new Uint8Array(encryptedKey));
      
      const formData = new FormData();
      const encryptedFile = new Blob([encryptedData], { type: file.type });
      formData.append('encryptedContent', encryptedFile);
      formData.append('encryptedKey', encryptedKeyHex);
      formData.append('iv', ivHex);
      formData.append('keyIv', keyIvHex);
      formData.append('tag', authTagHex);
      
      setFileStatuses(prev => ({
        ...prev,
        [file.name]: { 
          status: 'uploading',
          fileId
        }
      }));
      
      const uploadResponse = await axios.post(
        `http://localhost:8080/api/files/upload/content/${fileId}`,
        formData,
        {
          withCredentials: true,
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      
      setFileStatuses(prev => ({
        ...prev,
        [file.name]: { 
          status: 'success',
          fileId
        }
      }));
    } catch (error) {
      setFileStatuses(prev => ({
        ...prev,
        [file.name]: { 
          status: 'error',
          fileId
        }
      }));
    }
  };

  return {
    fileStatuses,
    uploadFileMetadata
  };
}; 