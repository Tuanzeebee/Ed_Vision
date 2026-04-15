import { useEffect } from 'react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmButtonClass?: string;
  onConfirm: () =>void;
  onCancel: () =>void;
  type?: 'danger'| 'warning'| 'info'| 'success';
  hideCancel?: boolean;
}

export default function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmText = 'Đồng ý',
  cancelText = 'Hủy bỏ',
  confirmButtonClass,
  onConfirm,
  onCancel,
  type = 'warning',
  hideCancel = false
}: ConfirmDialogProps) {
  // Handle ESC key to close
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape'&& isOpen) {
        onCancel();
      }
    };
    
    window.addEventListener('keydown', handleEsc);
    return () =>window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onCancel]);

  // Prevent body scroll when dialog is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  // Icon based on type
  const getIcon = () => {
    switch (type) {
      case 'danger':
        return (
          <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-100">
            <svg className="h-6 w-6 text-red-600"fill="none"viewBox="0 0 24 24"strokeWidth="2"stroke="currentColor">
              <path strokeLinecap="round"strokeLinejoin="round"d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"/>
            </svg>
          </div>);
      case 'success':
        return (
          <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-green-100">
            <svg className="h-6 w-6 text-green-600"fill="none"viewBox="0 0 24 24"strokeWidth="2"stroke="currentColor">
              <path strokeLinecap="round"strokeLinejoin="round"d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
          </div>);
      case 'info':
        return (
          <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-blue-100">
            <svg className="h-6 w-6 text-blue-600"fill="none"viewBox="0 0 24 24"strokeWidth="2"stroke="currentColor">
              <path strokeLinecap="round"strokeLinejoin="round"d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"/>
            </svg>
          </div>);
      default: // warning
        return (
          <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-yellow-100">
            <svg className="h-6 w-6 text-yellow-600"fill="none"viewBox="0 0 24 24"strokeWidth="2"stroke="currentColor">
              <path strokeLinecap="round"strokeLinejoin="round"d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"/>
            </svg>
          </div>);
    }
  };

  // Button style based on type
  const getConfirmButtonClass = () => {
    if (confirmButtonClass) return confirmButtonClass;
    
    switch (type) {
      case 'danger':
        return 'bg-red-600 hover:bg-red-700 focus:ring-red-500';
      case 'success':
        return 'bg-green-600 hover:bg-green-700 focus:ring-green-500';
      case 'info':
        return 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500';
      default:
        return 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500';
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop - subtle blur to keep content visible */}
      <div 
        className="fixed inset-0 backdrop-blur-sm transition-all"onClick={onCancel}
      ></div>

      {/* Dialog */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative transform overflow-hidden rounded-lg bg-white shadow-2xl transition-all sm:my-8 sm:w-full sm:max-w-lg border border-gray-200">
          <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              {getIcon()}
              
              <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left flex-1">
                <h3 className="text-lg font-semibold leading-6 text-gray-900 mb-2">
                  {title}
                </h3>
                <div className="mt-2">
                  <p className="text-sm text-gray-600 whitespace-pre-line">
                    {message}
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Actions */}
          <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6 gap-3">
            <button
              type="button"onClick={onConfirm}
              className={`inline-flex w-full justify-center rounded-md px-4 py-2 text-sm font-semibold text-white shadow-sm sm:w-auto transition-colors ${getConfirmButtonClass()}`}
            >
              {confirmText}
            </button>
            {!hideCancel && (
              <button
                type="button"onClick={onCancel}
                className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto transition-colors">
                {cancelText}
              </button>)}
          </div>
        </div>
      </div>
    </div>);
}
