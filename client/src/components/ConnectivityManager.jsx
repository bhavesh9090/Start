import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { FiWifi, FiWifiOff, FiInfo, FiChevronDown, FiChevronUp, FiX, FiSmartphone } from 'react-icons/fi';

const ConnectivityManager = () => {
  const { t } = useTranslation();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showGuide, setShowGuide] = useState(false);
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 5000);
    };
    const handleOffline = () => {
      setIsOnline(false);
      setShowToast(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Handle Mutual Exclusion
  useEffect(() => {
    const handleClose = (e) => {
      if (e.detail.id !== 'connectivity') {
        setShowGuide(false);
      }
    };
    window.addEventListener('close-all-overlays', handleClose);
    return () => window.removeEventListener('close-all-overlays', handleClose);
  }, []);

  useEffect(() => {
    if (showGuide) {
      window.dispatchEvent(new CustomEvent('close-all-overlays', { detail: { id: 'connectivity' } }));
    }
  }, [showGuide]);

  return (
    <>
      {/* Small Toggle Button (Floating) - Hidden on mobile, visible on desktop */}
      <div className="fixed bottom-6 right-32 z-50 hidden sm:block">
        <style>
          {`
            @media (display-mode: standalone) {
              .mobile-status-pill { display: flex !important; }
            }
          `}
        </style>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowGuide(!showGuide)}
          className={`mobile-status-pill flex items-center gap-2 px-3 sm:px-4 py-2 rounded-full shadow-lg border transition-colors ${
            isOnline 
              ? 'bg-green-50 border-green-200 text-green-700' 
              : 'bg-amber-50 border-amber-200 text-amber-700'
          }`}
        >
          <FiSmartphone className={isOnline ? "" : "animate-pulse"} />
          <span className="text-[10px] sm:text-xs font-black uppercase tracking-widest">
            APP DETAILS
          </span>
          {showGuide ? <FiChevronDown /> : <FiChevronUp />}
        </motion.button>

        {/* Floating Guide Panel */}
        <AnimatePresence>
          {showGuide && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              className="absolute bottom-14 left-0 sm:left-auto sm:right-0 w-[85vw] sm:w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden"
            >
              <div className={`p-4 ${isOnline ? 'bg-green-500' : 'bg-amber-500'} text-white relative`}>
                <button 
                  onClick={() => setShowGuide(false)}
                  className="absolute top-3 right-3 p-1 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <FiX size={18} />
                </button>
                <h3 className="font-bold flex items-center gap-2">
                  <FiSmartphone /> E-TaxPay
                </h3>
                <p className="text-xs opacity-90 mt-1">
                  Offline Support Enabled
                </p>
              </div>
              
              <div className="p-6 space-y-4">
                <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0 text-blue-600">
                    <FiSmartphone size={20} />
                  </div>
                  <div>
                    <p className="font-bold text-blue-900 text-sm">App Availability</p>
                    <p className="text-xs text-blue-700/80 leading-relaxed mt-1">
                      जब आप अपने मोबाइल फोन पर इस वेबसाइट को खोलेंगे, तो आपको होम स्क्रीन पर ऐप इंस्टॉल करने का सीधा विकल्प (INSTALL APP) मिल जाएगा।
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-gray-50 border-t border-gray-100 text-center">
                <p className="text-[10px] text-gray-400 flex items-center justify-center gap-1 font-medium">
                  🔒 {t('offline.dataProtected')}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Connection Change Toast */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className={`fixed top-24 right-6 z-[60] flex items-center gap-3 px-6 py-4 rounded-2xl shadow-xl border ${
              isOnline 
                ? 'bg-white border-green-200 text-green-700' 
                : 'bg-white border-amber-200 text-amber-700'
            }`}
          >
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isOnline ? 'bg-green-100' : 'bg-amber-100'}`}>
              <FiSmartphone size={20} className={isOnline ? "" : "animate-pulse"} />
            </div>
            <div>
              <p className="font-bold text-sm">
                {isOnline ? t('offline.connected') : t('offline.noSignal')}
              </p>
              <p className="text-[11px] opacity-70 font-medium">
                {isOnline ? 'Real-time sync enabled' : 'Switched to local storage'}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default ConnectivityManager;
