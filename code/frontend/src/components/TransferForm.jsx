import React, { useState } from 'react'

const TransferForm = ({ onClose, userFiles = [] }) => {
  const [username, setUsername] = useState('');
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [searchText, setSearchText] = useState('');

  const handleUsernameChange = (e) => {
    setUsername(e.target.value);
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

  const filteredFiles = userFiles.filter(file => 
    file.name.toLowerCase().includes(searchText.toLowerCase())
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Transfer files to:', username, 'Files:', selectedFiles);
    // TODO: Implement actual file transfer logic
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl p-8 max-w-md w-full">
        <h2 className="text-2xl font-bold mb-6">Transfer Files</h2>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label htmlFor="username" className="block text-gray-700 mb-2">Recipient Username</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={handleUsernameChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter username"
              required
            />
          </div>

          <div className="mb-6">
            <label className="block text-gray-700 mb-2">Select Files to Transfer</label>
            <div className="mb-3">
              <input
                type="text"
                value={searchText}
                onChange={handleSearchChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Search files..."
              />
            </div>
            {filteredFiles.length > 0 ? (
              <div className="max-h-60 overflow-y-auto border border-gray-300 rounded-lg p-2">
                {filteredFiles.map((file) => (
                  <div key={file.id} className="flex items-center p-2 hover:bg-gray-100 rounded">
                    <input
                      type="checkbox"
                      id={`file-${file.id}`}
                      checked={selectedFiles.includes(file.id)}
                      onChange={() => handleFileSelect(file.id)}
                      className="mr-3"
                    />
                    <label htmlFor={`file-${file.id}`} className="cursor-pointer flex-1">
                      {file.name}
                    </label>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No files found matching your search</p>
            )}
          </div>

          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-400"
              disabled={!username || selectedFiles.length === 0}
            >
              Transfer Files
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default TransferForm