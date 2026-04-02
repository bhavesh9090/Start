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
    <div className="min-h-screen flex items-center justify-center mountain-bg">
      <Loader />
    </div>
  );

  return (
    <div className="min-h-screen pt-20 pb-10 px-4 animate-fade-in transition-opacity duration-700 mountain-bg">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-10">
          <div>
            <h1 className="text-4xl font-black text-maroon-500 mb-2 tracking-tight">{t('monthlyTax.title')}</h1>
            <p className="text-gray-500 font-medium">{t('monthlyTax.subtitle')}</p>
            <p className="text-[10px] text-gray-400 mt-2 font-black uppercase tracking-widest bg-white/50 w-fit px-2 py-1 rounded-lg border border-gray-100">
              🏪 {t('monthlyTax.registrationNotice', { month: t(`months.${registrationMonth}`), year: registrationYear })}
            </p>
          </div>

          <div className="flex items-center gap-3 bg-white px-5 py-2.5 rounded-2xl shadow-sm border border-gray-100">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('tax.year')}</span>
            <select 
              value={selectedYear} 
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="bg-transparent border-none focus:ring-0 text-maroon-500 font-black text-lg cursor-pointer"
            >
              {[currentYear, currentYear - 1, currentYear - 2].filter(y => y >= registrationYear).map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>
        
        {message && (
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="mb-8 p-5 rounded-2xl bg-forest-50 text-forest-700 font-bold border-l-4 border-forest-500 shadow-sm">
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
                className={`flex flex-col items-center justify-center p-8 rounded-3xl shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 transform ${data.bgColor} ${data.state === 'NOT_APPLICABLE' ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div className={`text-xl font-black mb-3 drop-shadow-sm ${data.state === 'FUTURE' || data.state === 'NOT_APPLICABLE' ? 'text-gray-400' : 'text-white'}`}>{monthName} {selectedYear}</div>
                <div className="mb-6 bg-white/10 p-4 rounded-2xl backdrop-blur-sm">{data.icon}</div>
                <div className={`text-lg font-black uppercase tracking-widest ${data.textColor}`}>{data.text}</div>
                <div className={`text-[10px] font-bold mb-8 uppercase tracking-widest opacity-80 ${data.textColor}`}>{data.subtext}</div>

                {data.canPay && (
                   <button 
                     onClick={() => initiatePayment(m)}
                     disabled={paying === m}
                     className="mt-auto w-full py-4 bg-white text-maroon-500 font-black rounded-xl shadow-lg active:scale-95 transition-all text-[10px] uppercase tracking-[0.2em]"
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
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 40, opacity: 0 }} 
              animate={{ scale: 1, y: 0, opacity: 1 }} 
              exit={{ scale: 0.9, y: 40, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-8 max-w-[90%] sm:max-w-lg w-full shadow-2xl relative border border-gray-100"
            >
              <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <FiAlertCircle className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-maroon-600 leading-tight">Important Instructions</h3>
              </div>
              
              <div className="space-y-4 mb-6 sm:mb-8">
                <div className="bg-orange-50 border-l-4 border-orange-500 p-3 sm:p-4 rounded-r-lg shadow-inner">
                  <p className="text-xs sm:text-sm font-bold text-gray-800 mb-3">
                    This payment is in <span className="text-red-600">Test Mode</span>. UPI options might not work. The preferred option is to use <span className="text-forest-600 bg-forest-100 px-1 rounded">Net Banking</span>. Please do not be afraid, this payment is unreal/fake and your actual money will not be deducted.
                  </p>
                  <p className="text-xs sm:text-sm font-bold text-gray-800 border-t border-orange-200 pt-3">
                    यह भुगतान <span className="text-red-600">टेस्ट मोड (Test Mode)</span> में है। यूपीआई (UPI) काम नहीं कर सकता है। कृपया <span className="text-forest-600 bg-forest-100 px-1 rounded">नेट बैंकिंग (Net Banking)</span> का उपयोग करें। कृपया घबराएं नहीं, यह भुगतान वास्तविक नहीं है और आपका कोई पैसा नहीं कटेगा।
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button 
                  onClick={() => setShowInstructionModal(false)}
                  className="flex-1 py-3 px-4 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors uppercase tracking-wider text-xs"
                >
                  Cancel / रद्द करें
                </button>
                <button 
                  onClick={() => {
                    setShowInstructionModal(false);
                    if (pendingMonth !== null) {
                      handlePay(pendingMonth);
                    }
                  }}
                  className="flex-1 py-3 px-4 bg-maroon-600 text-white font-bold rounded-xl hover:bg-maroon-700 shadow-lg shadow-maroon-500/30 transition-all active:scale-95 uppercase tracking-wider text-xs"
                >
                  Proceed to Pay
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
