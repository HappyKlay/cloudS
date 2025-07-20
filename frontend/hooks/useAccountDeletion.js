import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export const useAccountDeletion = () => {
  const navigate = useNavigate();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [deletionStep, setDeletionStep] = useState(null);
  const [deletionError, setDeletionError] = useState(null);

  const handleDeleteConfirmChange = (e) => {
    setDeleteConfirmText(e.target.value);
  };

  const resetDeleteConfirm = () => {
    setShowDeleteConfirm(false);
    setDeleteConfirmText('');
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') {
      return;
    }

    try {
      setIsDeleting(true);
      setDeletionError(null);
      
      // Step 1: Delete all user files
      setDeletionStep('files');
      const deleteFilesResponse = await fetch('http://localhost:8080/api/users/delete-files', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });
      
      if (!deleteFilesResponse.ok) {
        throw new Error('Failed to delete user files');
      }
      
      // Step 2: Delete the account
      setDeletionStep('account');
      const deleteAccountResponse = await fetch('http://localhost:8080/api/users/delete-account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });
      
      if (!deleteAccountResponse.ok) {
        throw new Error('Failed to delete user account');
      }
      
      // Clear local storage
      localStorage.removeItem('userAuthKey');
      localStorage.removeItem('rememberEmail');
      
      // Dispatch auth change event to update UI
      window.dispatchEvent(new Event('authChange'));
      
      // Redirect to login page after showing complete status
      setDeletionStep('complete');
      setTimeout(() => {
        // Make sure the UI updates by forcing a render cycle
        document.body.style.cursor = 'wait'; 
        setTimeout(() => {
          document.body.style.cursor = '';
          navigate('/login');
          setIsDeleting(false);
        }, 100);
      }, 1500);
      
    } catch (error) {
      console.error('Account deletion error:', error);
      setDeletionError(error.message || 'An error occurred during account deletion');
      setIsDeleting(false);
    }
  };

  return {
    showDeleteConfirm,
    deleteConfirmText,
    isDeleting,
    deletionStep,
    deletionError,
    setShowDeleteConfirm,
    handleDeleteConfirmChange,
    resetDeleteConfirm,
    handleDeleteAccount
  };
}; 