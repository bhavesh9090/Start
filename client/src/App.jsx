import { useState, useEffect, useMemo } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import AOS from 'aos';
import 'aos/dist/aos.css';
import { FiInfo, FiZap, FiEye, FiCheckCircle, FiArrowRight } from 'react-icons/fi';

// Pages - Root
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import NotFound from './pages/NotFound';

// Pages - User
import UserDashboard from './pages/user/Dashboard';
import TaxTable from './pages/user/TaxTable';
import Payments from './pages/user/Payments';
import MonthlyTaxPayment from './pages/user/MonthlyTaxPayment';
import UserNotices from './pages/user/Notices';
import UserProfile from './pages/user/Profile';
import UserSupport from './pages/user/SupportTickets';

// Pages - Admin
import AdminDashboard from './pages/admin/Dashboard';
import AdminSupportHub from './pages/admin/SupportManager';
import AdminUsers from './pages/admin/Users';
import TaxAnalytics from './pages/admin/TaxAnalytics';
import AdminNotices from './pages/admin/AdminNotices';
import AdminComplaints from './pages/admin/Complaints';
import AuditLogs from './pages/admin/AuditLogs';
import AdminMonthlyTaxes from './pages/admin/MonthlyTaxes';
import AdminProfile from './pages/admin/AdminProfile';
import GovtUpdates from './pages/admin/GovtUpdates';
import AdminMeeting from './pages/admin/AdminMeeting';

// Components
import Navbar from './components/Navbar';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import ConnectivityManager from './components/ConnectivityManager';
import PWAInstallButton from './components/PWAInstallButton';
import NotificationManager from './components/NotificationManager';
import ErrorBoundary from './components/ErrorBoundary';
import UpdatePrompt from './components/UpdatePrompt';
import TopHeader from './components/TopHeader';

const BUCKET_NAME = "assets";
const STORAGE_BASE = `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/${BUCKET_NAME}`;
const logoUrl = `${STORAGE_BASE}/logo.png`;

const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { user, loading, isAdmin } = useAuth();

  if (loading) return (
    <div className="min-h-screen bg-[#fafaf8] p-4 pt-24 space-y-4 animate-pulse">
      <div className="h-8 bg-gray-200 rounded-2xl w-48"></div>
      <div className="h-4 bg-gray-100 rounded-xl w-64"></div>
      <div className="grid grid-cols-2 gap-3 mt-6">
        <div className="h-28 bg-gray-100 rounded-2xl"></div>
        <div className="h-28 bg-gray-100 rounded-2xl"></div>
        <div className="h-28 bg-gray-100 rounded-2xl"></div>
        <div className="h-28 bg-gray-100 rounded-2xl"></div>
      </div>
    </div>
  );
  if (!user) return <Navigate to="/login" />;
  if (adminOnly && !isAdmin()) return <Navigate to="/user/dashboard" />;

  return children;
};

const PageWrapper = ({ children }) => (
  <motion.div
    initial={{ opacity: 0, y: 6 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -6 }}
    transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
    className="min-h-screen bg-[#fafaf8]"
  >
    {children}
  </motion.div>
);

