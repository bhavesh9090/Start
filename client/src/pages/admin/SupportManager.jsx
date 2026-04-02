import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { complaintAPI } from '../../services/api';
import { FiFilter, FiMessageSquare, FiCheck, FiX, FiInfo, FiTrash, FiUser, FiCalendar, FiClock, FiStar, FiAlertTriangle } from 'react-icons/fi';
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

export default function AdminSupportHub() {
  const { t } = useTranslation();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [remarks, setRemarks] = useState('');
  const [newCount, setNewCount] = useState(0);
  const { user } = useAuth();
  const { showToast } = useToast();

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [ticketToDelete, setTicketToDelete] = useState(null);

  useEffect(() => {
    loadTickets();
    
    // Realtime subscription for support tickets in this district
    const districtId = user?.district_id;
    const channel = supabase
      .channel('admin-support-realtime')
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'complaints'
        },
        (payload) => {
          if (payload.eventType === 'INSERT' && payload.new.user_id) {
            setNewCount(prev => prev + 1);
          }
          loadTickets();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [statusFilter, user?.district_id]);

  const loadTickets = async () => {
    setLoading(true);
    try {
      const res = await complaintAPI.getAll(statusFilter || undefined, 'support');
      setTickets(res.data.complaints || []);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const updateStatus = async (id, status) => {
    try {
      await complaintAPI.update(id, { status, admin_remarks: remarks });
      setSelectedTicket(null);
      setRemarks('');
      loadTickets();
      showToast(t('common.success'), 'success');
    } catch (err) {
      showToast(t('common.error'), 'error');
    }
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

  const statusColors = {
    pending: 'bg-saffron-100 text-saffron-600 border-saffron-200',
    in_progress: 'bg-blue-100 text-blue-600 border-blue-200',
    resolved: 'bg-forest-100 text-forest-600 border-forest-200',
    rejected: 'bg-red-100 text-red-600 border-red-200',
  };

  const stats = {
    total: tickets.length,
    pending: tickets.filter(t => t.status === 'pending').length,
    resolved: tickets.filter(t => t.status === 'resolved').length
  };

  return (
    <div className="min-h-screen mountain-bg pt-20 pb-10 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div className="animate-slide-in-left">
            <h1 className="text-3xl font-black font-heading text-maroon-500 flex items-center gap-2">
               <FiStar className="text-saffron-500" /> {t('support.title')}
            </h1>
            <p className="text-gray-500 text-[10px] font-black font-sans uppercase tracking-widest mt-1 flex items-center gap-2">
               User Support Management <span className="w-1 h-1 bg-gray-300 rounded-full"></span> {user?.district} District
            </p>
          </div>

          <div className="flex flex-wrap gap-4">
             <div className="glass-card px-5 py-3 flex items-center gap-4 bg-white/40 border-none shadow-sm h-fit">
                <div className="w-10 h-10 rounded-xl bg-saffron-500 flex items-center justify-center text-white shadow-lg shadow-saffron-500/20">
                   <FiClock className="w-5 h-5" />
                </div>
                <div>
                   <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Open Tickets</p>
                   <p className="text-2xl font-black text-gray-800 leading-none">{stats.pending}</p>
                </div>
             </div>
             <div className="glass-card px-5 py-3 flex items-center gap-4 bg-white/40 border-none shadow-sm h-fit">
                <div className="w-10 h-10 rounded-xl bg-forest-500 flex items-center justify-center text-white shadow-lg shadow-forest-500/20">
                   <FiCheck className="w-5 h-5" />
                </div>
                <div>
                   <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Resolved</p>
                   <p className="text-2xl font-black text-gray-800 leading-none">{stats.resolved}</p>
                </div>
             </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
           <div className="flex p-1 bg-white/50 backdrop-blur-sm rounded-2xl border border-white/20 shadow-inner w-full sm:w-auto">
              {[
                { id: '', label: t('adminPanel.status.all'), icon: FiFilter },
                { id: 'pending', label: t('adminPanel.status.pending'), icon: FiClock },
                { id: 'resolved', label: t('adminPanel.status.resolved'), icon: FiCheck }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setStatusFilter(tab.id)}
                  className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${
                    statusFilter === tab.id ? 'bg-white text-maroon-500 shadow-lg' : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  <tab.icon className="w-3.5 h-3.5" />
                  {tab.label}
                </button>
              ))}
           </div>
           
           {newCount > 0 && (
              <button 
                onClick={() => { setNewCount(0); loadTickets(); }}
                className="flex items-center gap-2 px-4 py-2 bg-forest-500 text-white rounded-xl text-xs font-black animate-bounce shadow-xl shadow-forest-500/30"
              >
                <FiMessageSquare className="w-3.5 h-3.5" />
                {newCount} NEW TICKETS
              </button>
            )}
        </div>

        <div className="space-y-4">
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <Loader message="Fetching Support Hub..." />
            </div>
          ) : tickets.length === 0 ? (
            <div className="glass-card p-16 text-center border-l-4 border-gray-100">
              <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <FiMessageSquare className="w-10 h-10 text-gray-200" />
              </div>
              <h3 className="text-xl font-bold text-gray-300">No support tickets at the moment.</h3>
              <p className="text-xs text-gray-200 mt-2 uppercase tracking-widest font-black">All quiet in {user?.district}</p>
            </div>
          ) : (
            tickets.map((ticket, i) => (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                key={ticket.id} 
                className="glass-card p-6 border-l-4 border-l-maroon-500 hover:shadow-2xl transition-all duration-300 group"
              >
                <div className="flex flex-col lg:flex-row items-start justify-between gap-6 relative">
                  <div className="flex-1 space-y-4">
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="text-lg font-black text-gray-800 group-hover:text-maroon-500 transition-colors">{ticket.subject}</h3>
                      <span className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-full border-2 ${statusColors[ticket.status]}`}>
                        {ticket.status}
                      </span>
                    </div>

                    <p className="text-sm text-gray-600 leading-relaxed italic bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
                      "{ticket.description}"
                    </p>

                    <div className="flex flex-wrap gap-4 text-[10px] text-gray-400 font-black uppercase tracking-tighter items-center">
                      <div className="flex items-center gap-4 bg-white px-4 py-2.5 rounded-2xl border border-maroon-100/50 shadow-sm pr-6 hover:shadow-md transition-shadow group/user">
                        <div className="w-12 h-12 rounded-2xl bg-saffron-100 flex items-center justify-center overflow-hidden border-2 border-white shadow-sm ring-4 ring-saffron-50 group-hover/user:ring-saffron-100 transition-all">
                           {ticket.users?.photo_url ? (
                             <img src={ticket.users.photo_url} alt={ticket.name} className="w-full h-full object-cover" />
                           ) : (
                             <FiUser className="text-saffron-600 w-6 h-6" />
                           )}
                        </div>
                        <div>
                           <p className="text-base font-black text-gray-800 leading-tight">{ticket.name || 'User'}</p>
                           <div className="flex items-center gap-2 mt-1">
                              <span className="px-1.5 py-0.5 bg-maroon-50 text-maroon-600 text-[8px] font-black uppercase tracking-widest rounded border border-maroon-100">
                                {ticket.users?.block || 'General'} Block
                              </span>
                              <span className="text-[9px] font-bold text-gray-400 tabular-nums">ID: {ticket.users?.gst_id || 'GUEST'}</span>
                           </div>
                        </div>
                      </div>
                      <span className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-gray-100 shadow-sm">
                        <FiMessageSquare className="text-blue-500" /> {ticket.mobile}
                      </span>
                      <span className="flex items-center gap-2 px-3 py-1.5">
                        <FiCalendar className="text-gray-300" /> {new Date(ticket.created_at).toLocaleString('en-IN')}
                      </span>

                      {/* Relocated Admin Delete Action */}
                      <button
                        onClick={() => handleDelete(ticket.id)}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover:opacity-100 flex items-center gap-1 ml-auto"
                        title={t('common.delete')}
                      >
                        <FiTrash className="w-4 h-4" />
                      </button>
                    </div>

                    {ticket.admin_remarks && (
                      <div className="p-4 bg-forest-50/50 rounded-2xl border border-forest-100 relative mt-4">
                         <div className="absolute -top-2 left-4 px-2 bg-white text-[8px] font-black text-forest-600 uppercase tracking-widest border border-forest-100 rounded flex items-center gap-1">
                           <FiMessageSquare className="w-2 h-2" /> {t('support.adminMsg')}
                         </div>
                         <p className="text-sm text-forest-700 font-medium italic">"{ticket.admin_remarks}"</p>
                      </div>
                    )}
                  </div>

                  {ticket.status !== 'resolved' && ticket.status !== 'rejected' && (
                    <div className="w-full lg:w-80 space-y-4">
                      <div className="glass-card p-6 border-2 border-dashed border-maroon-100 bg-white/50 shadow-inner">
                        <label className="block text-[10px] md:text-xs font-black text-maroon-400 uppercase tracking-widest mb-4 px-1 flex items-center gap-2">
                           <FiMessageSquare className="w-3 h-3" /> Resolution & Messaging
                        </label>
                        <textarea
                          placeholder="Type your response to the user..."
                          rows={5}
                          className="input-field text-base bg-white border-maroon-50 focus:border-maroon-500 py-3 shadow-sm"
                          value={selectedTicket === ticket.id ? remarks : ''}
                          onChange={(e) => {
                            setSelectedTicket(ticket.id);
                            setRemarks(e.target.value);
                          }}
                        />
                        <div className="flex flex-col sm:flex-row gap-3 mt-6">
                           <button
                             onClick={() => updateStatus(ticket.id, 'resolved')}
                             className="flex-1 flex items-center justify-center gap-2 px-4 py-3.5 bg-forest-500 text-white rounded-2xl text-xs font-black hover:bg-forest-600 shadow-xl shadow-forest-500/20 active:scale-95 transition-all"
                           >
                             <FiCheck className="w-4 h-4" /> RESOLVE
                           </button>
                           <button
                             onClick={() => updateStatus(ticket.id, 'rejected')}
                             className="flex-1 flex items-center justify-center gap-2 px-4 py-3.5 bg-red-500 text-white rounded-2xl text-xs font-black hover:bg-red-600 shadow-xl shadow-red-500/20 active:scale-95 transition-all"
                           >
                             <FiX className="w-4 h-4" /> REJECT
                           </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            ))
          )}
        </div>

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
