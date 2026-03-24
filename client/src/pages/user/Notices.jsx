import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { noticeAPI } from '../../services/api';
import { FiAlertCircle, FiAlertTriangle, FiInfo, FiTrash2 } from 'react-icons/fi';
import ConfirmationModal from '../../components/ConfirmationModal';
import { useAuth } from '../../context/AuthContext';

export default function UserNotices() {
  const { t } = useTranslation();
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);

  const [deletingId, setDeletingId] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    loadNotices();
  }, []);

  const loadNotices = async () => {
    try {
      const res = await noticeAPI.getUserNotices();
      setNotices(res.data.notices || []);
    } catch (err) {
      console.error('Load notices error:', err);
    }
    setLoading(false);
  };

  const handleDelete = async (id) => {
    try {
      await noticeAPI.delete(id);
      setNotices(notices.filter(n => n.id !== id));
      setDeletingId(null);
    } catch (err) {
      console.error('Delete notice error:', err);
    }
  };

  const typeConfig = {
    reminder: { icon: FiInfo, color: 'bg-blue-600 border-blue-700 text-white', badge: 'bg-white/20 text-white' },
    warning: { icon: FiAlertTriangle, color: 'bg-red-600 border-red-700 text-white', badge: 'bg-white/20 text-white animate-pulse' },
    general: { icon: FiAlertCircle, color: 'bg-saffron-600 border-saffron-700 text-white', badge: 'bg-white/20 text-white' },
  };

  return (
    <div className="min-h-screen pt-20 pb-10 px-4 mountain-bg">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-maroon-500 mb-6">{t('notice.title')}</h1>

        {loading ? (
          <p className="text-center text-gray-400 py-8">{t('common.loading')}</p>
        ) : notices.length === 0 ? (
          <div className="glass-card p-8 text-center">
            <FiInfo className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-400">{t('notice.noNotices')}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {notices.map((notice) => {
              const cfg = typeConfig[notice.type] || typeConfig.general;
              const Icon = cfg.icon;
              return (
                <div key={notice.id} className={`p-6 rounded-2xl border shadow-xl hover:shadow-2xl transition-all hover:-translate-y-1 ${cfg.color}`}>
                  <div className="flex items-start gap-4">
                    <Icon className="w-6 h-6 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-black text-lg tracking-tight">{notice.title}</h3>
                          <span className={`px-2 py-0.5 text-[10px] font-black uppercase tracking-widest rounded-full ${cfg.badge}`}>
                            {t(`notice.${notice.type}`)}
                          </span>
                        </div>
                        <button 
                          onClick={() => setDeletingId(notice.id)}
                          className="p-2 hover:bg-white/20 rounded-lg transition-colors text-white/70 hover:text-white"
                        >
                          <FiTrash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <p className="text-sm font-medium leading-relaxed opacity-90">{notice.message}</p>
                      <p className="text-[10px] font-bold text-white/60 mt-4 uppercase tracking-[0.1em]">
                        {new Date(notice.created_at).toLocaleString('en-IN')}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        
        <ConfirmationModal 
          isOpen={!!deletingId}
          onClose={() => setDeletingId(null)}
          onConfirm={() => handleDelete(deletingId)}
          title={t('common.confirmDelete')}
          message={t('common.confirmDeleteMessage')}
        />
      </div>
    </div>
  );
}
