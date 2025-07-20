import React, { useState, useEffect } from 'react';
import { useFiles } from '../hooks/useFiles';
import { useAuth } from '../hooks/useAuth';
import { hexToBytes, bytesToHex } from '../utils/cryptoUtils';
import { getKeys } from '../utils/indexedDBUtils';
import { generateKeyPair, getPublicKeyFromPrivate, createSharedSecret } from '../utils/EccCryptoUtils';
import axios from 'axios';
import { Send, Search, X, Mail, FileText, CheckCircle, AlertTriangle } from 'lucide-react';

const TransferForm = ({ onClose, userFiles = [] }) => {
  const [email, setEmail] = useState('');
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [loading, setLoading] = useState(false);
  const [formState, setFormState] = useState('initial'); // initial, submitting, success, error
  const [errorMessage, setErrorMessage] = useState('');
  const [animate, setAnimate] = useState(false);
  const { files, loading: filesLoading, error } = useFiles();
  const { userAuthKey } = useAuth();
  
  // Determine which files to display - use provided userFiles or fetch from API
  const displayFiles = userFiles.length > 0 ? userFiles : files;

  useEffect(() => {
    // If a single file is provided (from ProfilePage share action), pre-select it
    if (userFiles.length === 1) {
      setSelectedFiles([userFiles[0].id]);
    }
    
    // Start animation after component mounts
    setTimeout(() => setAnimate(true), 50);
  }, [userFiles]);

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
  };

  const handleSearchChange = (e) => {
    setSearchText(e.target.value);
  };

  const handleFileSelect = (fileId) => {
    if (selectedFiles.includes(fileId)) {
      setSelectedFiles(selectedFiles.filter(id => id !== fileId));
    } else {
      setSelectedFiles([...selectedFiles, fileId]);
    }
  };

  const filteredFiles = displayFiles.filter(file => 
    file.fileName.toLowerCase().includes(searchText.toLowerCase())
  );

  const handleCloseWithAnimation = () => {
    setAnimate(false);
    setTimeout(onClose, 300); // Wait for animation to complete
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setFormState('submitting');
    // http://sloud-s-beanstalk-env.eba-iibpdtfm.us-east-1.elasticbeanstalk.com 
    try {
      const recipientKeyResponse = await axios.get(`http://localhost:8080/api/users/publicKey/${email}`, {
        withCredentials: true
      });
      
      if (!recipientKeyResponse.data || !recipientKeyResponse.data.publicKey) {
        throw new Error("Recipient's public key not found. Make sure the email is correct.");
      }
      
      const recipientPublicKeyHex = recipientKeyResponse.data.publicKey;
      console.log("Recipient's public key obtained successfully");
      
      const recipientPublicKeyBytes = hexToBytes(recipientPublicKeyHex);
      
      const fileTransferPromises = selectedFiles.map(async (fileId) => {
        console.log(`Processing file ID: ${fileId}`);
        
        const fileDetailsResponse = await axios.get(`http://localhost:8080/api/files/${fileId}`, {
          withCredentials: true
        });
        
        const fileDetails = fileDetailsResponse.data;
        console.log("File details obtained from server");
        
        const keys = await getKeys(userAuthKey);
        if (!keys || !keys.masterKey) {
          throw new Error('Master key not found. Please login again.');
        }
        
        const masterKeyBytes = hexToBytes(keys.masterKey);
        const importedMasterKey = await crypto.subtle.importKey(
          "raw",
          masterKeyBytes,
          { name: "AES-GCM", length: 256 },
          false,
          ["decrypt"]
        );
        console.log("Master key imported successfully");
        
        const wrappedKeyBytes = hexToBytes(fileDetails.wrappedKey);
        const keyIvBytes = hexToBytes(fileDetails.keyIv);
        
        const fileKeyBytes = await crypto.subtle.decrypt(
          {
            name: "AES-GCM",
            iv: keyIvBytes,
            tagLength: 128
          },
          importedMasterKey,
          wrappedKeyBytes
        );
        console.log("File key decrypted successfully with master key");

        const senderPrivateKeyBytes = keys.privateKey;
        if (!senderPrivateKeyBytes) {
          throw new Error('Private key not found. Please login again.');
        }
        console.log("Sender's private key retrieved successfully");
        
        const sharedSecret = createSharedSecret(senderPrivateKeyBytes, recipientPublicKeyBytes);
        console.log("Shared secret created for encryption");

        const sharedSecretHash = await crypto.subtle.digest('SHA-256', sharedSecret);
        console.log("Generated KEK from shared secret using SHA-256");
        
        const kekKey = await crypto.subtle.importKey(
          "raw",
          sharedSecretHash,
          { name: "AES-GCM", length: 256 },
          false,
          ["encrypt"]
        );
        console.log("KEK imported as AES key");
        
        const newKeyIv = window.crypto.getRandomValues(new Uint8Array(12));
        
        const newWrappedKey = await crypto.subtle.encrypt(
          {
            name: "AES-GCM",
            iv: newKeyIv,
            tagLength: 128
          },
          kekKey,
          fileKeyBytes
        );
        console.log("File key encrypted successfully for recipient using KEK");
        
        const senderPublicKeyBytes = getPublicKeyFromPrivate(senderPrivateKeyBytes);
        const senderPublicKeyHex = bytesToHex(senderPublicKeyBytes);
        
        return axios.post('http://localhost:8080/api/files/transfer', {
          fileId: fileId,
          recipientEmail: email,
          newWrappedKey: bytesToHex(new Uint8Array(newWrappedKey)),
          newKeyIv: bytesToHex(newKeyIv),
          senderPublicKey: senderPublicKeyHex 
        }, {
          withCredentials: true
        });
      });
      
      await Promise.all(fileTransferPromises);
      console.log("All files transferred successfully");
      
      setFormState('success');
      setTimeout(() => {
        setAnimate(false);
        setTimeout(onClose, 300);
      }, 1500);
    } catch (error) {
      console.error('Error transferring files:', error);
      setFormState('error');
      setErrorMessage(error.response?.data?.message || error.message);
    } finally {
      setLoading(false);
    }
  };

  const renderFileSelection = () => {
    if (filesLoading) {
      return (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600"></div>
          <p className="ml-3 text-gray-600">Loading files...</p>
        </div>
      );
    }
    
    if (error) {
      return (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center">
          <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
          <p className="text-red-600">Error loading files: {error}</p>
        </div>
      );
    }
    
    if (displayFiles.length === 1) {
      const file = displayFiles[0];
      
      return (
        <div className="mb-6 transform transition-all duration-300 ease-in-out">
          <label className="block text-gray-700 mb-2 font-medium">File to Transfer</label>
          <div className="border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300">
            <div className={`flex items-center p-3 ${selectedFiles.includes(file.id) ? 'bg-indigo-50 border-l-4 border-indigo-500' : 'hover:bg-gray-50'} transition-all duration-300`}>
              <input
                type="checkbox"
                id={`file-${file.id}`}
                checked={selectedFiles.includes(file.id)}
                onChange={() => handleFileSelect(file.id)}
                className="mr-3 h-5 w-5 text-indigo-600 rounded focus:ring-indigo-500 cursor-pointer transition-all duration-200 ease-in-out"
              />
              <label htmlFor={`file-${file.id}`} className="cursor-pointer flex-1 font-medium flex items-center">
                <FileText className="h-4 w-4 text-indigo-500 mr-2" />
                <span className="text-gray-800">{file.fileName}</span>
              </label>
            </div>
          </div>
        </div>
      );
    }    

    return (
      <div className="mb-6 transform transition-all duration-300 ease-in-out">
        <label className="block text-gray-700 mb-2 font-medium">Select Files to Transfer</label>
        <div className="mb-3 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            value={searchText}
            onChange={handleSearchChange}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
            placeholder="Search files..."
          />
        </div>
        {filteredFiles.length > 0 ? (
          <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300">
            {filteredFiles.map((file, index) => (
              <div 
                key={file.id} 
                className={`flex items-center p-3 border-b border-gray-100 last:border-b-0 ${selectedFiles.includes(file.id) ? 'bg-indigo-50 border-l-4 border-indigo-500' : 'hover:bg-gray-50'} transition-all duration-300 ease-in-out`}
                style={{ 
                  animationDelay: `${index * 50}ms`,
                  animation: animate ? 'fadeIn 0.5s ease forwards' : 'none'
                }}
              >
                <input
                  type="checkbox"
                  id={`file-${file.id}`}
                  checked={selectedFiles.includes(file.id)}
                  onChange={() => handleFileSelect(file.id)}
                  className="mr-3 h-5 w-5 text-indigo-600 rounded focus:ring-indigo-500 cursor-pointer transition-all duration-200 ease-in-out"
                />
                <label htmlFor={`file-${file.id}`} className="cursor-pointer flex-1 flex items-center group">
                  <FileText className="h-4 w-4 text-indigo-500 mr-2 group-hover:scale-110 transition-transform duration-200" />
                  <span className="text-gray-800 group-hover:text-indigo-600 transition-colors duration-200">{file.fileName}</span>
                </label>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-8 bg-gray-50 rounded-lg border border-gray-200">
            <AlertTriangle className="h-10 w-10 text-gray-400 mb-2" />
            <p className="text-gray-500 text-center">No files found matching your search</p>
          </div>
        )}
      </div>
    );
  };

  const renderFormContent = () => {
    if (formState === 'success') {
      return (
        <div className="flex flex-col items-center justify-center py-10 px-6 animate-fade-in">
          <div className="bg-green-100 rounded-full p-4 mb-5">
            <CheckCircle className="h-12 w-12 text-green-500" />
          </div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">Transfer Complete!</h3>
          <p className="text-gray-600 text-center mb-5">Your files have been successfully shared.</p>
        </div>
      );
    }
    
    if (formState === 'error') {
      return (
        <div className="p-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-5 animate-shake">
            <div className="flex items-start">
              <AlertTriangle className="h-5 w-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-red-800 font-medium">Transfer Failed</h3>
                <p className="text-red-600 text-sm mt-1">{errorMessage}</p>
              </div>
            </div>
          </div>
          
          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <label htmlFor="email" className="block text-gray-700 mb-2 font-medium">Recipient Email</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={handleEmailChange}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                  placeholder="Enter recipient's email"
                  required
                />
              </div>
            </div>

            {renderFileSelection()}

            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={handleCloseWithAnimation}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white rounded-lg hover:from-indigo-600 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50 shadow-md hover:shadow-lg transition-all duration-200 transform hover:-translate-y-0.5 flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
                disabled={!email || selectedFiles.length === 0 || loading}
              >
                {loading ? (
                  <>
                    <span className="inline-block animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></span>
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    <span>Transfer Files</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      );
    }

    return (
      <div className="p-6">
        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label htmlFor="email" className="block text-gray-700 mb-2 font-medium">Recipient Email</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="email"
                id="email"
                value={email}
                onChange={handleEmailChange}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                placeholder="Enter recipient's email"
                required
              />
            </div>
          </div>

          {renderFileSelection()}

          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={handleCloseWithAnimation}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white rounded-lg hover:from-indigo-600 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50 shadow-md hover:shadow-lg transition-all duration-200 transform hover:-translate-y-0.5 flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
              disabled={!email || selectedFiles.length === 0 || loading}
            >
              {loading ? (
                <>
                  <span className="inline-block animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></span>
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  <span>Transfer Files</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div 
        className={`bg-white rounded-xl shadow-2xl overflow-hidden transition-all duration-300 ease-in-out max-w-md w-full transform ${
          animate ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
        }`}
      >
        {/* Header with gradient */}
        <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 p-5 relative">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-white">Transfer Files</h2>
            <button 
              onClick={handleCloseWithAnimation} 
              className="text-white/80 hover:text-white p-1 rounded-full hover:bg-white/20 transition-colors duration-200"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          <div className="absolute -bottom-4 left-0 right-0 h-4 bg-gradient-to-b from-indigo-600/20 to-transparent"></div>
        </div>
        
        {/* Form content with conditional rendering based on state */}
        {renderFormContent()}
      </div>
      
      {/* Custom animations */}
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
          20%, 40%, 60%, 80% { transform: translateX(5px); }
        }
        
        .animate-fade-in {
          animation: fadeIn 0.5s ease forwards;
        }
        
        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
      `}</style>
    </div>
  );
};

export default TransferForm;