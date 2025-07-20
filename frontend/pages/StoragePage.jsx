import React, { useState, useEffect, useRef } from 'react';
import { Search, Filter, MoreVertical, Download, Share, Trash, FileText, Image, File, Folder, X, ChevronDown, ChevronUp, CloudOff, RefreshCcw } from 'lucide-react';
import TransferForm from '../components/TransferForm';
import { useFiles } from '../hooks/useFiles';
import { useFileFilters } from '../hooks/useFileFilters';
import { useMenuState } from '../hooks/useMenuState';
import { useAuth } from '../hooks/useAuth';

// File type mapping for icons
const FILE_TYPES = [
  { id: 1, name: 'Documents', icon: <FileText className="w-5 h-5 text-blue-500" />, extensions: ['docx', 'doc', 'txt'] },
  { id: 2, name: 'Tables', icon: <File className="w-5 h-5 text-green-500" />, extensions: ['xlsx', 'xls', 'csv'] },
  { id: 3, name: 'Presentations', icon: <File className="w-5 h-5 text-yellow-500" />, extensions: ['pptx', 'ppt'] },
  { id: 4, name: 'Images', icon: <Image className="w-5 h-5 text-pink-500" />, extensions: ['jpg', 'jpeg', 'png', 'gif'] },
  { id: 5, name: 'PDF files', icon: <FileText className="w-5 h-5 text-red-500" />, extensions: ['pdf'] },
  { id: 6, name: 'Video', icon: <File className="w-5 h-5 text-red-500" />, extensions: ['mp4', 'avi', 'mov', 'wmv'] },
  { id: 7, name: 'Archives (ZIP)', icon: <File className="w-5 h-5 text-gray-500" />, extensions: ['zip', 'rar', '7z'] },
  { id: 8, name: 'Audio file', icon: <File className="w-5 h-5 text-orange-500" />, extensions: ['mp3', 'wav', 'ogg'] },
  { id: 9, name: 'Forms', icon: <File className="w-5 h-5 text-indigo-500" />, extensions: [] },
  { id: 10, name: 'Vids files', icon: <File className="w-5 h-5 text-purple-500" />, extensions: [] },
  { id: 11, name: 'Drawings', icon: <Image className="w-5 h-5 text-blue-300" />, extensions: [] },
];


// Utility functions
const formatFileSize = (bytes) => {
  if (!bytes || bytes <= 0) return "0 B";
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return (bytes / Math.pow(1024, i)).toFixed(1) + ' ' + units[i];
};

const getFileIcon = (fileName) => {
  if (!fileName.includes('.')) {
    return <Folder className="w-5 h-5 text-indigo-500" />;
  }
  
  const extension = fileName.split('.').pop().toLowerCase();
  
  for (const type of FILE_TYPES) {
    if (type.extensions.includes(extension)) {
      return type.icon;
    }
  }
  
  return <File className="w-5 h-5 text-indigo-500" />;
};

// Component for the context menu
const FileContextMenu = ({ position, isOpen, onClose, onDownload, onShare, onDelete, isDownloading, isDeleting, selectedFileId }) => {
  if (!isOpen) return null;
  
  return (
    <div 
      className="absolute bg-white rounded-lg shadow-xl py-1 z-50 border border-gray-200 w-44 transform transition-all duration-200 animate-fade-in-up"
      style={{ top: `${position.top}px`, left: `${position.left}px` }}
      onClick={(e) => e.stopPropagation()}
    >
      <button 
        onClick={onDownload}
        disabled={isDownloading}
        className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 flex items-center disabled:opacity-50 transition-colors duration-150"
      >
        {isDownloading ? (
          <>
            <span className="inline-block animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-indigo-600 mr-2"></span>
            <span>Downloading...</span>
          </>
        ) : (
          <>
            <Download className="h-4 w-4 mr-2 text-indigo-500" />
            <span>Download</span>
          </>
        )}
      </button>
      <button 
        onClick={onShare}
        className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 flex items-center transition-colors duration-150"
      >
        <Share className="h-4 w-4 mr-2 text-indigo-500" />
        <span>Share</span>
      </button>
      <button 
        onClick={onDelete}
        disabled={isDeleting}
        className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-red-50 hover:text-red-700 flex items-center disabled:opacity-50 transition-colors duration-150"
      >
        {isDeleting ? (
          <>
            <span className="inline-block animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-red-500 mr-2"></span>
            <span>Deleting...</span>
          </>
        ) : (
          <>
            <Trash className="h-4 w-4 mr-2 text-red-500" />
            <span>Delete</span>
          </>
        )}
      </button>
    </div>
  );
};

