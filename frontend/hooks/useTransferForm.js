import { useState } from 'react';

export const useTransferForm = () => {
  const [showTransferForm, setShowTransferForm] = useState(false);

  const openTransferForm = () => {
    setShowTransferForm(true);
  };

  const closeTransferForm = () => {
    setShowTransferForm(false);
  };

  return {
    showTransferForm,
    openTransferForm,
    closeTransferForm
  };
}; 