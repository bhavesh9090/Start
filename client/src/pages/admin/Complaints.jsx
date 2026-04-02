import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { complaintAPI } from '../../services/api';
import { FiFilter, FiMessageSquare, FiCheck, FiX, FiInfo, FiTrash2, FiUser, FiCalendar, FiClock } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { supabase } from '../../services/supabase';
import CustomDropdown from '../../components/CustomDropdown';
import Loader from '../../components/Loader';

export default function AdminComplaints() {
  const { t } = useTranslation();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [remarks, setRemarks] = useState('');
  const [newCount, setNewCount] = useState(0);
  const { user } = useAuth();
  const { showToast } = useToast();

  useEffect(() => {
    loadComplaints();
    
    // Realtime subscription for complaints in this district
    const districtId = user?.district_id;
    const channel = supabase
      .channel('admin-complaints-realtime')
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'complaints',
          filter: districtId ? `district_id=eq.${districtId}` : undefined
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setNewCount(prev => prev + 1);
            // Optional: Show toast or sound
          }
          loadComplaints();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [statusFilter, user?.district_id]);

  const loadComplaints = async () => {
    setLoading(true);
    try {
      const res = await complaintAPI.getAll(statusFilter || undefined, 'complaint');
      setComplaints(res.data.complaints || []);
    } catch (err) {}
    setLoading(false);
  };

  const updateStatus = async (id, status) => {
    try {
      await complaintAPI.update(id, { status, admin_remarks: remarks });
      setSelectedComplaint(null);
      setRemarks('');
      loadComplaints();
      showToast(t('common.success'), 'success');
    } catch (err) {
      showToast(t('common.error'), 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm(t('common.confirmDelete'))) return;
    try {
      await complaintAPI.delete(id);
      loadComplaints();
      showToast(t('common.success'), 'success');
      if (selectedComplaint?.id === id) setSelectedComplaint(null);
    } catch (err) {
      showToast(t('common.error'), 'error');
    }
  };

  const statusColors = {
    pending: 'bg-saffron-100 text-saffron-600',
    in_progress: 'bg-blue-100 text-blue-600',
    resolved: 'bg-forest-100 text-forest-600',
    rejected: 'bg-red-100 text-red-600',
  };

  const statusOptions = [
    { value: '', label: t('adminPanel.status.all') },
    { value: 'pending', label: t('adminPanel.status.pending') },
    { value: 'in_progress', label: t('adminPanel.status.in_progress') },
    { value: 'resolved', label: t('adminPanel.status.resolved') },
    { value: 'rejected', label: t('adminPanel.status.rejected') },
  ];

  return (
    <div className="min-h-screen mountain-bg pt-20 pb-10 px-4">
      <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="animate-slide-in-left">
            <h1 className="text-3xl font-black font-heading text-maroon-500">{t('admin.complaints')}</h1>
            <p className="text-gray-500 text-[10px] font-black font-sans uppercase tracking-widest mt-1 flex items-center gap-2">
               <FiUser className="text-saffron-500" /> {t('adminPanel.district')} <span className="text-maroon-600 underline decoration-saffron-300 underline-offset-4">{user?.district}</span>
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
             <div className="bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-100 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-saffron-100 flex items-center justify-center text-saffron-600">
                   <FiClock className="w-4 h-4" />
                </div>
                <div>
                   <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Pending</p>
                   <p className="text-lg font-black text-gray-800 leading-tight">{complaints.filter(c => c.status === 'pending').length}</p>
                </div>
             </div>
             <div className="bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-100 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-forest-100 flex items-center justify-center text-forest-600">
                   <FiCheck className="w-4 h-4" />
                </div>
                <div>
                   <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Resolved</p>
                   <p className="text-lg font-black text-gray-800 leading-tight">{complaints.filter(c => c.status === 'resolved').length}</p>
                </div>
             </div>
          </div>
        </div>

        {/* Improved Tabs Filter */}
        <div className="flex items-center justify-between mb-6 bg-white/50 p-1.5 rounded-2xl w-full sm:w-fit shadow-inner border border-white/20">
           <div className="flex gap-1">
              {[
                { id: '', label: t('adminPanel.status.all'), icon: FiFilter },
                { id: 'pending', label: t('adminPanel.status.pending'), icon: FiClock },
                { id: 'resolved', label: t('adminPanel.status.resolved'), icon: FiCheck }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setStatusFilter(tab.id)}
                  className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${
                    statusFilter === tab.id ? 'bg-white text-maroon-500 shadow-md' : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
           </div>
        </div>


        <div className="space-y-4">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <Loader message={t('common.loading')} />
            </div>
          ) : complaints.length === 0 ? (
            <div className="glass-card p-8 text-center">
              <FiMessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-400">{t('admin.noData')}</p>
            </div>
          ) : (
            complaints.map((c) => (
              <div key={c.id} className="glass-card p-5">
                <div className="flex flex-col md:flex-row items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-gray-800">{c.subject}</h3>
                      <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${statusColors[c.status]}`}>
                        {t(`adminPanel.status.${c.status}`)}
                      </span>
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleDelete(c.id); }}
                        className="ml-auto p-1.5 text-red-400 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                        title={t('common.delete')}
                      >
                        <FiTrash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="text-xs sm:text-sm text-gray-600 mb-3 leading-relaxed break-words whitespace-pre-wrap italic bg-gray-50/50 p-3 rounded-xl border border-gray-100">
                      "{c.description}"
                    </p>
                    <div className="flex flex-wrap gap-4 text-[10px] text-gray-400 font-black uppercase tracking-tighter">
                      {c.name && <span className="flex items-center gap-1.5 bg-white px-2 py-1 rounded-md border border-gray-100 shadow-sm"><FiUser className="text-saffron-500" /> {c.name}</span>}
                      {c.mobile && <span className="flex items-center gap-1.5 bg-white px-2 py-1 rounded-md border border-gray-100 shadow-sm"><FiMessageSquare className="text-blue-500" /> {c.mobile}</span>}
                      <span className="flex items-center gap-1.5"><FiCalendar className="text-gray-300" /> {new Date(c.created_at).toLocaleString('en-IN')}</span>
                    </div>
                    {c.admin_remarks && (
                      <div className="mt-2 p-2 bg-saffron-50 rounded-lg">
                        <p className="text-xs text-gray-500"><strong>{t('adminPanel.labels.admin')}</strong> {c.admin_remarks}</p>
                      </div>
                    )}
                  </div>

                  {c.status === 'pending' || c.status === 'in_progress' ? (
                    <div className="flex-shrink-0 w-full md:w-auto">
                      {selectedComplaint === c.id ? (
                        <div className="space-y-2 w-full sm:w-48">
                          <textarea placeholder={t('admin.remarks')} rows={2}
                            className="input-field text-xs resize-none"
                            value={remarks} onChange={(e) => setRemarks(e.target.value)} />
                          <div className="flex flex-col sm:flex-row gap-2">
                            <button onClick={() => updateStatus(c.id, 'resolved')}
                              className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 bg-forest-500 text-white rounded-lg text-xs font-medium">
                              <FiCheck className="w-3 h-3" /> {t('admin.resolve')}
                            </button>
                            <button onClick={() => updateStatus(c.id, 'rejected')}
                              className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 bg-red-500 text-white rounded-lg text-xs font-medium">
                              <FiX className="w-3 h-3" /> {t('admin.reject')}
                            </button>
                          </div>
                          <button onClick={() => setSelectedComplaint(null)}
                            className="w-full text-xs text-gray-400 hover:text-gray-600">{t('common.cancel')}</button>
                        </div>
                      ) : (
                        <button onClick={() => setSelectedComplaint(c.id)}
                          className="px-3 py-1.5 bg-saffron-500 text-white rounded-lg text-xs font-medium hover:bg-saffron-600">
                          {t('admin.updateStatus')}
                        </button>
                      )}
                    </div>
                  ) : null}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
