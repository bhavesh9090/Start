import { FiCheckCircle, FiCopy, FiX } from 'react-icons/fi';
import { useState } from 'react';

export default function OTPModal({ isOpen, onClose, otp }) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(otp);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
      <div 
        className="glass-card w-full max-w-sm p-6 overflow-hidden shadow-2xl animate-fade-in-up border-maroon-100"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <div className="w-12 h-12 rounded-full bg-saffron-50 flex items-center justify-center text-saffron-600 shadow-inner">
            <FiCheckCircle className="w-6 h-6" />
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-600"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>

        <div className="text-center mb-8">
          <h3 className="text-xl font-bold text-maroon-500 mb-2">Development OTP</h3>
          <p className="text-sm text-gray-500 mb-6">
            Use the code below to verify your mobile number in development mode.
          </p>
          
          <div className="bg-gray-50 rounded-2xl p-6 border border-dashed border-gray-200 relative group">
            <span className="text-4xl font-black tracking-[0.2em] text-gray-800 font-mono">
              {otp}
            </span>
            <button 
              onClick={handleCopy}
              className="absolute right-2 top-2 p-2 text-gray-400 hover:text-saffron-600 transition-colors"
              title="Copy OTP"
            >
              {copied ? <FiCheckCircle className="text-forest-500" /> : <FiCopy />}
            </button>
          </div>
          {copied && (
            <p className="text-[10px] font-bold text-forest-500 mt-2 uppercase tracking-widest">
              Copied to clipboard!
            </p>
          )}
        </div>

        <button
          onClick={onClose}
          className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-saffron-500 to-saffron-600 text-white font-semibold hover:shadow-lg transition-all active:scale-95"
        >
          Got it
        </button>
      </div>
    </div>
  );
}
