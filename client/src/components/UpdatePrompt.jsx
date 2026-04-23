import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiRefreshCw, FiX } from 'react-icons/fi';

export default function UpdatePrompt() {
  const [show, setShow] = useState(false);
  const [waitingWorker, setWaitingWorker] = useState(null);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistration().then(reg => {
        if (!reg) return;

        const checkUpdate = (worker) => {
          if (worker.state === 'installed') {
            setWaitingWorker(worker);
            setShow(true);
          }
        };

        if (reg.waiting) checkUpdate(reg.waiting);

        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;
          newWorker.addEventListener('statechange', () => {
            checkUpdate(newWorker);
          });
        });
      });
    }
  }, []);

  const onUpdate = () => {
    if (waitingWorker) {
      waitingWorker.postMessage({ type: 'SKIP_WAITING' });
      setShow(false);
      window.location.reload();
    }
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          className="fixed bottom-24 left-4 right-4 z-[100] md:left-auto md:right-8 md:w-96"
        >
          <div className="bg-white dark:bg-[#252525] rounded-[2rem] p-6 shadow-2xl border border-gray-100 dark:border-white/10 flex items-center gap-4">
            <div className="w-12 h-12 bg-saffron-50 dark:bg-saffron-900/30 rounded-2xl flex items-center justify-center flex-shrink-0">
              <FiRefreshCw className="w-6 h-6 text-saffron-600 dark:text-saffron-400 animate-spin-slow" />
            </div>
            
            <div className="flex-grow">
              <h4 className="text-sm font-black text-gray-900 dark:text-gray-100">न्यू अपडेट तैयार है!</h4>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 font-medium leading-relaxed">
                App को अपडेट करने के लिए रीफ्रेश करें।
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <button
                onClick={onUpdate}
                className="px-4 py-2 bg-gradient-to-r from-maroon-500 to-maroon-600 text-white text-[11px] font-black uppercase tracking-wider rounded-xl shadow-md active:scale-95 transition-all"
              >
                अपडेट करें
              </button>
              <button
                onClick={() => setShow(false)}
                className="px-4 py-2 text-[11px] font-bold text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                बाद में
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
