import React, { useRef, useState } from 'react'
import TransferForm from '../components/TransferForm'

const Dashboard = () => {
  const fileInputRef = useRef(null);
  const [showTransferForm, setShowTransferForm] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  
  const mockUserFiles = [
    { id: '1', name: 'document.pdf' },
    { id: '2', name: 'image.jpg' },
    { id: '3', name: 'spreadsheet.xlsx' }
  ];

  const handleFileSelect = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = (event) => {
    const files = event.target.files;
    if (files.length > 0) {
      const newFiles = Array.from(files).map(file => ({
        name: file.name,
        size: file.size,
        type: file.type,
        file: file
      }));
      setSelectedFiles([...selectedFiles, ...newFiles]);
      event.target.value = '';
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const newFiles = Array.from(files).map(file => ({
        name: file.name,
        size: file.size,
        type: file.type,
        file: file
      }));
      setSelectedFiles([...selectedFiles, ...newFiles]);
    }
  };

  const openTransferForm = () => {
    setShowTransferForm(true);
  };

  const closeTransferForm = () => {
    setShowTransferForm(false);
  };

  return (
    <div className="h-[94vh] w-full flex items-center justify-center bg-[#f4f4f7]">
      <div 
        className={`bg-white rounded-xl shadow-xl px-8 py-12 min-w-[400px] flex flex-col items-center
          ${isDragging ? 'border-4 border-blue-400 border-dashed' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <h1 className="text-4xl font-bold text-[#222] m-0">Upload file</h1>
        <p className="mt-4 mb-8 text-gray-600 text-lg text-center">
          Easily upload files to your personal cloud storage
        </p>
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileChange} 
          className="hidden" 
          multiple
        />
        <button 
          onClick={handleFileSelect}
          className="bg-blue-500 hover:bg-blue-600 text-white text-2xl font-semibold py-5 px-12 rounded-xl shadow-md mb-3 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-50 transition"
        >
          Select files
        </button>
        <span className="text-gray-500 text-base mt-1">or drop files here</span>
        
        {selectedFiles.length > 0 && (
          <div className="w-full mt-6 max-h-60 overflow-y-auto">
            <h3 className="text-lg font-semibold mb-2">Selected Files:</h3>
            <ul className="bg-gray-50 rounded-lg p-3">
              {selectedFiles.map((file, index) => (
                <li key={index} className="py-2 px-3 border-b border-gray-200 last:border-b-0">
                  <div className="flex items-center">
                    <span className="text-blue-500 mr-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </span>
                    <span className="font-medium">{file.name}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
        
        <div className="w-full border-t border-gray-200 my-8"></div>
        
        <button 
          onClick={openTransferForm}
          className="bg-green-500 hover:bg-green-600 text-white text-lg font-semibold py-3 px-8 rounded-xl shadow-md focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-opacity-50 transition"
        >
          Transfer Files to Users
        </button>
      </div>
      
      {showTransferForm && (
        <TransferForm onClose={closeTransferForm} userFiles={mockUserFiles} />
      )}
    </div>
  )
}

export default Dashboard