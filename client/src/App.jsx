import { useState, useEffect, useMemo } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import AOS from 'aos';
import 'aos/dist/aos.css';

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
const logoUrl = `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/${BUCKET_NAME}/logo.png`;

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
      {/* Cinematic Background with Blur */}
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

      {/* Content Container */}
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

      {/* Progress Bar */}
      <div className="absolute bottom-20 w-56 h-1 bg-white/10 rounded-full overflow-hidden backdrop-blur-sm border border-white/5">
        <motion.div 
          initial={{ width: "0%" }}
          animate={{ width: "100%" }}
          transition={{ duration: 2.8, ease: "easeInOut" }}
          className="h-full bg-gradient-to-r from-maroon-500 to-orange-500 shadow-[0_0_15px_rgba(255,107,0,0.5)]"
        />
      </div>

      {/* Footer Text */}
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

export default function App() {
  const { i18n } = useTranslation();
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    document.documentElement.lang = i18n.language;
    AOS.init({
      duration: 800,
      easing: 'ease-out-cubic',
      once: true,
      offset: 60,
    });
  }, [i18n.language]);

  return (
    <ErrorBoundary>
      <AuthProvider>
        <ToastProvider>
          <AnimatePresence mode="wait">
            {isInitializing ? (
              <SplashScreen finishLoading={() => setIsInitializing(false)} key="splash" />
            ) : (
              <motion.div
                key="main-app"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
              >
                <Router>
                  <TopHeader />
                  <Navbar />
                  <ConnectivityManager />
                  <PWAInstallButton />
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
