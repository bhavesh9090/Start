import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { monthlyTaxAPI } from '../../services/api';
import { supabase } from '../../services/supabase';
import { useAuth } from '../../context/AuthContext';
import { FiDownload, FiFilter, FiCreditCard } from 'react-icons/fi';
import { useToast } from '../../context/ToastContext';

const TAX_AMOUNTS = {
  'Grocery & Retail': 200,
  'Restaurant & Cafe': 500,
  'Electronics & Hardware': 600,
  'Medical & Pharmacy': 400,
  'Clothing & Apparels': 300,
  'Services & Consultancy': 250,
  'Small Kiosk / Vendor': 100,
};

export default function TaxTable() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [message, setMessage] = useState({ text: '', type: '' });

  const monthlyTax = TAX_AMOUNTS[user?.business_type] || 500;

  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  useEffect(() => {
    loadData();
    
    // Set up Real-time listener
    const channel = supabase
      .channel('tax-updates')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'monthly_payments',
        filter: `user_id=eq.${user?.id}`
      }, () => {
        loadData(); // Re-fetch on any change
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  const loadData = async () => {
    try {
      const res = await monthlyTaxAPI.getPayments();
      setPayments(res.data.payments || []);
    } catch (err) {
      console.error('Failed to load payments', err);
    } finally {
      setLoading(false);
    }
  };

  // Generate 12 months for the selected year
  const getTableData = () => {
    const yearNum = parseInt(selectedYear);
    return Array.from({ length: 12 }, (_, i) => {
      const monthNum = i + 1;
      const record = payments.find(p => p.year === yearNum && p.month === monthNum);
      
      let status = 'locked';
      if (yearNum < currentYear || (yearNum === currentYear && monthNum <= currentMonth)) {
        status = record?.status === 'PAID' ? 'paid' : (record?.status === 'PENDING' ? 'pending' : 'due');
      }

      return {
        id: record?.id || `temp-${yearNum}-${monthNum}`,
        year: yearNum,
        month: monthNum,
        amount: record?.amount || 0, // We'll need to handle the display amount if record is missing
        penalty: record?.penalty || 0,
        status: status,
        record: record
      };
    });
  };

  const canPay = (tax) => {
    if (tax.status === 'paid') return false;
    // Cannot pay future tax
    if (tax.year > currentYear || (tax.year === currentYear && tax.month > currentMonth)) return false;
    return true;
  };

  const getStatusDisplay = (item) => {
    if (item.status === 'paid') return { label: t('tax.paid'), class: 'bg-forest-600 text-white shadow-sm shadow-forest-200' };
    if (item.status === 'locked') return { label: t('tax.locked'), class: 'bg-slate-200 text-slate-600' };
    if (item.status === 'pending') return { label: t('monthlyTax.pending'), class: 'bg-red-600 text-white shadow-sm shadow-red-200 animate-pulse' };
    return { label: t('tax.due'), class: 'bg-saffron-500 text-white shadow-sm shadow-saffron-200' };
  };


  const exportCSV = () => {
    const data = getTableData();
    const headers = [
      t('tableHeaders.year'), 
      t('tableHeaders.month'), 
      t('tableHeaders.amount'), 
      t('tableHeaders.penalty'), 
      t('tableHeaders.total'), 
      t('tableHeaders.status'), 
      t('tableHeaders.paidOn')
    ];
    const rows = data.map(item => [
      item.year, t(`months.${item.month}`), item.amount || '-', item.penalty || 0,
      Number(item.amount || 0) + Number(item.penalty || 0),
      item.status, item.record?.created_at || ''
    ]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tax_records_${selectedYear}.csv`;
    a.click();
  };

  const years = [currentYear, currentYear - 1, currentYear - 2];
  const tableTaxes = getTableData();

  return (
    <div className="min-h-screen pt-20 pb-10 px-4 mountain-bg">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-maroon-500">{t('tax.title')}</h1>
            {user?.business_type && (
              <div className="mt-2 flex items-center gap-2 text-saffron-600 font-semibold animate-slide-in-left">
                <div className="w-2 h-2 rounded-full bg-saffron-500 animate-ping"></div>
                {t('monthlyTax.taxDescription', { 
                  type: t(`auth.businessCategories.${Object.keys(TAX_AMOUNTS).find(k => k === user.business_type) ? (user.business_type === 'Grocery & Retail' ? 'grocery' : user.business_type === 'Restaurant & Cafe' ? 'restaurant' : user.business_type === 'Electronics & Hardware' ? 'electronics' : user.business_type === 'Medical & Pharmacy' ? 'medical' : user.business_type === 'Clothing & Apparels' ? 'clothing' : user.business_type === 'Services & Consultancy' ? 'services' : 'small') : 'small'}`), 
                  amount: monthlyTax 
                })}
              </div>
            )}
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <FiFilter className="text-gray-400" />
              <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)}
                className="input-field py-2 w-auto">
                <option value="">{t('tax.all')}</option>
                {years.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            <button onClick={exportCSV} className="flex items-center gap-1.5 px-4 py-2 bg-forest-500 text-white rounded-xl text-sm font-medium hover:bg-forest-600 transition-colors">
              <FiDownload className="w-4 h-4" /> {t('tax.exportCsv')}
            </button>
          </div>
        </div>

        {message.text && (
          <div className={`mb-4 p-4 rounded-xl text-sm font-medium ${
            message.type === 'success' ? 'bg-forest-50 text-forest-600 border border-forest-200' : 'bg-red-50 text-red-600 border border-red-200'
          }`}>{message.text}</div>
        )}

        <div className="glass-card overflow-hidden">
        <div className="glass-card overflow-hidden border-0 shadow-2xl">
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gradient-to-r from-saffron-50/50 to-saffron-100/50 border-b border-gray-100 uppercase tracking-tighter">
                  <th className="px-6 py-4 text-left text-[10px] font-black text-gray-500">{t('tableHeaders.year')}</th>
                  <th className="px-6 py-4 text-left text-[10px] font-black text-gray-500">{t('tableHeaders.month')}</th>
                  <th className="px-6 py-4 text-left text-[10px] font-black text-gray-500">{t('tableHeaders.amount')}</th>
                  <th className="px-6 py-4 text-left text-[10px] font-black text-gray-500">{t('tableHeaders.penalty')}</th>
                  <th className="px-6 py-4 text-left text-[10px] font-black text-gray-500">{t('tableHeaders.total')}</th>
                  <th className="px-6 py-4 text-left text-[10px] font-black text-gray-500">{t('tableHeaders.status')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loading ? (
                  <tr><td colSpan={7} className="px-6 py-12 text-center text-gray-400 font-bold animate-pulse uppercase tracking-[0.2em]">{t('common.loading')}</td></tr>
                ) : tableTaxes.length === 0 ? (
                  <tr><td colSpan={7} className="px-6 py-12 text-center text-gray-300 italic">{t('admin.noData')}</td></tr>
                ) : (
                  tableTaxes.map((item) => {
                    const status = getStatusDisplay(item);
                    return (
                      <tr key={item.id} className="hover:bg-saffron-50/20 transition-all border-gray-50">
                        <td className="px-6 py-4 text-sm font-black text-gray-900">{item.year}</td>
                        <td className="px-6 py-4 text-sm font-bold text-gray-600">{t(`months.${item.month}`)}</td>
                        <td className="px-6 py-4 text-sm font-semibold text-gray-600">{item.amount > 0 ? `₹${item.amount}` : '—'}</td>
                        <td className="px-6 py-4 text-sm font-bold text-red-500">{item.penalty > 0 ? `₹${item.penalty}` : '—'}</td>
                        <td className="px-6 py-4 text-sm font-black text-gray-900">{item.amount > 0 ? `₹${Number(item.amount) + Number(item.penalty || 0)}` : '—'}</td>
                        <td className="px-6 py-4 text-center">
                          <span className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-full ${status.class}`}>{status.label}</span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden divide-y divide-gray-100">
            {loading ? (
              <div className="p-12 text-center text-gray-400 font-bold animate-pulse uppercase tracking-[0.2em]">{t('common.loading')}</div>
            ) : tableTaxes.length === 0 ? (
              <div className="p-12 text-center text-gray-300 italic">{t('admin.noData')}</div>
            ) : (
              tableTaxes.map((item) => {
                const status = getStatusDisplay(item);
                return (
                  <div key={item.id} className="p-5 hover:bg-saffron-50/10 transition-colors">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">{item.year}</p>
                        <h4 className="text-lg font-black text-gray-900">{t(`months.${item.month}`)}</h4>
                      </div>
                      <span className={`px-3 py-1 text-[9px] font-black uppercase tracking-widest rounded-full ${status.class}`}>
                        {status.label}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2 mb-4 bg-gray-50/50 rounded-2xl p-3 border border-gray-100">
                      <div>
                        <p className="text-[8px] font-black text-gray-400 uppercase">{t('tableHeaders.amount')}</p>
                        <p className="text-xs font-bold text-gray-700">{item.amount > 0 ? `₹${item.amount}` : '—'}</p>
                      </div>
                      <div>
                        <p className="text-[8px] font-black text-gray-400 uppercase">{t('tableHeaders.penalty')}</p>
                        <p className="text-xs font-bold text-red-500">{item.penalty > 0 ? `₹${item.penalty}` : '—'}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[8px] font-black text-gray-400 uppercase">{t('tableHeaders.total')}</p>
                        <p className="text-sm font-black text-gray-900">{item.amount > 0 ? `₹${Number(item.amount) + Number(item.penalty || 0)}` : '—'}</p>
                      </div>
                    </div>

                  </div>
                );
              })
            )}
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}
