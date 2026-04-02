import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { adminAPI } from '../../services/api';
import { FiUsers, FiDollarSign, FiCheckCircle, FiAlertCircle, FiTrendingUp, FiAlertTriangle, FiInfo, FiActivity, FiMap, FiMessageSquare } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../services/supabase';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, BarChart, Bar, Legend
} from 'recharts';
import { memo } from 'react';
import { motion } from 'framer-motion';
import Loader from '../../components/Loader';

export default function AdminDashboard() {
  const { t } = useTranslation();
  const [stats, setStats] = useState(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [loading, setLoading] = useState(true);

  const { user } = useAuth();

  const [lastSync, setLastSync] = useState(new Date());

  useEffect(() => {
    // Subscription for all relevant changes in this district
    const sync = () => {
      setLastSync(new Date());
      loadDashboard(selectedYear);
    };

    const channels = [
      supabase.channel('admin-users-sync').on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, sync).subscribe(),
      supabase.channel('admin-payments-sync').on('postgres_changes', { event: '*', schema: 'public', table: 'monthly_payments' }, sync).subscribe(),
      supabase.channel('admin-complaints-sync').on('postgres_changes', { event: '*', schema: 'public', table: 'complaints' }, sync).subscribe()
    ];

    return () => {
      channels.forEach(ch => supabase.removeChannel(ch));
    };
  }, [selectedYear]);

  useEffect(() => {
    loadDashboard(selectedYear);
  }, [selectedYear]);

  const loadDashboard = async (year) => {
    try {
      const res = await adminAPI.getDashboard({ year });
      setStats(res.data.stats);
    } catch (err) {
      console.error('Dashboard error:', err);
    }
    setLoading(false);
  };

  const statCards = useMemo(() => {
    if (!stats) return [];
    return [
      { label: 'Total Shops', value: stats.totalUsers, icon: FiUsers, color: 'bg-saffron-500', trend: '+12%' },
      { label: 'Paid This Month', value: stats.totalPaid, icon: FiCheckCircle, color: 'bg-forest-500', trend: 'Active' },
      { label: 'Pending Dues', value: stats.totalUnpaid, icon: FiAlertCircle, color: 'bg-maroon-500', trend: 'Priority' },
      { label: 'Total Revenue', value: `₹${(stats.totalRevenue || 0).toLocaleString('en-IN')}`, icon: FiTrendingUp, color: 'bg-blue-600', trend: 'Growth' },
      { label: 'Pending Collection', value: `₹${(stats.pendingAmount || 0).toLocaleString('en-IN')}`, icon: FiDollarSign, color: 'bg-orange-600', trend: 'Recovery' },
      { label: 'No. of Complaints', value: stats.complaints?.total || 0, icon: FiMessageSquare, color: 'bg-yellow-500', trend: 'Total' },
    ];
  }, [stats]);

  const collectionData = useMemo(() => {
    if (!stats) return [];
    return [
      { name: 'Paid', value: stats.totalPaid },
      { name: 'Unpaid', value: stats.totalUnpaid }
    ];
  }, [stats]);

  const complaintData = useMemo(() => {
    if (!stats) return [];
    return [
      { name: t('notice.open'), value: stats.complaints?.pending || 0 },
      { name: t('notice.resolved'), value: stats.complaints?.resolved || 0 }
    ];
  }, [stats, t]);

  if (loading || !stats) return (
    <div className="min-h-screen flex items-center justify-center pt-16 mountain-bg">
      <Loader message={t('common.loading')} />
    </div>
  );

  const COLORS = ['#FF6B00', '#10B981', '#1a1a2e', '#3B82F6', '#F97316', '#6366F1'];

  return (
    <div className="min-h-screen mountain-bg pt-20 pb-10 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div className="flex items-center gap-5 animate-slide-in-left">
            {user?.photo_url ? (
              <div className="w-16 h-16 rounded-2xl overflow-hidden shadow-lg border-2 border-white flex-shrink-0 bg-white">
                <img src={user.photo_url} alt="Profile" className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-maroon-500 to-maroon-600 flex items-center justify-center text-white text-2xl font-black shadow-lg flex-shrink-0">
                {user?.username?.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <h1 className="text-2xl sm:text-4xl font-black text-maroon-500 tracking-tight mb-2">
                {t('notice.adminDashboard')}
                {user?.username && <span className="text-gray-400 font-normal">, {user.username}</span>}
              </h1>
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 bg-saffron-100 text-saffron-700 text-[10px] font-black uppercase rounded-lg border border-saffron-200">
                  {user?.district || 'District'}
                </span>
                <p className="text-xs text-gray-400 font-bold uppercase flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-forest-500 animate-pulse"></span>
                  {t('notice.intelligenceEngine')}
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-4 animate-slide-in-right">
            <div className="relative group">
              <select 
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="appearance-none bg-white border border-gray-200 text-gray-700 font-bold text-sm py-3 px-6 pr-10 rounded-2xl focus:outline-none focus:ring-4 focus:ring-saffron-500/10 focus:border-saffron-500 transition-all cursor-pointer shadow-sm"
              >
                <option value="2026">{t('notice.financialYear')} 2026</option>
                <option value="2025">{t('notice.financialYear')} 2025</option>
                <option value="2024">{t('notice.financialYear')} 2024</option>
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 group-hover:text-saffron-500 transition-colors">
                <FiMap className="w-4 h-4" />
              </div>
            </div>

            <div className="flex items-center gap-2 px-5 py-3 bg-white/50 backdrop-blur-md rounded-2xl border border-gray-100 text-[10px] text-gray-500 font-bold shadow-sm">
              <FiActivity className="w-4 h-4 text-forest-500 animate-pulse" />
              Real-time: {lastSync.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true }).toUpperCase()}
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
          {statCards.map((card, i) => (
            <motion.div 
              key={i} 
              className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex items-center justify-between group hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
            >
              <div className="flex items-center gap-4">
                <div className={`w-14 h-14 rounded-2xl ${card.color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-500`}>
                  <card.icon className="w-7 h-7 text-white" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase mb-1">{card.label}</p>
                  <p className="text-2xl font-black text-gray-900">{card.value}</p>
                </div>
              </div>
              <div className="text-right">
                <span className={`text-[10px] font-black px-2 py-1 rounded-lg ${card.trend.includes('+') ? 'bg-forest-50 text-forest-600' : 'bg-gray-100 text-gray-500'} uppercase`}>
                  {card.trend}
                </span>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Charts Overhaul */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Revenue Trend Area Chart */}
          <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-100 animate-slide-in-up">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-xl font-black text-gray-900 tracking-tight">{t('notice.revenueGrowth')}</h3>
                <p className="text-xs text-forest-500 font-bold flex items-center gap-1"><FiActivity className="w-3 h-3" /> {t('notice.realtimeTrends')}</p>
              </div>
              <div className="p-3 bg-forest-50 rounded-2xl text-forest-600 shadow-sm"><FiTrendingUp className="w-5 h-5" /></div>
            </div>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats.revenueTrend}>
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#228B22" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#228B22" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} dy={10} />
                  <YAxis hide />
                  <Tooltip 
                    contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', padding: '15px' }}
                    itemStyle={{ fontWeight: 800, color: '#1e293b' }}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#228B22" strokeWidth={4} fillOpacity={1} fill="url(#colorRev)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Shop Distribution Pie Chart */}
          <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-100 animate-slide-in-up delay-100">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-xl font-black text-gray-900 tracking-tight">{t('notice.shopDistribution')}</h3>
                <p className="text-xs text-saffron-500 font-bold flex items-center gap-1"><FiMap className="w-3 h-3" /> {t('notice.businessCategory')}</p>
              </div>
              <div className="p-3 bg-saffron-50 rounded-2xl text-saffron-600 shadow-sm"><FiUsers className="w-5 h-5" /></div>
            </div>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.distribution}
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={8}
                    dataKey="value"
                    strokeWidth={0}
                  >
                    {stats.distribution?.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Collection Status Bar Chart */}
          <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-100 animate-slide-in-up delay-200">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-xl font-black text-gray-900 tracking-tight">{t('notice.collectionStatus')}</h3>
                <p className="text-xs text-maroon-500 font-bold flex items-center gap-1"><FiCheckCircle className="w-3 h-3" /> {t('notice.paidVsUnpaid')}</p>
              </div>
              <div className="p-3 bg-maroon-50 rounded-2xl text-maroon-600 shadow-sm"><FiDollarSign className="w-5 h-5" /></div>
            </div>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={collectionData}>
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} />
                  <Tooltip contentStyle={{ borderRadius: '15px' }} />
                  <Bar dataKey="value" radius={[10, 10, 0, 0]} barSize={35}>
                    <Cell fill="#228B22" />
                    <Cell fill="#800000" />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Complaints Summary Donut */}
          <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-100 animate-slide-in-up delay-300">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-xl font-black text-gray-900 tracking-tight">{t('notice.feedbackSupport')}</h3>
                <p className="text-xs text-yellow-600 font-bold flex items-center gap-1"><FiAlertTriangle className="w-3 h-3" /> {t('notice.openVsResolved')}</p>
              </div>
              <div className="p-3 bg-yellow-50 rounded-2xl text-yellow-600 shadow-sm"><FiAlertTriangle className="w-5 h-5" /></div>
            </div>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={complaintData}
                    innerRadius={70}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    <Cell fill="#EAB308" />
                    <Cell fill="#228B22" />
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '15px' }} />
                  <Legend verticalAlign="bottom" />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