const AppRoutes = () => {
  const { user, isAdmin } = useAuth();
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* Public Routes */}
        <Route path="/" element={<PageWrapper><Landing /></PageWrapper>} />
        <Route path="/login" element={<PageWrapper>{user ? <Navigate to={isAdmin() ? '/admin/dashboard' : '/user/dashboard'} /> : <Login />}</PageWrapper>} />
        <Route path="/register" element={<PageWrapper>{user ? <Navigate to="/user/dashboard" /> : <Register />}</PageWrapper>} />
        <Route path="/forgot-password" element={<PageWrapper><ForgotPassword /></PageWrapper>} />

        {/* User Routes */}
        <Route path="/user/dashboard" element={<ProtectedRoute><PageWrapper><UserDashboard /></PageWrapper></ProtectedRoute>} />
        <Route path="/user/taxes" element={<ProtectedRoute><PageWrapper><TaxTable /></PageWrapper></ProtectedRoute>} />
        <Route path="/user/payments" element={<ProtectedRoute><PageWrapper><Payments /></PageWrapper></ProtectedRoute>} />
        <Route path="/user/monthly-tax" element={<ProtectedRoute><PageWrapper><MonthlyTaxPayment /></PageWrapper></ProtectedRoute>} />
        <Route path="/user/notices" element={<ProtectedRoute><PageWrapper><UserNotices /></PageWrapper></ProtectedRoute>} />
        <Route path="/user/profile" element={<ProtectedRoute><PageWrapper><UserProfile /></PageWrapper></ProtectedRoute>} />
        <Route path="/user/support" element={<ProtectedRoute><PageWrapper><UserSupport /></PageWrapper></ProtectedRoute>} />

        {/* Admin Routes */}
        <Route path="/admin/dashboard" element={<ProtectedRoute adminOnly><PageWrapper><AdminDashboard /></PageWrapper></ProtectedRoute>} />
        <Route path="/admin/support" element={<ProtectedRoute adminOnly><PageWrapper><AdminSupportHub /></PageWrapper></ProtectedRoute>} />
        <Route path="/admin/users" element={<ProtectedRoute adminOnly><PageWrapper><AdminUsers /></PageWrapper></ProtectedRoute>} />
        <Route path="/admin/analytics" element={<ProtectedRoute adminOnly><PageWrapper><TaxAnalytics /></PageWrapper></ProtectedRoute>} />
        <Route path="/admin/notices" element={<ProtectedRoute adminOnly><PageWrapper><AdminNotices /></PageWrapper></ProtectedRoute>} />
        <Route path="/admin/complaints" element={<ProtectedRoute adminOnly><PageWrapper><AdminComplaints /></PageWrapper></ProtectedRoute>} />
        <Route path="/admin/audit-logs" element={<ProtectedRoute adminOnly><PageWrapper><AuditLogs /></PageWrapper></ProtectedRoute>} />
        <Route path="/admin/monthly-tax" element={<ProtectedRoute adminOnly><PageWrapper><AdminMonthlyTaxes /></PageWrapper></ProtectedRoute>} />
        <Route path="/admin/profile" element={<ProtectedRoute adminOnly><PageWrapper><AdminProfile /></PageWrapper></ProtectedRoute>} />
        <Route path="/admin/govt-updates" element={<ProtectedRoute adminOnly><PageWrapper><GovtUpdates /></PageWrapper></ProtectedRoute>} />
        <Route path="/admin/meeting" element={<ProtectedRoute adminOnly><PageWrapper><AdminMeeting /></PageWrapper></ProtectedRoute>} />

        {/* Fallback */}
        <Route path="*" element={<PageWrapper><NotFound /></PageWrapper>} />
      </Routes>
    </AnimatePresence>
  );
};

