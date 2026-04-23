import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { FiWifi, FiWifiOff, FiInfo, FiChevronDown, FiChevronUp } from 'react-icons/fi';

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

  return (
    <>
      {/* Small Toggle Button (Floating) */}
      <div className="fixed bottom-6 right-24 z-50">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowGuide(!showGuide)}
          className={`flex items-center gap-2 px-4 py-2 rounded-full shadow-lg border backdrop-blur-md transition-colors ${
            isOnline 
              ? 'bg-green-500/10 border-green-500/20 text-green-600' 
              : 'bg-amber-500/10 border-amber-500/20 text-amber-600'
          }`}
        >
          {isOnline ? <FiWifi /> : <FiWifiOff className="animate-pulse" />}
          <span className="text-xs font-bold uppercase tracking-wider hidden md:block">
            {isOnline ? t('offline.statusOnline') : t('offline.statusOffline')}
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
              className="absolute bottom-14 right-0 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden"
            >
              <div className={`p-4 ${isOnline ? 'bg-green-500' : 'bg-amber-500'} text-white`}>
                <h3 className="font-bold flex items-center gap-2">
                  <FiInfo /> {t('offline.title')}
                </h3>
                <p className="text-xs opacity-90 mt-1">
                  {isOnline ? t('offline.connectedDesc') : t('offline.offlineDesc')}
                </p>
              </div>
              
              <div className="p-4 space-y-4 max-h-[400px] overflow-y-auto">
                <div className="space-y-3 text-sm">
                  <p className="font-bold text-gray-800 text-xs uppercase tracking-tight">
                    {t('offline.guideTitle')}
                  </p>
                  
                  <div className="space-y-3">
                    {[1, 2, 3].map((step) => (
                      <div key={step} className="flex gap-3">
                        <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 text-[10px] font-bold text-gray-500 border border-gray-200">
                          {step}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-700 text-xs">
                            {t(`offline.step${step}Title`)}
                          </p>
                          <p className="text-[11px] text-gray-500 leading-relaxed">
                            {t(`offline.step${step}Desc`)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-3 border-t border-gray-50">
                  <div className="p-3 bg-blue-50 rounded-xl border border-blue-100">
                    <p className="text-[11px] font-bold text-blue-700">
                      💡 {t('offline.proTipTitle')}
                    </p>
                    <p className="text-[10px] text-blue-600/80 mt-1">
                      {t('offline.proTipDesc')}
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
            className={`fixed top-24 right-6 z-[60] flex items-center gap-3 px-6 py-4 rounded-2xl shadow-xl border backdrop-blur-md ${
              isOnline 
                ? 'bg-white/90 border-green-500/20 text-green-700' 
                : 'bg-white/90 border-amber-500/20 text-amber-700'
            }`}
          >
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isOnline ? 'bg-green-100' : 'bg-amber-100'}`}>
              {isOnline ? <FiWifi size={20} /> : <FiWifiOff size={20} />}
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
