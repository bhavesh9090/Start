import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { monthlyTaxAPI } from '../../services/api';
import { FiCheckCircle, FiCreditCard, FiAlertCircle, FiLock, FiDownload } from 'react-icons/fi';
import Loader from '../../components/Loader';

export default function MonthlyTaxPayment() {
  const { t } = useTranslation();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [paying, setPaying] = useState(null);
  const [message, setMessage] = useState('');
  
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1; // 1 to 12

  // An array for 12 months
  const monthsList = Array.from({ length: 12 }, (_, i) => i + 1);

  useEffect(() => {
    loadPayments();
  }, []);

  const loadPayments = async () => {
    try {
      setLoading(true);
      const res = await monthlyTaxAPI.getPayments();
      setPayments(res.data.payments || []);
    } catch (err) {
      console.error('Failed to load monthly payments', err);
    } finally {
      setLoading(false);
    }
  };

  const getMonthData = (monthNumber) => {
    // Find payment for this month in selected year
    const record = payments.find(p => p.year === selectedYear && p.month === monthNumber);
    
    // Determine State
    // 1. Future
    if (selectedYear > currentYear || (selectedYear === currentYear && monthNumber > currentMonth)) {
      return {
        state: 'FUTURE',
        icon: <FiLock className="w-10 h-10 text-gray-500 mb-3" />,
        text: t('monthlyTax.future'),
        subtext: t('monthlyTax.locked'),
        bgColor: 'bg-white/40 border border-gray-200 backdrop-blur-md',
        textColor: 'text-gray-600',
        canPay: false,
        record
      };
    }

    // 2. Paid
    if (record && record.status === 'PAID') {
      return {
        state: 'PAID',
        icon: <FiCheckCircle className="w-10 h-10 text-white mb-3" />,
        text: t('monthlyTax.paid'),
        subtext: t('monthlyTax.completed'),
        bgColor: 'bg-forest-600 border border-forest-700 shadow-lg shadow-forest-500/20',
        textColor: 'text-white font-black',
        canPay: false,
        record
      };
    }

    // 3. Pending (Penalty) -> Missed month
    if (selectedYear < currentYear || (selectedYear === currentYear && monthNumber < currentMonth)) {
      return {
        state: 'PENDING',
        icon: <FiAlertCircle className="w-10 h-10 text-white mb-3" />,
        text: t('monthlyTax.pending'),
        subtext: t('monthlyTax.penaltyAdded'),
        bgColor: 'bg-red-600 border border-red-700 shadow-lg shadow-red-500/20 animate-pulse',
        textColor: 'text-white font-black',
        canPay: true,
        record: record || null
      };
    }

    // 4. Payable (Current Month)
    if (selectedYear === currentYear && monthNumber === currentMonth) {
      return {
        state: 'PAYABLE',
        icon: <FiCreditCard className="w-10 h-10 text-white mb-3" />,
        text: t('monthlyTax.pay'),
        subtext: t('monthlyTax.thisMonth'),
        bgColor: 'bg-saffron-500 border border-saffron-600 shadow-lg shadow-saffron-500/20',
        textColor: 'text-white font-black',
        canPay: true,
        record: record || null
      };
    }

    // Fallback
    return {
      state: 'UNKNOWN',
      icon: <FiAlertCircle />,
      text: t('monthlyTax.unknown'),
      subtext: '',
      bgColor: 'bg-white',
      textColor: 'text-gray-800',
      canPay: false,
      record: null
    };
  };

  const handlePay = async (month) => {
    setMessage('');
    setPaying(month);
    try {
      const orderRes = await monthlyTaxAPI.createOrder(month, selectedYear);
      const { order_id, amount, key_id } = orderRes.data;

      const options = {
        key: key_id,
        amount: Math.round(amount * 100),
        currency: 'INR',
        name: t('nav.logoName'),
        description: `Tax Payment - Month ${month}`,
        order_id: order_id,
        handler: async (response) => {
          try {
            await monthlyTaxAPI.verifyPayment({
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
              month: month,
              year: selectedYear
            });
            setMessage(t('monthlyTax.paymentSuccess'));
            loadPayments();
          } catch (err) {
            setMessage(t('monthlyTax.paymentFailed'));
            loadPayments(); // to show penalty if missed
          }
        },
        theme: { color: '#FF8C00' },
      };

      if (window.Razorpay) {
        const rzp = new window.Razorpay(options);
        rzp.open();
      } else {
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload = () => {
          const rzp = new window.Razorpay(options);
          rzp.open();
        };
        document.body.appendChild(script);
      }
    } catch (err) {
      setMessage(err.response?.data?.error || t('common.initPaymentFailed'));
    }
    setPaying(null);
  };

  const handleDownload = async (id) => {
    try {
      const res = await monthlyTaxAPI.downloadReceipt(id);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `receipt-${id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('Download error', err);
      alert(t('common.downloadFailed'));
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center mountain-bg">
      <Loader />
    </div>
  );

  return (
    <div className="min-h-screen pt-20 pb-10 px-4 animate-fade-in transition-opacity duration-700 mountain-bg">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
          <div>
            <h1 className="text-3xl font-bold text-maroon-500 mb-2">{t('monthlyTax.title')}</h1>
            <p className="text-gray-600">{t('monthlyTax.subtitle')}</p>
          </div>
          <div className="flex items-center gap-2 bg-white dark:bg-slate-800 px-4 py-2 rounded-xl shadow-sm border border-saffron-100 dark:border-slate-700">
            <span className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('tax.year')}</span>
            <select 
              value={selectedYear} 
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="bg-transparent border-none focus:ring-0 text-maroon-500 dark:text-maroon-400 font-bold text-lg cursor-pointer"
            >
              {[currentYear, currentYear - 1, currentYear - 2].map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>
        
        {message && (
          <div className="mb-6 p-4 rounded-xl bg-forest-50 text-forest-700 font-semibold border border-forest-200">
            {message}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {monthsList.map((m) => {
            const data = getMonthData(m);
            // Use translation for month name
            const monthName = t(`months.${m}`);

            return (
              <div 
                key={m} 
                 className={`flex flex-col items-center justify-center p-6 rounded-2xl shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 transform ${data.bgColor}`}
              >
                <div className={`text-xl font-black mb-2 drop-shadow-sm ${data.state === 'FUTURE' ? 'text-gray-900' : 'text-white'}`}>{monthName} {selectedYear}</div>
                <div className="mb-4">{data.icon}</div>
                <div className={`text-lg font-black uppercase tracking-widest ${data.textColor}`}>{data.text}</div>
                <div className={`text-xs font-bold mb-5 uppercase tracking-tighter ${data.state === 'FUTURE' ? 'text-gray-600' : 'text-white/80'}`}>{data.subtext}</div>

                {data.canPay && (
                   <button 
                     onClick={() => handlePay(m)}
                     disabled={paying === m}
                     className="mt-auto w-full py-3 bg-saffron-500 hover:bg-saffron-600 text-white font-black rounded-xl border-2 border-white/30 shadow-lg shadow-saffron-500/20 active:scale-95 transition-all text-[10px] uppercase tracking-[0.2em]"
                   >
                     {paying === m ? t('monthlyTax.processing') : t('monthlyTax.payNow')}
                   </button>
                )}

                {data.state === 'PAID' && data.record && (
                  <button 
                    onClick={() => handleDownload(data.record.id)}
                    className="mt-auto flex items-center justify-center gap-2 w-full py-2 bg-white/20 backdrop-blur-md border border-white/30 text-white rounded-xl hover:bg-white/30 transition-colors text-xs font-black uppercase tracking-widest"
                  >
                    <FiDownload className="w-3.5 h-3.5" /> {t('monthlyTax.receipt')}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