const SplashScreen = ({ finishLoading }) => {
  useEffect(() => {
    const timer = setTimeout(finishLoading, 3000);
    return () => clearTimeout(timer);
  }, [finishLoading]);

  return (
    <motion.div 
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1, ease: "easeInOut" }}
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black overflow-hidden"
    >
      <motion.div 
        initial={{ scale: 1.2, opacity: 0 }}
        animate={{ scale: 1, opacity: 0.6 }}
        transition={{ duration: 2.5, ease: "easeOut" }}
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: `url('${STORAGE_BASE}/hola.jpg')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'blur(4px)'
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80 z-0" />

      <div className="relative z-10 flex flex-col items-center">
        <motion.div
          initial={{ y: 30, opacity: 0, scale: 0.9 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          transition={{ duration: 1, ease: [0.23, 1, 0.32, 1] }}
          className="relative w-36 h-36 sm:w-44 sm:h-44 bg-white/10 backdrop-blur-2xl rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.3)] flex items-center justify-center p-8 border border-white/20 overflow-hidden group"
        >
          <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
          <motion.img 
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ 
              repeat: Infinity, 
              repeatType: "reverse", 
              duration: 2,
              ease: "easeInOut"
            }}
            src={logoUrl} 
            alt="Logo" 
            className="w-full h-full object-contain drop-shadow-2xl" 
          />
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.8 }}
          className="mt-12 text-center"
        >
          <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tighter flex items-center gap-3 drop-shadow-2xl">
            E-Tax<span className="text-white font-extrabold uppercase bg-maroon-600 px-3 py-1 rounded-2xl shadow-lg border border-maroon-500">Pay</span>
          </h1>
          <div className="flex flex-col items-center gap-2 mt-4">
            <p className="text-[10px] sm:text-[11px] font-black text-white/60 uppercase tracking-[0.4em]">Zila Panchayat Uttarakhand</p>
            <div className="h-[1px] w-12 bg-maroon-500/50 mt-1"></div>
          </div>
        </motion.div>
      </div>

      <div className="absolute bottom-20 w-56 h-1 bg-white/10 rounded-full overflow-hidden backdrop-blur-sm border border-white/5">
        <motion.div 
          initial={{ width: "0%" }}
          animate={{ width: "100%" }}
          transition={{ duration: 2.8, ease: "easeInOut" }}
          className="h-full bg-gradient-to-r from-maroon-500 to-orange-500 shadow-[0_0_15px_rgba(255,107,0,0.5)]"
        />
      </div>

      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        className="absolute bottom-10 flex items-center gap-2 text-[9px] font-bold text-white/30 uppercase tracking-[0.2em]"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
        Secure Government Gateway
      </motion.div>
    </motion.div>
  );
};

const ProjectDisclaimer = () => {
  const { t } = useTranslation();
  const [show, setShow] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    const standalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator && window.navigator.standalone);
    setIsStandalone(!!standalone);
    const hasAgreed = localStorage.getItem('eTaxPayDisclaimerAgreed') === 'true';
    if (!standalone && !hasAgreed) {
      setShow(true);
    }
  }, []);

  const handleAgreeAndEnter = () => {
    if (agreed) {
      localStorage.setItem('eTaxPayDisclaimerAgreed', 'true');
      setShow(false);
    }
  };

  if (!show || isStandalone) return null;

  return (
    <motion.div 
      className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xl"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div 
        className="bg-white/95 backdrop-blur-2xl rounded-[2.5rem] p-8 sm:p-10 w-full max-w-sm sm:max-w-md shadow-[0_40px_100px_rgba(0,0,0,0.3)] border border-white/20 relative overflow-hidden"
        initial={{ scale: 0.9, y: 40, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 rounded-full blur-3xl -mr-16 -mt-16" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-green-500/5 rounded-full blur-3xl -ml-16 -mb-16" />

        <div className="text-center mb-8 relative">
          <motion.div 
            className="w-20 h-20 bg-gradient-to-br from-maroon-600 to-maroon-700 rounded-3xl flex items-center justify-center text-white mx-auto mb-6 shadow-2xl shadow-maroon-900/20"
            animate={{ rotate: [0, 5, -5, 0] }}
            transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
          >
            <FiInfo className="w-10 h-10" />
          </motion.div>
          <h2 className="text-2xl font-black text-gray-900 tracking-tight leading-tight mb-2">Important Disclaimer</h2>
          <div className="flex flex-col items-center gap-1">
             <span className="text-[12px] font-black text-maroon-600 uppercase tracking-widest bg-maroon-50 px-3 py-1 rounded-full border border-maroon-100">Educational Project</span>
             <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-2">Zila Panchayat Project</p>
          </div>
        </div>
        
        <div className="space-y-6 relative">
          <div className="space-y-3">
            <div className="flex gap-4 items-start p-5 bg-orange-50/50 rounded-3xl border border-orange-100">
              <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
                <FiZap className="w-4 h-4 text-orange-600" />
              </div>
              <div>
                <p className="text-[11px] font-black text-gray-800 uppercase tracking-tighter">Educational Only / शैक्षणिक कार्य</p>
                <p className="text-[10px] text-gray-500 font-medium leading-relaxed">This site is for project demonstration only.<br/>यह वेबसाइट केवल प्रोजेक्ट प्रदर्शन के लिए है।</p>
              </div>
            </div>
            <div className="flex gap-4 items-start p-5 bg-blue-50/50 rounded-3xl border border-blue-100">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                <FiEye className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <p className="text-[11px] font-black text-gray-800 uppercase tracking-tighter">Dummy Data / डमी डेटा</p>
                <p className="text-[10px] text-gray-500 font-medium leading-relaxed">No real financial transactions occur here.<br/>यहाँ कोई वास्तविक वित्तीय लेनदेन नहीं होता है।</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 py-4 px-2 border-y border-gray-100 group cursor-pointer" onClick={() => setAgreed(!agreed)}>
            <motion.div 
              className={`w-6 h-6 rounded-lg border-2 flex-shrink-0 flex items-center justify-center transition-all duration-300 ${agreed ? 'bg-maroon-600 border-maroon-600 text-white shadow-lg' : 'bg-white border-gray-200 group-hover:border-maroon-400'}`}
              whileTap={{ scale: 0.85 }}
            >
              {agreed && <FiCheckCircle className="w-4 h-4" />}
            </motion.div>
            <p className="text-[11px] sm:text-xs font-black text-gray-800 leading-tight">
              I understand and agree to the terms.<br/>
              <span className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">मैं सहमत हूँ।</span>
            </p>
          </div>

          <motion.button 
            onClick={handleAgreeAndEnter}
            disabled={!agreed}
            className={`w-full py-5 rounded-2xl font-black text-[12px] shadow-2xl transition-all uppercase tracking-[0.3em] flex items-center justify-center gap-3 ${
              agreed 
                ? 'bg-gradient-to-r from-maroon-600 to-maroon-700 text-white shadow-maroon-900/20' 
                : 'bg-gray-100 text-gray-400 cursor-not-allowed shadow-none'
            }`}
            whileHover={agreed ? { scale: 1.02, y: -2 } : {}}
            whileTap={agreed ? { scale: 0.98 } : {}}
          >
            <span>Enter Website</span>
            <FiArrowRight className="w-5 h-5" />
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default function App() {
  const { i18n } = useTranslation();
  const [isInitializing, setIsInitializing] = useState(true);

  const isStandalone = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(display-mode: standalone)').matches || (window.navigator && 'standalone' in window.navigator && window.navigator.standalone);
  }, []);

  useEffect(() => {
    document.documentElement.lang = i18n.language;
    AOS.init({
      duration: 800,
      easing: 'ease-out-cubic',
      once: true,
      offset: 60,
    });

    if (!isStandalone) {
      setIsInitializing(false);
    }
  }, [i18n.language, isStandalone]);

  return (
    <ErrorBoundary>
      <AuthProvider>
        <ToastProvider>
          <AnimatePresence mode="wait">
            {isInitializing && isStandalone ? (
              <SplashScreen finishLoading={() => setIsInitializing(false)} key="splash" />
            ) : (
              <motion.div
                key="main-app"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
              >
                <Router>
                  <ProjectDisclaimer />
                  <TopHeader />
                  <Navbar />
                  <ConnectivityManager />
                  {!isStandalone && <PWAInstallButton />}
                  <NotificationManager />
                  <UpdatePrompt />
                  <AppRoutes />
                </Router>
              </motion.div>
            )}
          </AnimatePresence>
        </ToastProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
