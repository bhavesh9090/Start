import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#fafaf8] flex items-center justify-center px-6 relative overflow-hidden">
      {/* Background blobs */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[10%] left-[5%] w-72 h-72 bg-saffron-500/5 rounded-full blur-[100px]" />
        <div className="absolute bottom-[10%] right-[5%] w-96 h-96 bg-maroon-500/5 rounded-full blur-[100px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
        className="relative text-center max-w-md"
      >
        {/* 404 Number */}
        <motion.div
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
          className="relative inline-block"
        >
          <span className="text-[140px] sm:text-[180px] font-black leading-none tracking-tighter bg-gradient-to-br from-maroon-500 via-saffron-500 to-maroon-400 bg-clip-text text-transparent select-none">
            404
          </span>
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -top-4 -right-4 text-5xl"
          >
            🏔️
          </motion.div>
        </motion.div>

        {/* Message */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 mt-2">
            रास्ता भटक गए!
          </h1>
          <p className="text-gray-500 mt-3 text-sm sm:text-base leading-relaxed">
            ये पेज शायद पहाड़ों में कहीं खो गया है। <br />
            चलिए आपको वापस सही रास्ते पर ले चलते हैं।
          </p>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-8"
        >
          <Link 
            to="/"
            className="px-8 py-3 bg-gradient-to-r from-maroon-500 to-saffron-500 text-white font-bold rounded-2xl shadow-lg shadow-maroon-500/20 hover:shadow-xl hover:shadow-maroon-500/30 transition-all active:scale-95 text-sm"
          >
            🏠 होम पेज जाएं
          </Link>
          <button 
            onClick={() => window.history.back()}
            className="px-8 py-3 bg-white text-gray-700 font-bold rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all active:scale-95 text-sm"
          >
            ← वापस जाएं
          </button>
        </motion.div>

        {/* Footer hint */}
        <p className="text-[11px] text-gray-400 mt-10 font-medium uppercase tracking-widest">
          E-TaxPay • Zila Panchayat Uttarakhand
        </p>
      </motion.div>
    </div>
  );
}
