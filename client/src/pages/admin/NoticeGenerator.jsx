import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { noticeAPI, taxAPI } from '../../services/api';
import { FiSend, FiAlertTriangle, FiCalendar } from 'react-icons/fi';
import Loader from '../../components/Loader';

export default function NoticeGenerator() {
  const { t } = useTranslation();
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [taxGenerating, setTaxGenerating] = useState(false);
  const [message, setMessage] = useState('');

  const [autoForm, setAutoForm] = useState({
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
  });

  const [manualForm, setManualForm] = useState({
    title: '', message: '', type: 'reminder', user_id: '',
  });

  useEffect(() => { loadNotices(); }, []);

  const loadNotices = async () => {
    try {
      const res = await noticeAPI.getAll();
      setNotices(res.data.notices || []);
    } catch (err) {}
    setLoading(false);
  };

  const handleAutoGenerate = async (e) => {
    e.preventDefault();
    setGenerating(true);
    setMessage('');
    try {
      const res = await noticeAPI.autoGenerate(autoForm);
      setMessage(`✅ ${res.data.message}`);
      loadNotices();
    } catch (err) {
      setMessage(`❌ ${err.response?.data?.error || 'Failed'}`);
    }
    setGenerating(false);
  };

  const handleTaxGenerate = async (e) => {
    e.preventDefault();
    setTaxGenerating(true);
    setMessage('');
    try {
      const res = await taxAPI.generateTaxes(autoForm);
      setMessage(`✅ ${res.data.message}`);
    } catch (err) {
      setMessage(`❌ ${err.response?.data?.error || 'Failed'}`);
    }
    setTaxGenerating(false);
  };

  const handleManualNotice = async (e) => {
    e.preventDefault();
    try {
      await noticeAPI.create(manualForm);
      setManualForm({ title: '', message: '', type: 'reminder', user_id: '' });
      setMessage('✅ Notice created');
      loadNotices();
    } catch (err) {
      setMessage(`❌ ${err.response?.data?.error || 'Failed'}`);
    }
  };

  return (
    <div className="min-h-screen bg-cream pt-20 pb-10 px-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-maroon-500 mb-6">{t('admin.noticeGenerator')}</h1>

        {message && (
          <div className={`mb-4 p-3 rounded-xl text-sm font-medium ${
            message.startsWith('✅') ? 'bg-forest-50 text-forest-600 border border-forest-200' : 'bg-red-50 text-red-600 border border-red-200'
          }`}>{message}</div>
        )}

        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          {/* Tax Generation */}
          <div className="glass-card p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <FiCalendar className="text-saffron-500" /> {t('admin.generateTax')}
            </h2>
            <form onSubmit={handleTaxGenerate} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.selectYear')}</label>
                  <select className="input-field" value={autoForm.year}
                    onChange={(e) => setAutoForm({...autoForm, year: Number(e.target.value)})}>
                    {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.selectMonth')}</label>
                  <select className="input-field" value={autoForm.month}
                    onChange={(e) => setAutoForm({...autoForm, month: Number(e.target.value)})}>
                    {Array.from({length: 12}, (_, i) => (
                      <option key={i+1} value={i+1}>{t(`months.${i+1}`)}</option>
                    ))}
                  </select>
                </div>
              </div>
              <button type="submit" disabled={taxGenerating} className="btn-saffron w-full disabled:opacity-50">
                {taxGenerating ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    {t('common.loading')}
                  </span>
                ) : t('admin.generate')}
              </button>
            </form>
          </div>

          {/* Auto Generate Notices */}
          <div className="glass-card p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <FiAlertTriangle className="text-maroon-500" /> {t('admin.generateNotice')}
            </h2>
            <form onSubmit={handleAutoGenerate} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.selectYear')}</label>
                  <select className="input-field" value={autoForm.year}
                    onChange={(e) => setAutoForm({...autoForm, year: Number(e.target.value)})}>
                    {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.selectMonth')}</label>
                  <select className="input-field" value={autoForm.month}
                    onChange={(e) => setAutoForm({...autoForm, month: Number(e.target.value)})}>
                    {Array.from({length: 12}, (_, i) => (
                      <option key={i+1} value={i+1}>{t(`months.${i+1}`)}</option>
                    ))}
                  </select>
                </div>
              </div>
              <button type="submit" disabled={generating} className="btn-maroon w-full disabled:opacity-50">
                {generating ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    {t('common.loading')}
                  </span>
                ) : t('admin.generateNotice')}
              </button>
            </form>
          </div>
        </div>

        {/* Manual Notice */}
        <div className="glass-card p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Create Manual Notice</h2>
          <form onSubmit={handleManualNotice} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <input type="text" placeholder="Title" className="input-field"
                value={manualForm.title} onChange={(e) => setManualForm({...manualForm, title: e.target.value})} required />
              <select className="input-field" value={manualForm.type}
                onChange={(e) => setManualForm({...manualForm, type: e.target.value})}>
                <option value="reminder">Reminder</option>
                <option value="warning">Warning</option>
                <option value="general">General</option>
              </select>
            </div>
            <textarea placeholder="Notice message" rows={3} className="input-field resize-none"
              value={manualForm.message} onChange={(e) => setManualForm({...manualForm, message: e.target.value})} required />
            <button type="submit" className="btn-forest flex items-center gap-2">
              <FiSend className="w-4 h-4" /> Send Notice
            </button>
          </form>
        </div>

        {/* Recent Notices */}
        <div className="glass-card p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Recent Notices ({notices.length})</h2>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {notices.slice(0, 20).map((n) => (
              <div key={n.id} className="p-3 bg-white rounded-xl border border-gray-100 flex items-start gap-3">
                <div className={`w-2 h-2 mt-2 rounded-full flex-shrink-0 ${
                  n.type === 'warning' ? 'bg-red-400' : n.type === 'reminder' ? 'bg-saffron-400' : 'bg-gray-400'
                }`}></div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-800">{n.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{n.message?.substring(0, 100)}...</p>
                  <p className="text-xs text-gray-400 mt-1">{new Date(n.created_at).toLocaleString('en-IN')}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
