import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { adminAPI } from '../../services/api';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend, LineChart, Line, AreaChart, Area
} from 'recharts';
import { 
  FiTrendingUp, FiCalendar, FiMap, FiBriefcase, FiDownload, FiActivity 
} from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../services/supabase';
import Loader from '../../components/Loader';

const COLORS = ['#800000', '#D97706', '#FFA500', '#B22222', '#CC7722', '#8B0000'];

export default function TaxAnalytics() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('year'); // year, month, block, type
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();

    // Real-time synchronization
    const channel = supabase
      .channel('analytics-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'monthly_payments' }, () => loadAnalytics())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadAnalytics = async () => {
    try {
      const res = await adminAPI.getAdvancedAnalytics();
      setData(res.data);
    } catch (err) {
      console.error('Analytics load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center mountain-bg">
      <Loader size="large" message={t('common.loading')} />
    </div>
  );

  const tabs = [
    { id: 'year', label: t('analytics.yearWise'), icon: FiCalendar },
    { id: 'month', label: t('analytics.monthWise'), icon: FiTrendingUp },
    { id: 'block', label: t('analytics.blockWise'), icon: FiMap },
    { id: 'type', label: t('analytics.shopTypeWise'), icon: FiBriefcase },
  ];

  const renderActiveContent = () => {
    if (!data) return null;

    switch (activeTab) {
      case 'year':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-8 animate-fade-in-up">
          <div className="lg:col-span-2 bg-white rounded-[1.5rem] sm:rounded-[2.5rem] p-4 sm:p-8 shadow-sm border border-gray-100 modern-card hover-glow transition-all">
            <h3 className="text-lg font-black text-gray-800 mb-6 sm:mb-8 flex items-center gap-2">
               {t('analytics.yearCollection')}
            </h3>
            <div className="h-[250px] sm:h-[300px] md:h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.yearWise}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 600 }} minTickGap={20} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 600 }} />
                    <Tooltip 
                      cursor={{ stroke: '#800000', strokeWidth: 1 }}
                      contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    />
                    <Line type="monotone" dataKey="collection" stroke="#800000" strokeWidth={4} dot={{ r: 6, fill: '#800000', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 8 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="bg-white rounded-[2rem] sm:rounded-[2.5rem] p-5 sm:p-8 shadow-sm border border-gray-100">
              <h3 className="text-lg font-black text-gray-800 mb-6 sm:mb-8">{t('analytics.yearSummary')}</h3>
              <div className="overflow-x-auto rounded-2xl border border-gray-50">
                <table className="w-full text-left">
                  <thead className="bg-[#FAF9F6]">
                    <tr>
                      <th className="px-2 sm:px-4 py-3 text-[8px] font-black text-gray-500 uppercase tracking-widest">{t('analytics.labelYear')}</th>
                      <th className="px-2 sm:px-4 py-3 text-right text-[8px] font-black text-gray-500 uppercase tracking-widest">{t('analytics.labelCollection')}</th>
                      <th className="px-2 sm:px-4 py-3 text-[8px] sm:text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('analytics.growth')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {data.yearWise.map((it, i) => (
                      <tr key={it.year} className="hover:bg-gray-50/50 transition-colors animate-fade-in opacity-0" style={{ animationDelay: `${i * 50}ms`, animationFillMode: 'forwards' }}>
                        <td className="px-4 py-4 text-sm font-black text-gray-800">{it.year}</td>
                        <td className="px-4 py-4 text-sm font-bold text-gray-600">₹{it.collection.toLocaleString('en-IN')}</td>
                        <td className="px-4 py-4 text-sm font-bold">
                          <span className={it.growth >= 0 ? 'text-forest-600' : 'text-maroon-600'}>
                            {it.growth >= 0 ? '↑' : '↓'} {Math.abs(it.growth)}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );

      case 'month':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-8 animate-fade-in-up">
          <div className="lg:col-span-2 bg-white rounded-[1.5rem] sm:rounded-[2.5rem] p-4 sm:p-8 shadow-sm border border-gray-100">
            <h3 className="text-lg font-black text-gray-800 mb-6 sm:mb-8 flex items-center gap-2">
               {t('analytics.monthPerformance')} 
            </h3>
            <div className="h-[250px] sm:h-[300px] md:h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.monthWise}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 600 }} minTickGap={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 600 }} />
                    <Tooltip cursor={{ fill: '#f8fafc' }} />
                    <Bar dataKey="collection" fill="#D97706" radius={[10, 10, 0, 0]} barSize={25} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="bg-white rounded-[2rem] sm:rounded-[2.5rem] p-5 sm:p-8 shadow-sm border border-gray-100 modern-card hover-glow delay-100 transition-all">
              <h3 className="text-lg font-black text-gray-800 mb-6 sm:mb-8">{t('analytics.monthDetails')}</h3>
              <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                {data.monthWise.map((it, i) => (
                  <div key={it.month} className="p-4 rounded-2xl bg-gray-50 border border-gray-100 flex justify-between items-center group hover:bg-white hover:border-saffron-200 transition-all shadow-sm animate-fade-in-up opacity-0" style={{ animationDelay: `${i * 50}ms`, animationFillMode: 'forwards' }}>
                    <div className="flex-1">
                      <p className="text-[8px] font-black text-gray-400 uppercase mb-0.5">{it.month}</p>
                      <h4 className="text-xs font-black text-gray-900 leading-tight">₹{it.collection}</h4>
                    </div>
                    <div className="flex items-center gap-2">
                      <FiTrendingUp className="w-3 h-3 text-saffron-500 interactive-icon" />
                      <div className="text-right">
                        <p className="text-[10px] font-bold text-gray-400 uppercase">{t('admin.paidShops')}: {it.paidCount}</p>
                        <p className="text-[10px] font-bold text-maroon-400 uppercase">{t('tax.due')}: {it.unpaidCount}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'block':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-8 animate-fade-in-up">
          <div className="lg:col-span-2 bg-white rounded-[1.5rem] sm:rounded-[2.5rem] p-4 sm:p-8 shadow-sm border border-gray-100 modern-card hover-glow transition-all">
            <h3 className="text-lg font-black text-gray-800 mb-6 sm:mb-8">{t('analytics.blockEfficiency')}</h3>
            <div className="h-[250px] sm:h-[300px] md:h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.blockWise} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                    <XAxis type="number" axisLine={false} tickLine={false} />
                    <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} width={100} tick={{ fontSize: 11, fontWeight: 700 }} />
                    <Tooltip />
                    <Bar dataKey="collection" fill="#059669" radius={[0, 10, 10, 0]} barSize={30} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="bg-white rounded-[2rem] sm:rounded-[2.5rem] p-5 sm:p-8 shadow-sm border border-gray-100">
              <h3 className="text-lg font-black text-gray-800 mb-6 sm:mb-8">{t('analytics.blockRanking')}</h3>
              <div className="space-y-3">
                {data.blockWise.map((it, idx) => (
                  <div key={it.name} className="flex items-center gap-4">
                    <span className="w-6 text-sm font-black text-gray-300">#{idx + 1}</span>
                    <div className="flex-1">
                      <div className="flex justify-between mb-1">
                        <span className="text-xs font-black text-gray-700">{it.name}</span>
                        <span className="text-xs font-bold text-forest-600">₹{it.collection.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-forest-500 rounded-full" 
                          style={{ width: `${(it.collection / data.blockWise[0].collection) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'type':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-8 animate-fade-in-up">
          <div className="lg:col-span-2 bg-white rounded-[1.5rem] sm:rounded-[2.5rem] p-4 sm:p-8 shadow-sm border border-gray-100 modern-card hover-glow transition-all">
            <h3 className="text-lg font-black text-gray-800 mb-6 sm:mb-8">{t('analytics.businessSector')}</h3>
            <div className="h-[250px] sm:h-[300px] md:h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.typeWise}
                      cx="50%"
                      cy="50%"
                      innerRadius="60%"
                      outerRadius="90%"
                      paddingAngle={5}
                      dataKey="collection"
                    >
                      {data.typeWise.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '20px' }} />
                    <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '10px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="bg-white rounded-[2rem] sm:rounded-[2.5rem] p-5 sm:p-8 shadow-sm border border-gray-100">
              <h3 className="text-lg font-black text-gray-800 mb-6 sm:mb-8">{t('analytics.sectorRevenue')}</h3>
              <div className="space-y-4">
                {data.typeWise.map((it, idx) => (
                  <div key={it.name} className="flex items-center justify-between p-4 rounded-2xl border border-gray-50 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></div>
                      <span className="text-xs font-black text-gray-700">{it.name}</span>
                    </div>
                    <span className="text-xs font-bold text-gray-600">₹{it.collection.toLocaleString('en-IN')}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen mountain-bg pt-8 sm:pt-12 pb-8 sm:pb-12 px-2 sm:px-4 md:px-8 animate-fade-in overflow-x-hidden">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-6 sm:mb-12">
          <div className="animate-slide-in-left">
            <h1 className="text-2xl sm:text-3xl lg:text-5xl font-black font-heading text-maroon-500 tracking-tighter mb-2 flex items-center gap-3">
              <FiTrendingUp className="text-saffron-500 w-6 h-6 sm:w-8 sm:h-8" /> {t('analytics.taxAnalysis')}
            </h1>
            <p className="text-[10px] text-gray-500 font-bold font-sans uppercase tracking-[0.3em]">{t('analytics.intelligenceEngine')}</p>
          </div>
          
          <button 
            onClick={handlePrint}
            className="w-full md:w-auto flex items-center justify-center gap-3 bg-white border border-gray-200 hover:border-maroon-500 hover:text-maroon-600 text-gray-700 font-black text-xs uppercase tracking-widest px-8 py-4 rounded-2xl shadow-sm transition-all transform active:scale-95 hover-lift hover-glow"
          >
            <FiDownload className="w-4 h-4 group-hover:animate-bounce" />
            {t('analytics.exportReport')}
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-col md:flex-row gap-2 p-2 bg-gray-100/50 backdrop-blur-md rounded-[2rem] border border-gray-100 mb-10 w-full md:w-fit animate-fade-in shrink-0">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2.5 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all w-full md:w-auto ${
                activeTab === tab.id 
                ? 'bg-white text-maroon-600 shadow-lg shadow-gray-200/50 scale-[1.02] md:scale-100' 
                : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50/50'
              }`}
            >
              <tab.icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Intelligence Grid */}
        <div className="relative min-h-[600px]">
          {renderActiveContent()}
        </div>
      </div>
    </div>
  );
}
