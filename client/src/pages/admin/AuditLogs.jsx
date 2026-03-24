import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { adminAPI } from '../../services/api';
import { FiActivity, FiFilter, FiInfo, FiUser, FiSettings } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import CustomDropdown from '../../components/CustomDropdown';

export default function AuditLogs() {
  const { t } = useTranslation();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ action: '', actor_type: '' });

  useEffect(() => { loadLogs(); }, [filters]);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const res = await adminAPI.getAuditLogs(filters);
      setLogs(res.data.logs || []);
    } catch (err) {}
    setLoading(false);
  };

  const actorOptions = [
    { value: '', label: 'All Actors' },
    { value: 'user', label: 'User' },
    { value: 'admin', label: 'Admin' },
    { value: 'system', label: 'System' },
  ];

  const actionOptions = [
    { value: '', label: 'All Actions' },
    { value: 'USER_REGISTERED', label: 'Registration' },
    { value: 'USER_LOGIN', label: 'User Login' },
    { value: 'ADMIN_LOGIN', label: 'Admin Login' },
    { value: 'PAYMENT_SUCCESS', label: 'Payment' },
    { value: 'TAX_GENERATION', label: 'Tax Generation' },
    { value: 'NOTICE_CREATED', label: 'Notice' },
  ];

  const actionColors = {
    USER_REGISTERED: 'bg-forest-100 text-forest-600',
    USER_LOGIN: 'bg-blue-100 text-blue-600',
    ADMIN_LOGIN: 'bg-maroon-100 text-maroon-600',
    PAYMENT_SUCCESS: 'bg-forest-100 text-forest-600',
    TAX_GENERATION: 'bg-saffron-100 text-saffron-600',
    NOTICE_CREATED: 'bg-saffron-100 text-saffron-600',
  };

  const { user } = useAuth();

  return (
    <div className="min-h-screen mountain-bg pt-20 pb-10 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-black font-heading text-maroon-500 flex items-center gap-2">
              <FiActivity className="text-saffron-500" /> {t('admin.auditLogs')}
            </h1>
            <p className="text-gray-600 text-[10px] font-black font-sans uppercase tracking-widest leading-none mt-1">Logs for District: <span className="text-saffron-600">{user?.role === 'super_admin' ? 'All Districts' : user?.district}</span></p>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-3 w-full md:flex-1">
            <CustomDropdown
              options={actorOptions}
              value={filters.actor_type}
              onChange={(val) => setFilters({...filters, actor_type: val})}
              placeholder="All Actors"
              icon={FiUser}
              className="w-full md:w-40"
            />
            <CustomDropdown
              options={actionOptions}
              value={filters.action}
              onChange={(val) => setFilters({...filters, action: val})}
              placeholder="All Actions"
              icon={FiSettings}
              className="w-full md:w-48"
            />
          </div>
        </div>



        {/* Desktop Table View */}
        <div className="hidden md:block glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gradient-to-r from-gray-50 to-gray-100">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">{t('admin.timestamp')}</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">{t('admin.action')}</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">{t('admin.actor')}</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">{t('admin.target')}</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">{t('admin.details')}</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">{t('admin.ipAddress')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">{t('common.loading')}</td></tr>
                ) : logs.length === 0 ? (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">{t('admin.noData')}</td></tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-xs text-gray-500">
                        {new Date(log.created_at).toLocaleString('en-IN')}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                          actionColors[log.action] || 'bg-gray-100 text-gray-600'
                        }`}>{log.action}</span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-600">
                        <span className={`px-1.5 py-0.5 rounded text-xs ${
                          log.actor_type === 'admin' ? 'bg-maroon-50 text-maroon-500' : 'bg-blue-50 text-blue-500'
                        }`}>{log.actor_type}</span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">{log.target_table || '—'}</td>
                      <td className="px-4 py-3 text-xs text-gray-500 max-w-xs truncate">
                        {log.details ? JSON.stringify(log.details) : '—'}
                      </td>
                      <td className="px-4 py-3 text-xs font-mono text-gray-400">{log.ip_address || '—'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden space-y-4">
          {loading ? (
            <div className="p-10 text-center text-gray-400 bg-white rounded-3xl border border-dashed">{t('common.loading')}</div>
          ) : logs.length === 0 ? (
            <div className="p-10 text-center text-gray-400 bg-white rounded-3xl border border-dashed">{t('admin.noData')}</div>
          ) : (
            logs.map((log) => (
              <div key={log.id} className="bg-white p-5 rounded-[2rem] shadow-sm border border-gray-100 space-y-4 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-gray-50 opacity-50 rounded-full -mr-12 -mt-12 -z-10"></div>
                
                <div className="flex justify-between items-start">
                  <span className={`px-3 py-1 text-[10px] font-black rounded-full uppercase tracking-wider ${
                    actionColors[log.action] || 'bg-gray-100 text-gray-600'
                  }`}>{log.action}</span>
                  <span className="text-[10px] font-bold text-gray-400">
                    {new Date(log.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">{t('admin.actor')}</p>
                    <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-tight ${
                      log.actor_type === 'admin' ? 'bg-maroon-50 text-maroon-500' : 'bg-blue-50 text-blue-500'
                    }`}>{log.actor_type}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">{t('admin.target')}</p>
                    <p className="text-xs font-bold text-gray-700">{log.target_table || '—'}</p>
                  </div>

                  <div className="flex items-center justify-between">
                    <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">{t('admin.ipAddress')}</p>
                    <p className="text-[10px] font-mono text-gray-500">{log.ip_address || '—'}</p>
                  </div>

                  <div className="pt-2 border-t border-gray-50">
                    <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">{t('admin.details')}</p>
                    <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 overflow-hidden">
                      <p className="text-[10px] font-bold text-gray-600 break-all leading-relaxed">
                        {log.details ? JSON.stringify(log.details) : '—'}
                      </p>
                    </div>
                  </div>
                </div>

                <p className="text-[9px] font-bold text-gray-300 text-right mt-2">
                  {new Date(log.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                </p>
              </div>
            ))
          )}
        </div>

        <p className="text-sm text-gray-400 mt-4 text-right">Showing {logs.length} entries</p>
      </div>
    </div>
  );
}
