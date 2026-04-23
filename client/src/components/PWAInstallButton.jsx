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
      console.log('Install prompt captured');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Mutual Exclusion Listener
    const handleClose = (e) => {
      if (e.detail.id !== 'pwa') {
        // We don't necessarily want to hide the PWA button, only panels
        // But if the user wants it, we can. For now leave it visible.
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
      alert("Installation is already in progress or your browser doesn't support direct install. Check your browser menu!");
      return;
    }

    const result = await installPrompt.prompt();
    if (result.outcome === 'accepted') {
      console.log('User accepted the install prompt');
      setIsVisible(false);
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <div className="fixed bottom-20 sm:bottom-24 right-4 sm:right-6 z-50 flex flex-col items-center">
          {/* Tooltip Label */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="mb-2 px-2 sm:px-3 py-1 bg-gray-900 text-white text-[9px] sm:text-[11px] font-black rounded-lg shadow-xl uppercase tracking-widest whitespace-nowrap"
          >
            INSTALL APP
          </motion.div>

          {/* Glowing Install Button */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleInstallClick}
            className="relative w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-red-600 to-red-500 rounded-full flex items-center justify-center text-white shadow-[0_10px_30px_rgba(224,52,52,0.4)] border-4 border-white/20 group"
          >
            {/* Ping effect */}
            <span className="absolute inset-0 rounded-full bg-red-400 animate-ping opacity-20 group-hover:opacity-40"></span>

            <FiSmartphone size={20} className="sm:hidden relative z-10" />
            <FiSmartphone size={24} className="hidden sm:block relative z-10" />

            {/* Close Button (Optional/Small) */}
            <button
              onClick={(e) => { e.stopPropagation(); setIsVisible(false); }}
              className="absolute -top-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 bg-white text-gray-500 rounded-full border border-gray-100 flex items-center justify-center shadow-md hover:bg-gray-50"
            >
              <FiX size={10} />
            </button>
          </motion.button>
        </div>
      )}
    </AnimatePresence>
  );
};

export default PWAInstallButton;
