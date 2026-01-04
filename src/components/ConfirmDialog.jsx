import React from "react";
import { AlertTriangle, X, Loader2 } from "lucide-react";

export default function ConfirmDialog({ 
  title, 
  message, 
  onConfirm, 
  onCancel, 
  onClose, // Support both onCancel and onClose
  confirmText = "Confirm", 
  cancelText = "Cancel",
  confirmColor = "blue",
  isLoading = false,
  isDangerous = false,
  isOpen = true // Support isOpen prop
}) {
  // Use onClose if provided, otherwise use onCancel
  const handleCancel = onClose || onCancel;
  
  // Don't render if not open
  if (!isOpen) return null;
  // Use confirmColor prop, or derive from isDangerous
  const color = confirmColor || (isDangerous ? 'red' : 'blue');
  
  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50" onClick={handleCancel}></div>
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg elevation-5 max-w-md w-full p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                color === 'red' ? 'bg-red-100' : 'bg-blue-100'
              }`}>
                <AlertTriangle className={`w-6 h-6 ${
                  color === 'red' ? 'text-red-600' : 'text-blue-600'
                }`} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">{title}</h3>
            </div>
            <button 
              onClick={handleCancel} 
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              disabled={isLoading}
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
          
          <p className="text-gray-600 dark:text-gray-400 mb-6">{message}</p>
          
          <div className="flex gap-3">
            <button
              onClick={handleCancel}
              disabled={isLoading}
              className="flex-1 py-3 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              disabled={isLoading}
              className={`flex-1 py-3 rounded-lg text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${
                color === 'red' 
                  ? 'bg-red-600 hover:bg-red-700' 
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              {isLoading ? 'Processing...' : confirmText}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
