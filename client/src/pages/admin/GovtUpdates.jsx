import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { FiClock, FiTag, FiChevronRight, FiBell, FiX, FiInfo, FiChevronLeft } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';

export default function GovtUpdates() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [selectedUpdate, setSelectedUpdate] = useState(null);

  // Localized Mock Data
  const getMockUpdates = () => {
    const isHi = i18n.language === 'hi';
    return [
      {
        id: 1,
        title: isHi ? "नई ई-टैक्स नीति 2026" : "New E-Tax Policy 2026",
        content: isHi 
          ? "उत्तराखंड सरकार ने स्थानीय व्यवसायों को बढ़ावा देने के लिए पहाड़ी क्षेत्रों में वाणिज्यिक दुकानों के लिए संशोधित कर स्लैब की घोषणा की। कार्यान्वयन अगले वित्तीय तिमाही से शुरू होगा।"
          : "Government of Uttarakhand announces revised tax slabs for commercial shops in hilly regions to promote local businesses. Implementation starts next financial quarter.",
        created_at: "2026-03-15T10:00:00Z",
        category: "Policy",
        priority: "Urgent",
        scope: "State-wide",
        status: "Active"
      },
      {
        id: 2,
        title: isHi ? "डिजिटल उत्तराखंड पहल" : "Digital Uttarakhand Initiative",
        content: isHi
          ? "पारदर्शी कर संग्रह और बेहतर बुनियादी ढांचा योजना सुनिश्चित करने के लिए सभी जिला राजस्व ब्लॉकों के लिए वास्तविक समय जीआईएस मानचित्रण का एकीकरण।"
          : "Integration of real-time GIS mapping for all district revenue blocks to ensure transparent tax collection and better infrastructure planning.",
        created_at: "2026-03-10T14:30:00Z",
        category: "Digital Services",
        priority: "Normal",
        scope: "District Level",
        status: "In Progress"
      },
      {
        id: 3,
        title: isHi ? "जीएसटी अनुपालन कार्यशाला" : "GST Compliance Workshop",
        content: isHi
          ? "लघु स्तरीय कुटीर उद्योगों के लिए नई स्वचालित जीएसटी फाइलिंग प्रणाली पर जिला प्रशासकों के लिए आगामी क्षेत्रीय कार्यशाला।"
          : "Upcoming regional workshop for district administrators on the new automated GST filing system for small scale cottage industries.",
        created_at: "2026-03-05T09:15:00Z",
        category: "Tax Initiative",
        priority: "Announcement",
        scope: "Regional",
        status: "Scheduled"
      },
      {
        id: 14,
        title: isHi ? "त्रैमासिक राजस्व ऑडिट" : "Quarterly Revenue Audit",
        content: isHi
          ? "Q4 अवधि के लिए सभी जिला पंचायत राजस्व संग्रह का अनिवार्य ऑडिट। कृपया सुनिश्चित करें कि महीने के अंत तक सभी डिजिटल रसीदें सिंक्रनाइज़ हो जाएं।"
          : "Mandatory audit of all Zila Panchayat revenue collection for the Q4 period. Please ensure all digital receipts are synchronized by month end.",
        created_at: "2026-02-28T16:45:00Z",
        category: "Policy",
        priority: "Urgent",
        scope: "Administrative",
        status: "Mandatory"
      },
      {
        id: 15,
        title: isHi ? "पंचायत पोर्टल अपग्रेड" : "Panchayat Portal Upgrade",
        content: isHi
          ? "दूरस्थ पहाड़ी ब्लॉकों में 5जी कनेक्टिविटी का समर्थन करने के लिए संरचनात्मक उन्नयन के लिए केंद्रीय नागरिक पोर्टल रखरखाव से गुजरेगा।"
          : "The central citizen portal will undergo maintenance for structural upgrades to support 5G connectivity in remote hilly blocks.",
        created_at: "2026-02-15T11:20:00Z",
        category: "Digital Services",
        priority: "Normal",
        scope: "Technical",
        status: "Upcoming"
      }
    ];
  };

  const updates = getMockUpdates();

  useEffect(() => {
    // Simulated loading for premium feel
    const timer = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!selectedUpdate) return;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setSelectedUpdate(null);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [selectedUpdate]);

  useEffect(() => {
    if (!selectedUpdate) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [selectedUpdate]);

  const filteredUpdates = filter === 'all' 
    ? updates 
    : updates.filter(u => u.category === filter);

  return (
    <div className="min-h-screen mountain-bg pt-24 pb-12 px-4 shadow-inner">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div className="animate-slide-in-left">
            <h1 className="text-3xl md:text-4xl font-extrabold text-maroon-500 tracking-tight flex items-center gap-3 animate-fade-in mb-2">
              <FiBell className="w-7 h-7 md:w-8 md:h-8" /> {t('admin.govtUpdates')}
            </h1>
            <div className="flex flex-wrap items-center gap-2 text-gray-500">
               <div className="flex items-center gap-2">
                 <span className="w-2 h-2 rounded-full bg-forest-500"></span>
                 <span className="text-sm md:text-base">{t('adminPanel.govtUpdates.officialComm')}</span>
               </div>
               <span className="font-black text-saffron-600 uppercase tracking-[0.15em] text-xs md:text-sm bg-saffron-50 px-3 py-0.5 rounded-full border border-saffron-100">
                 {user?.district || 'District'}
               </span>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-white/50 backdrop-blur-sm px-6 py-3 rounded-2xl border border-saffron-200 animate-slide-in-right">
             <FiInfo className="text-saffron-500 w-5 h-5" />
             <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">{t('adminPanel.govtUpdates.readOnlyInbox')}</p>
          </div>
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap items-center gap-3 mb-10 animate-fade-in delay-100">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest py-1">{t('adminPanel.govtUpdates.filterNotices')}</span>
          {['all', 'Policy', 'Tax Initiative', 'Digital Services'].map(cat => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
                filter === cat
                  ? 'bg-black text-white shadow-lg scale-105'
                  : 'bg-white text-gray-400 hover:bg-gray-50 border border-gray-100 shadow-sm'
              }`}
            >
              {cat === 'all' ? t('adminPanel.govtUpdates.viewAll') : t(`adminPanel.govtUpdates.categories.${cat}`)}
            </button>
          ))}
        </div>

        {/* Updates Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {loading ? (
            Array(3).fill(0).map((_, i) => (
              <div key={i} className="glass-card p-8 h-64 animate-pulse bg-white/50"></div>
            ))
          ) : (
            filteredUpdates.map((update, index) => (
              <div 
                key={update.id} 
                className="glass-card group hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border-b-4 border-transparent hover:border-maroon-500 overflow-hidden animate-fade-in-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="p-8">
                  <div className="flex items-center justify-between mb-6">
                    <div className={`p-3 rounded-2xl ${
                      update.category.includes('Policy') ? 'bg-maroon-50 text-maroon-600' :
                      update.category.includes('Tax') ? 'bg-saffron-50 text-saffron-600' :
                      'bg-forest-50 text-forest-600'
                    }`}>
                      <FiTag className="w-5 h-5" />
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t(`adminPanel.govtUpdates.categories.${update.category}`)}</p>
                      <p className="text-[10px] font-bold text-gray-300 flex items-center justify-end gap-1 mt-0.5">
                        <FiClock className="w-3 h-3" /> {new Date(update.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <h3 className="text-xl font-black text-gray-900 mb-3 group-hover:text-maroon-600 transition-colors line-clamp-2">
                    {update.title}
                  </h3>
                  <p className="text-sm text-gray-500 leading-relaxed line-clamp-3 mb-8">
                    {update.content}
                  </p>

                  <div className="flex items-center justify-between pt-6 border-t border-gray-50">
                    <span className={`text-[10px] font-black px-3 py-1 rounded-lg uppercase tracking-widest ${
                      update.priority === 'Urgent' ? 'bg-red-50 text-red-600 animate-pulse' : 'bg-gray-50 text-gray-400'
                    }`}>
                      {t(`adminPanel.govtUpdates.priorities.${update.priority}`)}
                    </span>
                    <button 
                      onClick={() => setSelectedUpdate(update)}
                      className="flex items-center gap-1 text-[10px] font-black text-maroon-500 uppercase tracking-widest group-hover:gap-2 transition-all"
                    >
                      {t('adminPanel.govtUpdates.readNotice')} <FiChevronRight />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Detail Modal */}
      {selectedUpdate && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 animate-fade-in">
          <div className="absolute inset-0 bg-maroon-900/60 backdrop-blur-sm" onClick={() => setSelectedUpdate(null)}></div>
          <div
            className="relative bg-white w-full max-w-md p-5 sm:p-10 animate-scale-in border border-gray-100 shadow-2xl overflow-y-auto hide-scrollbar max-h-[75vh] sm:max-h-[calc(100vh-4rem)] rounded-[2rem] sm:rounded-[2.5rem]"
            role="dialog"
            aria-modal="true"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-gray-50 rounded-full -mr-16 -mt-16 opacity-50 -z-10"></div>
            
            <div className="flex justify-between items-start mb-6 sm:mb-10 gap-4">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="w-10 h-10 sm:w-16 sm:h-16 bg-black text-white rounded-xl sm:rounded-[1.3rem] flex items-center justify-center text-lg sm:text-2xl shadow-xl transform -rotate-3">
                  <FiBell />
                </div>
                <div>
                  <h2 className="text-xl sm:text-3xl font-black text-gray-900 tracking-tight uppercase leading-none">
                    {t('adminPanel.govtUpdates.officialNotice')}
                  </h2>
                  <p className="text-[8px] sm:text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1.5 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-forest-500"></span>{' '}
                    {t('adminPanel.govtUpdates.refId')} GEN-{selectedUpdate.id}2026
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedUpdate(null)}
                className="w-8 h-8 sm:w-10 sm:h-10 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors text-gray-400"
                aria-label="Close"
                title="Close"
              >
                <FiX className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </div>
            
            <div className="space-y-4 sm:space-y-8">
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4">
                 <div className="p-2 sm:p-4 bg-gray-50 rounded-xl sm:rounded-2xl border border-gray-100">
                    <p className="text-[8px] sm:text-[9px] font-black text-gray-400 uppercase tracking-widest mb-0.5">{t('adminPanel.govtUpdates.category')}</p>
                    <p className="text-[10px] sm:text-xs font-black text-gray-800">{t(`adminPanel.govtUpdates.categories.${selectedUpdate.category}`)}</p>
                 </div>
                 <div className="p-2 sm:p-4 bg-gray-50 rounded-xl sm:rounded-2xl border border-gray-100">
                    <p className="text-[8px] sm:text-[9px] font-black text-gray-400 uppercase tracking-widest mb-0.5">{t('adminPanel.govtUpdates.scope')}</p>
                    <p className="text-[10px] sm:text-xs font-black text-gray-800">{t(`adminPanel.govtUpdates.scopes.${selectedUpdate.scope}`)}</p>
                 </div>
                 <div className="p-2 sm:p-4 bg-gray-50 rounded-xl sm:rounded-2xl border border-gray-100 col-span-2 lg:col-span-1">
                    <p className="text-[8px] sm:text-[9px] font-black text-gray-400 uppercase tracking-widest mb-0.5">{t('adminPanel.govtUpdates.status')}</p>
                    <p className="text-[10px] sm:text-xs font-black text-forest-600">{t(`adminPanel.govtUpdates.statuses.${selectedUpdate.status}`)}</p>
                 </div>
              </div>

              <div className="bg-white rounded-2xl sm:rounded-3xl">
                 <h3 className="text-xl sm:text-2xl font-black text-gray-900 mb-3 sm:mb-4 leading-tight">{selectedUpdate.title}</h3>
                 <p className="text-[13px] sm:text-sm font-bold text-gray-600 leading-relaxed mb-4">
                   {selectedUpdate.content}
                 </p>
                 <div className="bg-maroon-50 p-4 sm:p-6 rounded-xl sm:rounded-2xl border-l-4 border-maroon-500 italic">
                    <p className="text-[10px] sm:text-xs font-bold text-maroon-900 opacity-80 leading-relaxed">
                      {t('adminPanel.govtUpdates.disclaimer')}
                    </p>
                 </div>
              </div>

              <button 
                onClick={() => setSelectedUpdate(null)}
                className="w-full bg-black hover:bg-gray-900 text-white font-black text-[10px] uppercase tracking-[0.3em] py-3.5 sm:py-5 rounded-xl sm:rounded-2xl shadow-xl transition-all active:scale-95 border-b-4 sm:border-b-8 border-gray-800"
              >
                {t('adminPanel.govtUpdates.acknowledgeClose')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
