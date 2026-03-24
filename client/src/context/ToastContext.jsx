import React, { createContext, useContext, useState, useCallback } from 'react';
import { FiCheckCircle, FiAlertCircle, FiInfo, FiX } from 'react-icons/fi';

const ToastContext = createContext();

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within a ToastProvider');
  return context;
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = 'success', duration = 3000) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  }, []);

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const icons = {
    success: <FiCheckCircle className="text-green-400" />,
    error: <FiAlertCircle className="text-red-400" />,
    info: <FiInfo className="text-blue-400" />,
  };

  const colors = {
    success: 'border-green-500/20',
    error: 'border-red-500/20',
    info: 'border-blue-500/20',
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Toast Container */}
      <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none">
        {toasts.map((toast) => (
          <div 
            key={toast.id}
            className={`pointer-events-auto flex items-center gap-3 bg-black text-white px-6 py-4 rounded-2xl shadow-2xl border ${colors[toast.type]} animate-slide-in-right min-w-[300px] max-w-md backdrop-blur-md bg-opacity-95`}
          >
            <div className="text-xl">
              {icons[toast.type]}
            </div>
            <div className="flex-1">
              <p className="text-[11px] font-black uppercase tracking-widest leading-tight">
                {toast.message}
              </p>
            </div>
            <button 
              onClick={() => removeToast(toast.id)}
              className="text-gray-500 hover:text-white transition-colors p-1"
            >
              <FiX className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};
