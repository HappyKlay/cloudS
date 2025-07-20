import React from 'react';
import { Mail } from 'lucide-react';

const EmailRequestForConfirmationForm = ({ email }) => {
  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl p-8 max-w-md w-full text-center">
        <Mail className="w-12 h-12 text-blue-500 mx-auto mb-4" />
        <p className="text-gray-700 mb-6">
          Confirm your registration by clicking on the link in the email you receive.
          <br />
          <span className="font-medium">{email}</span>
        </p>
      </div>
    </div>
  );
};

export default EmailRequestForConfirmationForm;