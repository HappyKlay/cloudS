import React, { useState, useEffect } from 'react';
import { Search, Filter, MoreVertical, Download, Share, Trash, FileText, Image, File, Folder } from 'lucide-react';
import TransferForm from '../components/TransferForm';

const ProfilePage = () => {
  const [files, setFiles] = useState([
    { id: 1, name: 'Document1.docx', size: '2.5 MB', owner: 'You' },
    { id: 2, name: 'Presentation.pptx', size: '5.8 MB', owner: 'You' },
    { id: 3, name: 'Spreadsheet.xlsx', size: '1.2 MB', owner: 'John Doe' },
    { id: 4, name: 'Image.jpg', size: '3.7 MB', owner: 'You' },
    { id: 5, name: 'Image2.jpg', size: '1.2 MB', owner: 'You' },
    { id: 6, name: 'Video.mp4', size: '8.1 GB', owner: 'You' },
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const [selectedFileId, setSelectedFileId] = useState(null);
  const [choosedFile, setChoosedFile] = useState(null);
  const [showTransferForm, setShowTransferForm] = useState(false);
  const [typeFilterOpen, setTypeFilterOpen] = useState(false);
  const [nameFilterOpen, setNameFilterOpen] = useState(false);
  const [sizeFilterOpen, setSizeFilterOpen] = useState(false);
  const [typeFilterPosition, setTypeFilterPosition] = useState({ top: 0, left: 0 });
  const [nameFilterPosition, setNameFilterPosition] = useState({ top: 0, left: 0 });
  const [sizeFilterPosition, setSizeFilterPosition] = useState({ top: 0, left: 0 });
  const [sizeOrder, setSizeOrder] = useState(null); 

  const fileTypes = [
    { id: 1, name: 'Documents', icon: <FileText className="w-5 h-5 text-blue-500" /> },
    { id: 2, name: 'Tables', icon: <File className="w-5 h-5 text-green-500" /> },
    { id: 3, name: 'Presentations', icon: <File className="w-5 h-5 text-yellow-500" /> },
    { id: 4, name: 'Vids files', icon: <File className="w-5 h-5 text-purple-500" /> },
    { id: 5, name: 'Forms', icon: <File className="w-5 h-5 text-indigo-500" /> },
    { id: 6, name: 'Images', icon: <Image className="w-5 h-5 text-pink-500" /> },
    { id: 7, name: 'PDF files', icon: <FileText className="w-5 h-5 text-red-500" /> },
    { id: 8, name: 'Video', icon: <File className="w-5 h-5 text-red-500" /> },
    { id: 9, name: 'Archives (ZIP)', icon: <File className="w-5 h-5 text-gray-500" /> },
    { id: 10, name: 'Audio file', icon: <File className="w-5 h-5 text-orange-500" /> },
    { id: 11, name: 'Drawings', icon: <Image className="w-5 h-5 text-blue-300" /> },
  ];

  const owners = [
    { id: 1, name: 'You', avatar: '👤' },
    { id: 2, name: 'John Doe', avatar: '👤' },
  ];

  const handleMenuOpen = (event, fileId) => {
    event.preventDefault();
    event.stopPropagation();
    const rect = event.currentTarget.getBoundingClientRect();
    setMenuPosition({ 
      top: rect.bottom + window.scrollY,
      left: rect.right + window.scrollX - 160 
    });
    setSelectedFileId(fileId);
    const selectedFile = files.find(file => file.id === fileId);
    setChoosedFile(selectedFile ? [selectedFile] : []);
    setMenuOpen(true);
  };

  const handleMenuClose = () => {
    setMenuOpen(false);
    setSelectedFileId(null);
  };

  const handleTypeFilterToggle = (event) => {
    event.preventDefault();
    event.stopPropagation();
    const rect = event.currentTarget.getBoundingClientRect();
    setTypeFilterPosition({ 
      top: rect.bottom + window.scrollY,
      left: rect.left + window.scrollX
    });
    setTypeFilterOpen(!typeFilterOpen);
    setNameFilterOpen(false);
  };

  const handleNameFilterToggle = (event) => {
    event.preventDefault();
    event.stopPropagation();
    const rect = event.currentTarget.getBoundingClientRect();
    setNameFilterPosition({ 
      top: rect.bottom + window.scrollY,
      left: rect.left + window.scrollX
    });
    setNameFilterOpen(!nameFilterOpen);
    setTypeFilterOpen(false);
  };

  const handleSizeToggle = () => {
    setSizeOrder((prev) => {
      if (prev === null) return 'asc';
      if (prev === 'asc') return 'desc';
      return null;
    });
  };

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  const parseSize = (sizeStr) => {
    if (!sizeStr) return 0;
    const units = { 'b': 1, 'kb': 1024, 'mb': 1024**2, 'gb': 1024**3, 'tb': 1024**4 };
    const match = sizeStr.toLowerCase().replace(/ /g, '').match(/([\d.]+)(tb|gb|mb|kb|b)/);
    if (!match) return 0;
    const value = parseFloat(match[1]);
    const unit = match[2];
    return value * (units[unit] || 1);
  };

  let sortedFiles = [...files];
  if (sizeOrder === 'asc' || sizeOrder === 'desc') {
    sortedFiles.sort((a, b) => {
      const sizeA = parseSize(a.size);
      const sizeB = parseSize(b.size);
      return sizeOrder === 'asc' ? sizeA - sizeB : sizeB - sizeA;
    });
  }

  const filteredFiles = sortedFiles.filter(file => 
    file.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    file.owner.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDownload = () => {
    console.log(`Downloading file with ID: ${selectedFileId}`);
    handleMenuClose();
  };

  const handleShare = () => {
    openTransferForm();
    handleMenuClose();
  };

  const handleDelete = () => {
    setFiles(files.filter(file => file.id !== selectedFileId));
    console.log(`Deleted file with ID: ${selectedFileId}`);
    handleMenuClose();
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if ((typeFilterOpen || nameFilterOpen || menuOpen) && 
          !event.target.closest('.filter-menu') && 
          !event.target.closest('.filter-button')) {
        setTypeFilterOpen(false);
        setNameFilterOpen(false);
        if (menuOpen) {
          handleMenuClose();
        }
      }
    };
    
    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [typeFilterOpen, nameFilterOpen, menuOpen]);

  const getFileIcon = (fileName) => {
    if (!fileName.includes('.')) {
      return <Folder className="w-5 h-5 text-blue-500" />;
    }
    
    const extension = fileName.split('.').pop().toLowerCase();
    
    if (['docx', 'doc', 'txt'].includes(extension)) {
      return fileTypes.find(type => type.name === 'Documents')?.icon || <FileText className="w-5 h-5 text-blue-500" />;
    } else if (['xlsx', 'xls', 'csv'].includes(extension)) {
      return fileTypes.find(type => type.name === 'Tables')?.icon || <File className="w-5 h-5 text-green-500" />;
    } else if (['pptx', 'ppt'].includes(extension)) {
      return fileTypes.find(type => type.name === 'Presentations')?.icon || <File className="w-5 h-5 text-yellow-500" />;
    } else if (['jpg', 'jpeg', 'png', 'gif'].includes(extension)) {
      return fileTypes.find(type => type.name === 'Images')?.icon || <Image className="w-5 h-5 text-pink-500" />;
    } else if (['pdf'].includes(extension)) {
      return fileTypes.find(type => type.name === 'PDF files')?.icon || <FileText className="w-5 h-5 text-red-500" />;
    } else if (['mp4', 'avi', 'mov', 'wmv'].includes(extension)) {
      return fileTypes.find(type => type.name === 'Video')?.icon || <File className="w-5 h-5 text-red-500" />;
    } else if (['zip', 'rar', '7z'].includes(extension)) {
      return fileTypes.find(type => type.name === 'Archives (ZIP)')?.icon || <File className="w-5 h-5 text-gray-500" />;
    } else if (['mp3', 'wav', 'ogg'].includes(extension)) {
      return fileTypes.find(type => type.name === 'Audio file')?.icon || <File className="w-5 h-5 text-orange-500" />;
    } else {
      return <File className="w-5 h-5 text-blue-500" />;
    }
  };
  
  const openTransferForm = () => {
    setShowTransferForm(true);
  };

  const closeTransferForm = () => {
    setShowTransferForm(false);
  };

  return (
    <div className="w-full bg-gray-100 min-h-screen p-4 pt-24">
      {/* Search Bar */}
      <div className="w-full max-w-2xl mx-auto mb-6">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white"
            placeholder="Search in your cloud"
            value={searchTerm}
            onChange={handleSearchChange}
          />
        </div>
      </div>

      {/* Filter Buttons */}
      <div className="flex gap-2 mb-6">
        <button 
          className="filter-button flex items-center px-3 py-1.5 border border-gray-300 rounded-md text-gray-600 bg-white hover:bg-gray-50"
          onClick={handleTypeFilterToggle}
        >
          <Filter className="h-4 w-4 mr-2" />
          Type
        </button>
        <button 
          className="filter-button flex items-center px-3 py-1.5 border border-gray-300 rounded-md text-gray-600 bg-white hover:bg-gray-50"
          onClick={handleNameFilterToggle}
        >
          <Filter className="h-4 w-4 mr-2" />
          Name
        </button>
        <button 
          className="filter-button flex items-center px-3 py-1.5 border border-gray-300 rounded-md text-gray-600 bg-white hover:bg-gray-50"
          onClick={handleSizeToggle}
        >
          <Filter className="h-4 w-4 mr-2" />
          Size
          {sizeOrder === 'asc' && <span className="ml-1">↑</span>}
          {sizeOrder === 'desc' && <span className="ml-1">↓</span>}
        </button>
      </div>

      {/* Type Filter Menu */}
      {typeFilterOpen && (
        <div 
          className="filter-menu absolute bg-white rounded-md shadow-lg py-1 z-10 border border-gray-200 w-48"
          style={{ 
            top: `${typeFilterPosition.top}px`, 
            left: `${typeFilterPosition.left}px`
          }}
        >
          {fileTypes.map(type => (
            <button 
              key={type.id}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
            >
              <span className="mr-2">{type.icon}</span>
              {type.name}
            </button>
          ))}
        </div>
      )}

      {/* Name Filter Menu */}
      {nameFilterOpen && (
        <div 
          className="filter-menu absolute bg-white rounded-md shadow-lg py-1 z-10 border border-gray-200 w-48"
          style={{ 
            top: `${nameFilterPosition.top}px`, 
            left: `${nameFilterPosition.left}px`
          }}
        >
          {owners.map(owner => (
            <button 
              key={owner.id}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
            >
              <span className="mr-2 text-lg">{owner.avatar}</span>
              {owner.name}
            </button>
          ))}
        </div>
      )}

      {/* Files Table */}
      <div className="bg-white rounded-md shadow-md overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Size
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Owner
              </th>
              <th scope="col" className="relative px-6 py-3">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredFiles.length > 0 ? (
              filteredFiles.map((file) => (
                <tr key={file.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {getFileIcon(file.name)}
                      <span className="ml-2 text-sm text-gray-900">{file.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {file.size}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {file.owner}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={(e) => handleMenuOpen(e, file.id)}
                      className="text-gray-400 hover:text-gray-500 focus:outline-none"
                    >
                      <MoreVertical className="h-5 w-5" />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-sm text-gray-500">
                  No files match your search
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Context Menu */}
      {menuOpen && (
        <div 
          className="absolute bg-white rounded-md shadow-lg py-1 z-10 border border-gray-200 w-40"
          style={{ 
            top: `${menuPosition.top}px`, 
            left: `${menuPosition.left}px`
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <button 
            onClick={handleDownload}
            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
          >
            <Download className="h-4 w-4 mr-2" />
            Download
          </button>
          <button 
            onClick={handleShare}
            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
          >
            <Share className="h-4 w-4 mr-2" />
            Share
          </button>
          <button 
            onClick={handleDelete}
            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
          >
            <Trash className="h-4 w-4 mr-2" />
            Delete
          </button>
        </div>
      )}
      {showTransferForm && (
        <TransferForm onClose={closeTransferForm} userFiles={choosedFile} />
      )}
    </div>
  );
};

export default ProfilePage;