import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { monthlyTaxAPI } from '../../services/api';
import { FiDownload, FiFileText } from 'react-icons/fi';
import { useToast } from '../../context/ToastContext';

export default function Payments() {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPayments();
  }, []);

  const loadPayments = async () => {
    try {
      const res = await monthlyTaxAPI.getPayments();
      // Only show PAID records in history, or all? Prompt says: SELECT month, amount, penalty, status, created_at
      setPayments(res.data.payments || []);
    } catch (err) {
      console.error('Load payments error:', err);
    }
    setLoading(false);
  };


  const handleDownloadReceipt = async (paymentId) => {
    try {
      const res = await monthlyTaxAPI.downloadReceipt(paymentId);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `receipt-${paymentId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('Download receipt error:', err);
      showToast(t('common.downloadFailed'), 'error');
    }
  };

  return (
    <div className="min-h-screen pt-20 pb-10 px-4 mountain-bg">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-maroon-500 mb-6">{t('payment.title')}</h1>

        <div className="glass-card overflow-hidden border-0 shadow-2xl">
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gradient-to-r from-forest-50/50 to-forest-100/50 border-b border-gray-100 uppercase tracking-tighter">
                  <th className="px-6 py-4 text-left text-[10px] font-black text-gray-500">{t('tableHeaders.receiptNo')}</th>
                  <th className="px-6 py-4 text-left text-[10px] font-black text-gray-500">{t('tableHeaders.month')}/{t('tableHeaders.year')}</th>
                  <th className="px-6 py-4 text-left text-[10px] font-black text-gray-500">{t('tableHeaders.amount')}</th>
                  <th className="px-6 py-4 text-left text-[10px] font-black text-gray-500">{t('tableHeaders.paymentId')}</th>
                  <th className="px-6 py-4 text-left text-[10px] font-black text-gray-500">{t('tableHeaders.paidOn')}</th>
                   <th className="px-6 py-4 text-left text-[10px] font-black text-gray-500">{t('tableHeaders.status')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loading ? (
                  <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-400 font-bold animate-pulse uppercase tracking-[0.2em]">{t('common.loading')}</td></tr>
                ) : payments.length === 0 ? (
                  <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-300 italic">{t('admin.noData')}</td></tr>
                ) : (
                  payments.map((p) => (
                    <tr key={p.id} className="hover:bg-forest-50/20 transition-all border-gray-50">
                      <td className="px-6 py-4 text-xs font-black font-mono text-saffron-600">MTX-{p.id.split('-')[0].toUpperCase()}</td>
                      <td className="px-6 py-4 text-sm font-bold text-gray-600">
                        {t(`months.${p.month}`)} {p.year}
                      </td>
                      <td className="px-6 py-4 text-sm font-black text-gray-900">₹{Number(p.amount) + Number(p.penalty || 0)}</td>
                      <td className="px-6 py-4 text-[10px] font-bold text-gray-400 font-mono">{p.razorpay_payment_id || '—'}</td>
                      <td className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase">
                        {p.created_at ? new Date(p.created_at).toLocaleString('en-IN') : '—'}
                      </td>
                       <td className="px-6 py-4 text-center">
                        <span className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-full shadow-sm ${p.status === 'PAID' ? 'bg-forest-600 text-white shadow-forest-200' : 'bg-red-600 text-white shadow-red-200 animate-pulse'}`}>
                          {p.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden divide-y divide-gray-100">
            {loading ? (
              <div className="p-12 text-center text-gray-400 font-bold animate-pulse uppercase tracking-[0.2em]">{t('common.loading')}</div>
            ) : payments.length === 0 ? (
              <div className="p-12 text-center text-gray-300 italic">{t('admin.noData')}</div>
            ) : (
              payments.map((p) => (
                <div key={p.id} className="p-5 hover:bg-forest-50/10 transition-colors">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">MTX-{p.id.split('-')[0].toUpperCase()}</p>
                      <h4 className="text-lg font-black text-gray-900">{t(`months.${p.month}`)} {p.year}</h4>
                    </div>
                    {/* Original status badge removed from here */}
                  </div>

                  <div className="flex justify-between items-center bg-gray-50/50 rounded-2xl p-4 border border-gray-100 mb-4 shadow-inner">
                    <div>
                      <p className="text-[8px] font-black text-gray-400 uppercase mb-1 tracking-widest">{t('tableHeaders.status')}</p>
                      <span className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-full shadow-sm ${p.status === 'PAID' ? 'bg-forest-600 text-white shadow-forest-200' : 'bg-red-600 text-white shadow-red-200 animate-pulse'}`}>
                        {p.status}
                      </span>
                    </div>
                  </div>

                  <div className="bg-gray-50/50 rounded-2xl p-4 border border-gray-100 mb-4">
                    <div className="flex justify-between items-end">
                      <div>
                        <p className="text-[8px] font-black text-gray-500 uppercase mb-1">{t('tableHeaders.amount')}</p>
                        <p className="text-xl font-black text-gray-900">₹{Number(p.amount) + Number(p.penalty || 0)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[8px] font-black text-gray-500 uppercase mb-1">{t('tableHeaders.paidOn')}</p>
                        <p className="text-[10px] font-bold text-gray-700">{p.created_at ? new Date(p.created_at).toLocaleDateString('en-IN') : '—'}</p>
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-gray-200/50">
                      <p className="text-[8px] font-black text-gray-500 uppercase mb-1">{t('tableHeaders.paymentId')}</p>
                      <p className="text-[10px] font-mono font-bold text-gray-600 break-all">{p.razorpay_payment_id || '—'}</p>
                    </div>
                  </div>

                </div>
              )
            ))}
          </div>
        </div>
      </div>

    </div>
  );
}
