import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../../services/supabase';
import { monthlyTaxAPI } from '../../services/api';
import { useTranslation } from 'react-i18next';
import { FiActivity, FiDollarSign, FiInfo, FiTrendingUp } from 'react-icons/fi';

export default function AdminMonthlyTaxes() {
  const { t } = useTranslation();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPayments();

    // Set up Supabase Realtime Subscription
    const subscription = supabase
      .channel('public:monthly_payments')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'monthly_payments' },
        (payload) => {
          console.log('Real-time update received:', payload);
          // Instead of manually mutating the state which might miss joins,
          // refetch or handle it properly. Refetch is safe and instantaneous enough.
          fetchPayments();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const res = await monthlyTaxAPI.getAllPayments();
      setPayments(res.data.payments || []);
    } catch (error) {
      console.error('Error fetching payments:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen mountain-bg pt-20 pb-10 px-4 animate-fade-in">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="animate-slide-in-left">
            <h1 className="text-3xl font-bold text-maroon-500 flex items-center gap-2">
              <FiTrendingUp className="text-saffron-500 interactive-icon" /> {t('adminPanel.monthlyTax.streamsTitle')}
            </h1>
            <p className="text-gray-600 text-sm mt-1">{t('adminPanel.monthlyTax.streamsDesc')}</p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-saffron-50 rounded-lg text-saffron-600 text-[10px] font-bold border border-saffron-100 animate-fade-in delay-300">
            <FiActivity className="animate-pulse" /> LIVE STREAMING
          </div>
        </div>

        <div className="modern-card overflow-hidden border-0 shadow-2xl animate-fade-in-up delay-100">
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-100 uppercase tracking-tighter">
                  <th className="p-4 text-[10px] font-black text-gray-500">{t('adminPanel.users.table.profile')}</th>
                  <th className="p-4 text-[10px] font-black text-gray-500">{t('adminPanel.labels.gstId')}</th>
                  <th className="p-4 text-[10px] font-black text-gray-500">{t('adminPanel.labels.monthYear')}</th>
                  <th className="p-4 text-[10px] font-black text-gray-500">{t('tax.amount')}</th>
                  <th className="p-4 text-[10px] font-black text-gray-500">{t('tax.penalty')}</th>
                  <th className="p-4 text-[10px] font-black text-gray-500">{t('adminPanel.users.table.status')}</th>
                  <th className="p-4 text-[10px] font-black text-gray-500">{t('adminPanel.labels.dateLogged')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 font-bold">
                {loading && payments.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="p-12 text-center text-gray-400 font-bold animate-pulse uppercase tracking-widest">{t('adminPanel.monthlyTax.loading')}</td>
                  </tr>
                ) : payments.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="p-12 text-center text-gray-300 italic">{t('adminPanel.monthlyTax.noMatching')}</td>
                  </tr>
                ) : (
                  payments.map((p, i) => (
                    <tr 
                      key={p.id} 
                      className="hover:bg-forest-50/20 transition-all border-gray-50 animate-fade-in opacity-0"
                      style={{ animationDelay: `${i * 50}ms`, animationFillMode: 'forwards' }}
                    >
                      <td className="p-4 text-sm font-black text-gray-900 group-hover:text-maroon-600">{p.users?.username || 'Unknown'}</td>
                      <td className="p-4 text-xs text-gray-500 font-mono tracking-tight">{p.users?.gst_id || 'N/A'}</td>
                      <td className="p-4 text-sm text-gray-700">{`${p.month} / ${p.year}`}</td>
                      <td className="p-4 text-sm font-black text-gray-900">₹{p.amount}</td>
                      <td className="p-4 text-sm text-red-500">{Number(p.penalty) > 0 ? `₹${p.penalty}` : '—'}</td>
                      <td className="p-4">
                        <span className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-full ${p.status === 'PAID' ? 'bg-forest-100 text-forest-600' : 'bg-red-100 text-red-600'} hover:scale-110 transition-transform cursor-default inline-block`}>
                          {p.status === 'PAID' ? t('tax.paid') : t('tax.unpaid')}
                        </span>
                      </td>
                      <td className="p-4 text-[10px] font-bold text-gray-400 uppercase">{new Date(p.created_at).toLocaleString('en-IN')}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden divide-y divide-gray-100">
            {loading && payments.length === 0 ? (
              <div className="p-12 text-center text-gray-400 font-bold animate-pulse uppercase tracking-widest">{t('adminPanel.monthlyTax.loading')}</div>
            ) : payments.length === 0 ? (
              <div className="p-12 text-center text-gray-300 italic">{t('adminPanel.monthlyTax.noMatching')}</div>
            ) : (
              payments.map((p, i) => (
                <div 
                  key={p.id} 
                  className="p-5 hover:bg-forest-50/10 transition-colors animate-fade-in-up opacity-0"
                  style={{ animationDelay: `${i * 100}ms`, animationFillMode: 'forwards' }}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h4 className="text-lg font-black text-gray-900 leading-tight group-hover:text-maroon-600 transition-colors">{p.users?.username || 'Unknown'}</h4>
                      <p className="text-[10px] font-mono font-bold text-gray-400 mt-1 uppercase leading-none">{p.users?.gst_id || 'N/A'}</p>
                    </div>
                    <span className={`px-3 py-1 text-[9px] font-black uppercase tracking-widest rounded-full ${p.status === 'PAID' ? 'bg-forest-100 text-forest-600' : 'bg-red-100 text-red-600'} hover:scale-110 transition-transform`}>
                      {p.status === 'PAID' ? t('tax.paid') : t('tax.unpaid')}
                    </span>
                  </div>

                  <div className="bg-gray-50/50 rounded-2xl p-4 border border-gray-100 hover:border-saffron-200 transition-colors">
                    <div className="flex justify-between items-end mb-3">
                      <div>
                        <p className="text-[8px] font-black text-gray-500 uppercase mb-1">{t('adminPanel.labels.monthYear')}</p>
                        <p className="text-sm font-bold text-gray-700">{`${p.month} / ${p.year}`}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[8px] font-black text-gray-500 uppercase mb-1">{t('adminPanel.labels.dateLogged')}</p>
                        <p className="text-[10px] font-bold text-gray-700">{new Date(p.created_at).toLocaleDateString('en-IN')}</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 pt-3 border-t border-gray-200/50">
                      <div>
                        <p className="text-[8px] font-black text-gray-500 uppercase mb-1">{t('tax.amount')}</p>
                        <p className="text-lg font-black text-gray-900">₹{p.amount}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[8px] font-black text-gray-500 uppercase mb-1">{t('tax.penalty')}</p>
                        <p className="text-lg font-black text-red-600">{Number(p.penalty) > 0 ? `₹${p.penalty}` : '—'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
