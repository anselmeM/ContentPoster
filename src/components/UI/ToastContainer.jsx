import { useState, useEffect } from 'react';
import clsx from 'clsx';
import { toast } from '../../services/notifications';

const ToastContainer = () => {
  const [toasts, setToasts] = useState([]);
  
  useEffect(() => {
    // Subscribe to toast updates
    const unsubscribe = toast.subscribe((newToasts) => {
      setToasts(newToasts);
    });
    
    return () => unsubscribe();
  }, []);
  
  if (toasts.length === 0) return null;
  
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
      {toasts.map((t) => (
        <Toast key={t.id} toast={t} onClose={() => toast.remove(t.id)} />
      ))}
    </div>
  );
};

const Toast = ({ toast, onClose }) => {
  useEffect(() => {
    if (toast.duration > 0) {
      const timer = setTimeout(onClose, toast.duration);
      return () => clearTimeout(timer);
    }
  }, [toast.duration, onClose]);
  
  const typeStyles = {
    success: {
      bg: 'bg-green-50 dark:bg-green-900/30',
      border: 'border-green-500',
      icon: 'fa-check-circle',
      iconColor: 'text-green-500',
      title: 'text-green-800 dark:text-green-200',
      message: 'text-green-700 dark:text-green-300'
    },
    error: {
      bg: 'bg-red-50 dark:bg-red-900/30',
      border: 'border-red-500',
      icon: 'fa-exclamation-circle',
      iconColor: 'text-red-500',
      title: 'text-red-800 dark:text-red-200',
      message: 'text-red-700 dark:text-red-300'
    },
    warning: {
      bg: 'bg-yellow-50 dark:bg-yellow-900/30',
      border: 'border-yellow-500',
      icon: 'fa-exclamation-triangle',
      iconColor: 'text-yellow-500',
      title: 'text-yellow-800 dark:text-yellow-200',
      message: 'text-yellow-700 dark:text-yellow-300'
    },
    info: {
      bg: 'bg-blue-50 dark:bg-blue-900/30',
      border: 'border-blue-500',
      icon: 'fa-info-circle',
      iconColor: 'text-blue-500',
      title: 'text-blue-800 dark:text-blue-200',
      message: 'text-blue-700 dark:text-blue-300'
    }
  };
  
  const style = typeStyles[toast.type] || typeStyles.info;
  
  return (
    <div 
      className={clsx(
        'rounded-lg shadow-lg border-l-4 p-4 animate-slide-in',
        style.bg,
        style.border
      )}
      role="alert"
    >
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <i className={clsx('fas', style.iconColor, 'text-xl')} />
        </div>
        <div className="ml-3 flex-1">
          {toast.title && (
            <p className={clsx('font-semibold text-sm', style.title)}>
              {toast.title}
            </p>
          )}
          {toast.message && (
            <p className={clsx('text-sm mt-1', style.message)}>
              {toast.message}
            </p>
          )}
        </div>
        <button
          onClick={onClose}
          className="ml-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
        >
          <i className="fas fa-times" />
        </button>
      </div>
    </div>
  );
};

export default ToastContainer;