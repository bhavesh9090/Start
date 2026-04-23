import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiMenu, FiX, FiGlobe, FiBell, FiUser, FiLogOut, 
  FiLayout, FiFileText, FiShield, FiPieChart, 
  FiAlertCircle, FiSettings, FiCalendar, FiActivity,
  FiChevronDown, FiExternalLink
} from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';

const BUCKET_NAME = "assets";
const logoUrl = `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/${BUCKET_NAME}/logo.png`;

const Navbar = () => {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, isAdmin } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showNotif, setShowNotif] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadHubCount, setUnreadHubCount] = useState(0);

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
    <nav className="sticky top-0 inset-x-0 z-50 flex justify-center px-0 transition-all duration-500 bg-white border-b border-gray-100">
      <div className={`max-w-7xl w-full mx-auto px-6 sm:px-10 py-3.5 transition-all duration-500 ${
        scrolled 
          ? 'bg-white shadow-sm' 
          : 'bg-white'
      }`}>
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" onClick={() => setMenuOpen(false)} className="flex items-center gap-4 group flex-shrink-0">
            <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center p-1.5 shadow-sm border border-gray-100">
              <img src={logoUrl} alt="Logo" className="w-full h-full object-contain" />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-xl font-black text-[#1a202c] tracking-tight">
                E-TaxPay
              </span>
              <span className="hidden sm:block text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-0.5">
                Zila Panchayat Uttarakhand
              </span>
            </div>
          </Link>

          {/* Nav Links */}
          <div className="hidden lg:flex items-center gap-6">
            {navLinks.map((link, i) => {
              const isActive = link.href ? false : location.pathname === link.to;
              return link.href ? (
                <a key={i} href={link.href}
                  className="text-[14px] font-bold text-[#4a5568] hover:text-[#ff6b00] transition-colors whitespace-nowrap">
                  {link.label}
                </a>
              ) : (
                <Link key={i} to={link.to}
                  onClick={link.onClick}
                  className={`text-[14px] font-bold transition-all whitespace-nowrap ${
                    isActive ? 'text-[#ff6b00]' : 'text-[#4a5568] hover:text-[#ff6b00]'
                  }`}>
                  {link.label}
                </Link>
              );
            })}
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-5">
            <button onClick={toggleLanguage}
              className="flex items-center gap-2 text-[13px] font-bold text-[#4a5568] hover:text-[#ff6b00] transition-all">
              <FiGlobe className="w-4 h-4" />
              <span className="hidden sm:inline">{i18n.language === 'en' ? 'हिन्दी' : 'English'}</span>
            </button>

            {user && (
              <div className="relative" ref={notifRef}>
                <button onClick={toggleNotif}
                  className="p-2.5 text-black hover:bg-gray-100 rounded-xl transition-all shadow-sm border border-gray-100 bg-white">
                  <FiBell className="w-5 h-5" />
                  {notifications.filter(n => !n.is_read).length > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-black rounded-full border-2 border-white animate-pulse"></span>
                  )}
                </button>
              </div>
            )}

            {user ? (
               <div className="relative flex items-center" ref={profileRef}>
                  <button onClick={() => setShowProfile(!showProfile)}
                    className="flex items-center gap-3 p-1 bg-white border border-gray-100 rounded-full pr-4 transition-all shadow-sm hover:shadow-md">
                    <div className="w-9 h-9 rounded-full bg-[#ff6b00] flex items-center justify-center text-white text-xs font-black shadow-md group-hover:scale-105 transition-transform">
                      {user.username?.charAt(0).toUpperCase()}
                    </div>
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
              <div className="hidden sm:flex items-center gap-8">
                <Link to="/login" className="text-[14px] font-black text-[#ff6b00] hover:scale-105 transition-all">
                  Login
                </Link>
                <Link to="/register" className="px-8 py-3 bg-[#ff6b00] text-white text-[14px] font-black rounded-full shadow-lg shadow-orange-500/20 hover:scale-105 active:scale-95 transition-all whitespace-nowrap">
                  Register
                </Link>
              </div>
            )}

            <button onClick={() => setMenuOpen(!menuOpen)}
              className="lg:hidden p-2 text-[#4a5568]">
              {menuOpen ? <FiX className="w-6 h-6" /> : <FiMenu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            className="lg:hidden absolute top-24 inset-x-4 bg-white border border-gray-100 shadow-2xl rounded-[3rem] overflow-hidden z-40 p-10"
          >
            <div className="grid grid-cols-1 gap-2">
              {navLinks.map((link, i) => (
                <Link key={i} to={link.to || '#'} onClick={() => setMenuOpen(false)}
                  className={`px-5 py-4 text-sm font-black rounded-2xl transition-all ${
                    location.pathname === link.to ? 'bg-[#ff6b00] text-white shadow-lg shadow-orange-500/20' : 'text-gray-900 hover:bg-orange-50'
                  }`}>
                  {link.label}
                </Link>
              ))}
              {!user && (
                <div className="flex flex-col gap-2 mt-4 pt-4 border-t border-gray-100">
                  <Link to="/login" onClick={() => setMenuOpen(false)} className="px-5 py-4 text-center font-black text-[#ff6b00] bg-orange-50 rounded-2xl">Login</Link>
                  <Link to="/register" onClick={() => setMenuOpen(false)} className="px-5 py-4 text-center font-black text-white bg-[#ff6b00] rounded-2xl shadow-lg shadow-orange-500/20">Register</Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>

    {/* Admin Tier 2 Ribbon */}
    {user && isAdmin() && !menuOpen && (
      <div className="fixed top-24 inset-x-0 z-40 flex justify-center px-4 pointer-events-none">
        <div className="max-w-fit pointer-events-auto bg-white border border-gray-200 shadow-xl rounded-2xl px-2 py-1.5 flex items-center gap-1 overflow-x-auto scrollbar-hide">
          {navLinks.slice(1).map((link, i) => (
            <Link key={i} to={link.to}
              className={`px-3 py-2 text-[11px] font-black rounded-xl transition-all whitespace-nowrap ${
                location.pathname === link.to ? 'bg-[#ff6b00] text-white shadow-md shadow-orange-500/10' : 'text-gray-900 hover:bg-orange-50'
              }`}>
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    )}
    </>
  );
};

export default Navbar;
