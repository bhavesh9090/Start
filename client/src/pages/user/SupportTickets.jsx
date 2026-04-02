import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { FiMessageSquare, FiSend, FiClock, FiCheckCircle, FiAlertCircle, FiPlus, FiChevronRight, FiUser, FiCalendar, FiTrash, FiAlertTriangle } from 'react-icons/fi';
import { complaintAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { supabase } from '../../services/supabase';
import Loader from '../../components/Loader';

const DeleteModal = ({ isOpen, onClose, onConfirm, t }) => (
  <AnimatePresence>
    {isOpen && (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-maroon-900/40 backdrop-blur-md"
        />
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="relative bg-white rounded-3xl shadow-2xl p-8 max-w-sm w-full border border-maroon-100 overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 rounded-full -mr-16 -mt-16 blur-3xl"></div>
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mb-2 ring-8 ring-red-50/50">
              <FiAlertTriangle className="w-8 h-8 text-red-500" />
            </div>
            <h3 className="text-xl font-black text-gray-800">{t('common.confirmDelete')}</h3>
            <p className="text-sm text-gray-500 font-medium leading-relaxed">
              {t('common.confirmDeleteMessage')}
            </p>
            <div className="flex flex-col w-full gap-3 pt-4">
              <button
                onClick={onConfirm}
                className="w-full py-4 bg-red-500 text-white rounded-2xl font-black hover:bg-red-600 shadow-xl shadow-red-500/20 active:scale-95 transition-all text-sm uppercase tracking-widest"
              >
                {t('common.delete')}
              </button>
              <button
                onClick={onClose}
                className="w-full py-4 bg-gray-50 text-gray-400 rounded-2xl font-black hover:bg-gray-100 transition-all text-sm uppercase tracking-widest"
              >
                {t('common.cancel')}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    )}
  </AnimatePresence>
);

export default function UserSupport() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNewForm, setShowNewForm] = useState(false);
  const [activeTab, setActiveTab] = useState('active'); // active, history
  
  const [formData, setFormData] = useState({
    subject: '',
    description: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    loadTickets();

    // Listen for real-time status updates/responses
    const channel = supabase
      .channel(`user-support-${user?.id}`)
      .on(
        'postgres_changes',
        { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'complaints',
          filter: `user_id=eq.${user?.id}`
        },
        (payload) => {
          setTickets(prev => prev.map(t => t.id === payload.new.id ? { ...t, ...payload.new } : t));
          if (payload.new.status === 'resolved') {
             showToast(t('support.resolvedMsg'), 'success');
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [ticketToDelete, setTicketToDelete] = useState(null);

  const loadTickets = async () => {
    setLoading(true);
    try {
      const res = await complaintAPI.getUserComplaints();
      setTickets(res.data.complaints || []);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.subject || !formData.description) return;
    
    setSubmitting(true);
    try {
      const payload = {
        ...formData,
        name: user.username,
        mobile: user.mobile,
        district_id: user.district_id, // Automatically bind to user's district
        user_id: user.id
      };
      
      await complaintAPI.create(payload);
      showToast(t('support.successSubmit'), 'success');
      setFormData({ subject: '', description: '' });
      setShowNewForm(false);
      loadTickets();
    } catch (err) {
      showToast(t('common.error'), 'error');
    }
    setSubmitting(false);
  };

  const handleDelete = (id) => {
    setTicketToDelete(id);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!ticketToDelete) return;
    try {
      await complaintAPI.delete(ticketToDelete);
      showToast(t('common.success'), 'success');
      loadTickets();
    } catch (err) {
      showToast(t('common.error'), 'error');
    } finally {
      setShowDeleteModal(false);
      setTicketToDelete(null);
    }
  };

  const filteredTickets = tickets.filter(t => 
    activeTab === 'active' ? (t.status !== 'resolved' && t.status !== 'rejected') : (t.status === 'resolved' || t.status === 'rejected')
  );

  const statusIcons = {
    pending: <FiClock className="text-saffron-500" />,
    in_progress: <FiAlertCircle className="text-blue-500" />,
    resolved: <FiCheckCircle className="text-forest-500" />,
    rejected: <FiAlertCircle className="text-red-500" />
  };

  const statusBg = {
    pending: 'bg-saffron-50 border-saffron-100',
    in_progress: 'bg-blue-50 border-blue-100',
    resolved: 'bg-forest-50 border-forest-100',
    rejected: 'bg-red-50 border-red-100'
  };

  return (
    <div className="min-h-screen pt-20 pb-10 px-4 mountain-bg">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-10">
          <div className="animate-slide-in-left">
            <h1 className="text-2xl sm:text-3xl font-black text-maroon-500 mb-2">{t('support.title')}</h1>
            <p className="text-gray-500 font-bold uppercase text-[9px] sm:text-[10px] tracking-widest flex items-center gap-2">
               <FiUser className="text-saffron-500" /> {user.district} District Portal
            </p>
          </div>

          <button
            onClick={() => setShowNewForm(!showNewForm)}
            className="flex items-center gap-2 px-5 sm:px-6 py-2.5 sm:py-3 bg-maroon-500 text-white rounded-2xl font-bold hover:bg-maroon-600 transition-all shadow-xl hover:-translate-y-0.5 active:scale-95 text-sm sm:text-base w-full sm:w-auto justify-center"
          >
            <FiPlus className={`w-4 h-4 sm:w-5 sm:h-5 transition-transform ${showNewForm ? 'rotate-45' : ''}`} />
            {t('support.newTicket')}
          </button>
        </div>

        <AnimatePresence>
          {showNewForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden mb-10"
            >
              <div className="glass-card p-6 md:p-12 border-2 border-dashed border-maroon-100 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-maroon-500/5 rounded-full -mr-16 -mt-16 blur-3xl"></div>
                
                <h2 className="text-2xl md:text-3xl font-black text-gray-800 mb-8 flex items-center gap-3">
                   <FiPlus className="text-maroon-500" /> {t('support.raiseTicket')}
                </h2>

                 <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
                   <div>
                     <label className="block text-[10px] md:text-xs font-black text-maroon-400 uppercase tracking-widest mb-2 md:mb-3 px-1">{t('support.subject')}</label>
                     <input
                       type="text"
                       className="input-field text-base md:text-lg py-3 md:py-4 px-4 md:px-6 bg-white/80 focus:bg-white"
                       placeholder="e.g., Payment failed..."
                       value={formData.subject}
                       onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                     />
                   </div>
                   <div>
                     <label className="block text-[10px] md:text-xs font-black text-maroon-400 uppercase tracking-widest mb-2 md:mb-3 px-1">{t('support.description')}</label>
                     <textarea
                       rows={isMobile ? 4 : 6}
                       className="input-field text-base md:text-lg py-3 md:py-4 px-4 md:px-6 bg-white/80 focus:bg-white resize-none"
                       placeholder="Describe the issue in detail..."
                       value={formData.description}
                       onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                     />
                   </div>
                  <div className="flex flex-col sm:flex-row justify-end gap-4 pt-6">
                    <button 
                      type="button"
                      onClick={() => setShowNewForm(false)}
                      className="order-2 sm:order-1 px-8 py-4 text-sm font-black text-gray-400 hover:text-gray-600 uppercase tracking-widest transition-colors"
                    >
                      {t('common.cancel')}
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="order-1 sm:order-2 flex items-center justify-center gap-3 px-10 py-4 bg-forest-500 text-white rounded-2xl font-black hover:bg-forest-600 shadow-xl shadow-forest-500/20 active:scale-95 transition-all disabled:opacity-50"
                    >
                      <FiSend className="w-5 h-5" /> {submitting ? t('common.loading') : t('support.newTicket')}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tabs */}
        <div className="flex gap-1 bg-white/50 p-1 rounded-2xl mb-8 w-full sm:w-fit shadow-inner border border-white/20">
          <button
            onClick={() => setActiveTab('active')}
            className={`flex-1 sm:flex-none px-4 sm:px-6 py-2 sm:py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all ${
              activeTab === 'active' ? 'bg-white text-maroon-500 shadow-md' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            {t('support.active')}
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex-1 sm:flex-none px-4 sm:px-6 py-2 sm:py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all ${
              activeTab === 'history' ? 'bg-white text-maroon-500 shadow-md' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            {t('support.history')}
          </button>
        </div>

        {/* Tickets List */}
        {loading ? (
          <div className="py-20 flex justify-center"><Loader message="Fetching Tickets..." /></div>
        ) : filteredTickets.length === 0 ? (
          <div className="glass-card p-12 text-center border-l-4 border-gray-100">
            <FiMessageSquare className="w-16 h-16 text-gray-200 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-400">{t('support.noTickets')}</h3>
            <p className="text-sm text-gray-300 mt-2">Any issue raised will appear here.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredTickets.map((ticket, i) => (
              <motion.div
                key={ticket.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className={`glass-card p-6 border-l-4 group transition-all hover:shadow-xl relative ${
                  ticket.status === 'resolved' ? 'border-forest-500' : 
                  ticket.status === 'pending' ? 'border-saffron-500' : 'border-blue-500'
                }`}
              >
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <span className={`p-2 rounded-xl text-lg ${statusBg[ticket.status].split(' ')[0]}`}>
                        {statusIcons[ticket.status]}
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-gray-800 leading-tight">{ticket.subject}</h4>
                          {ticket.admin_remarks && (
                            <span className="flex items-center gap-1 bg-blue-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded-md animate-pulse">
                              <FiMessageSquare className="w-2 h-2" /> {t('support.adminMsg')}
                            </span>
                          )}
                        </div>
                         <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-2 sm:mt-1">
                           <span className="text-[9px] sm:text-[10px] font-black text-gray-400 uppercase tracking-tighter flex items-center gap-1 bg-gray-50 px-2 py-1 rounded-md border border-gray-100">
                             <FiCalendar /> {new Date(ticket.created_at).toLocaleDateString()}
                           </span>
                           <span className={`text-[9px] sm:text-[10px] font-black px-2 py-1 rounded-full uppercase tracking-tighter ${statusBg[ticket.status]}`}>
                             {t(`support.statusLabel.${ticket.status}`)}
                           </span>
                         </div>
                       </div>
                     </div>
                     <p className="text-xs sm:text-sm text-gray-500 leading-relaxed sm:pl-13 mt-2 sm:mt-0">
                       {ticket.description}
                     </p>

                    {ticket.admin_remarks && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-6 sm:ml-13 p-4 bg-gray-50/80 rounded-2xl border border-gray-100 relative"
                      >
                         <div className="absolute -top-2 left-4 px-2 bg-white text-[8px] sm:text-[9px] font-black text-forest-600 uppercase tracking-widest border border-forest-100 rounded">
                           {t('support.adminMsg')}
                         </div>
                         <p className="text-xs sm:text-sm text-gray-600 font-medium italic">"{ticket.admin_remarks}"</p>
                      </motion.div>
                    )}
                  </div>

                  <div className="flex flex-row md:flex-col justify-between items-end gap-3 md:w-32">
                    <div className="text-right hidden md:block">
                      <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest mb-1">{t('support.ticketId')}</p>
                      <p className="text-[11px] font-bold text-gray-400 tabular-nums">#TIC-{ticket.id.slice(0,8).toUpperCase()}</p>
                    </div>
                    
                    <div className="flex flex-row md:flex-col items-center md:items-end gap-2">
                       <button
                         onClick={() => handleDelete(ticket.id)}
                         className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                         title={t('common.delete')}
                       >
                         <FiTrash className="w-5 h-5" />
                       </button>

                       {ticket.status === 'resolved' && (
                         <div className="flex items-center gap-1 text-forest-500 text-xs font-bold uppercase transition-transform group-hover:translate-x-1">
                            Solution <FiChevronRight />
                         </div>
                       )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        <DeleteModal 
          isOpen={showDeleteModal} 
          onClose={() => setShowDeleteModal(false)} 
          onConfirm={confirmDelete} 
          t={t}
        />
      </div>
    </div>
  );
}
