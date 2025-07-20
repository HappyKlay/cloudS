import { useState, useEffect } from 'react';

export const useMenuState = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const [selectedFileId, setSelectedFileId] = useState(null);
  const [choosedFile, setChoosedFile] = useState(null);
  
  const [typeFilterOpen, setTypeFilterOpen] = useState(false);
  const [nameFilterOpen, setNameFilterOpen] = useState(false);
  const [typeFilterPosition, setTypeFilterPosition] = useState({ top: 0, left: 0 });
  const [nameFilterPosition, setNameFilterPosition] = useState({ top: 0, left: 0 });

  const handleMenuOpen = (event, fileId, files) => {
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

  useEffect(() => {
    const handleClickOutside = (event) => {
      if ((typeFilterOpen || nameFilterOpen || menuOpen) && 
          !event.target.closest('.filter-menu') && 
          !event.target.closest('.filter-button')) {
        setTypeFilterOpen(false);
        setNameFilterOpen(false);
        if (menuOpen) handleMenuClose();
      }
    };
    
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [typeFilterOpen, nameFilterOpen, menuOpen]);

  return {
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
  };
}; 