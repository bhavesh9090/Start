import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiGlobe, FiBell, FiUser, FiLogOut, FiMenu, FiX, FiCheck
} from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { noticeAPI } from '../services/api';
import { supabase } from '../services/supabase';

const BUCKET_NAME = "assets";
const logoUrl = `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/${BUCKET_NAME}/logo.png`;

const Navbar = () => {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, isAdmin } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showNotif, setShowNotif] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const toastTimeoutRef = useRef(null);

  const profileRef = useRef(null);
  const notifRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) setShowProfile(false);
      if (notifRef.current && !notifRef.current.contains(event.target)) setShowNotif(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'hi' : 'en';
    i18n.changeLanguage(newLang);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const toggleNotif = () => {
    setShowNotif(!showNotif);
    setShowProfile(false);
  };

  // Show toast notification
  const showToast = useCallback((title, message) => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToast({ title, message, id: Date.now() });
    toastTimeoutRef.current = setTimeout(() => setToast(null), 4000);
  }, []);

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    try {
      const res = await noticeAPI.getUserNotices();
      setNotifications(res.data.notices || []);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    }
  }, [user]);

  // Fetch on mount & setup multi-table realtime listeners
  useEffect(() => {
    if (!user) return;
    fetchNotifications();

    const channels = [];

    // Listen for new notices
    const noticeChannel = supabase
      .channel('navbar-notices')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notices' }, (payload) => {
        fetchNotifications();
        showToast('📢 New Notice', payload.new?.title || 'A new notice has been published');
      })
      .subscribe();
    channels.push(noticeChannel);

    if (isAdmin()) {
      // Admin: listen for new complaints
      const complaintChannel = supabase
        .channel('navbar-complaints')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'complaints' }, (payload) => {
          showToast('📋 New Complaint', payload.new?.subject || 'A new complaint has been filed');
        })
        .subscribe();
      channels.push(complaintChannel);

      // Admin: listen for new support tickets
      const supportChannel = supabase
        .channel('navbar-support')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'support_tickets' }, (payload) => {
          showToast('🎫 New Support Ticket', payload.new?.subject || 'A user needs help');
        })
        .subscribe();
      channels.push(supportChannel);

      // Admin: listen for new payments
      const paymentChannel = supabase
        .channel('navbar-payments')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'payments' }, (payload) => {
          showToast('💰 Payment Received', `₹${payload.new?.amount || ''} payment confirmed`);
        })
        .subscribe();
      channels.push(paymentChannel);

      // Admin: listen for new user registrations
      const userChannel = supabase
        .channel('navbar-users')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'users' }, (payload) => {
          showToast('👤 New Registration', `${payload.new?.username || 'A new user'} has registered`);
        })
        .subscribe();
      channels.push(userChannel);

      // Admin: listen for new meeting messages (Chat)
      const chatChannel = supabase
        .channel('navbar-admin-msgs')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'admin_messages' }, (payload) => {
          const msg = payload.new;
          // Show toast if it's a group message or if I'm the receiver
          if (!msg.receiver_id || msg.receiver_id === user.id) {
            if (msg.sender_id !== user.id) {
              showToast('💬 Admin Meeting', msg.content || 'New attachment received');
            }
          }
        })
        .subscribe();
      channels.push(chatChannel);
    } else {
      // User: listen for payment confirmations
      const myPaymentChannel = supabase
        .channel('navbar-my-payments')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'payments', filter: `user_id=eq.${user.id}` }, (payload) => {
          showToast('✅ Payment Successful', `₹${payload.new?.amount || ''} has been confirmed`);
        })
        .subscribe();
      channels.push(myPaymentChannel);

      // User: listen for complaint updates
      const myComplaintChannel = supabase
        .channel('navbar-my-complaints')
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'complaints', filter: `user_id=eq.${user.id}` }, (payload) => {
          const status = payload.new?.status;
          showToast('🔔 Complaint Update', status === 'resolved' ? 'Your complaint has been resolved!' : `Status: ${status}`);
        })
        .subscribe();
      channels.push(myComplaintChannel);

      // User: listen for monthly tax generation
      const taxChannel = supabase
        .channel('navbar-my-tax')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'monthly_taxes', filter: `user_id=eq.${user.id}` }, (payload) => {
          showToast('💰 Tax Due', `Monthly tax of ₹${payload.new?.amount || ''} is pending`);
        })
        .subscribe();
      channels.push(taxChannel);
    }

    return () => channels.forEach(ch => supabase.removeChannel(ch));
  }, [user, isAdmin, fetchNotifications, showToast]);

  // Cleanup toast timeout on unmount
  useEffect(() => {
    return () => { if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current); };
  }, []);

  const markAsRead = (id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
  };

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const publicLinks = [
    { to: '/', label: t('nav.home'), onClick: () => window.scrollTo({ top: 0, behavior: 'smooth' }) },
    { href: '/#how-it-works', label: t('nav.howItWorks') },
    { href: '/#help', label: t('nav.help') },
    { href: '/#complaint', label: t('nav.complaint') },
    { href: '/#about-us', label: t('nav.aboutUs') },
  ];

  const userLinks = [
    { to: '/user/dashboard', label: t('nav.dashboard') },
    { to: '/user/taxes', label: t('nav.myTaxes') },
    { to: '/user/monthly-tax', label: t('monthlyTax.navTitle') },
    { to: '/user/payments', label: t('nav.payments') },
    { to: '/user/notices', label: t('nav.notices') },
    { to: '/user/support', label: t('support.title') },
  ];

  const adminLinks = [
    { to: '/admin/dashboard', label: t('nav.dashboard') },
    { to: '/admin/users', label: t('admin.manageUsers') },
    { to: '/admin/monthly-tax', label: t('monthlyTax.navTitle') },
    { to: '/admin/analytics', label: t('admin.taxAnalytics') },
    { to: '/admin/notices', label: t('admin.noticeGenerator') },
    { to: '/admin/complaints', label: t('admin.complaints') },
    { to: '/admin/support', label: t('support.title') },
    { to: '/admin/govt-updates', label: t('govtUpdates.title') },
    { to: '/admin/meeting', label: t('admin.meeting') },
    { to: '/admin/audit-logs', label: t('admin.auditLogs') },
  ];

  const navLinks = user ? (isAdmin() ? adminLinks : userLinks) : publicLinks;

  return (
    <>
      {/* ===== MAIN NAVBAR ===== */}
      <nav className="sticky top-0 inset-x-0 z-50 bg-white border-b border-gray-100 transition-all duration-500" id="main-navbar">
        
        {/* ROW 1: Logo + Actions */}
        <div className={`max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-10 py-2 sm:py-3.5 transition-all duration-500 ${
          scrolled ? 'shadow-sm' : ''
        }`}>
          <div className="flex items-center justify-between gap-2">
            {/* Logo */}
            <Link to="/" onClick={() => setMenuOpen(false)} className="flex items-center gap-2 sm:gap-4 group flex-shrink-0">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white rounded-xl sm:rounded-2xl flex items-center justify-center p-1 sm:p-1.5 shadow-sm border border-gray-100">
                <img src={logoUrl} alt="Logo" className="w-full h-full object-contain" />
              </div>
              <div className="flex flex-col leading-tight">
                <span className="text-base sm:text-xl font-black text-[#1a202c] tracking-tight">
                  {t('nav.logoName')}
                </span>
                <span className="hidden md:block text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-0.5">
                  {t('nav.zilaPanchayat')}
                </span>
              </div>
            </Link>

            {/* Right Actions */}
            <div className="flex items-center gap-2 sm:gap-4">
              {/* Language Toggle */}
              <button onClick={toggleLanguage}
                className="flex items-center gap-1.5 text-[12px] sm:text-[13px] font-bold text-[#4a5568] hover:text-[#ff6b00] transition-all p-1.5 sm:p-2">
                <FiGlobe className="w-4 h-4" />
                <span className="hidden sm:inline">{i18n.language === 'en' ? 'हिन्दी' : 'English'}</span>
              </button>

              {/* Notification Bell */}
              {user && (
                <div className="relative" ref={notifRef}>
                  <button onClick={toggleNotif}
                    className="p-2 sm:p-2.5 text-black hover:bg-gray-100 rounded-lg sm:rounded-xl transition-all shadow-sm border border-gray-100 bg-white relative">
                    <FiBell className="w-4 h-4 sm:w-5 sm:h-5" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 min-w-[16px] h-[16px] sm:min-w-[18px] sm:h-[18px] bg-red-500 text-white text-[9px] sm:text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white animate-pulse">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </button>
                </div>
              )}

              {/* Profile */}
              {user ? (
                <div className="relative flex items-center" ref={profileRef}>
                  <button onClick={() => setShowProfile(!showProfile)}
                    className="flex items-center gap-2 sm:gap-3 p-0.5 sm:p-1 bg-white border border-gray-100 rounded-full sm:pr-4 pr-1 transition-all shadow-sm hover:shadow-md">
                    {user.photo_url ? (
                      <img src={user.photo_url} alt={user.username} className="w-8 h-8 sm:w-9 sm:h-9 rounded-full object-cover shadow-md" />
                    ) : (
                      <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#ff6b00] flex items-center justify-center text-white text-[10px] sm:text-xs font-black shadow-md">
                        {user.username?.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="hidden sm:flex flex-col items-start leading-none">
                      <span className="text-[12px] font-black text-[#1a202c] truncate max-w-[80px]">{user.username}</span>
                      <span className="text-[9px] font-bold text-[#ff6b00] uppercase tracking-widest">Active</span>
                    </div>
                  </button>
                  <AnimatePresence>
                    {showProfile && (
                      <motion.div 
                        initial={{ opacity: 0, y: 12, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 12, scale: 0.95 }}
                        className="absolute right-0 top-full mt-3 w-56 bg-white rounded-3xl shadow-2xl border border-gray-100 p-2 z-50 overflow-hidden"
                      >
                        <Link to={isAdmin() ? "/admin/profile" : "/user/profile"} 
                          onClick={() => setShowProfile(false)}
                          className="flex items-center gap-3 px-4 py-3 text-sm font-black text-black hover:bg-gray-50 rounded-2xl transition-all">
                          <FiUser className="w-4 h-4" /> Profile
                        </Link>
                        <button onClick={handleLogout}
                          className="w-full flex items-center gap-3 px-4 py-3 text-sm font-black text-[#ff6b00] hover:bg-orange-50 rounded-2xl transition-all border-t border-gray-100 mt-1 pt-2">
                          <FiLogOut className="w-4 h-4" /> Sign Out
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <>
                  {/* Desktop Login/Register */}
                  <div className="hidden sm:flex items-center gap-8">
                    <Link to="/login" className="text-[14px] font-black text-[#ff6b00] hover:scale-105 transition-all">
                      {t('nav.login')}
                    </Link>
                    <Link to="/register" className="px-8 py-3 bg-[#ff6b00] text-white text-[14px] font-black rounded-full shadow-lg shadow-orange-500/20 hover:scale-105 active:scale-95 transition-all whitespace-nowrap">
                      {t('nav.register')}
                    </Link>
                  </div>
                  {/* Mobile Login/Register */}
                  <div className="flex sm:hidden items-center gap-2">
                    <Link to="/login" className="text-[12px] font-black text-[#ff6b00] px-3 py-1.5">
                      {t('nav.login')}
                    </Link>
                    <Link to="/register" className="px-4 py-1.5 bg-[#ff6b00] text-white text-[12px] font-black rounded-full shadow-md">
                      {t('nav.register')}
                    </Link>
                  </div>
                </>
              )}

              {/* Mobile hamburger (only when logged in) */}
              {user && (
                <button onClick={() => setMenuOpen(!menuOpen)}
                  className="lg:hidden p-1.5 sm:p-2 text-[#4a5568]">
                  {menuOpen ? <FiX className="w-5 h-5 sm:w-6 sm:h-6" /> : <FiMenu className="w-5 h-5 sm:w-6 sm:h-6" />}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ===== ROW 2: Page Navigation Links (Public & User) ===== */}
        <>
            {/* Desktop: horizontal tab bar */}
            <div className="hidden lg:block border-t border-gray-100 bg-white">
              <div className="max-w-7xl w-full mx-auto px-6 sm:px-10">
                <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide py-2">
                  {navLinks.map((link, i) => {
                    const isActive = link.href ? location.hash === link.href : location.pathname === link.to;
                    
                    if (link.href) {
                      return (
                        <a key={i} href={link.href}
                          className={`px-4 py-2 text-[13px] font-bold rounded-xl transition-all whitespace-nowrap ${
                            isActive 
                              ? 'text-white bg-[#ff6b00] shadow-md shadow-orange-500/20' 
                              : 'text-[#4a5568] hover:text-[#ff6b00] hover:bg-orange-50'
                          }`}>
                          {link.label}
                        </a>
                      );
                    }

                    return (
                      <Link key={i} to={link.to}
                        onClick={link.onClick}
                        className={`px-4 py-2 text-[13px] font-bold rounded-xl transition-all whitespace-nowrap ${
                          isActive 
                            ? 'text-white bg-[#ff6b00] shadow-md shadow-orange-500/20' 
                            : 'text-[#4a5568] hover:text-[#ff6b00] hover:bg-orange-50'
                        }`}>
                        {link.label}
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Mobile/Tablet: scrollable pill bar */}
            <div className="lg:hidden border-t border-gray-100 bg-white">
              <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide px-3 py-2"
                   style={{ WebkitOverflowScrolling: 'touch' }}>
                {navLinks.map((link, i) => {
                  const isActive = link.href ? location.hash === link.href : location.pathname === link.to;
                  
                  if (link.href) {
                    return (
                      <a key={i} href={link.href}
                        className={`px-3 py-1.5 text-[11px] font-bold rounded-lg transition-all whitespace-nowrap flex-shrink-0 ${
                          isActive 
                            ? 'text-white bg-[#ff6b00] shadow-sm' 
                            : 'text-[#4a5568] bg-gray-50 hover:bg-orange-50'
                        }`}>
                        {link.label}
                      </a>
                    );
                  }

                  return (
                    <Link key={i} to={link.to}
                      onClick={link.onClick}
                      className={`px-3 py-1.5 text-[11px] font-bold rounded-lg transition-all whitespace-nowrap flex-shrink-0 ${
                        isActive 
                          ? 'text-white bg-[#ff6b00] shadow-sm' 
                          : 'text-[#4a5568] bg-gray-50 hover:bg-orange-50'
                      }`}>
                      {link.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          </>

        {/* Mobile Menu overlay (hamburger) */}
        <AnimatePresence>
          {menuOpen && user && (
            <motion.div 
              initial={{ opacity: 0, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.98 }}
              className="lg:hidden absolute top-full inset-x-3 sm:inset-x-4 bg-white border border-gray-100 shadow-2xl rounded-2xl sm:rounded-3xl overflow-hidden z-40 p-4 sm:p-6 mt-1"
            >
              <div className="grid grid-cols-2 sm:grid-cols-1 gap-1">
                {navLinks.map((link, i) => (
                  <Link key={i} to={link.to || '#'} onClick={() => setMenuOpen(false)}
                    className={`px-3 sm:px-5 py-2.5 sm:py-3.5 text-[12px] sm:text-sm font-black rounded-xl sm:rounded-2xl transition-all text-center sm:text-left ${
                      location.pathname === link.to ? 'bg-[#ff6b00] text-white shadow-lg shadow-orange-500/20' : 'text-gray-900 hover:bg-orange-50'
                    }`}>
                    {link.label}
                  </Link>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
      {/* ===== NOTIFICATION PANEL (Full-screen on mobile, dropdown on desktop) ===== */}
      <AnimatePresence>
        {showNotif && user && (
          <>
            {/* Backdrop for mobile */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowNotif(false)}
              className="fixed inset-0 bg-black/20 z-[60] sm:hidden"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              ref={notifRef}
              className="fixed sm:absolute left-4 right-4 sm:left-auto sm:right-4 top-1/2 sm:top-[68px] -translate-y-1/2 sm:translate-y-0 sm:w-96 bg-white rounded-3xl shadow-2xl border border-gray-100 z-[70] overflow-hidden max-h-[80vh] sm:max-h-[70vh] flex flex-col"
            >
              {/* Header */}
              <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-black text-gray-900">Notifications</h3>
                  {unreadCount > 0 && (
                    <span className="text-[10px] font-bold text-white bg-red-500 px-2 py-0.5 rounded-full">
                      {unreadCount}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <button onClick={markAllRead} className="text-[11px] font-bold text-[#ff6b00] hover:underline">
                      Mark all read
                    </button>
                  )}
                  <button onClick={() => setShowNotif(false)} className="p-1 hover:bg-gray-100 rounded-lg sm:hidden">
                    <FiX className="w-4 h-4 text-gray-500" />
                  </button>
                </div>
              </div>

              {/* Notification List */}
              <div className="flex-1 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="py-12 text-center">
                    <div className="w-14 h-14 mx-auto mb-3 bg-gray-50 rounded-2xl flex items-center justify-center">
                      <FiBell className="w-7 h-7 text-gray-200" />
                    </div>
                    <p className="text-sm text-gray-400 font-bold">{t('dashboard.noNotifications')}</p>
                    <p className="text-[11px] text-gray-300 mt-1">New alerts will appear here</p>
                  </div>
                ) : (
                  notifications.slice(0, 20).map((n, idx) => (
                    <div key={n.id}
                      onClick={() => markAsRead(n.id)}
                      className={`px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors flex items-start gap-3 ${
                        !n.is_read ? 'bg-orange-50/60' : ''
                      } ${idx !== 0 ? 'border-t border-gray-50' : ''}`}>
                      <div className={`w-2.5 h-2.5 mt-1 rounded-full flex-shrink-0 transition-colors ${
                        !n.is_read ? 'bg-[#ff6b00] shadow-sm shadow-orange-300' : 'bg-gray-200'
                      }`} />
                      <div className="flex-1 min-w-0">
                        <p className={`text-[13px] truncate ${!n.is_read ? 'font-black text-gray-900' : 'font-bold text-gray-600'}`}>{n.title}</p>
                        <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-2 leading-relaxed">{n.message}</p>
                        <p className="text-[10px] text-gray-400 font-bold mt-1">
                          {new Date(n.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      {!n.is_read && (
                        <div className="mt-1 flex-shrink-0">
                          <div className="w-5 h-5 rounded-full border border-gray-200 flex items-center justify-center hover:bg-orange-50">
                            <FiCheck className="w-3 h-3 text-gray-300" />
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>

              {/* Footer */}
              {notifications.length > 0 && (
                <Link to={isAdmin() ? '/admin/notices' : '/user/notices'}
                  onClick={() => setShowNotif(false)}
                  className="block text-center py-3 text-[12px] font-black text-[#ff6b00] hover:bg-orange-50 transition-colors border-t border-gray-100 flex-shrink-0">
                  View All Notices →
                </Link>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ===== TOAST NOTIFICATION ===== */}
      <AnimatePresence>
        {toast && (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: -50, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: -50, x: '-50%' }}
            className="fixed top-20 left-1/2 z-[80] w-[calc(100%-2rem)] sm:w-auto sm:min-w-[320px] sm:max-w-[420px]"
          >
            <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 p-4 flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-orange-50 flex items-center justify-center flex-shrink-0">
                <FiBell className="w-4 h-4 text-[#ff6b00]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-black text-gray-900 truncate">{toast.title}</p>
                <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-1">{toast.message}</p>
              </div>
              <button onClick={() => setToast(null)} className="p-1 hover:bg-gray-100 rounded-lg flex-shrink-0">
                <FiX className="w-3.5 h-3.5 text-gray-400" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;
