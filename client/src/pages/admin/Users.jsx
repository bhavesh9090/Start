import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { adminAPI } from '../../services/api';
import { supabase } from '../../services/supabase';
import { FiSearch, FiUnlock, FiLock, FiUser, FiInfo, FiUsers, FiX, FiPhone, FiMapPin, FiBriefcase, FiCalendar, FiCheckCircle, FiAlertCircle, FiMap, FiSend, FiCamera, FiEdit3, FiSave } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import uttarakhandData from '../../data/uttarakhand';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { useMemo } from 'react';
import { monthlyTaxAPI, noticeAPI } from '../../services/api';
import CustomDropdown from '../../components/CustomDropdown';
import Loader from '../../components/Loader';


export default function AdminUsers() {
  const { t } = useTranslation();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({ block: '', business_type: '' });
  const [selectedUser, setSelectedUser] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [userPayments, setUserPayments] = useState([]);
  const [loadingTaxes, setLoadingTaxes] = useState(false);
  
  // Notice state for specific user
  const [personalNotice, setPersonalNotice] = useState({ title: '', message: '' });
  const [sendingNotice, setSendingNotice] = useState(false);
  const [noticeStatus, setNoticeStatus] = useState({ type: '', text: '' });

  // User Profile Edit state
  const fileInputRef = useRef(null);
  const [isEditingUser, setIsEditingUser] = useState(false);
  const [editUserData, setEditUserData] = useState({});
  const [savingUser, setSavingUser] = useState(false);

  const handleEditUserToggle = () => {
    setIsEditingUser(!isEditingUser);
    if (!isEditingUser) {
      setEditUserData(selectedUser);
    }
  };

  const handleEditUserChange = (e) => {
    setEditUserData({ ...editUserData, [e.target.name]: e.target.value });
  };

  const handleSaveUser = async () => {
    try {
      setSavingUser(true);
      const res = await adminAPI.updateUser(selectedUser.id, editUserData);
      setSelectedUser(res.data.user);
      setUsers(users.map(u => u.id === selectedUser.id ? res.data.user : u));
      setIsEditingUser(false);
      setNoticeStatus({ type: 'success', text: 'User profile updated successfully' });
      setTimeout(() => setNoticeStatus({ type: '', text: '' }), 3000);
    } catch (err) {
      console.error(err);
      setNoticeStatus({ type: 'error', text: 'Failed to update user profile' });
    } finally {
      setSavingUser(false);
    }
  };

  const handlePhotoUploadUser = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setSavingUser(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('profiles')
        .upload(fileName, file);

      if (uploadError) throw new Error('Photo upload failed');

      const { data } = supabase.storage
        .from('profiles')
        .getPublicUrl(fileName);

      const photo_url = data.publicUrl;

      const res = await adminAPI.updateUser(selectedUser.id, { photo_url });
      setSelectedUser(res.data.user);
      setUsers(users.map(u => u.id === selectedUser.id ? res.data.user : u));
      setEditUserData(prev => ({ ...prev, photo_url }));
      setNoticeStatus({ type: 'success', text: 'User photo updated successfully' });
      setTimeout(() => setNoticeStatus({ type: '', text: '' }), 3000);
    } catch (err) {
      console.error(err);
      setNoticeStatus({ type: 'error', text: 'Failed to update user photo' });
    } finally {
      setSavingUser(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadUsers();
    }, 300); // 300ms debounce
    return () => clearTimeout(timer);
  }, [filters, search]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const params = { ...filters };
      if (search) params.search = search;
      const res = await adminAPI.getUsers(params);
      setUsers(res.data.users || []);
    } catch (err) {
      console.error('Load users error:', err);
    }
    setLoading(false);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    loadUsers();
  };

  const handleUnlock = async (userId) => {
    try {
      await adminAPI.unlockUser(userId);
      setUsers(users.map(u => u.id === userId ? { ...u, is_locked: false } : u));
      if (selectedUser?.id === userId) {
        setSelectedUser({ ...selectedUser, is_locked: false });
      }
    } catch (err) {
      console.error('Unlock error:', err);
    }
  };

  const handleSendPersonalNotice = async (e) => {
    e.preventDefault();
    if (!personalNotice.title || !personalNotice.message || !selectedUser) return;

    setSendingNotice(true);
    setNoticeStatus({ type: '', text: '' });
    try {
      await noticeAPI.create({
        ...personalNotice,
        user_id: selectedUser.id
      });
      setNoticeStatus({ type: 'success', text: 'Notice sent to this user!' });
      setPersonalNotice({ title: '', message: '' });
      // Reset status after 3 seconds
      setTimeout(() => setNoticeStatus({ type: '', text: '' }), 3000);
    } catch (err) {
      setNoticeStatus({ type: 'error', text: 'Failed to send notice' });
    } finally {
      setSendingNotice(false);
    }
  };

  const loadUserTaxes = async (userId) => {
    setLoadingTaxes(true);
    try {
      const res = await monthlyTaxAPI.getAllPayments({ user_id: userId });
      setUserPayments(res.data.payments || []);
    } catch (err) {
      console.error('Load user taxes error:', err);
    }
    setLoadingTaxes(false);
  };

  const { user } = useAuth();
  const [filterPanelOpen, setFilterPanelOpen] = useState(true);

  const chartData = useMemo(() => {
    const counts = {};
    users.forEach(u => {
      const blockName = u.block || 'Unassigned';
      counts[blockName] = (counts[blockName] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [users]);

  const COLORS = ['#D97706', '#059669', '#991B1B', '#2563EB', '#7C3AED', '#4B5563'];

  return (
    <div className="min-h-screen mountain-bg pt-24 pb-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="animate-slide-in-left">
            <h1 className="text-4xl font-extrabold text-maroon-500 tracking-tight flex items-center gap-2 animate-fade-in">
              <FiUsers className="w-8 h-8" /> {t('admin.users')}
            </h1>
            <p className="text-gray-500 mt-1 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-forest-500"></span>
              {t('adminPanel.users.registeredUsers')} <span className="font-bold text-saffron-600 uppercase tracking-widest text-sm">{user?.district || 'Initializing...'}</span>
            </p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div className="glass-card p-6 border-l-4 border-saffron-500 animate-fade-in-up delay-100">
            <div className="flex justify-between items-start mb-2">
              <p className="text-sm font-medium text-gray-500">{t('adminPanel.users.registeredUsers')}</p>
              <div className="p-2 bg-saffron-50 rounded-lg text-saffron-600"><FiUsers /></div>
            </div>
            <p className="text-3xl font-bold text-gray-800 animate-bounce-in">{users.length}</p>
            <p className="text-xs text-forest-600 mt-2 font-medium animate-fade-in delay-200">↑ {t('adminPanel.users.totalRecords')}</p>
          </div>
          <div className="glass-card p-6 border-l-4 border-forest-500 animate-fade-in-up delay-200">
            <div className="flex justify-between items-start mb-2">
              <p className="text-sm font-medium text-gray-500">{t('adminPanel.users.activeStatus')}</p>
              <div className="p-2 bg-forest-50 rounded-lg text-forest-600"><FiUnlock /></div>
            </div>
            <p className="text-3xl font-bold text-gray-800 animate-bounce-in">{users.filter(u => !u.is_locked).length}</p>
            <p className="text-xs text-gray-400 mt-2 font-medium animate-fade-in delay-300">{t('adminPanel.users.readyTransactions')}</p>
          </div>
          <div className="glass-card p-6 border-l-4 border-maroon-500 animate-fade-in-up delay-300">
            <div className="flex justify-between items-start mb-2">
              <p className="text-sm font-medium text-gray-500">{t('adminPanel.users.lockedAccounts')}</p>
              <div className="p-2 bg-maroon-50 rounded-lg text-maroon-600"><FiLock /></div>
            </div>
            <p className="text-3xl font-bold text-maroon-600 animate-bounce-in">{users.filter(u => u.is_locked).length}</p>
            <p className="text-xs text-maroon-400 mt-2 font-medium italic animate-fade-in delay-400">{t('adminPanel.users.actionRequired')}</p>
          </div>
        </div>

        {/* Control Panel */}
        <div className="glass-card mb-8 overflow-hidden animate-fade-in-up delay-400">
          <div className="bg-gradient-to-r from-gray-50 to-white px-6 py-4 border-b border-gray-100 flex justify-between items-center cursor-pointer" onClick={() => setFilterPanelOpen(!filterPanelOpen)}>
            <h3 className="font-bold text-gray-800 flex items-center gap-2 text-sm uppercase tracking-widest">
              {t('adminPanel.users.filterAndSearch')}
            </h3>
            <span className="text-xs text-saffron-600 font-bold">{filterPanelOpen ? 'HIDE' : 'SHOW'}</span>
          </div>
          
          {filterPanelOpen && (
            <div className="p-6">
              <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
                <div className="md:col-span-2 space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] ml-1">{t('adminPanel.users.searchRecord')}</label>
                  <div className="relative group">
                    <FiSearch className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-saffron-500 transition-colors w-5 h-5 z-10" />
                    <input type="text" placeholder={t('adminPanel.users.searchPlaceholder')} 
                      className="input-field pr-4 py-3.5 shadow-inner bg-gray-50/50 font-medium"
                      style={{ paddingLeft: '4.5rem' }} 
                      value={search} onChange={(e) => setSearch(e.target.value)} />
                  </div>
                </div>
                <div className="space-y-1.5 flex-1 min-w-[200px]">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">{t('adminPanel.users.assignedBlock')}</label>
                  <CustomDropdown
                    options={[
                      { value: '', label: t('adminPanel.users.allRegions') },
                      ...(uttarakhandData[user?.district] || []).map(b => ({ value: b, label: b }))
                    ]}
                    value={filters.block}
                    onChange={(val) => setFilters({ ...filters, block: val })}
                    placeholder={t('adminPanel.users.allRegions')}
                    icon={FiMap}
                    className="w-full"
                  />
                </div>
              </form>

              <div className="flex flex-wrap gap-3 mt-6">
                <span className="text-xs font-bold text-gray-400 py-1">{t('adminPanel.users.businessTypes')}</span>
                {[
                  'Grocery & Retail', 
                  'Restaurant & Cafe', 
                  'Electronics & Hardware', 
                  'Medical & Pharmacy', 
                  'Clothing & Apparels', 
                  'Services & Consultancy', 
                  'Small Kiosk / Vendor'
                ].map(type => (
                  <button key={type} onClick={() => setFilters({...filters, business_type: filters.business_type === type ? '' : type})}
                    className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
                      filters.business_type === type ? 'bg-saffron-500 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}>
                    {type}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Users Table */}
        <div className="glass-card overflow-hidden shadow-2xl animate-fade-in-up delay-500 border-0">
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gradient-to-r from-gray-50/50 to-white text-gray-400 text-left uppercase tracking-tighter">
                  <th className="px-6 py-4 text-[10px] font-black border-b border-gray-100">{t('adminPanel.users.table.profile')}</th>
                  <th className="px-6 py-4 text-[10px] font-black border-b border-gray-100 hidden md:table-cell">{t('adminPanel.users.table.accounting')}</th>
                  <th className="px-6 py-4 text-[10px] font-black border-b border-gray-100 hidden lg:table-cell">{t('adminPanel.users.table.location')}</th>
                  <th className="px-6 py-4 text-[10px] font-black border-b border-gray-100">{t('adminPanel.users.table.status')}</th>
                  <th className="px-6 py-4 text-[10px] font-black border-b border-gray-100 text-right">{t('adminPanel.users.table.account')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loading ? (
                  <tr><td colSpan={5} className="px-6 py-20 text-center flex justify-center items-center"><Loader message={t('adminPanel.users.syncing')} /></td></tr>
                ) : users.length === 0 ? (
                  <tr><td colSpan={5} className="px-6 py-20 text-center text-gray-300 italic">{t('adminPanel.users.noShopkeepers')}</td></tr>
                ) : (
                  users.map((u) => (
                    <tr key={u.id} className="group hover:bg-saffron-50/20 transition-all border-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-xl overflow-hidden shadow-sm flex items-center justify-center font-black ${u.is_locked ? 'bg-maroon-50 text-maroon-600' : 'bg-forest-50 text-forest-600'}`}>
                            {u.photo_url ? (
                              <img src={u.photo_url} alt={u.username} className="w-full h-full object-cover" />
                            ) : (
                              u.username?.[0] || 'U'
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-black text-gray-900">{u.username}</p>
                            <p className="text-[10px] text-gray-400 font-bold tracking-tighter uppercase">{u.mobile}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 hidden md:table-cell">
                        <p className="text-sm font-black font-mono text-saffron-600 tracking-tight">{u.gst_id}</p>
                        <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">{u.business_type}</p>
                      </td>
                      <td className="px-6 py-4 hidden lg:table-cell">
                        <p className="text-sm font-bold text-gray-700">{u.block || '—'}</p>
                        <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest leading-none">{u.district}</p>
                      </td>
                      <td className="px-6 py-4">
                        {u.is_locked ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-maroon-50 text-maroon-600 text-[9px] font-black uppercase tracking-widest rounded-full border border-maroon-100">
                            <FiLock className="w-2.5 h-2.5" /> {t('adminPanel.status.locked')}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-forest-50 text-forest-600 text-[9px] font-black uppercase tracking-widest rounded-full border border-forest-100">
                            <FiUnlock className="w-2.5 h-2.5" /> {t('adminPanel.status.active')}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button 
                          onClick={() => { 
                            setSelectedUser(u); 
                            setIsModalOpen(true); 
                            loadUserTaxes(u.id);
                          }}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-gray-50 text-gray-500 hover:bg-saffron-500 hover:text-white border border-gray-100 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm active:scale-95"
                        >
                          <FiUser className="w-3.5 h-3.5" /> {t('adminPanel.users.viewProfile') || 'Profile'}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden divide-y divide-gray-100">
            {loading ? (
              <div className="px-6 py-12 text-center flex justify-center items-center"><Loader message={t('adminPanel.users.syncing')} /></div>
            ) : users.length === 0 ? (
              <div className="px-6 py-12 text-center text-gray-300 italic">{t('adminPanel.users.noShopkeepers')}</div>
            ) : (
              users.map((u) => (
                <div key={u.id} className="p-5 hover:bg-saffron-50/10 transition-colors">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-2xl overflow-hidden shadow-md flex items-center justify-center font-black text-lg ${u.is_locked ? 'bg-maroon-50 text-maroon-600' : 'bg-forest-50 text-forest-600'}`}>
                        {u.photo_url ? (
                          <img src={u.photo_url} alt={u.username} className="w-full h-full object-cover" />
                        ) : (
                          u.username?.[0] || 'U'
                        )}
                      </div>
                      <div>
                        <h4 className="text-base font-black text-gray-900 leading-tight">{u.username}</h4>
                        <p className="text-[10px] font-mono font-bold text-saffron-600 leading-none mt-1">{u.gst_id}</p>
                      </div>
                    </div>
                    {u.is_locked ? (
                      <span className="p-2 bg-maroon-50 text-maroon-600 rounded-xl border border-maroon-100">
                        <FiLock className="w-4 h-4" />
                      </span>
                    ) : (
                      <span className="p-2 bg-forest-50 text-forest-600 rounded-xl border border-forest-100">
                        <FiUnlock className="w-4 h-4" />
                      </span>
                    )}
                  </div>

                  <div className="bg-gray-50/50 rounded-2xl p-4 border border-gray-100 mb-4 grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[8px] font-black text-gray-500 uppercase mb-1">{t('adminPanel.users.table.location')}</p>
                      <p className="text-xs font-bold text-gray-800">{u.block || '—'}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[8px] font-black text-gray-500 uppercase mb-1">{t('adminPanel.users.table.accounting')}</p>
                      <p className="text-[10px] font-black text-gray-700 uppercase tracking-tighter truncate">{u.business_type}</p>
                    </div>
                  </div>

                  <button 
                    onClick={() => { 
                      setSelectedUser(u); 
                      setIsModalOpen(true); 
                      loadUserTaxes(u.id);
                    }}
                    className="w-full flex items-center justify-center gap-2 py-3 bg-white border border-gray-200 text-gray-600 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] shadow-sm active:scale-95 transition-all"
                  >
                    <FiUser className="w-4 h-4" />
                    {t('adminPanel.users.viewProfile') || 'View Profile'}
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="flex items-center justify-between mt-6 px-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100 pb-4 mb-12">
           <span>{t('adminPanel.users.totalDataset', { count: users.length })}</span>
           <span>{t('adminPanel.users.generated')} {new Date().toLocaleTimeString()}</span>
        </div>

        {/* Boxy Visualizations Section at the bottom */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12 animate-fade-in-up">
          {/* Bar Chart Box */}
          <div className="bg-white border-2 border-gray-100 rounded-3xl overflow-hidden shadow-xl hover:shadow-2xl transition-shadow">
            <div className="bg-gradient-to-r from-gray-50 to-white px-6 py-4 border-b-2 border-gray-100 flex items-center gap-3">
              <div className="p-2 bg-saffron-100 text-saffron-600 rounded-lg">
                <FiUsers className="w-5 h-5" />
              </div>
              <h3 className="font-extrabold text-gray-800 text-sm uppercase tracking-widest animate-slide-in-right">
                {t('adminPanel.users.blockStrength')}
              </h3>
            </div>
            <div className="p-6 h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 40 }}>
                  <defs>
                    <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#D97706" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#D97706" stopOpacity={0.2}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <Bar dataKey="value" fill="url(#barGradient)" radius={[6, 6, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Pie Chart Box */}
          <div className="bg-white border-2 border-gray-100 rounded-3xl overflow-hidden shadow-xl hover:shadow-2xl transition-shadow">
            <div className="bg-gradient-to-r from-gray-50 to-white px-6 py-4 border-b-2 border-gray-100 flex items-center gap-3">
              <div className="p-2 bg-forest-100 text-forest-600 rounded-lg">
                <FiInfo className="w-5 h-5" />
              </div>
              <h3 className="font-extrabold text-gray-800 text-sm uppercase tracking-widest animate-slide-in-right">
                {t('adminPanel.users.marketAnalytics')}
              </h3>
            </div>
            <div className="p-6 h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="45%"
                    innerRadius={70}
                    outerRadius={110}
                    paddingAngle={8}
                    dataKey="value"
                    strokeWidth={0}
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', padding: '12px' }}
                  />
                  <Legend verticalAlign="bottom" height={40} iconType="diamond" wrapperStyle={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#64748b' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* User Profile Modal */}
      {isModalOpen && selectedUser && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 animate-fade-in">
          <div className="absolute inset-0 bg-maroon-900/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
          
          <div className="relative bg-white rounded-[2rem] w-full max-w-2xl overflow-hidden animate-scale-in shadow-2xl border border-gray-100">
            {/* Modal Header */}
            <div className="bg-gray-50 px-8 py-6 border-b border-gray-100 flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className={`relative w-14 h-14 rounded-2xl overflow-hidden flex items-center justify-center text-2xl font-black shadow-md ${selectedUser.is_locked ? 'bg-maroon-100 text-maroon-600' : 'bg-forest-100 text-forest-600'}`}>
                  {isEditingUser && (
                    <input type="file" ref={fileInputRef} onChange={handlePhotoUploadUser} accept="image/*" className="hidden" />
                  )}
                  {selectedUser.photo_url ? (
                    <img src={selectedUser.photo_url} alt={selectedUser.username} className="w-full h-full object-cover" />
                  ) : (
                    selectedUser.username?.[0]
                  )}
                  {isEditingUser && (
                    <button onClick={() => fileInputRef.current?.click()} disabled={savingUser} className="absolute inset-0 bg-black/40 flex items-center justify-center text-white hover:bg-black/50 transition-colors">
                       <FiCamera className="w-5 h-5" />
                    </button>
                  )}
                </div>
                <div>
                  {isEditingUser ? (
                    <input 
                      type="text" name="username" value={editUserData.username || ''} onChange={handleEditUserChange} 
                      className="text-xl font-black text-gray-900 tracking-tight bg-white border border-gray-200 rounded-lg px-2 py-1 outline-none w-full"
                    />
                  ) : (
                    <h2 className="text-2xl font-black text-gray-900 tracking-tight">{selectedUser.username}</h2>
                  )}
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2 mt-1">
                    <span className={`w-2 h-2 rounded-full ${selectedUser.is_locked ? 'bg-maroon-500' : 'bg-forest-500'}`}></span>
                    {selectedUser.is_locked ? t('adminPanel.status.locked') : t('adminPanel.status.active')}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {isEditingUser ? (
                  <>
                    <button onClick={handleEditUserToggle} className="px-3 py-1.5 text-xs font-bold text-gray-500 hover:bg-gray-100 rounded-lg transition-colors">Cancel</button>
                    <button onClick={handleSaveUser} disabled={savingUser} className="px-3 py-1.5 text-xs font-bold text-white bg-saffron-500 hover:bg-saffron-600 rounded-lg transition-colors flex items-center gap-2 shadow-sm disabled:opacity-50">
                      <FiSave /> {savingUser ? 'Saving...' : 'Save'}
                    </button>
                  </>
                ) : (
                  <button onClick={handleEditUserToggle} className="flex items-center gap-2 p-2 hover:bg-saffron-50 text-saffron-600 rounded-xl transition-colors text-xs font-bold px-3">
                    <FiEdit3 className="w-4 h-4" /> Edit
                  </button>
                )}
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-gray-200 rounded-xl text-gray-400 transition-colors">
                  <FiX className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-8 max-h-[70vh] overflow-y-auto">
              {/* Profile Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                <div className="flex items-start gap-4 p-4 bg-gray-50/50 rounded-2xl border border-gray-100">
                  <div className="p-2 bg-white rounded-lg text-saffron-600 shadow-sm"><FiPhone className="w-5 h-5" /></div>
                  <div className="w-full">
                    <p className="text-[10px] font-bold text-gray-400 uppercase">{t('auth.mobile')}</p>
                    {isEditingUser ? (
                      <input type="text" name="mobile" value={editUserData.mobile || ''} onChange={handleEditUserChange} className="text-sm font-bold text-gray-800 bg-white border border-gray-200 rounded px-2 w-full py-1 mt-1 outline-none" />
                    ) : (
                      <p className="text-sm font-bold text-gray-800">{selectedUser.mobile}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-start gap-4 p-4 bg-gray-50/50 rounded-2xl border border-gray-100">
                  <div className="p-2 bg-white rounded-lg text-forest-600 shadow-sm"><FiBriefcase className="w-5 h-5" /></div>
                  <div className="w-full">
                    <p className="text-[10px] font-bold text-gray-400 uppercase">{t('adminPanel.users.business') || 'Business'}</p>
                    {isEditingUser ? (
                      <input type="text" name="business_type" value={editUserData.business_type || ''} onChange={handleEditUserChange} className="text-sm font-bold text-gray-800 bg-white border border-gray-200 rounded px-2 w-full py-1 mb-1 outline-none" />
                    ) : (
                      <p className="text-sm font-bold text-gray-800">{selectedUser.business_type}</p>
                    )}
                    <p className="text-[10px] font-mono text-gray-400">{selectedUser.gst_id}</p>
                  </div>
                </div>
                <div className="flex items-start gap-4 p-4 bg-gray-50/50 rounded-2xl border border-gray-100">
                  <div className="p-2 bg-white rounded-lg text-maroon-600 shadow-sm"><FiMapPin className="w-5 h-5" /></div>
                  <div className="w-full">
                    <p className="text-[10px] font-bold text-gray-400 uppercase">{t('adminPanel.users.blockRegion') || 'Block / Region'}</p>
                    {isEditingUser ? (
                      <input type="text" name="block" value={editUserData.block || ''} onChange={handleEditUserChange} className="text-sm font-bold text-gray-800 bg-white border border-gray-200 rounded px-2 w-full py-1 mt-1 outline-none" />
                    ) : (
                      <p className="text-sm font-bold text-gray-800">{selectedUser.block || 'Not Assigned'}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-start gap-4 p-4 bg-gray-50/50 rounded-2xl border border-gray-100">
                  <div className="p-2 bg-white rounded-lg text-blue-600 shadow-sm"><FiCalendar className="w-5 h-5" /></div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase">{t('auth.register')}</p>
                    <p className="text-sm font-bold text-gray-800">{new Date(selectedUser.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                  </div>
                </div>
              </div>

              {/* Payment Summary Section */}
              <div className="border-t border-dashed border-gray-200 pt-8 pb-4">
                <h3 className="text-sm font-black text-gray-800 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-saffron-500"></span>
                  {t('adminPanel.users.financialSummary')}
                </h3>
                
                {loadingTaxes ? (
                  <div className="animate-pulse flex items-center gap-3 text-gray-300 text-xs font-bold py-4">
                    <div className="w-4 h-4 bg-gray-200 rounded-full"></div> {t('adminPanel.users.loadingPayments')}
                  </div>
                ) : userPayments.length === 0 ? (
                  <div className="p-8 bg-gray-50 rounded-2xl border border-dashed border-gray-200 text-center">
                    <FiAlertCircle className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{t('tax.noPaidData')}</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {Object.entries(
                      userPayments.reduce((acc, p) => {
                        if (!acc[p.year]) acc[p.year] = { paid: 0, pending: 0 };
                        if (p.status === 'PAID') acc[p.year].paid++;
                        else acc[p.year].pending++;
                        return acc;
                      }, {})
                    )
                    .sort(([yearA], [yearB]) => yearB - yearA)
                    .map(([year, counts]) => (
                      <div key={year} className="bg-gray-50/50 rounded-2xl border border-gray-100 p-5 flex items-center justify-between group hover:border-saffron-200 transition-colors">
                        <div>
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Financial Year</p>
                          <h4 className="text-xl font-black text-gray-800">{year}</h4>
                        </div>
                        <div className="flex gap-4">
                          <div className="text-right">
                            <p className="text-[10px] font-bold text-forest-500 uppercase">Paid</p>
                            <p className="text-lg font-black text-forest-700">{counts.paid}</p>
                          </div>
                          <div className="w-px h-8 bg-gray-200 self-center"></div>
                          <div className="text-right">
                            <p className="text-[10px] font-bold text-maroon-500 uppercase">Pending</p>
                            <p className="text-lg font-black text-maroon-700">{counts.pending}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Personal Notice Section */}
              <div className="border-t border-dashed border-gray-200 pt-8 pb-4">
                <h3 className="text-sm font-black text-gray-800 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                  {t('adminPanel.users.sendPersonalNotice')}
                </h3>
                
                <form onSubmit={handleSendPersonalNotice} className="space-y-4 bg-blue-50/30 p-6 rounded-[2rem] border border-blue-100">
                  <div>
                    <input 
                      type="text"
                      className="w-full bg-white border border-blue-100 rounded-xl px-4 py-3 text-sm font-bold placeholder:text-gray-300 focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-300 transition-all shadow-sm"
                      placeholder={t('adminPanel.notices.noticeTitle')}
                      value={personalNotice.title}
                      onChange={(e) => setPersonalNotice({ ...personalNotice, title: e.target.value })}
                    />
                  </div>
                  <div>
                    <textarea 
                      rows="3"
                      className="w-full bg-white border border-blue-100 rounded-xl px-4 py-3 text-sm font-medium placeholder:text-gray-300 focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-300 transition-all resize-none shadow-sm"
                      placeholder={t('adminPanel.notices.messagePlaceholder')}
                      value={personalNotice.message}
                      onChange={(e) => setPersonalNotice({ ...personalNotice, message: e.target.value })}
                    ></textarea>
                  </div>
                  
                  {noticeStatus.text && (
                    <div className={`p-3 rounded-xl text-[10px] font-black uppercase text-center tracking-widest ${
                      noticeStatus.type === 'success' ? 'bg-forest-100 text-forest-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {noticeStatus.text}
                    </div>
                  )}

                  <button 
                    type="submit"
                    disabled={sendingNotice || !personalNotice.title || !personalNotice.message}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-200 disabled:text-gray-400 text-white font-black text-[10px] uppercase tracking-[0.2em] py-4 rounded-xl shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 transition-all flex items-center justify-center gap-2"
                  >
                    <FiSend className="w-4 h-4" />
                    {sendingNotice ? 'Sending...' : 'Send Direct Notice'}
                  </button>
                </form>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-gray-50 p-8 border-t border-gray-100 flex justify-end gap-3 flex-wrap">
              <button 
                onClick={() => setIsModalOpen(false)} 
                className="px-6 py-3 text-xs font-black text-gray-500 hover:text-gray-800 transition-colors uppercase tracking-widest"
              >
                Close
              </button>
              {selectedUser.is_locked && (
                <button 
                  onClick={() => { handleUnlock(selectedUser.id); setIsModalOpen(false); }}
                  className="flex items-center gap-3 bg-forest-600 text-white px-8 py-3 rounded-2xl text-xs font-black shadow-xl shadow-forest-100 hover:bg-forest-700 transition-all hover:-translate-y-1"
                >
                  <FiUnlock className="w-5 h-5" /> UNLOCK ACCOUNT
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
