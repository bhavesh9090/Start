import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { monthlyTaxAPI } from '../../services/api';
import { FiCheckCircle, FiCreditCard, FiAlertCircle, FiLock, FiDownload, FiMinusCircle } from 'react-icons/fi';
import Loader from '../../components/Loader';

export default function MonthlyTaxPayment() {
  const { t } = useTranslation();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [paying, setPaying] = useState(null);
  const [message, setMessage] = useState('');
  const [registrationMonth, setRegistrationMonth] = useState(1);
  const [registrationYear, setRegistrationYear] = useState(new Date().getFullYear());
  const [viewMode, setViewMode] = useState('calendar'); // 'grid' or 'calendar'
  const [activeMonth, setActiveMonth] = useState(new Date().getMonth() + 1);
  
  const [showInstructionModal, setShowInstructionModal] = useState(false);
  const [pendingMonth, setPendingMonth] = useState(null);

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
      // Read registration info from API response
      if (res.data.registration_month) setRegistrationMonth(res.data.registration_month);
      if (res.data.registration_year) setRegistrationYear(res.data.registration_year);
    } catch (err) {
      console.error('Failed to load monthly payments', err);
    } finally {
      setLoading(false);
    }
  };

  // Check if a given month/year is before user's registration
  const isBeforeRegistration = (year, month) => {
    if (year < registrationYear) return true;
    if (year === registrationYear && month < registrationMonth) return true;
    return false;
  };

  const getMonthData = (monthNumber) => {
    // Find payment for this month in selected year
    const record = payments.find(p => p.year === selectedYear && p.month === monthNumber);
    
    // 0. Before Registration — NOT APPLICABLE
    if (isBeforeRegistration(selectedYear, monthNumber)) {
      return {
        state: 'NOT_APPLICABLE',
        icon: <FiMinusCircle className="w-10 h-10 text-gray-300 mb-3" />,
        text: t('monthlyTax.notApplicable'),
        subtext: t('monthlyTax.beforeRegistration'),
        bgColor: 'bg-gray-50 border border-dashed border-gray-200',
        textColor: 'text-gray-300',
        canPay: false,
        record: null
      };
    }

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

  const initiatePayment = (month) => {
    setPendingMonth(month);
    setShowInstructionModal(true);
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
            loadPayments();
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
    <div className="min-h-screen flex items-center justify-center bg-[#fafaf8] dark:bg-[#121212]">
      <Loader />
    </div>
  );

  return (
    <div className="min-h-screen pt-20 pb-10 px-4 animate-fade-in transition-opacity duration-700 bg-[#fafaf8] dark:bg-[#121212] overflow-x-hidden">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-10">
          <div>
            <h1 className="text-4xl font-black text-maroon-500 dark:text-maroon-400 mb-2 tracking-tight">{t('monthlyTax.title')}</h1>
            <p className="text-gray-500 dark:text-gray-400 font-medium">{t('monthlyTax.subtitle')}</p>
            <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-2 font-black uppercase tracking-widest bg-white/50 dark:bg-white/5 w-fit px-2 py-1 rounded-lg border border-gray-100 dark:border-white/5">
              🏪 {t('monthlyTax.registrationNotice', { month: t(`months.${registrationMonth}`), year: registrationYear })}
            </p>
          </div>

          <div className="flex items-center gap-3 bg-white dark:bg-[#1E1E1E] px-5 py-2.5 rounded-2xl shadow-sm border border-gray-100 dark:border-white/10">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('tax.year')}</span>
            <select 
              value={selectedYear} 
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="bg-transparent border-none focus:ring-0 text-maroon-500 dark:text-maroon-400 font-black text-lg cursor-pointer"
            >
              {[currentYear, currentYear - 1, currentYear - 2].filter(y => y >= registrationYear).map(y => (
                <option key={y} value={y} className="dark:bg-[#1E1E1E]">{y}</option>
              ))}
            </select>
          </div>
        </div>
        
        {message && (
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="mb-8 p-5 rounded-2xl bg-forest-50 dark:bg-forest-900/20 text-forest-700 dark:text-forest-400 font-bold border-l-4 border-forest-500 shadow-sm">
            {message}
          </motion.div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {monthsList.filter(m => {
            if (selectedYear < registrationYear) return false;
            if (selectedYear === registrationYear) return m >= registrationMonth;
            return true;
          }).map((m) => {
            const data = getMonthData(m);
            const monthName = t(`months.${m}`);

            return (
              <motion.div 
                key={m} 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: m * 0.04 }}
                className={`flex flex-col items-center justify-center p-8 rounded-3xl shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 transform ${data.bgColor} ${data.state === 'NOT_APPLICABLE' ? 'opacity-50 cursor-not-allowed' : ''} ${data.state === 'FUTURE' ? 'dark:bg-[#1E1E1E]/40 dark:border-white/5' : ''}`}
              >
                <div className={`text-xl font-black mb-3 drop-shadow-sm ${data.state === 'FUTURE' || data.state === 'NOT_APPLICABLE' ? 'text-gray-400 dark:text-gray-500' : 'text-white'}`}>{monthName} {selectedYear}</div>
                <div className="mb-6 bg-white/10 dark:bg-black/20 p-4 rounded-2xl backdrop-blur-sm">{data.icon}</div>
                <div className={`text-lg font-black uppercase tracking-widest ${data.textColor}`}>{data.text}</div>
                <div className={`text-[10px] font-bold mb-8 uppercase tracking-widest opacity-80 ${data.textColor}`}>{data.subtext}</div>

                {data.canPay && (
                   <button 
                     onClick={() => initiatePayment(m)}
                     disabled={paying === m}
                     className="mt-auto w-full py-4 bg-white dark:bg-white/90 text-maroon-500 font-black rounded-xl shadow-lg active:scale-95 transition-all text-[10px] uppercase tracking-[0.2em]"
                   >
                     {paying === m ? t('monthlyTax.processing') : t('monthlyTax.payNow')}
                   </button>
                 )}

                {data.state === 'PAID' && data.record && (
                  <button 
                    onClick={() => handleDownload(data.record.id)}
                    className="mt-auto flex items-center justify-center gap-2 w-full py-3 bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-xl hover:bg-white/20 transition-colors text-xs font-black uppercase tracking-widest"
                  >
                    <FiDownload className="w-4 h-4" /> {t('monthlyTax.receipt')}
                  </button>
                 )}
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Payment Instruction Modal */}
      <AnimatePresence>
        {showInstructionModal && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 40, opacity: 0 }} 
              animate={{ scale: 1, y: 0, opacity: 1 }} 
              exit={{ scale: 0.9, y: 40, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="bg-white dark:bg-[#1E1E1E] rounded-3xl p-5 sm:p-8 max-w-[90%] sm:max-w-lg w-full shadow-2xl relative border border-gray-100 dark:border-white/10 overflow-hidden"
            >
              {/* Decorative elements */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-maroon-500/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-saffron-500/5 rounded-full blur-3xl -ml-16 -mb-16 pointer-events-none" />

              <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6 relative">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-maroon-50 dark:bg-maroon-900/30 text-maroon-600 dark:text-maroon-400 rounded-full flex items-center justify-center flex-shrink-0">
                  <FiCreditCard className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white leading-tight">भुगतान निर्देश</h3>
              </div>
              
              <div className="space-y-4 mb-6 sm:mb-8 relative">
                {/* Simulated QR Code for native feel */}
                <div className="flex flex-col items-center justify-center p-6 bg-gray-50 dark:bg-black/20 rounded-3xl border border-gray-100 dark:border-white/5 mb-6">
                  <div className="w-32 h-32 bg-white p-2 rounded-xl shadow-inner mb-3 relative overflow-hidden group">
                    <img 
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=ETAXPAY_TAX_PAYMENT_MONTH_${pendingMonth}_${selectedYear}`}
                      alt="Payment QR" 
                      className="w-full h-full object-contain grayscale opacity-50 dark:opacity-30 group-hover:opacity-100 transition-opacity"
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="bg-white/80 dark:bg-black/80 backdrop-blur-sm px-2 py-1 rounded text-[8px] font-black uppercase text-maroon-600 dark:text-maroon-400 border border-maroon-100 dark:border-maroon-900">Scan Disabled</div>
                    </div>
                  </div>
                  <span className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest text-center">
                    Quick Pay via QR (Disabled in Test Mode)
                  </span>
                </div>

                <div className="bg-orange-50 dark:bg-[#2A2010] border-l-4 border-orange-500 p-4 rounded-r-2xl">
                  <p className="text-xs font-bold text-gray-800 dark:text-gray-200 leading-relaxed">
                    This payment is in <span className="text-red-600 dark:text-red-400 font-black underline decoration-red-500/30">Test Mode</span>. UPI options might not work. Please use <span className="text-forest-600 dark:text-forest-400 bg-forest-100 dark:bg-forest-900/30 px-1.5 py-0.5 rounded-lg whitespace-nowrap">Net Banking</span>. No actual money will be deducted.
                  </p>
                  <p className="text-[11px] font-medium text-gray-600 dark:text-gray-400 mt-4 border-t border-orange-200 dark:border-orange-500/20 pt-4 leading-relaxed">
                    यह भुगतान <span className="text-red-600 dark:text-red-400 font-bold">टेस्ट मोड</span> में है। कृपया <span className="text-forest-600 dark:text-forest-400">नेट बैंकिंग</span> का उपयोग करें। यह भुगतान वास्तविक नहीं है।
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 relative">
                <button 
                  onClick={() => setShowInstructionModal(false)}
                  className="flex-1 py-4 px-4 bg-gray-100 dark:bg-[#2A2A2A] text-gray-700 dark:text-gray-300 font-bold rounded-2xl hover:bg-gray-200 dark:hover:bg-[#333333] transition-colors uppercase tracking-widest text-[10px]"
                >
                  रद्द करें / Cancel
                </button>
                <button 
                  onClick={() => {
                    setShowInstructionModal(false);
                    if (pendingMonth !== null) {
                      handlePay(pendingMonth);
                    }
                  }}
                  className="flex-1 py-4 px-4 bg-gradient-to-r from-maroon-500 to-maroon-600 text-white font-black rounded-2xl shadow-lg shadow-maroon-500/30 active:scale-95 transition-all uppercase tracking-widest text-[10px]"
                >
                  भुगतान करें / Pay
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
