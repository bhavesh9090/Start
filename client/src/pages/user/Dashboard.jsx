import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { monthlyTaxAPI } from '../../services/api';
import { FiDollarSign, FiCheckCircle, FiAlertCircle, FiAlertTriangle, FiBarChart2, FiTrendingUp } from 'react-icons/fi';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import Loader from '../../components/Loader';

export default function UserDashboard() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const [taxes, setTaxes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [isMobile, setIsMobile] = useState(false);
  const [isCompactChart, setIsCompactChart] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  // Used to adjust chart sizing for small screens.
  useEffect(() => {
    const update = () => {
      const w = window.innerWidth;
      setIsMobile(w < 640);
      // For narrower PC/tablet widths, still treat as compact so ticks don't overlap.
      setIsCompactChart(w < 980);
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  const loadData = async () => {
    try {
      const res = await monthlyTaxAPI.getPayments();
      setTaxes(res.data.payments || []);
    } catch (err) {
      console.error('Dashboard load error:', err);
    }
    setLoading(false);
  };

  const filteredTaxes = taxes.filter(t => t.year === selectedYear);

  const totalTax = filteredTaxes.reduce((sum, tax) => sum + Number(tax.amount) + Number(tax.penalty || 0), 0);
  const paidTax = filteredTaxes.filter(t => t.status === 'PAID').reduce((sum, tax) => sum + Number(tax.amount) + Number(tax.penalty || 0), 0);
  const pendingTax = filteredTaxes.filter(t => t.status === 'PENDING').reduce((sum, tax) => sum + Number(tax.amount) + Number(tax.penalty || 0), 0);
  const totalPenalty = filteredTaxes.reduce((sum, tax) => sum + Number(tax.penalty || 0), 0);

  const stats = [
    { label: t('dashboard.totalTax'), value: `₹${totalTax}`, icon: FiDollarSign, color: 'from-saffron-400 to-saffron-600', bg: 'bg-saffron-50' },
    { label: t('dashboard.paidTax'), value: `₹${paidTax}`, icon: FiCheckCircle, color: 'from-forest-400 to-forest-600', bg: 'bg-forest-50' },
    { label: t('dashboard.pendingTax'), value: `₹${pendingTax}`, icon: FiAlertCircle, color: 'from-maroon-400 to-maroon-600', bg: 'bg-maroon-50' },
    { label: t('dashboard.totalPenalty'), value: `₹${totalPenalty}`, icon: FiAlertTriangle, color: 'from-red-400 to-red-600', bg: 'bg-red-50' },
  ];

  // Prepare data for BarChart (12 Months)
  const currentYear = new Date().getFullYear();
  const chartData = Array.from({ length: 12 }, (_, i) => {
     const monthNum = i + 1;
     const record = filteredTaxes.find(t => t.month === monthNum);
     return {
       name: t(`months.${monthNum}`) || monthNum.toString(),
       Paid: record?.status === 'PAID' ? Number(record.amount) : 0,
       Pending: record?.status === 'PENDING' ? Number(record.amount) : 0,
       Penalty: record ? Number(record.penalty) : 0,
     };
  });

  // Prepare Data for PieChart
  const pieData = [
    { name: 'Paid Tax', value: paidTax, color: 'url(#colorPaid)' },
    { name: 'Pending Tax', value: pendingTax, color: 'url(#colorPending)' }
  ].filter(d => d.value > 0);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center pt-16 mountain-bg">
      <Loader message={t('common.loading')} />
    </div>
  );

  return (
    <div className="min-h-screen pt-20 pb-10 px-4 mountain-bg">
      <div className="max-w-6xl mx-auto">
        {/* Welcome */}
        <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
          <div className="flex items-center gap-4">
            {user?.photo_url && (
              <div className="w-16 h-16 rounded-2xl overflow-hidden shadow-lg border-2 border-white flex-shrink-0">
                <img src={user.photo_url} alt="Profile" className="w-full h-full object-cover" />
              </div>
            )}
            <div>
              <h1 className="text-3xl font-bold text-maroon-500">{t('dashboard.welcome')}, {user?.username || user?.gst_id}!</h1>
              <p className="text-gray-500 mt-1 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-forest-500"></span>
                GST: {user?.gst_id} • {user?.district}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl shadow-sm border border-saffron-100">
            <span className="text-sm font-semibold text-gray-500 uppercase tracking-wider">{t('tax.year')}</span>
            <select 
              value={selectedYear} 
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="bg-transparent border-none focus:ring-0 text-maroon-500 font-bold text-lg cursor-pointer"
            >
              {[currentYear, currentYear - 1, currentYear - 2].map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Stats */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((stat, i) => (
            <div key={i} className="glass-card p-4 sm:p-5 flex items-center gap-4 group hover:shadow-xl transition-all hover:-translate-y-0.5">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-md group-hover:scale-110 transition-transform`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-500">{stat.label}</p>
                <p className="text-xl font-bold text-gray-800">{stat.value}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Recent Activity */}
          <div className="glass-card p-4 sm:p-6">
            <h2 className="text-lg sm:text-base md:text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <FiDollarSign className="text-saffron-500" /> {t('dashboard.recentActivity')}
            </h2>
            <div className="space-y-3">
              {filteredTaxes.slice(0, 5).map((tax) => (
                <div key={tax.id} className="flex items-center justify-between p-3 bg-white rounded-xl border border-gray-100">
                  <div>
                    <p className="text-sm font-medium text-gray-700">
                      {t(`months.${tax.month}`)} {tax.year}
                    </p>
                    <p className="text-xs text-gray-400">₹{tax.amount}{tax.penalty > 0 ? ` + ₹${tax.penalty} penalty` : ''}</p>
                  </div>
                  <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                    tax.status === 'PAID' ? 'bg-forest-100 text-forest-600' : 'bg-red-100 text-red-600'
                  }`}>
                    {tax.status}
                  </span>
                </div>
              ))}
              {filteredTaxes.length === 0 && <p className="text-sm text-gray-400 text-center py-4">{t('dashboard.noPaidData')}</p>}
            </div>
          </div>

          {/* Interactive Donut Chart */}
          <div className="glass-card p-4 sm:p-6 flex flex-col items-center justify-center min-h-[260px] sm:min-h-[300px] border border-gray-100 shadow-md hover:shadow-xl transition-all duration-500 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-forest-400 rounded-full blur-[80px] opacity-20 group-hover:opacity-40 transition-opacity"></div>
            <h2 className="text-lg font-semibold text-gray-800 mb-4 sm:mb-6 w-full flex items-center gap-2">
               <FiBarChart2 className="text-forest-500" /> {t('payment.status')} {t('tax.breakdown')}
            </h2>
            {totalTax === 0 ? (
               <p className="text-gray-400 text-sm">{t('dashboard.noPaidData')}</p>
            ) : (
               <div className="w-full h-56 sm:h-64">
                 <ResponsiveContainer width="100%" height="100%">
                   <PieChart>
                     <defs>
                       <linearGradient id="colorPaid" x1="0" y1="0" x2="0" y2="1">
                         <stop offset="5%" stopColor="#10B981" stopOpacity={1}/>
                         <stop offset="95%" stopColor="#059669" stopOpacity={0.8}/>
                       </linearGradient>
                       <linearGradient id="colorPending" x1="0" y1="0" x2="0" y2="1">
                         <stop offset="5%" stopColor="#EF4444" stopOpacity={1}/>
                         <stop offset="95%" stopColor="#DC2626" stopOpacity={0.8}/>
                       </linearGradient>
                       <filter id="dropShadow" x="-20%" y="-20%" width="140%" height="140%">
                          <feDropShadow dx="0" dy="4" stdDeviation="5" floodColor="#000" floodOpacity="0.1" />
                       </filter>
                     </defs>
                     <Pie
                       data={pieData}
                       cx="50%"
                       cy="50%"
                       innerRadius={isMobile ? 45 : 55}
                       outerRadius={isMobile ? 85 : 105}
                       paddingAngle={6}
                       dataKey="value"
                       stroke="none"
                       isAnimationActive={true}
                       animationBegin={0}
                       animationDuration={1500}
                       animationEasing="ease-out"
                     >
                       {pieData.map((entry, index) => (
                         <Cell key={`cell-${index}`} fill={entry.color} filter="url(#dropShadow)" />
                       ))}
                     </Pie>
                     <Tooltip 
                        formatter={(value) => `₹${value}`} 
                        contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontWeight: 'bold'}}
                     />
                     <Legend verticalAlign="bottom" height={isMobile ? 28 : 36} iconType="circle" />
                   </PieChart>
                 </ResponsiveContainer>
               </div>
            )}
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mt-6">
          {/* Stunning Area Chart (Replacing Notifications) */}
          <div className="glass-card p-4 sm:p-6 border border-gray-100 shadow-md hover:shadow-xl transition-all duration-500 relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-32 h-32 bg-saffron-400 rounded-full blur-[80px] opacity-20 group-hover:opacity-40 transition-opacity"></div>
            <h2 className="text-lg font-semibold text-gray-800 mb-4 sm:mb-6 flex items-center gap-2">
              <FiTrendingUp className="text-saffron-500" /> {t('tax.revenueTrend')}
            </h2>
             <div className="w-full h-64 sm:h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 20, right: isMobile ? 10 : 30, left: 10, bottom: 5 }}>
                      <defs>
                        <linearGradient id="colorTrend" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="#F59E0B" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" opacity={0.5} />
                      <XAxis
                        dataKey="name"
                        axisLine={false}
                        tickLine={false}
                        tick={{
                          fontSize: isCompactChart ? 9 : isMobile ? 10 : 12,
                          fill: '#6B7280',
                          angle: isCompactChart ? -35 : 0,
                          textAnchor: isCompactChart ? 'end' : 'middle',
                        }}
                        interval={isCompactChart ? 1 : 0}
                        tickCount={isCompactChart ? 6 : 12}
                        minTickGap={isCompactChart ? 14 : 24}
                        tickFormatter={(value) => {
                          if (i18n.language !== 'en') return value;
                          return String(value).slice(0, 3).toUpperCase();
                        }}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: isMobile ? 10 : 12, fill: '#6B7280' }}
                        tickFormatter={(val) => `₹${val}`}
                      />
                      <Tooltip 
                         cursor={{stroke: '#F59E0B', strokeWidth: 2, strokeDasharray: '5 5'}} 
                         contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} 
                      />
                      <Area 
                         type="monotone" 
                         dataKey="Paid" 
                         stroke="#F59E0B" 
                         strokeWidth={4}
                         fillOpacity={1} 
                         fill="url(#colorTrend)" 
                         isAnimationActive={true}
                         animationDuration={2000}
                         animationEasing="ease-in-out"
                      />
                   </AreaChart>
                </ResponsiveContainer>
             </div>
          </div>

          {/* 12-Month Bar Chart */}
          <div className="glass-card p-4 sm:p-6 border border-gray-100 shadow-md hover:shadow-xl transition-all duration-500 relative overflow-hidden group">
             <div className="absolute top-0 right-0 w-32 h-32 bg-maroon-400 rounded-full blur-[80px] opacity-10 group-hover:opacity-30 transition-opacity"></div>
             <h2 className="text-lg font-semibold text-gray-800 mb-4 sm:mb-6 flex items-center gap-2">
                <FiBarChart2 className="text-maroon-500" /> {selectedYear} {t('tax.monthlyOverview')}
             </h2>
             <div className="w-full h-72 sm:h-80">
                <ResponsiveContainer width="100%" height="100%">
                   <BarChart
                     data={chartData}
                     margin={{ top: 20, right: isMobile ? 10 : 30, left: 10, bottom: 5 }}
                     barSize={isMobile ? 24 : 36}
                   >
                      <defs>
                        <linearGradient id="barPaid" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#10B981" stopOpacity={1}/>
                          <stop offset="100%" stopColor="#047857" stopOpacity={0.8}/>
                        </linearGradient>
                        <linearGradient id="barPending" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#F59E0B" stopOpacity={1}/>
                          <stop offset="100%" stopColor="#B45309" stopOpacity={0.8}/>
                        </linearGradient>
                        <linearGradient id="barPenalty" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#EF4444" stopOpacity={1}/>
                          <stop offset="100%" stopColor="#B91C1C" stopOpacity={0.8}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" opacity={0.5} />
                      <XAxis
                        dataKey="name"
                        axisLine={false}
                        tickLine={false}
                        tick={{
                          fontSize: isCompactChart ? 9 : isMobile ? 10 : 12,
                          fill: '#6B7280',
                          angle: isCompactChart ? -35 : 0,
                          textAnchor: isCompactChart ? 'end' : 'middle',
                        }}
                        interval={isCompactChart ? 1 : 0}
                        tickCount={isCompactChart ? 6 : 12}
                        minTickGap={isCompactChart ? 14 : 24}
                        tickFormatter={(value) => {
                          if (i18n.language !== 'en') return value;
                          return String(value).slice(0, 3).toUpperCase();
                        }}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: isMobile ? 10 : 12, fill: '#6B7280' }}
                        tickFormatter={(val) => `₹${val}`}
                      />
                      <Tooltip 
                         cursor={{fill: '#F3F4F6', opacity: 0.4}} 
                         contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} 
                      />
                      <Legend
                        iconType="circle"
                        wrapperStyle={{
                          fontSize: isMobile ? '12px' : '14px',
                          paddingTop: isMobile ? '12px' : '20px',
                        }}
                      />
                      <Bar dataKey="Paid" stackId="a" fill="url(#barPaid)" radius={[0, 0, 4, 4]} isAnimationActive={true} animationDuration={1500} />
                      <Bar dataKey="Pending" stackId="a" fill="url(#barPending)" radius={[0, 0, 0, 0]} isAnimationActive={true} animationDuration={1500} />
                      <Bar dataKey="Penalty" stackId="a" fill="url(#barPenalty)" radius={[8, 8, 0, 0]} isAnimationActive={true} animationDuration={1500} />
                   </BarChart>
                </ResponsiveContainer>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