// Component for filter menus
const FilterMenu = ({ isOpen, position, items, onItemClick, selectedItem }) => {
  if (!isOpen) return null;
  
  return (
    <div 
      className="filter-menu absolute bg-white rounded-lg shadow-xl py-1 z-10 border border-gray-200 w-56 max-h-80 overflow-y-auto transform transition-all duration-200 animate-fade-in-up"
      style={{ top: `${position.top}px`, left: `${position.left}px` }}
    >
      {items.map(item => (
        <button 
          key={item.id}
          className={`w-full text-left px-4 py-2.5 text-sm hover:bg-indigo-50 flex items-center group transition-colors duration-150 ${selectedItem?.id === item.id ? 'bg-indigo-100 text-indigo-700 font-medium' : 'text-gray-700'}`}
          onClick={() => onItemClick(item)}
        >
          {item.icon && (
            <span className="mr-3 group-hover:scale-110 transition-transform duration-200">
              {item.icon}
            </span>
          )}
          {item.avatar && <span className="mr-3 text-lg group-hover:scale-110 transition-transform duration-200">{item.avatar}</span>}
          <span>{item.name}</span>
          {selectedItem?.id === item.id && (
            <span className="ml-auto">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="https://www.w3.org/2000/svg">
                <path d="M6.00039 10.7814L3.21895 8.00001L2.27344 8.9455L6.00039 12.6724L13.7274 4.94539L12.7819 3.99989L6.00039 10.7814Z" fill="#4F46E5"/>
              </svg>
            </span>
          )}
        </button>
      ))}
    </div>
  );
};

// Empty state component
const EmptyState = ({ searchTerm, hasFilters }) => (
  <div className="flex flex-col items-center justify-center py-16 px-4">
    <div className="bg-indigo-100 p-4 rounded-full mb-4">
      <CloudOff className="h-12 w-12 text-indigo-500" />
    </div>
    {searchTerm || hasFilters ? (
      <>
        <h3 className="text-xl font-bold text-gray-800 mb-2">No files found</h3>
        <p className="text-gray-600 text-center max-w-md mb-4">
          We couldn't find any files matching your search or filters. Try adjusting your search term or clearing filters.
        </p>
      </>
    ) : (
      <>
        <h3 className="text-xl font-bold text-gray-800 mb-2">No files in your storage</h3>
        <p className="text-gray-600 text-center max-w-md mb-4">
          Upload your first file from the dashboard or drag and drop files here to get started.
        </p>
      </>
    )}
  </div>
);

