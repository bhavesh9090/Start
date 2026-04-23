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
    const timer = setTimeout(finishLoading, 2500);
    return () => clearTimeout(timer);
  }, [finishLoading]);

  return (
    <motion.div 
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8, ease: "easeInOut" }}
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#fafaf8]"
    >
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute bottom-0 left-0 right-0 h-[40vh] bg-gradient-to-t from-black/5 to-transparent"></div>
      </div>

      <div className="relative flex flex-col items-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1, ease: [0.23, 1, 0.32, 1] }}
          className="relative w-32 h-32 sm:w-40 sm:h-40 bg-white rounded-3xl shadow-xl flex items-center justify-center p-6 border border-gray-100 overflow-hidden"
        >
          <img src={logoUrl} alt="Logo" className="w-full h-full object-contain" />
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.8 }}
          className="mt-10 text-center"
        >
          <h1 className="text-3xl font-black text-black tracking-tighter flex items-center gap-2">
            E-Tax<span className="text-maroon-700 font-extrabold uppercase bg-maroon-50 px-2.5 py-0.5 rounded-xl border border-maroon-100">Pay</span>
          </h1>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mt-3">Zila Panchayat Uttarakhand</p>
        </motion.div>
      </div>

      <div className="absolute bottom-20 w-48 h-1 bg-gray-100 rounded-full overflow-hidden">
        <motion.div 
          initial={{ width: "0%" }}
          animate={{ width: "100%" }}
          transition={{ duration: 2.2, ease: "easeInOut" }}
          className="h-full bg-black shadow-[0_0_10px_rgba(0,0,0,0.5)]"
        />
      </div>
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
          <AnimatePresence>
            {isInitializing && isStandalone && (
              <SplashScreen finishLoading={() => setIsInitializing(false)} key="splash" />
            )}
          </AnimatePresence>
          
          {( !isInitializing || !isStandalone ) && (
            <Router>
              <TopHeader />
              <Navbar />
              <ConnectivityManager />
              <PWAInstallButton />
              <NotificationManager />
              <UpdatePrompt />
              <AppRoutes />
            </Router>
          )}
        </ToastProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
