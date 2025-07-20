import { useState, useMemo } from 'react';

export const useFileFilters = (files) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sizeOrder, setSizeOrder] = useState(null);
  const [selectedTypeFilter, setSelectedTypeFilter] = useState(null);
  const [selectedOwnerFilter, setSelectedOwnerFilter] = useState(null);

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  const handleSizeToggle = () => {
    setSizeOrder((prev) => {
      if (prev === null) return 'asc';
      if (prev === 'asc') return 'desc';
      return null;
    });
  };

  const handleTypeFilterSelect = (type) => {
    setSelectedTypeFilter(prevType => prevType?.id === type.id ? null : type);
  };

  const handleOwnerFilterSelect = (owner) => {
    setSelectedOwnerFilter(prevOwner => prevOwner?.id === owner.id ? null : owner);
  };

  const clearFilters = () => {
    setSelectedTypeFilter(null);
    setSelectedOwnerFilter(null);
    setSizeOrder(null);
  };

  const filteredFiles = useMemo(() => {
    return files
      .filter(file => {
        if (searchTerm && 
            !file.fileName.toLowerCase().includes(searchTerm.toLowerCase()) && 
            !file.owner.toLowerCase().includes(searchTerm.toLowerCase())) {
          return false;
        }

        if (selectedTypeFilter) {
          const extension = file.fileName.split('.').pop().toLowerCase();
          if (!selectedTypeFilter.extensions.includes(extension)) {
            return false;
          }
        }

        if (selectedOwnerFilter && selectedOwnerFilter.name !== 'You') {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sizeOrder === 'asc') return a.fileSizeBytes - b.fileSizeBytes;
        if (sizeOrder === 'desc') return b.fileSizeBytes - a.fileSizeBytes;
        return 0;
      });
  }, [files, searchTerm, selectedTypeFilter, selectedOwnerFilter, sizeOrder]);

  return {
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
  };
}; 