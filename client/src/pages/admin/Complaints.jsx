import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { complaintAPI } from '../../services/api';
import { FiFilter, FiMessageSquare, FiCheck, FiX, FiInfo, FiTrash2 } from 'react-icons/fi';
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
      const res = await complaintAPI.getAll(statusFilter || undefined);
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
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-black font-heading text-maroon-500">{t('admin.complaints')}</h1>
            <p className="text-gray-600 text-[10px] font-black font-sans uppercase tracking-widest mt-1">{t('adminPanel.district')} <span className="text-saffron-600">{user?.district}</span></p>
          </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
            {newCount > 0 && (
              <button 
                onClick={() => { setNewCount(0); loadComplaints(); }}
                className="flex items-center gap-2 px-3 py-1.5 bg-forest-500 text-white rounded-lg text-xs font-bold animate-bounce shadow-lg shadow-forest-500/20"
              >
                <FiMessageSquare className="w-3.5 h-3.5" />
                {t('adminPanel.newComplaints', { count: newCount })}
              </button>
            )}
            
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <CustomDropdown
                options={statusOptions}
                value={statusFilter}
                onChange={(val) => setStatusFilter(val)}
                placeholder={t('adminPanel.status.all')}
                icon={FiFilter}
                className="w-full sm:w-48"
              />
            </div>
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
                    <p className="text-xs sm:text-sm text-gray-600 mb-2 leading-relaxed break-words whitespace-pre-wrap">
                      {c.description}
                    </p>
                    <div className="flex flex-wrap gap-4 text-[8px] text-gray-400 font-bold uppercase tracking-wider">
                      {c.name && <span>{t('adminPanel.labels.name')} {c.name}</span>}
                      {c.mobile && <span>{t('adminPanel.labels.mobile')} {c.mobile}</span>}
                      {c.users?.username && <span>{t('adminPanel.labels.user')} {c.users.username}</span>}
                      <span>{new Date(c.created_at).toLocaleString('en-IN')}</span>
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
