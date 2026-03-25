import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import AOS from 'aos';
import 'aos/dist/aos.css';
import { useTranslation } from 'react-i18next';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Loader from './components/Loader';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import UserDashboard from './pages/user/Dashboard';
import TaxTable from './pages/user/TaxTable';
import Payments from './pages/user/Payments';
import MonthlyTaxPayment from './pages/user/MonthlyTaxPayment';
import UserNotices from './pages/user/Notices';
import Profile from './pages/user/Profile';
import AdminDashboard from './pages/admin/Dashboard';
import AdminUsers from './pages/admin/Users';
import TaxAnalytics from './pages/admin/TaxAnalytics';
import AdminNotices from './pages/admin/AdminNotices';
import AdminComplaints from './pages/admin/Complaints';
import AuditLogs from './pages/admin/AuditLogs';
import AdminMonthlyTaxes from './pages/admin/MonthlyTaxes';
import AdminProfile from './pages/admin/AdminProfile';
import GovtUpdates from './pages/admin/GovtUpdates';
import AdminMeeting from './pages/admin/AdminMeeting';


const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { user, loading, isAdmin } = useAuth();

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen mountain-bg">
      <Loader message="Securing Session" />
    </div>
  );
  if (!user) return <Navigate to="/login" />;
  if (adminOnly && !isAdmin()) return <Navigate to="/user/dashboard" />;

  return children;
};

const AppRoutes = () => {
  const { user, isAdmin } = useAuth();

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={user ? <Navigate to={isAdmin() ? '/admin/dashboard' : '/user/dashboard'} /> : <Login />} />
      <Route path="/register" element={user ? <Navigate to="/user/dashboard" /> : <Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />

      {/* User Routes */}
      <Route path="/user/dashboard" element={<ProtectedRoute><UserDashboard /></ProtectedRoute>} />
      <Route path="/user/taxes" element={<ProtectedRoute><TaxTable /></ProtectedRoute>} />
      <Route path="/user/payments" element={<ProtectedRoute><Payments /></ProtectedRoute>} />
      <Route path="/user/monthly-tax" element={<ProtectedRoute><MonthlyTaxPayment /></ProtectedRoute>} />
      <Route path="/user/notices" element={<ProtectedRoute><UserNotices /></ProtectedRoute>} />
      <Route path="/user/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />

      {/* Admin Routes */}
      <Route path="/admin/dashboard" element={<ProtectedRoute adminOnly><AdminDashboard /></ProtectedRoute>} />
      <Route path="/admin/users" element={<ProtectedRoute adminOnly><AdminUsers /></ProtectedRoute>} />
      <Route path="/admin/analytics" element={<ProtectedRoute adminOnly><TaxAnalytics /></ProtectedRoute>} />
      <Route path="/admin/notices" element={<ProtectedRoute adminOnly><AdminNotices /></ProtectedRoute>} />
      <Route path="/admin/complaints" element={<ProtectedRoute adminOnly><AdminComplaints /></ProtectedRoute>} />
      <Route path="/admin/audit-logs" element={<ProtectedRoute adminOnly><AuditLogs /></ProtectedRoute>} />
      <Route path="/admin/monthly-tax" element={<ProtectedRoute adminOnly><AdminMonthlyTaxes /></ProtectedRoute>} />
      <Route path="/admin/profile" element={<ProtectedRoute adminOnly><AdminProfile /></ProtectedRoute>} />
      <Route path="/admin/govt-updates" element={<ProtectedRoute adminOnly><GovtUpdates /></ProtectedRoute>} />
      <Route path="/admin/meeting" element={<ProtectedRoute adminOnly><AdminMeeting /></ProtectedRoute>} />


      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
};

import { ToastProvider } from './context/ToastContext';

export default function App() {
  const { i18n } = useTranslation();

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
    <AuthProvider>
      <ToastProvider>
        <Router>
          <Navbar />
          <AppRoutes />
        </Router>
      </ToastProvider>
    </AuthProvider>
  );
}
