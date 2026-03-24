import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { noticeAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { FiSend, FiBell, FiInfo, FiAlertCircle } from 'react-icons/fi';

export default function AdminNotices() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    message: '',
  });
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchNotices();
  }, []);

  const fetchNotices = async () => {
    try {
      setLoading(true);
      const res = await noticeAPI.getAll();
      setNotices(res.data.notices || []);
    } catch (error) {
      console.error('Error fetching notices:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.message) return;

    setSubmitting(true);
    setMessage({ type: '', text: '' });
    try {
      await noticeAPI.create(formData);
      setMessage({ type: 'success', text: t('common.success') });
      setFormData({ title: '', message: '' });
      fetchNotices();
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.error || t('common.error') });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen mountain-bg pt-20 pb-10 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-black font-heading text-maroon-500 flex items-center gap-2">
              <FiBell className="text-saffron-500 animate-bounce" /> Notices
            </h1>
            <p className="text-gray-600 text-[10px] font-black font-sans uppercase tracking-[0.2em] mt-1">{t('adminPanel.district')} <span className="text-saffron-600">{user?.district}</span></p>
          </div>
          
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Create Notice Form */}
          <div className="lg:col-span-1">
            <div className="glass-card p-6 sticky top-24">
              <h2 className="text-lg font-semibold text-gray-800 mb-6 flex items-center gap-2">
                <FiSend className="text-saffron-500" /> {t('adminPanel.notices.newBroadcast')}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('adminPanel.notices.noticeTitle')}</label>
                  <input
                    type="text"
                    required
                    className="input-field"
                    placeholder={t('adminPanel.notices.noticeTitlePlaceholder')}
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('adminPanel.notices.messageBody')}</label>
                  <textarea
                    required
                    rows="5"
                    className="input-field resize-none"
                    placeholder={t('adminPanel.notices.messagePlaceholder')}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  ></textarea>
                </div>

                {message.text && (
                  <div className={`p-3 rounded-lg flex items-center gap-2 text-sm ${
                    message.type === 'success' ? 'bg-forest-50 text-forest-600' : 'bg-red-50 text-red-600'
                  }`}>
                    <FiAlertCircle /> {message.text}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-saffron w-full flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <FiSend /> {submitting ? t('common.loading') : t('adminPanel.notices.broadcastBtn')}
                </button>
              </form>
            </div>
          </div>

          {/* Sent Notices List */}
          <div className="lg:col-span-2">
            <div className="glass-card p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-6 flex items-center gap-2">
                <FiBell className="text-saffron-500" /> {t('adminPanel.notices.historyTitle')}
              </h2>
              
              {loading ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-saffron-500"></div>
                </div>
              ) : notices.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <FiBell className="w-12 h-12 mx-auto mb-4 opacity-20" />
                  {t('adminPanel.notices.noNotices')}
                </div>
              ) : (
                <div className="space-y-4">
                  {notices.map((n) => (
                    <div key={n.id} className="p-4 rounded-xl border border-gray-100 hover:border-saffron-200 transition-colors bg-white/50">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-bold text-gray-800">{n.title}</h3>
                        <span className="text-[8px] font-black px-2 py-0.5 rounded-full uppercase bg-saffron-100 text-saffron-600 tracking-widest">
                          {n.districts?.name || user?.district}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-3 whitespace-pre-wrap">{n.message}</p>
                      <div className="flex items-center justify-between text-[8px] font-black text-gray-400 uppercase tracking-widest">
                        <span>{t('adminPanel.labels.id')} {n.id.split('-')[0]}...</span>
                        <span>{new Date(n.created_at).toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
