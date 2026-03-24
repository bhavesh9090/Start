import { FiAlertTriangle, FiX } from 'react-icons/fi';
import { useTranslation } from 'react-i18next';

export default function ConfirmationModal({ isOpen, onClose, onConfirm, title, message, confirmText, cancelText }) {
  const { t } = useTranslation();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
      <div 
        className="glass-card w-full max-w-md p-6 overflow-hidden shadow-2xl animate-fade-in-up border-maroon-100"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center text-red-500 shadow-inner">
            <FiAlertTriangle className="w-6 h-6 animate-pulse" />
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-600"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>

        <div className="mb-8">
          <h3 className="text-xl font-bold text-maroon-500 mb-2">{title || t('common.confirmDelete')}</h3>
          <p className="text-gray-600 leading-relaxed">
            {message || t('common.confirmDeleteMessage')}
          </p>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 py-3 px-4 rounded-xl border border-gray-200 text-gray-700 font-semibold hover:bg-gray-50 transition-all hover:shadow-md"
          >
            {cancelText || t('common.cancel')}
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-red-500 to-maroon-600 text-white font-semibold hover:shadow-lg hover:brightness-110 transition-all transform hover:-translate-y-0.5 active:scale-95 shadow-md shadow-red-200"
          >
            {confirmText || t('common.delete')}
          </button>
        </div>
      </div>
    </div>
  );
}
