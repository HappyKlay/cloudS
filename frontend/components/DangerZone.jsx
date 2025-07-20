import React from 'react';
import { AlertTriangle, Trash2, FileX, UserX, CheckCircle, ShieldOff } from 'lucide-react';

const DeleteProgress = ({ step }) => {
  const steps = [
    { id: 'files', label: 'Deleting user files', icon: <FileX className="h-5 w-5 text-red-500" /> },
    { id: 'account', label: 'Deleting account data', icon: <UserX className="h-5 w-5 text-red-500" /> },
    { id: 'complete', label: 'Account deletion complete', icon: <CheckCircle className="h-5 w-5 text-green-500" /> }
  ];
  
  return (
    <div className="mt-4 space-y-3">
      {steps.map((s) => (
        <div 
          key={s.id} 
          className={`flex items-center ${step === s.id ? 'text-red-600 font-medium' : step === 'complete' && s.id === 'complete' ? 'text-green-600 font-medium' : 'text-gray-400'}`}
        >
          {step === s.id && step !== 'complete' ? (
            <span className="animate-ping h-3 w-3 rounded-full bg-red-500 mr-3"></span>
          ) : step === 'complete' && s.id === 'complete' ? (
            s.icon
          ) : (
            <span className={`h-3 w-3 rounded-full ${s.id === 'complete' ? 'bg-green-400' : 'bg-gray-300'} mr-3 ${(step === 'files' && s.id === 'files') || (step === 'account' && (s.id === 'files' || s.id === 'account')) || step === 'complete' ? 'opacity-100' : 'opacity-40'}`}></span>
          )}
          <span className="ml-2">{s.label}</span>
        </div>
      ))}
      
      {step === 'complete' && (
        <p className="text-green-600 text-sm font-medium mt-2 animate-pulse-slow">
          Redirecting to login page...
        </p>
      )}
    </div>
  );
};

const DangerZone = ({
  showDeleteConfirm,
  deleteConfirmText,
  setShowDeleteConfirm,
  handleDeleteConfirmChange,
  resetDeleteConfirm,
  handleDeleteAccount,
  isDeleting,
  deletionStep,
  deletionError
}) => {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden">
      <div className="px-6 py-4 bg-gradient-to-r from-red-50 to-white border-b border-red-100">
        <div className="flex items-center">
          <div className="bg-red-100 p-2 rounded-lg mr-3">
            <ShieldOff className="h-5 w-5 text-red-600" />
          </div>
          <div>
            <h2 className="text-lg font-medium text-red-800">Danger Zone</h2>
            <p className="text-sm text-red-600/80 mt-1">Actions in this area can't be undone</p>
          </div>
        </div>
      </div>
      
      <div className="p-6">
        <h3 className="text-base font-medium text-gray-900 mb-2">Delete Account</h3>
        <p className="text-sm text-gray-600 mb-4">
          Once you delete your account, all your files and data will be permanently removed. This action cannot be undone.
        </p>

        {deletionError && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start animate-fade-in">
            <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" />
            <div className="text-red-600 text-sm">{deletionError}</div>
          </div>
        )}

        {isDeleting ? (
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 shadow-sm animate-fade-in">
            <div className="flex items-center mb-3">
              <Trash2 className="h-5 w-5 text-red-500 mr-2" />
              <h4 className="font-medium text-gray-900">Account Deletion in Progress</h4>
            </div>
            <DeleteProgress step={deletionStep} />
          </div>
        ) : !showDeleteConfirm ? (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="inline-flex items-center justify-center py-2.5 px-4 border border-red-300 text-sm font-medium rounded-lg text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all duration-200 shadow-sm hover:shadow transform hover:-translate-y-0.5"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete Account
          </button>
        ) : (
          <div className="p-5 border border-red-200 rounded-lg bg-red-50 shadow-sm animate-fade-in">
            <div className="flex items-start mb-3">
              <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" />
              <p className="text-sm text-red-600">
                To confirm deletion, please type <span className="font-semibold">DELETE</span> below:
              </p>
            </div>
            <input
              type="text"
              value={deleteConfirmText}
              onChange={handleDeleteConfirmChange}
              className="block w-full border-red-200 rounded-lg shadow-sm focus:ring-red-500 focus:border-red-500 sm:text-sm mb-4 p-2.5 transition-all duration-200"
              placeholder="Type DELETE to confirm"
            />
            <div className="flex space-x-3">
              <button
                onClick={handleDeleteAccount}
                disabled={deleteConfirmText !== 'DELETE'}
                className="inline-flex items-center justify-center py-2.5 px-4 border border-transparent shadow-sm text-sm font-medium rounded-lg text-white bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 disabled:hover:from-red-500 disabled:hover:to-red-600"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Permanently Delete Account
              </button>
              <button
                onClick={resetDeleteConfirm}
                className="inline-flex items-center justify-center py-2.5 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
      
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(5px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes pulseSlow {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
        
        .animate-fade-in {
          animation: fadeIn 0.3s ease-out forwards;
        }
        
        .animate-pulse-slow {
          animation: pulseSlow 2s infinite ease-in-out;
        }
      `}</style>
    </div>
  );
};

export default DangerZone; 