const StoragePage = () => {
  const { userAuthKey } = useAuth();
  const [showTransferForm, setShowTransferForm] = useState(false);
  const [animate, setAnimate] = useState(false);
  const [updateAnimation, setUpdateAnimation] = useState(false);
  const previousFilesCountRef = useRef(0);

  useEffect(() => {
    // Scroll to top when component mounts
    window.scrollTo(0, 0);
    setTimeout(() => setAnimate(true), 100);
  }, []);

  const {
    files,
    loading,
    error,
    hasMoreFiles,
    totalFiles,
    loadingMore,
    downloadingFileId,
    deletingFileId,
    loadMoreFiles,
    handleDownload,
    handleDelete,
    startPolling,
    stopPolling,
    isPolling
  } = useFiles(userAuthKey);

  // Effect to detect when files change due to polling
  useEffect(() => {
    if (files.length > 0 && previousFilesCountRef.current > 0 && files.length !== previousFilesCountRef.current) {
      // Play update animation when files count changes
      setUpdateAnimation(true);
      setTimeout(() => setUpdateAnimation(false), 1500);
    }
    previousFilesCountRef.current = files.length;
  }, [files.length]);

  const {
    searchTerm,
    sizeOrder,
    selectedTypeFilter,
    selectedOwnerFilter,
    filteredFiles,
    handleSearchChange,
    handleSizeToggle,
    handleTypeFilterSelect,
    handleOwnerFilterSelect,
    clearFilters
  } = useFileFilters(files);

  const {
    menuOpen,
    menuPosition,
    selectedFileId,
    choosedFile,
    typeFilterOpen,
    nameFilterOpen,
    typeFilterPosition,
    nameFilterPosition,
    handleMenuOpen,
    handleMenuClose,
    handleTypeFilterToggle,
    handleNameFilterToggle
  } = useMenuState();

  const openTransferForm = () => setShowTransferForm(true);
  const closeTransferForm = () => setShowTransferForm(false);

  const handleShare = () => {
    openTransferForm();
    handleMenuClose();
  };

  const hasFilters = !!selectedTypeFilter || !!selectedOwnerFilter || !!sizeOrder;

  return (
    <div className="w-full bg-gray-50 min-h-screen pt-20 pb-8 px-4 sm:px-6 transition-opacity duration-500">
      <div className="max-w-6xl mx-auto">
        {/* Compact Header with Search Bar Integrated */}
        <div className={`mb-6 transform transition-all duration-700 ease-out ${animate ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
          <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-50 via-white to-indigo-50 shadow-sm border border-indigo-100">
            <div className="flex flex-col sm:flex-row sm:items-center">
              <div className="flex items-center justify-center sm:justify-start mb-3 sm:mb-0">
                <div className="bg-indigo-100 p-2 rounded-full mr-3 animate-float">
                  <Folder className="h-6 w-6 text-indigo-600" />
                </div>
                <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-indigo-500">Your Cloud Storage</h1>
              </div>
              
              {/* Search Bar - Integrated */}
              <div className="relative flex-1 group max-w-2xl mx-auto sm:mx-0 sm:ml-4">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-gray-400 group-focus-within:text-indigo-500 transition-colors duration-200" />
                </div>
                <input
                  type="text"
                  className="block w-full pl-9 pr-9 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white placeholder-gray-400 transition-all duration-200 text-sm"
                  placeholder="Search files by name..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                />
                {searchTerm ? (
                  <button 
                    onClick={() => handleSearchChange({ target: { value: '' } })}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors duration-200"
                  >
                    <X className="h-4 w-4" />
                  </button>
                ) : (
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-300 pointer-events-none">
                    <kbd className="inline-flex items-center px-1 border border-gray-300 rounded text-xs font-medium bg-gray-50">
                      ⌘K
                    </kbd>
                  </div>
                )}
              </div>
            </div>
            <div className="text-gray-600 text-sm mt-2 hidden sm:flex justify-between items-center">
              <p>Securely manage, organize and share your files with end-to-end encryption</p>
              <div className="flex items-center">
                <button 
                  onClick={() => isPolling ? stopPolling() : startPolling()}
                  className={`ml-2 p-1.5 rounded-full transition-all duration-200 flex items-center text-xs ${
                    isPolling 
                      ? 'text-indigo-600 hover:bg-indigo-100' 
                      : 'text-gray-500 hover:bg-gray-200'
                  }`}
                  title={isPolling ? "Auto-updates enabled" : "Auto-updates disabled"}
                >
                  <RefreshCcw className={`h-3.5 w-3.5 mr-1 ${isPolling ? 'animate-spin-slow' : ''}`} />
                  {isPolling ? 'Auto-updating' : 'Updates paused'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Filter Buttons */}
        <div className={`flex flex-wrap gap-2 mb-6 transform transition-all duration-700 delay-200 ease-out ${animate ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
          <button 
            className={`filter-button flex items-center px-4 py-2 border rounded-xl text-sm font-medium transition-all duration-200 ${
              selectedTypeFilter 
                ? 'bg-indigo-100 text-indigo-700 border-indigo-300 shadow-sm' 
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
            onClick={handleTypeFilterToggle}
          >
            <Filter className="h-4 w-4 mr-2" />
            <span>{selectedTypeFilter ? selectedTypeFilter.name : "File Type"}</span>
            <ChevronDown className="h-4 w-4 ml-2" />
          </button>

          <button 
            className={`filter-button flex items-center px-4 py-2 border rounded-xl text-sm font-medium transition-all duration-200 ${
              sizeOrder 
                ? 'bg-indigo-100 text-indigo-700 border-indigo-300 shadow-sm' 
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
            onClick={handleSizeToggle}
          >
            <span>Size</span>
            {sizeOrder === 'asc' && <ChevronUp className="h-4 w-4 ml-2" />}
            {sizeOrder === 'desc' && <ChevronDown className="h-4 w-4 ml-2" />}
            {!sizeOrder && <svg className="h-4 w-4 ml-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
            </svg>}
          </button>

          {(hasFilters) && (
            <button 
              className="flex items-center px-4 py-2 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-all duration-200"
              onClick={clearFilters}
            >
              <X className="h-4 w-4 mr-2" />
              Clear Filters
            </button>
          )}
        </div>

        {/* Filter Menus */}
        <FilterMenu 
          isOpen={typeFilterOpen}
          position={typeFilterPosition}
          items={FILE_TYPES}
          onItemClick={handleTypeFilterSelect}
          selectedItem={selectedTypeFilter}
        />
        
        {/* Files Table Container */}
        <div className={`bg-white rounded-xl shadow-sm overflow-hidden transform transition-all duration-700 delay-300 ease-out ${animate ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'} ${updateAnimation ? 'animate-update-flash' : ''} hover:shadow-md transition-shadow duration-300`}>
          {loading ? (
            <div className="py-16 text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-r-2 border-indigo-600 mb-4"></div>
              <p className="text-gray-600 font-medium">Loading your files...</p>
            </div>
          ) : error ? (
            <div className="py-16 text-center">
              <div className="inline-block bg-red-100 p-3 rounded-full mb-4">
                <X className="h-8 w-8 text-red-500" />
              </div>
              <p className="text-red-600 font-medium mb-2">Something went wrong</p>
              <p className="text-sm text-gray-600">{error}</p>
            </div>
          ) : filteredFiles.length === 0 ? (
            <EmptyState searchTerm={searchTerm} hasFilters={hasFilters} />
          ) : (
            <>
              <div className="overflow-x-auto">
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
                  <tbody>
                    {filteredFiles.map((file, index) => (
                      <tr 
                        key={file.id} 
                        className={`hover:bg-indigo-50/30 transition-colors duration-150 group ${
                          !previousFilesCountRef.current || file.id > 0 ? '' : 'animate-highlight-row'
                        }`}
                        style={{ 
                          animationDelay: `${index * 50}ms`,
                          animation: animate ? 'fadeInRow 0.5s ease-out forwards' : 'none'
                        }}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 bg-indigo-100 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                              {getFileIcon(file.fileName)}
                            </div>
                            <div className="ml-3">
                              <div className="text-sm font-medium text-gray-900 group-hover:text-indigo-700 transition-colors duration-150">
                                {file.fileName}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 group-hover:text-gray-700 transition-colors duration-150">
                          {formatFileSize(file.fileSizeBytes)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 group-hover:text-gray-700 transition-colors duration-150">
                          {file.owner}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={(e) => handleMenuOpen(e, file.id, files)}
                            className="text-gray-400 hover:text-indigo-600 focus:outline-none rounded-full p-1 hover:bg-indigo-100 transition-all duration-150"
                            aria-label="File actions"
                          >
                            <MoreVertical className="h-5 w-5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {/* Load More Button */}
              {hasMoreFiles && (
                <div className="py-5 text-center border-t border-gray-100">
                  <button 
                    onClick={loadMoreFiles}
                    disabled={loadingMore}
                    className="px-5 py-2 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white text-sm font-medium rounded-lg hover:from-indigo-600 hover:to-indigo-700 shadow-sm hover:shadow transition-all duration-200 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50 transform hover:-translate-y-0.5"
                  >
                    {loadingMore ? (
                      <>
                        <span className="inline-block animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></span>
                        Loading more files...
                      </>
                    ) : (
                      'Load More Files'
                    )}
                  </button>
                </div>
              )}
              
              {/* File Count */}
              <div className="py-3 px-6 bg-gray-50 text-sm text-gray-600 border-t border-gray-100">
                <span className="font-medium">{filteredFiles.length}</span> of <span className="font-medium">{totalFiles}</span> files
              </div>
            </>
          )}
        </div>
      </div>

      {/* Context Menu */}
      <FileContextMenu 
        position={menuPosition}
        isOpen={menuOpen}
        onClose={handleMenuClose}
        onDownload={() => handleDownload(selectedFileId)}
        onShare={handleShare}
        onDelete={() => handleDelete(selectedFileId)}
        isDownloading={downloadingFileId === selectedFileId}
        isDeleting={deletingFileId === selectedFileId}
        selectedFileId={selectedFileId}
      />

      {/* Transfer Form */}
      {showTransferForm && (
        <TransferForm onClose={closeTransferForm} userFiles={choosedFile} />
      )}

      {/* Custom animations */}
      <style jsx>{`
        @keyframes fadeInRow {
          from { opacity: 0; transform: translateX(-10px); }
          to { opacity: 1; transform: translateX(0); }
        }
        
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes float {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
          100% { transform: translateY(0px); }
        }
        
        @keyframes update-flash {
          0% { box-shadow: 0 0 0 0 rgba(79, 70, 229, 0.2); }
          50% { box-shadow: 0 0 0 8px rgba(79, 70, 229, 0.2); }
          100% { box-shadow: 0 0 0 0 rgba(79, 70, 229, 0); }
        }
        
        @keyframes highlight-row {
          0% { background-color: rgba(79, 70, 229, 0.2); }
          100% { background-color: transparent; }
        }
        
        .animate-fade-in-up {
          animation: fadeInUp 0.3s ease-out forwards;
        }
        
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        
        .animate-update-flash {
          animation: update-flash 1.5s ease-in-out;
        }
        
        .animate-highlight-row {
          animation: highlight-row 2s ease-out forwards;
        }
        
        .animate-spin-slow {
          animation: spin 3s linear infinite;
        }
        
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default StoragePage;