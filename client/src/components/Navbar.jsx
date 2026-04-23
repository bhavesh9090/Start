import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { FiMenu, FiX, FiGlobe, FiBell, FiLogOut, FiUser, FiShield, FiUserCheck } from 'react-icons/fi';
import { supabase } from '../services/supabase';
import { adminAPI } from '../services/api';
// Supabase Storage Configuration
const BUCKET_NAME = "assets";
const logoUrl = `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/${BUCKET_NAME}/logo.png`;

export default function Navbar() {
  const { t, i18n } = useTranslation();
  const { user, logout, isAdmin } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showNotif, setShowNotif] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [unreadHubCount, setUnreadHubCount] = useState(0);

  const notifRef = useRef(null);
  const profileRef = useRef(null);

  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setScrolled(window.scrollY > 20);
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotif(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setShowProfile(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchNotifs = async () => {
      if (!user || isAdmin()) return;
      
      let dbNotifs = [];
      let notices = [];

      // 1. Fetch real notifications
      try {
        const res = await adminAPI.getNotifications();
        dbNotifs = res.data.notifications || [];
      } catch (e) { /* ignore */ }

      // 2. Fetch notices
      try {
        const res = await noticeAPI.getUserNotices();
        notices = res.data.notices || [];
      } catch (e) { /* ignore */ }

      // 2.5 Fetch user support tickets status
      try {
        const res = await complaintAPI.getUserComplaints();
        const userTickets = res.data.complaints || [];
        const ticketNotifs = userTickets
          .filter(c => c.status === 'resolved' || c.status === 'rejected')
          .map(c => ({
            id: `ticket-${c.id}`,
            title: c.status === 'resolved' ? 'Ticket Resolved' : 'Ticket Updated',
            message: c.admin_remarks ? `${c.subject}: ${c.admin_remarks}` : c.subject,
            created_at: c.updated_at || c.created_at,
            is_read: false,
            type: c.status === 'resolved' ? 'success' : 'important'
          }));
        
        dbNotifs = [...dbNotifs, ...ticketNotifs];
      } catch (e) { /* ignore */ }

      // 3. Map notices to notification format
      const noticeNotifs = notices.map(n => ({
        id: `notice-${n.id}`, 
        title: n.title,
        message: n.message,
        created_at: n.created_at,
        is_read: false,
        type: 'info'
      }));

      // 4. Combine and deduplicate
      const combined = [...dbNotifs];
      noticeNotifs.forEach(nn => {
        if (!combined.some(cn => cn.title === nn.title)) {
          combined.push(nn);
        }
      });

      // Sort by date (newest first) and limit to 4
      const sorted = combined.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      setNotifications(sorted.slice(0, 4));
    };

    fetchNotifs();
    const interval = setInterval(fetchNotifs, 30.2 * 1000); // 30.2s polling
    return () => clearInterval(interval);
  }, [user]);

  // Real-time Meeting Hub Notifications for Admins
  useEffect(() => {
    if (!user || !isAdmin()) return;

    const fetchUnreadHub = async () => {
      try {
        const { count, error } = await supabase
          .from('admin_messages')
          .select('*', { count: 'exact', head: true })
          .eq('receiver_id', user.id)
          .eq('is_read', false);
        
        if (!error) setUnreadHubCount(count || 0);
      } catch (err) {
        console.error('Error fetching hub unread:', err);
      }
    };

    fetchUnreadHub();

    const channel = supabase
      .channel('navbar-meeting-notifs')
      .on('postgres_changes', {
        event: '*', 
        schema: 'public',
        table: 'admin_messages'
      }, (payload) => {
        fetchUnreadHub();
      })
      .subscribe();

    // Real-time Support Ticket Notifications for Users
    const supportChannel = supabase
      .channel('navbar-support-notifs')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'complaints',
        filter: `user_id=eq.${user.id}`
      }, (payload) => {
        // Trigger refetch of notifications when a ticket is updated
        fetchNotifs();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(supportChannel);
    };
  }, [user]);

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'hi' : 'en';
    i18n.changeLanguage(newLang);
    document.documentElement.lang = newLang;
  };

  const handleLogout = () => {
    logout();
    navigate('/');
    setMenuOpen(false);
  };

  const markAllAsRead = async () => {
    const unread = notifications.filter(n => !n.is_read);
    if (unread.length === 0) return;
    try {
      await Promise.all(unread.map(n => adminAPI.markNotificationRead(n.id)));
      // Update local state without clearing, just marking as read
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (err) {
      console.error('Failed to mark notifications as read:', err);
    }
  };

  const toggleNotif = () => {
    const newState = !showNotif;
    setShowNotif(newState);
    if (newState) {
      setShowProfile(false);
      markAllAsRead();
    }
  };

  const isLanding = location.pathname === '/';
  const isAuthPage = ['/login', '/register', '/forgot-password'].includes(location.pathname);

  const publicLinks = [
    { href: '/#about', label: t('nav.about') },
    { href: '/#howitworks', label: t('nav.howItWorks') },
    { href: '/#help', label: t('nav.help') },
    { href: '/#complaint', label: t('nav.complaint') },
    { href: '/#about-us', label: t('nav.aboutUs') },
  ];

  const userLinks = [
    { to: '/user/dashboard', label: t('dashboard.title') },
    { to: '/user/taxes', label: t('tax.title') },
    { to: '/user/payments', label: t('payment.title') },
    { to: '/user/monthly-tax', label: t('monthlyTax.navTitle') },
    { to: '/user/notices', label: t('notice.title') },
    { to: '/user/support', label: t('support.title') },
  ];

  const adminLinks = [
    { to: '/admin/dashboard', label: t('admin.dashboard') },
    { to: '/admin/users', label: t('admin.users') },
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
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      scrolled ? 'bg-white/95 backdrop-blur-md shadow-lg' : 'bg-white/80 backdrop-blur-sm'
    }`}>
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Logo (Stays Left) */}
          <Link to="/" className="flex items-center gap-2 group flex-shrink-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 bg-white rounded-xl flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow overflow-hidden p-1 sm:p-1.5 flex-shrink-0">
              <img 
                src={logoUrl} 
                alt="Logo" 
                className="w-full h-full object-contain drop-shadow-md" 
                loading="eager"
                fetchpriority="high"
                decoding="async"
              />
            </div>
            <div className="flex flex-col min-w-0 py-1">
              <span className="text-base sm:text-lg lg:text-xl font-bold text-maroon-500 block leading-relaxed max-w-[14rem] sm:max-w-[18rem] truncate pb-0.5">
                {t('nav.logoName')}
              </span>
              <span className="text-[10px] sm:text-[11px] text-gray-500 font-medium leading-tight -mt-0.5 truncate">
                {t('nav.zilaPanchayat')}
              </span>
            </div>
          </Link>

          {/* Regular User Nav Links (Hidden for admins in Tier 1) */}
          {!isAdmin() && (
            <div className="hidden lg:flex items-center gap-0.5">
              {navLinks.map((link, i) => {
                const isActive = link.href ? false : location.pathname === link.to;
                return link.href ? (
                  <a key={i} href={link.href}
                    className="px-3 py-2 text-[13px] font-bold text-gray-600 hover:text-saffron-600 hover:bg-saffron-50 rounded-xl transition-all relative group whitespace-nowrap">
                    {link.label}
                    <span className="absolute bottom-1 left-3 right-3 h-0.5 bg-saffron-500 scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></span>
                  </a>
                ) : (
                  <Link key={i} to={link.to}
                    className={`px-3 py-2 text-[13px] font-bold rounded-xl transition-all relative group flex items-center gap-1.5 whitespace-nowrap ${
                      isActive
                        ? 'text-saffron-600 bg-saffron-50/50 shadow-sm'
                        : 'text-gray-600 hover:text-saffron-600 hover:bg-saffron-50'
                    }`}>
                    {link.label}
                    {isActive && <span className="absolute bottom-1 left-3 right-3 h-0.5 bg-saffron-500 rounded-full"></span>}
                  </Link>
                );
              })}
            </div>
          )}

          {/* Right Actions (Consistently on the RIGHT) */}
          <div className="flex items-center gap-2">
            {/* Language Toggle */}
            <button onClick={toggleLanguage}
              className="flex items-center gap-1 px-2 sm:px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-saffron-600 hover:bg-saffron-50 rounded-lg transition-colors"
              title="Toggle Language">
              <FiGlobe className="w-4 h-4" />
              <span className="hidden sm:inline">{t('nav.language')}</span>
            </button>

            {/* Notifications */}
            {user && !isAdmin() && (
              <div className="relative" ref={notifRef}>
                <button onClick={toggleNotif}
                  className="relative p-2 text-gray-600 hover:text-saffron-600 hover:bg-saffron-50 rounded-lg transition-all active:scale-90">
                  <FiBell className="w-5 h-5" />
                  {notifications.filter(n => !n.is_read).length > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-saffron-500 text-white text-xs rounded-full flex items-center justify-center animate-pulse shadow-md">
                      {notifications.filter(n => !n.is_read).length}
                    </span>
                  )}
                </button>
                <AnimatePresence>
                  {showNotif && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.2, ease: "easeOut" }}
                      className="fixed inset-x-4 top-[70px] sm:absolute sm:inset-auto sm:right-0 sm:top-full mt-2 sm:w-80 bg-white rounded-xl shadow-2xl border border-gray-100 max-h-[80vh] sm:max-h-96 overflow-y-auto z-[60] origin-top-right"
                    >
                      <div className="p-3 border-b border-gray-100">
                        <h3 className="font-semibold text-gray-800">{t('dashboard.notifications')}</h3>
                      </div>
                      {notifications.length === 0 ? (
                        <p className="p-4 text-sm text-gray-500">{t('dashboard.noNotifications')}</p>
                      ) : (
                        notifications.slice(0, 10).map((n) => (
                          <div key={n.id} className={`p-3 border-b border-gray-50 hover:bg-saffron-50 transition-colors relative ${!n.is_read ? 'bg-saffron-50/30' : ''}`}>
                            <div className="flex justify-between items-start gap-2">
                               <p className={`text-sm font-medium ${!n.is_read ? 'text-gray-900' : 'text-gray-800'}`}>{n.title}</p>
                               {!n.is_read && <span className="w-2 h-2 bg-saffron-500 rounded-full mt-1 flex-shrink-0 animate-bounce"></span>}
                            </div>
                            <p className="text-xs text-gray-500 mt-1 line-clamp-2">{n.message}</p>
                          </div>
                        ))
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* Profile Dropdown */}
            {user ? (
               <div className="relative flex items-center gap-2.5" ref={profileRef}>
                 <div className="hidden sm:flex flex-col items-end leading-tight mr-1 max-w-[120px] lg:max-w-[150px]">
                   <span className="text-[13px] font-bold text-gray-800 truncate w-full text-right">{user.username}</span>
                   <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-0.5 whitespace-nowrap">
                     {isAdmin() ? 'ADMIN' : (user.gst_id ? user.gst_id : 'USER')}
                   </span>
                 </div>
                 <button onClick={() => { setShowProfile(!showProfile); setShowNotif(false); }}
                   className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center transition-all overflow-hidden ${
                     showProfile ? 'ring-2 ring-saffron-500 shadow-inner' : 'shadow-sm'
                   }`}>
                   {user.photo_url ? (
                     <img src={user.photo_url} alt="Profile" className="w-full h-full object-cover" />
                   ) : (
                     <div className={`w-full h-full flex items-center justify-center text-white text-sm font-bold bg-gradient-to-br ${isAdmin() ? 'from-maroon-500 to-maroon-600' : 'from-saffron-500 to-saffron-600'}`}>
                       {user.username?.charAt(0).toUpperCase()}
                     </div>
                   )}
                 </button>
                 <AnimatePresence>
                   {showProfile && (
                     <motion.div 
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-[60] origin-top-right"
                      >
                       <Link to={isAdmin() ? "/admin/profile" : "/user/profile"} 
                         onClick={() => setShowProfile(false)}
                         className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-saffron-50 hover:text-saffron-600 transition-colors">
                         <FiUser className="w-4 h-4" /> {t('profile.title')}
                       </Link>
                       <button onClick={handleLogout}
                         className="w-full flex items-center gap-2 px-4 py-2 text-sm text-maroon-600 hover:bg-maroon-50 transition-colors">
                         <FiLogOut className="w-4 h-4" /> {t('nav.logout')}
                       </button>
                     </motion.div>
                   )}
                 </AnimatePresence>
               </div>
            ) : (
              <div className="hidden sm:flex items-center gap-2">
                <Link to="/login" className="px-4 py-2 text-sm font-medium text-saffron-600 hover:bg-saffron-50 rounded-xl">{t('nav.login')}</Link>
                <Link to="/register" className="px-4 py-2 text-sm font-medium text-white bg-saffron-500 rounded-xl shadow-md">{t('nav.register')}</Link>
              </div>
            )}

            {/* Mobile Menu Button */}
            <button onClick={() => setMenuOpen(!menuOpen)}
              className="lg:hidden p-2 text-gray-600 hover:text-saffron-600 rounded-lg ml-1">
              {menuOpen ? <FiX className="w-6 h-6" /> : <FiMenu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Admin Tier 2: Dedicated Navigation Modules Ribon */}
      {user && isAdmin() && (
        <div className="hidden lg:block bg-gradient-to-r from-gray-50 via-white to-gray-50 border-t border-gray-100 shadow-sm py-1.5 scrollbar-hide">
          <div className="max-w-7xl mx-auto px-6 overflow-x-auto whitespace-nowrap scrollbar-hide">
            <div className="flex items-center justify-center gap-1.5">
              {navLinks.map((link, i) => {
                const isActive = location.pathname === link.to;
                return (
                  <Link key={i} to={link.to}
                    className={`px-3 py-1.5 text-[13.5px] font-bold rounded-xl transition-all relative group flex items-center gap-1.5 whitespace-nowrap ${
                      isActive
                        ? 'text-saffron-600 bg-saffron-50/70 shadow-sm ring-1 ring-saffron-100'
                        : 'text-gray-500 hover:text-saffron-600 hover:bg-saffron-50/50'
                    }`}>
                    <span className="relative flex items-center gap-1.5">
                      {link.label}
                      {link.to === '/admin/meeting' && unreadHubCount > 0 && (
                        <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 1, repeat: Infinity }}>
                          <FiBell className="w-3 h-3 text-red-500 fill-red-500" />
                        </motion.div>
                      )}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Mobile Menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="lg:hidden bg-white border-t border-gray-100 shadow-lg max-h-[calc(100vh-56px)] overflow-y-auto sm:max-h-[calc(100vh-64px)] origin-top"
          >
            <div className="px-3 sm:px-4 py-3 space-y-1">
              {navLinks.map((link, i) => (
                link.href ? (
                  <a key={i} href={link.href} onClick={() => setMenuOpen(false)}
                    className="block px-4 py-2.5 text-sm font-medium text-gray-700 hover:text-saffron-600 hover:bg-saffron-50 rounded-lg">
                    {link.label}
                  </a>
                ) : (
                  <Link key={i} to={link.to} onClick={() => setMenuOpen(false)}
                    className={`flex items-center justify-between px-4 py-2.5 text-sm font-medium rounded-lg ${
                      location.pathname === link.to ? 'text-saffron-600 bg-saffron-50' : 'text-gray-700 hover:text-saffron-600 hover:bg-saffron-50'
                    }`}>
                    <span>{link.label}</span>
                    {link.to === '/admin/meeting' && unreadHubCount > 0 && (
                      <span className="flex items-center gap-1 text-red-500 text-[10px] font-bold bg-red-50 px-2 py-0.5 rounded-full">
                        <FiBell className="w-3 h-3 fill-red-500" />
                        {unreadHubCount}
                      </span>
                    )}
                  </Link>
                )
              ))}
              {!user ? (
                <div className="pt-2 space-y-1 border-t border-gray-100">
                  <Link to="/login" onClick={() => setMenuOpen(false)}
                    className="block px-4 py-2.5 text-sm font-medium text-saffron-600">{t('nav.login')}</Link>
                  <Link to="/register" onClick={() => setMenuOpen(false)}
                    className="block px-4 py-2.5 text-sm font-medium text-white bg-saffron-500 rounded-lg text-center">{t('nav.register')}</Link>
                </div>
              ) : (
                <div className="pt-2 border-t border-gray-100">
                  <div className="flex items-center gap-3 px-4 py-4 bg-gray-50/50 rounded-xl mb-2">
                    <div className="w-10 h-10 rounded-lg bg-white shadow-sm overflow-hidden flex-shrink-0 flex items-center justify-center">
                      {user.photo_url ? (
                        <img src={user.photo_url} alt="Profile" className="w-full h-full object-cover" />
                      ) : (
                        <div className={`w-full h-full flex items-center justify-center text-white text-sm font-bold bg-gradient-to-br ${isAdmin() ? 'from-maroon-500 to-maroon-600' : 'from-saffron-500 to-saffron-600'}`}>
                          {user.username?.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-sm font-bold text-gray-900 truncate">{user.username}</span>
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest truncate">
                        {isAdmin() 
                          ? (user.role === 'super_admin' ? 'Super Admin' : 'District Admin') 
                          : (user.gst_id ? user.gst_id : 'User')}
                      </span>
                    </div>
                  </div>
                  <button onClick={handleLogout}
                    className="w-full px-4 py-2.5 text-sm font-medium text-maroon-500 text-left rounded-lg hover:bg-maroon-50 flex items-center gap-2">
                    <FiLogOut className="w-4 h-4" />
                    {t('nav.logout')}
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
    {/* Spacer to prevent Two-Tier overlap on admin pages */}
    {user && isAdmin() && <div className="w-full h-[46px] hidden lg:block pointer-events-none"></div>}
    </>
  );
}
