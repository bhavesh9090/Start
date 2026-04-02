import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { noticeAPI } from '../../services/api';
import { FiAlertCircle, FiAlertTriangle, FiInfo, FiTrash2, FiSearch, FiFilter, FiCalendar, FiArrowRight } from 'react-icons/fi';
import ConfirmationModal from '../../components/ConfirmationModal';
import Loader from '../../components/Loader';

export default function UserNotices() {
  const { t } = useTranslation();
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [deletingId, setDeletingId] = useState(null);

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
      setDeletingId(null);
    }
  };

  const filteredNotices = useMemo(() => {
    return notices.filter(n => {
      const matchesSearch = n.title.toLowerCase().includes(search.toLowerCase()) || 
                            n.message.toLowerCase().includes(search.toLowerCase());
      const matchesFilter = filter === 'all' || n.type === filter;
      return matchesSearch && matchesFilter;
    });
  }, [notices, search, filter]);

  const typeConfig = {
    reminder: { 
      icon: FiInfo, 
      color: 'text-blue-500', 
      accent: 'bg-blue-500',
      border: 'border-l-blue-500',
      lightBg: 'bg-blue-50/50'
    },
    warning: { 
      icon: FiAlertTriangle, 
      color: 'text-saffron-500', 
      accent: 'bg-saffron-500',
      border: 'border-l-saffron-500',
      lightBg: 'bg-saffron-50/50'
    },
    general: { 
      icon: FiAlertCircle, 
      color: 'text-gray-500', 
      accent: 'bg-gray-500',
      border: 'border-l-gray-500',
      lightBg: 'bg-gray-50/50'
    },
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="min-h-screen pt-24 pb-12 px-4 mountain-bg overflow-x-hidden">
      {/* Decorative Glow */}
      <div className="fixed top-0 right-0 w-[500px] h-[500px] bg-saffron-500/5 blur-[120px] -z-10 rounded-full animate-pulse"></div>
      <div className="fixed bottom-0 left-0 w-[500px] h-[500px] bg-maroon-500/5 blur-[120px] -z-10 rounded-full animate-pulse delay-1000"></div>

      <div className="max-w-5xl mx-auto">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 animate-fade-in-up">
          <div className="space-y-2">
            <div className="flex items-center gap-4">
               <h1 className="text-5xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                <FiInfo className="text-gray-900" /> {t('notice.title')}
              </h1>
              {notices.length > 0 && (
                <span className="bg-white/80 backdrop-blur px-3 py-1 rounded-xl text-xs font-black text-maroon-500 shadow-sm border border-maroon-100">
                  {notices.length} TOTAL
                </span>
              )}
            </div>
            <p className="text-gray-500 font-bold max-w-lg leading-snug">
              {t('notice.description')}
            </p>
          </div>

          {/* Quick Stats/Filter Pills */}
          <div className="flex flex-wrap gap-2">
             {['all', 'reminder', 'warning', 'general'].map((tType) => (
               <button 
                 key={tType}
                 onClick={() => setFilter(tType)}
                 className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                   filter === tType 
                    ? 'bg-saffron-500 text-white shadow-lg shadow-saffron-500/20 active:scale-95' 
                    : 'bg-white/80 text-gray-500 hover:bg-gray-50 border border-gray-100'
                 }`}
               >
                 {tType === 'all' ? 'All Updates' : t(`notice.${tType}`)}
               </button>
             ))}
          </div>
        </div>

        {/* Search Bar */}
        <div className="glass-card mb-8 p-2 flex items-center gap-4 group focus-within:ring-4 focus-within:ring-saffron-500/5 transition-all">
          <div className="p-3 bg-gray-50 rounded-2xl text-gray-400 group-focus-within:text-saffron-500 transition-colors">
            <FiSearch className="w-5 h-5" />
          </div>
          <input 
            type="text" 
            placeholder="Search through your notifications..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-transparent border-none outline-none text-sm font-bold text-gray-700 placeholder:text-gray-300"
          />
        </div>

        {/* Main Content */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Loader message={t('common.loading')} />
          </div>
        ) : filteredNotices.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card p-20 text-center border-dashed border-2 bg-white/40"
          >
            <div className="w-24 h-24 bg-gradient-to-br from-gray-50 to-white rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-sm border border-gray-100">
              <FiAlertCircle className="w-10 h-10 text-gray-200" />
            </div>
            <h3 className="text-xl font-black text-gray-400 uppercase tracking-widest mb-1">
               {search || filter !== 'all' ? 'No Results Found' : t('notice.noNotices')}
            </h3>
            <p className="text-gray-300 text-sm font-medium">Try adjusting your filters or search keywords</p>
          </motion.div>
        ) : (
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="grid gap-6"
          >
            <AnimatePresence mode='popLayout'>
              {filteredNotices.map((notice) => {
                const cfg = typeConfig[notice.type] || typeConfig.general;
                const Icon = cfg.icon;
                return (
                  <motion.div 
                    layout
                    variants={itemVariants}
                    exit={{ opacity: 0, scale: 0.95, x: -20 }}
                    key={notice.id} 
                    className={`glass-card group relative p-8 border-l-[6px] ${cfg.border} hover:shadow-2xl hover:-translate-y-1 transition-all duration-300`}
                  >
                    <div className="flex flex-col sm:flex-row items-start gap-8">
                      {/* Icon Bagde */}
                      <div className={`p-4 rounded-[1.5rem] ${cfg.lightBg} ${cfg.color} group-hover:scale-110 transition-transform shadow-sm`}>
                        <Icon className="w-8 h-8" />
                      </div>
                      
                      {/* Text Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center justify-between gap-4 mb-3">
                          <div className="flex flex-wrap items-center gap-4">
                            <h3 className="font-black text-2xl text-gray-900 tracking-tight leading-tight">
                              {notice.title}
                            </h3>
                            <div className={`px-3 py-1 text-[9px] font-black uppercase tracking-[0.2em] rounded-lg text-white shadow-sm ${cfg.accent}`}>
                              {t(`notice.${notice.type}`)}
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                             <button 
                               onClick={() => setDeletingId(notice.id)}
                               className="p-2.5 text-gray-300 hover:text-white hover:bg-red-500 rounded-xl transition-all shadow-sm active:scale-95"
                             >
                                <FiTrash2 className="w-4 h-4" />
                             </button>
                          </div>
                        </div>

                        <p className="text-gray-500 font-bold text-base leading-relaxed mb-6 group-hover:text-gray-700 transition-colors">
                          {notice.message}
                        </p>

                        <div className="flex items-center justify-between">
                           <div className="flex items-center gap-3 text-[11px] font-black text-gray-400 uppercase tracking-widest bg-gray-50/50 px-4 py-2 rounded-xl border border-gray-100/50">
                              <span className="text-saffron-500">POSTED BY SYSTEM</span>
                              <span className="w-1.5 h-1.5 rounded-full bg-gray-200"></span>
                              <span>
                                {new Date(notice.created_at).toLocaleString('en-IN', {
                                  day: '2-digit', month: 'short', year: 'numeric',
                                  hour: '2-digit', minute: '2-digit'
                                })}
                              </span>
                           </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </motion.div>
        )}
      </div>

      <ConfirmationModal 
        isOpen={!!deletingId}
        onClose={() => setDeletingId(null)}
        onConfirm={() => handleDelete(deletingId)}
        title={t('common.confirmDelete')}
        message={t('common.confirmDeleteMessage')}
      />
    </div>
  );
}
