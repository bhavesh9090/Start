import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiSmartphone, FiX } from 'react-icons/fi';

const PWAInstallButton = () => {
  const [installPrompt, setInstallPrompt] = useState(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Detect iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    setIsIOS(isIOSDevice);
    
    // Show guide for iOS users automatically if not in standalone
    if (isIOSDevice && !window.matchMedia('(display-mode: standalone)').matches) {
      setIsVisible(true);
    }

    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setInstallPrompt(e);
      setIsVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Mutual Exclusion Listener
    const handleClose = (e) => {
      if (e.detail.id !== 'pwa') {
        // Optional hide logic
      }
    };
    window.addEventListener('close-all-overlays', handleClose);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('close-all-overlays', handleClose);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isIOS) {
      alert("iPhone Users: Tap the 'Share' icon below and select 'Add to Home Screen' to install E-TaxPay.");
      return;
    }

    if (!installPrompt) {
      alert("Installation is already in progress or your browser doesn't support direct install.");
      return;
    }

    const result = await installPrompt.prompt();
    if (result.outcome === 'accepted') {
      setIsVisible(false);
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <div className="fixed bottom-20 sm:bottom-24 right-4 sm:right-6 z-50 flex flex-col items-center gap-2">
          {/* Glowing Install Button */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleInstallClick}
            className="relative w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-red-600 to-red-500 rounded-full flex items-center justify-center text-white shadow-[0_10px_30px_rgba(224,52,52,0.4)] border-4 border-white group"
          >
            {/* Ping effect */}
            <span className="absolute inset-0 rounded-full bg-red-400 animate-ping opacity-20 group-hover:opacity-40"></span>
            
            <FiSmartphone size={20} className="sm:hidden relative z-10" />
            <FiSmartphone size={24} className="hidden sm:block relative z-10" />
            
            {/* Close Button */}
            <button 
              onClick={(e) => { e.stopPropagation(); setIsVisible(false); }}
              className="absolute -top-1 -right-1 w-5 h-5 bg-white text-gray-900 rounded-full border border-gray-200 flex items-center justify-center shadow-md hover:bg-gray-50 z-20"
            >
              <FiX size={10} />
            </button>
          </motion.button>

          {/* Label Below Button */}
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white px-3 py-1 rounded-full shadow-lg border border-red-100 flex items-center gap-1.5"
          >
            <span className="text-[9px] font-black text-red-600 uppercase tracking-widest whitespace-nowrap">
              Download the App
            </span>
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default PWAInstallButton;
