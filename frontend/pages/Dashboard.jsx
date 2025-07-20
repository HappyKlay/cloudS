import React, { useState, useEffect } from 'react';
import { Upload, File, CheckCircle, X, AlertCircle } from 'lucide-react';
import TransferForm from '../components/TransferForm';
import { useFileUpload } from '../hooks/useFileUpload';
import { useFileSelection } from '../hooks/useFileSelection';
import { useTransferForm } from '../hooks/useTransferForm';
import { useFiles } from '../hooks/useFiles';

const Dashboard = () => {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [userAuthKey, setUserAuthKey] = useState('');
  const [animateEntry, setAnimateEntry] = useState(false);
  
  const { fileStatuses, uploadFileMetadata } = useFileUpload(userAuthKey);
  const { files } = useFiles(userAuthKey);
  const { 
    isDragging, 
    fileInputRef, 
    handleFileSelect, 
    handleFileChange, 
    handleDragOver, 
    handleDragLeave, 
    handleDrop 
  } = useFileSelection((newFiles) => setSelectedFiles(prev => [...prev, ...newFiles]));
  const { showTransferForm, openTransferForm, closeTransferForm } = useTransferForm();

  useEffect(() => {
    selectedFiles.forEach(file => {
      if (!fileStatuses[file.name]) {
        uploadFileMetadata(file);
      }
    });
  }, [selectedFiles, fileStatuses, uploadFileMetadata]);

  useEffect(() => {
    const storedAuthKey = localStorage.getItem('userAuthKey');
    if (storedAuthKey) {
      setUserAuthKey(storedAuthKey);
    }
    
    // Trigger animations on mount
    setAnimateEntry(true);
  }, []);

  const getStatusIndicator = (fileName) => {
    if (!fileStatuses[fileName]) {
      return null;
    }

    const status = fileStatuses[fileName].status;
    
    if (status === 'pending') {
      return (
        <span className="ml-auto flex items-center text-yellow-500">
          <svg className="animate-spin h-5 w-5 mr-1" xmlns="https://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span className="text-xs">Pending</span>
        </span>
      );
    } else if (status === 'encrypting') {
      return (
        <span className="ml-auto flex items-center text-blue-500">
          <svg className="animate-spin h-5 w-5 mr-1" xmlns="https://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span className="text-xs">Encrypting</span>
        </span>
      );
    } else if (status === 'uploading') {
      return (
        <span className="ml-auto flex items-center text-indigo-500">
          <svg className="animate-spin h-5 w-5 mr-1" xmlns="https://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span className="text-xs">Uploading</span>
        </span>
      );
    } else if (status === 'success') {
      return (
        <span className="ml-auto">
          <CheckCircle className="h-5 w-5 text-green-500" />
        </span>
      );
    } else if (status === 'error') {
      return (
        <span className="ml-auto">
          <AlertCircle className="h-5 w-5 text-red-500" />
        </span>
      );
    }
    
    return null;
  };

  return (
    <div className="h-screen w-full flex items-center justify-center bg-gray-50">
      <div 
        className={`max-w-lg w-full bg-white rounded-xl shadow-xl overflow-hidden transform transition-all duration-500 ${
          animateEntry ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
        }`}
      >
        {/* Header section */}
        <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 p-6 flex items-center justify-center">
          <div className="text-center">
            <Upload className="h-12 w-12 text-white mb-2 mx-auto animate-bounce-subtle" />
            <h1 className="text-3xl font-bold text-white">Upload Files</h1>
            <p className="text-indigo-100 mt-1">Securely store and share your files</p>
          </div>
        </div>
        
        {/* Main content */}
        <div className="p-6">
          <div 
            className={`border-2 rounded-lg p-8 text-center transition-all duration-300 mb-6 ${
              isDragging 
                ? 'border-indigo-400 bg-indigo-50 border-dashed scale-105' 
                : 'border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/30'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              className="hidden" 
              multiple
            />
            <div className="flex flex-col items-center justify-center gap-2">
              <div className={`rounded-full bg-indigo-100 p-4 mb-2 transition-all duration-300 ${isDragging ? 'bg-indigo-200 scale-110' : ''}`}>
                <Upload className="h-8 w-8 text-indigo-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-800">Drag & Drop Files</h3>
              <p className="text-gray-500 text-sm mb-4">or</p>
              <button 
                onClick={handleFileSelect}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-6 rounded-md shadow-sm transition-all duration-300 hover:shadow-md transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-opacity-50"
              >
                Browse Files
              </button>
            </div>
          </div>
          
          {/* Selected files display */}
          {selectedFiles.length > 0 && (
            <div className={`w-full mt-4 transition-all duration-500 transform ${animateEntry ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-semibold text-gray-800">Selected Files</h3>
                <span className="text-sm text-indigo-600 font-medium">{selectedFiles.length} file(s)</span>
              </div>
              
              <ul className="bg-gray-50 rounded-lg divide-y divide-gray-200 border border-gray-200 overflow-y-auto max-h-60 shadow-inner">
                {selectedFiles.map((file, index) => (
                  <li 
                    key={index} 
                    className="py-3 px-4 hover:bg-gray-100 transition-colors duration-200"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="bg-indigo-100 rounded-md p-2 mr-3">
                          <File className="h-4 w-4 text-indigo-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-800 truncate max-w-xs">{file.name}</p>
                          <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(2)} KB</p>
                        </div>
                      </div>
                      {getStatusIndicator(file.name)}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {/* Transfer button section */}
          <div className="mt-6 flex justify-center">
            <button 
              onClick={openTransferForm}
              className="flex items-center bg-gradient-to-r from-indigo-500 to-indigo-600 text-white text-lg font-medium py-3 px-8 rounded-md shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-opacity-50 transition-all duration-300 transform hover:-translate-y-0.5 hover:scale-105"
            >
              <span>Transfer Files</span>
            </button>
          </div>
        </div>
      </div>
      
      {/* TransferForm Modal with animation */}
      {showTransferForm && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50 transition-opacity duration-300">
          <div 
            className="bg-white rounded-xl shadow-2xl max-w-lg w-full m-4 transform transition-all duration-300 animate-modal-entry"
          >
            <TransferForm onClose={closeTransferForm} />
          </div>
        </div>
      )}

      {/* CSS for custom animations */}
      <style jsx>{`
        @keyframes bounce-subtle {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
        
        @keyframes modal-entry {
          0% { opacity: 0; transform: scale(0.9); }
          70% { opacity: 1; transform: scale(1.05); }
          100% { opacity: 1; transform: scale(1); }
        }
        
        .animate-bounce-subtle {
          animation: bounce-subtle 2s infinite ease-in-out;
        }
        
        .animate-modal-entry {
          animation: modal-entry 0.4s forwards ease-out;
        }
      `}</style>
    </div>
  );
};

export default Dashboard;