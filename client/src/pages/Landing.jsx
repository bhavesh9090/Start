import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { motion, useInView, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { 
  FiShield, FiZap, FiEye, FiGlobe, FiMail, FiPhone, FiMapPin, FiClock, 
  FiSend, FiUsers, FiChevronRight, FiCheckCircle, FiInfo, FiFileText, 
  FiLayout, FiTruck, FiShoppingBag, FiTool, FiActivity, FiMessageSquare,
  FiCreditCard, FiBell, FiLock, FiArrowRight, FiStar,
  FiFacebook, FiTwitter, FiInstagram, FiLinkedin, FiGithub 
} from 'react-icons/fi';
import { complaintAPI, authAPI, helpAPI } from '../services/api';
import UttarakhandMap from '../components/UttarakhandMap';
import ChatBot from '../components/ChatBot';
import logoImg from '../assets/logo.png';
import sumitImg from '../assets/sumit.png';
import manishImg from '../assets/manish.jpeg';
import bhaveshImg from '../assets/bhavesh.jpeg';
import deepakImg from '../assets/deepak.png';
import lalitImg from '../assets/lalit.jpeg';
import sahilImg from '../assets/sahil.jpeg';
import rajaImg from '../assets/raja.jpeg';
import gauravImg from '../assets/gaurav.jpeg';
import Loader from '../components/Loader';

gsap.registerPlugin(ScrollTrigger);

// ==================== ANIMATION VARIANTS ====================
const fadeInUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.12, delayChildren: 0.1 } }
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] } }
};

// ==================== ANIMATED COUNTER ====================
function AnimatedCounter({ target, suffix = '' }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  
  useEffect(() => {
    if (inView) {
      const num = parseInt(target.replace(/\D/g, '')) || 0;
      const duration = 2000;
      const step = num / (duration / 16);
      let current = 0;
      const timer = setInterval(() => {
        current += step;
        if (current >= num) {
          setCount(num);
          clearInterval(timer);
        } else {
          setCount(Math.floor(current));
        }
      }, 16);
      return () => clearInterval(timer);
    }
  }, [inView, target]);
  
  return <span ref={ref} className="counter-value">{count}{suffix}</span>;
}

// ==================== FLOATING PARTICLES ====================
function FloatingParticles() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(6)].map((_, i) => (
        <div
          key={i}
          className="absolute rounded-full"
          style={{
            width: `${8 + i * 6}px`,
            height: `${8 + i * 6}px`,
            background: `radial-gradient(circle, ${
              ['rgba(255,140,0,0.3)', 'rgba(128,0,0,0.2)', 'rgba(46,139,87,0.25)'][i % 3]
            }, transparent)`,
            left: `${10 + i * 15}%`,
            top: `${20 + (i % 3) * 25}%`,
            animation: `float-particle ${4 + i * 1.5}s ease-in-out infinite`,
            animationDelay: `${i * 0.8}s`,
          }}
        />
      ))}
    </div>
  );
}


export default function Landing() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-white text-gray-800 overflow-hidden">
      <HeroSection t={t} />
      <AboutSection t={t} />
      <HelpSection t={t} />
      <ComplaintSection t={t} />
      <AboutUsSection t={t} />
      <Footer t={t} />
      <ChatBot />
      <ProjectDisclaimer t={t} />
    </div>
  );
}

const districtDetails = {
    "Almora": { height: "1,600m", famous: "Nanda Devi, Bal Mithai", hq: "Almora", description: "The cultural heart of Kumaon, known for its rich heritage and stunning Himalayan views." },
    "Bageshwar": { height: "1,004m", famous: "Bagnath Temple", hq: "Bageshwar", description: "Located at the holy confluence of Saryu and Gomti rivers." },
    "Chamoli": { height: "1,550m", famous: "Badrinath, Valley of Flowers", hq: "Gopeshwar", description: "Known as the Abode of Gods, home to major shrines and world heritage sites." },
    "Champawat": { height: "1,615m", famous: "Tea Gardens, Kranteshwar", hq: "Champawat", description: "Mythological land where Lord Vishnu took the Kurma incarnation." },
    "Dehradun": { height: "450m", famous: "FRI, Robber's Cave", hq: "Dehradun", description: "The capital city nestled in the Doon Valley between Ganga and Yamuna." },
    "Nainital": { height: "2,084m", famous: "Naini Lake, Mall Road", hq: "Nainital", description: "The Lake District of India, a popular hill station with emerald lakes." },
    "Garhwal": { height: "1,814m", famous: "Kandoliya Temple", hq: "Pauri", description: "Commanding views of snow-capped peaks and deep valleys. (Pauri Garhwal)" },
    "Pithoragarh": { height: "1,645m", famous: "Mini Kashmir, Chandak", hq: "Pithoragarh", description: "A picturesque valley often called the 'Little Kashmir' of Uttarakhand." },
    "Rudraprayag": { height: "895m", famous: "Kedarnath Temple", hq: "Rudraprayag", description: "Naming after Lord Shiva, it marks the confluence of Alaknanda and Mandakini." },
    "Tehri Garhwal": { height: "1,750m", famous: "Tehri Dam, Surkanda", hq: "New Tehri", description: "Home to one of the world's highest dams and beautiful New Tehri town." },
    "Udham Singh Nagar": { height: "200m", famous: "Industrial Hub, Nanakmatta", hq: "Rudrapur", description: "The 'Food Bowl of Uttarakhand' and a major industrial center." },
    "Uttarkashi": { height: "1,158m", famous: "Gangotri, Yamunotri", hq: "Uttarkashi", description: "Holy land of temples and the source of the sacred Ganga and Yamuna." },
    "Hardwar": { height: "314m", famous: "Har Ki Pauri, Kumbh Mela", hq: "Haridwar", description: "The gateway to the gods and one of the seven holiest places in India. (Haridwar)" },
  };

// ==================== HERO SECTION ====================
function HeroSection({ t }) {
  const [titleLangToggle, setTitleLangToggle] = useState(false);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setTitleLangToggle(prev => !prev);
    }, 5000);
    return () => clearInterval(interval);
  }, []);


  const [selectedDistrict, setSelectedDistrict] = useState(null);
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const yParallax = useTransform(scrollYProgress, [0, 1], ['0%', '30%']);

  return (
    <section ref={heroRef} className="relative min-h-screen flex items-center justify-center bg-gradient-to-b from-red-50/40 via-white to-green-50/40 pt-16 overflow-hidden">
      {/* Animated Background Orbs */}
      <div className="absolute inset-0">
        <motion.div 
          className="absolute top-20 left-10 w-72 h-72 bg-gradient-to-br from-red-200/30 to-red-100/20 rounded-full blur-3xl"
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div 
          className="absolute bottom-20 right-10 w-96 h-96 bg-gradient-to-br from-green-200/30 to-emerald-100/20 rounded-full blur-3xl"
          animate={{ scale: [1.2, 1, 1.2], opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div 
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-br from-red-100/10 to-green-100/10 rounded-full blur-3xl"
          animate={{ rotate: 360 }}
          transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
        />
      </div>
      <FloatingParticles />

      <div className="relative z-10 max-w-7xl mx-auto px-4 w-full">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Text Content */}
          <motion.div 
            className="text-center lg:text-left"
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
          >
            <motion.div variants={fadeInUp} className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/80 backdrop-blur-xl border border-red-200/50 rounded-full mb-8 shadow-lg shadow-red-100/20">
              <FiShield className="w-4 h-4 text-red-500" />
              <span className="text-sm font-semibold text-gray-700">{t('nav.zilaPanchayat')}</span>
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            </motion.div>
            
            <motion.h1 variants={fadeInUp} className="text-4xl sm:text-5xl md:text-7xl font-extrabold mb-6 leading-normal text-gray-900 h-[80px] sm:h-[100px] md:h-[130px] flex items-center justify-center lg:justify-start">
              <AnimatePresence mode="wait">
                <motion.span
                  key={titleLangToggle ? 'hi' : 'en'}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                  className="bg-gradient-to-r from-red-800 via-rose-700 to-emerald-800 bg-clip-text text-transparent pt-6 pb-4 block w-full"
                >
                  {titleLangToggle ? 'ई-टैक्सपे' : 'E-TaxPay'}
                </motion.span>
              </AnimatePresence>
            </motion.h1>
            
            <motion.p variants={fadeInUp} className="text-xl md:text-2xl font-semibold text-gray-600 mb-4">
              {t('hero.subtitle')}
            </motion.p>
            
            <motion.p variants={fadeInUp} className="text-lg text-gray-500 max-w-2xl mx-auto lg:mx-0 mb-10 leading-relaxed">
              {t('hero.description')}
            </motion.p>
            
            <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 mb-12">
              <motion.a 
                href="/register"
                className="bg-gradient-to-r from-red-600 to-red-500 text-white font-semibold text-lg px-8 py-4 flex items-center gap-3 shadow-xl shadow-red-500/25 rounded-2xl group"
                whileHover={{ scale: 1.03, y: -2 }}
                whileTap={{ scale: 0.98 }}
              >
                {t('hero.cta')}
                <FiArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </motion.a>
              <motion.a 
                href="#about"
                className="px-8 py-4 text-lg font-semibold text-green-600 border-2 border-green-200 rounded-2xl hover:bg-green-50 transition-all duration-300 backdrop-blur-sm"
                whileHover={{ scale: 1.03, y: -2 }}
                whileTap={{ scale: 0.98 }}
              >
                {t('hero.learnMore')}
              </motion.a>
            </motion.div>

            {/* Animated Stats */}
            <motion.div variants={fadeInUp} className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { value: '13', label: t('hero.districts'), suffix: '' },
                { value: '500', label: t('hero.registeredShops'), suffix: '+' },
                { value: '100', label: t('hero.secure'), suffix: '%' },
                { value: '24/7', label: t('hero.support'), suffix: '', isStatic: true },
              ].map((stat, i) => (
                <motion.div 
                  key={i} 
                  className="bg-white/80 backdrop-blur-md border border-gray-100 shadow-md rounded-2xl p-4 text-center group cursor-default"
                  whileHover={{ y: -4, boxShadow: '0 20px 40px rgba(239,68,68,0.1)' }}
                >
                  <div className="text-2xl font-black text-red-500 group-hover:text-green-500 transition-colors">
                    {stat.isStatic ? stat.value : <AnimatedCounter target={stat.value} suffix={stat.suffix} />}
                  </div>
                  <div className="text-xs font-bold text-gray-500 mt-1 uppercase tracking-wider">{stat.label}</div>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>

          {/* Interactive Map */}
          <motion.div 
            className="flex flex-col justify-center items-center relative order-first lg:order-last mb-12 lg:mb-0 lg:scale-[1.7] xl:scale-[2]"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            style={{ y: yParallax }}
          >
            <div className="absolute inset-0 bg-gradient-to-tr from-red-500/10 to-green-500/10 rounded-full blur-3xl -z-10 animate-pulse" />

            <div className="animate-float w-full max-w-lg lg:max-w-xl xl:max-w-2xl flex justify-center">
              <UttarakhandMap 
                onDistrictClick={useCallback((district) => setSelectedDistrict({
                  ...district,
                  ...districtDetails[district.name]
                }), [])} 
              />
            </div>
            
            {/* District Info Popup */}
            {selectedDistrict && (
              <div className="fixed inset-0 lg:absolute lg:inset-auto z-[60] flex items-center justify-center p-4 lg:p-0 lg:-top-8 lg:left-1/2 lg:-translate-x-1/2 overflow-hidden pointer-events-none">
                <div 
                  className="absolute inset-0 bg-white/70 backdrop-blur-md lg:hidden pointer-events-auto"
                  onClick={() => setSelectedDistrict(null)}
                />
                <motion.div 
                  className="relative bg-white/95 backdrop-blur-xl p-4 rounded-3xl shadow-[0_15px_35px_rgba(239,68,68,0.12)] border-2 border-red-400 w-full max-w-[250px] lg:w-[260px] pointer-events-auto"
                  initial={{ opacity: 0, scale: 0.8, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                >
                  <button 
                    onClick={() => setSelectedDistrict(null)} 
                    className="absolute top-2 right-2 w-6 h-6 rounded-full bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-100 transition-all text-sm font-bold"
                  >×</button>

                  <div className="space-y-2">
                    <div className="border-b border-gray-100 pb-1.5">
                      <h3 className="text-lg font-black text-gray-900 leading-tight pr-5">
                        {selectedDistrict.name === 'Hardwar' ? 'Haridwar' : selectedDistrict.name === 'Garhwal' ? 'Pauri Garhwal' : selectedDistrict.name}
                      </h3>
                      <p className="text-[7px] font-bold uppercase tracking-widest text-red-500 truncate">{t('hero.districtZP')}</p>
                    </div>
                    <p className="text-gray-500 text-[10px] leading-snug italic line-clamp-2">
                      "{selectedDistrict.description || 'Uttarakhand District.'}"
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-red-50/70 p-2 rounded-xl border border-red-100">
                        <span className="text-[7px] text-red-500 font-bold uppercase block mb-0.5">Height</span>
                        <span className="text-sm font-black text-red-800">{selectedDistrict.height || 'N/A'}</span>
                      </div>
                      <div className="bg-green-50/70 p-2 rounded-xl border border-green-100 overflow-hidden">
                        <span className="text-[7px] text-green-600 font-bold uppercase block mb-0.5">HQ</span>
                        <span className="text-[10px] font-black text-green-800 truncate block">{selectedDistrict.hq || 'N/A'}</span>
                      </div>
                    </div>
                    <div className="bg-gray-50 p-2 rounded-xl border border-gray-100">
                      <p className="text-[7px] text-gray-400 font-bold uppercase mb-0.5">Famous</p>
                      <p className="text-[10px] font-bold text-gray-800 leading-tight truncate">{selectedDistrict.famous || 'Natural Beauty'}</p>
                    </div>
                    <div className="flex justify-center items-center bg-green-50/70 py-1.5 rounded-xl border border-green-200">
                      <div className="w-4 h-4 bg-white rounded flex items-center justify-center text-green-600 shadow-sm border border-green-100 mr-2">
                        <FiCheckCircle className="w-3 h-3" />
                      </div>
                      <p className="text-[9px] font-black text-green-700 lowercase tracking-tight">online & {t('hero.active')}</p>
                    </div>
                  </div>
                </motion.div>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </section>
  );
}

// ==================== ABOUT SECTION ====================
function AboutSection({ t }) {
  const features = [
    { icon: FiShield, title: t('about.feature1Title'), desc: t('about.feature1Desc'), gradient: 'from-red-500 to-red-400' },
    { icon: FiCreditCard, title: t('about.feature2Title'), desc: t('about.feature2Desc'), gradient: 'from-red-400 to-rose-400' },
    { icon: FiActivity, title: t('about.feature3Title'), desc: t('about.feature3Desc'), gradient: 'from-green-500 to-emerald-400' },
    { icon: FiMessageSquare, title: t('about.feature4Title'), desc: t('about.feature4Desc'), gradient: 'from-green-400 to-green-300' },
    { icon: FiBell, title: t('about.feature5Title'), desc: t('about.feature5Desc'), gradient: 'from-red-500 to-rose-400' },
    { icon: FiLock, title: t('about.feature6Title'), desc: t('about.feature6Desc'), gradient: 'from-emerald-500 to-green-400' },
  ];

  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="about" className="py-28 px-4 bg-white relative overflow-hidden">
      {/* Subtle bg decoration */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-red-100/30 rounded-full blur-3xl -z-0" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-green-100/20 rounded-full blur-3xl -z-0" />
      
      <div className="max-w-6xl mx-auto relative z-10" ref={ref}>
        <div className="text-center mb-20">
          <motion.span 
            className="text-red-500 font-bold tracking-[0.3em] uppercase text-xs mb-4 block"
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5 }}
          >
            WHY E-TAXPAY
          </motion.span>
          <motion.h2 
            className="section-title mb-5"
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            {t('about.title')}
          </motion.h2>
          <motion.p 
            className="text-lg text-gray-500 max-w-3xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            {t('about.description')}
          </motion.p>
        </div>
        
        <motion.div 
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
          variants={staggerContainer}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
        >
          {features.map((f, i) => (
            <motion.div 
              key={i}
              className="premium-card p-8 group cursor-default"
              variants={scaleIn}
              whileHover={{ y: -8, transition: { duration: 0.3 } }}
            >
              <div className={`w-14 h-14 mb-6 rounded-2xl bg-gradient-to-br ${f.gradient} flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-500`}>
                <f.icon className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-3 group-hover:text-red-500 transition-colors">{f.title}</h3>
              <p className="text-gray-500 leading-relaxed text-sm">{f.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

// ==================== HELP SECTION ====================
function HelpSection({ t }) {
  const [form, setForm] = useState({ name: '', email: '', mobile: '', message: '' });
  const [sent, setSent] = useState(false);
  const { showToast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await helpAPI.submit(form);
      setSent(true);
      showToast(t('tax.sent') || 'Help request sent successfully!', 'success');
      setTimeout(() => {
        setSent(false);
        setForm({ name: '', email: '', mobile: '', message: '' });
      }, 3000);
    } catch (err) {
      console.error('Help submission error:', err);
      showToast('Failed to send help request. Please check your connection.', 'error');
    }
  };

  return (
    <section id="help" className="py-28 px-4 bg-gradient-to-b from-gray-50 to-white relative overflow-hidden">
      <div className="absolute top-20 left-1/4 w-64 h-64 bg-red-100/30 rounded-full blur-3xl" />
      
      <div className="max-w-6xl mx-auto relative z-10">
        <div className="text-center mb-16" data-aos="fade-up">
          <span className="text-green-600 font-bold tracking-[0.3em] uppercase text-xs mb-4 block">SUPPORT</span>
          <h2 className="section-title mb-4">{t('help.title')}</h2>
          <p className="text-lg text-gray-500">{t('help.description')}</p>
        </div>
        <div className="grid md:grid-cols-2 gap-10">
          <motion.form 
            onSubmit={handleSubmit} 
            className="premium-card p-8 space-y-5"
            data-aos="fade-right"
            whileHover={{ boxShadow: '0 25px 50px rgba(239,68,68,0.08)' }}
          >
            <input type="text" placeholder={t('help.name')} className="input-field focus:ring-red-400 focus:scale-[1.01] transition-all"
              value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} required />
            <input type="email" placeholder={t('help.email')} className="input-field focus:ring-red-400 focus:scale-[1.01] transition-all"
              value={form.email} onChange={(e) => setForm({...form, email: e.target.value})} required />
            <input type="tel" placeholder={t('help.mobile')} className="input-field focus:ring-red-400 focus:scale-[1.01] transition-all"
              value={form.mobile} onChange={(e) => setForm({...form, mobile: e.target.value.replace(/\D/g, '').slice(0, 10)})} maxLength="10" />
            <textarea placeholder={t('help.message')} rows={4} className="input-field resize-none focus:ring-red-400 focus:scale-[1.01] transition-all"
              value={form.message} onChange={(e) => setForm({...form, message: e.target.value})} required />
            <motion.button 
              type="submit" 
              className="bg-gradient-to-r from-red-600 to-red-500 text-white font-semibold w-full flex items-center justify-center gap-2 py-4 text-lg rounded-2xl shadow-lg shadow-red-500/20"
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
            >
              <FiSend className="w-4 h-4" />
              {sent ? `✓ ${t('tax.sent')}` : t('help.submit')}
            </motion.button>
          </motion.form>

          <div className="space-y-4" data-aos="fade-left" data-aos-delay="100">
            <h3 className="text-xl font-bold text-green-600 mb-2">{t('help.contactTitle')}</h3>
            <div className="space-y-3">
              {[
                { icon: FiMapPin, text: t('help.address'), gradient: 'from-red-500 to-red-400' },
                { icon: FiPhone, text: t('help.phone'), gradient: 'from-red-400 to-rose-400' },
                { icon: FiMail, text: t('help.emailId'), gradient: 'from-green-500 to-emerald-400' },
                { icon: FiClock, text: t('help.hours'), gradient: 'from-green-400 to-green-300' },
              ].map((item, i) => (
                <motion.div 
                  key={i} 
                  className="flex items-start gap-4 p-4 premium-card"
                  whileHover={{ x: 6, transition: { duration: 0.2 } }}
                >
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${item.gradient} flex items-center justify-center flex-shrink-0 shadow-md`}>
                    <item.icon className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-gray-600 flex-1 pt-2 text-sm">{item.text}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function ComplaintSection({ t }) {
  const [form, setForm] = useState({ name: '', mobile: '', subject: '', description: '', district_id: '' });
  const [districts, setDistricts] = useState([
    { id: 'cf6e1dfc-4f9a-4e6c-a75c-b25c123f3878', name: 'Almora' },
    { id: 'b5fbbc16-edd4-4838-9112-65aa2aba2180', name: 'Bageshwar' },
    { id: '8733bd15-e5eb-43fb-8515-37542f699703', name: 'Chamoli' },
    { id: 'd4adb1a6-5b5b-4c86-8d05-c2c768d6d765', name: 'Champawat' },
    { id: '1042b9ed-bcf9-4fbd-ba26-710e18ae9cc7', name: 'Dehradun' },
    { id: 'c3a34dc1-86f6-4223-bb97-3e3a655d7de3', name: 'Haridwar' },
    { id: '58dd52ab-2f34-4333-97ef-b7fc0761463e', name: 'Nainital' },
    { id: 'bde97633-b8ea-4137-8cbb-7c49625232b9', name: 'Pauri Garhwal' },
    { id: '6cb6f451-95f9-4edf-8520-1ef8cf6b1848', name: 'Pithoragarh' },
    { id: '0c696371-31cf-42c3-ac1a-a3658e3e663e', name: 'Rudraprayag' },
    { id: 'b4fec44d-e944-4321-a099-fb9d2f1ae606', name: 'Tehri Garhwal' },
    { id: '8afe531d-9e86-4e10-a3b7-8672748887f6', name: 'Udham Singh Nagar' },
    { id: '220b8156-3d96-47c0-89bf-cca149fb6bfe', name: 'Uttarkashi' }
  ]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    authAPI.getDistricts().then(res => {
      setDistricts(res.data.districts || []);
    }).catch(() => {});
  }, []);

  const { showToast } = useToast();

  const handleComplaintSubmit = async (e) => {
    e.preventDefault();
    if (!form.district_id) {
      showToast('Please select a district admin', 'error');
      return;
    }
    const mobileRegex = /^[0-9]{10}$/;
    if (!mobileRegex.test(form.mobile)) {
      showToast('Please enter a valid 10-digit mobile number', 'error');
      return;
    }
    setLoading(true);
    try {
      await complaintAPI.create(form);
      showToast('Complaint submitted successfully!', 'success');
      setForm({ name: '', mobile: '', subject: '', description: '', district_id: '' });
    } catch (err) {
      showToast('Failed to submit complaint', 'error');
    }
    setLoading(false);
  };

  return (
    <section id="complaint" className="py-28 px-4 bg-gray-50 relative overflow-hidden">
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-green-100/20 rounded-full blur-3xl" />
      
      <div className="max-w-4xl mx-auto relative z-10">
        <div className="text-center mb-12" data-aos="fade-up">
          <span className="text-red-500 font-bold tracking-[0.3em] uppercase text-xs mb-4 block">GRIEVANCE CELL</span>
          <h2 className="section-title mb-4">{t('complaintSection.title')}</h2>
          <div className="flex justify-center mb-4">
            <span className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-forest-50 border border-forest-100 text-forest-600 rounded-full text-xs font-bold animate-pulse uppercase tracking-wider">
              <span className="w-1.5 h-1.5 bg-forest-500 rounded-full" />
              Real-time Routing Active
            </span>
          </div>
          <p className="text-lg text-gray-400">{t('complaintSection.description')}</p>
        </div>
        
        <motion.form 
          onSubmit={handleComplaintSubmit} 
          className="premium-card p-8 space-y-5"
          data-aos="zoom-in"
          whileHover={{ boxShadow: '0 25px 50px rgba(128,0,0,0.08)' }}
        >
          <div className="grid md:grid-cols-2 gap-5">
            <input type="text" placeholder={t('complaintSection.name')} className="input-field focus:scale-[1.01] transition-all"
              value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} required />
            <input type="tel" placeholder={t('complaintSection.mobile')} className="input-field focus:scale-[1.01] transition-all"
              value={form.mobile} onChange={(e) => setForm({...form, mobile: e.target.value.replace(/\D/g, '').slice(0, 10)})} maxLength="10" required />
          </div>
          <div className="grid md:grid-cols-2 gap-5">
            <select 
              className="input-field bg-white focus:scale-[1.01] transition-all"
              value={form.district_id}
              onChange={(e) => setForm({...form, district_id: e.target.value})}
              required
            >
              <option value="">{t('complaintSection.selectDistrict') || 'Select District Admin'}</option>
              {districts.map(d => (
                <option key={d.id} value={d.id}>{d.name} Admin</option>
              ))}
            </select>
            <input type="text" placeholder={t('complaintSection.subject')} className="input-field focus:scale-[1.01] transition-all"
              value={form.subject} onChange={(e) => setForm({...form, subject: e.target.value})} required />
          </div>
          <textarea placeholder={t('complaintSection.description_field')} rows={5} className="input-field resize-none focus:scale-[1.01] transition-all"
            value={form.description} onChange={(e) => setForm({...form, description: e.target.value})} required />
          <motion.button 
            type="submit" 
            disabled={loading} 
            className="bg-gradient-to-r from-green-600 to-green-500 text-white font-semibold w-full disabled:opacity-50 flex items-center justify-center gap-2 py-4 text-lg rounded-2xl shadow-xl shadow-green-500/20"
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
          >
            {loading ? (
              <Loader size="small" />
            ) : (
              <>
                <FiSend className="w-5 h-5" />
                {t('complaintSection.submit')}
              </>
            )}
          </motion.button>
        </motion.form>
      </div>
    </section>
  );
}

const BlobPaths = [
    "M44.7,-76.4C58.8,-69.2,71.8,-59.1,79.6,-45.8C87.4,-32.6,90,-16.3,88.5,-0.9C87,14.6,81.4,29.2,72.1,40.1C62.8,51,49.8,58.3,36.5,66.4C23.2,74.5,9.6,83.5,-5.1,83.5C-19.8,83.5,-39.7,74.5,-53.1,66.4C-66.5,58.3,-73.4,51,-79.8,40.1C-86.2,29.2,-92.1,14.6,-91.4,0.4C-90.7,-13.8,-83.4,-27.6,-74.6,-38.5C-65.8,-49.4,-55.5,-57.4,-44.1,-64.6C-32.7,-71.8,-20.2,-78.2,-5.1,-78.2C10,-78.2,20.1,-71.8,44.7,-76.4Z",
    "M42.2,-73.1C55.3,-64.5,67.1,-53.8,74.5,-40.5C81.9,-27.2,84.9,-11.3,83.5,4.1C82.1,19.5,76.3,34.4,66.4,45.8C56.5,57.2,42.5,65.1,28,71.2C13.5,77.3,-1.5,81.6,-16.5,80C-31.4,78.3,-46.3,70.7,-57.6,60.1C-68.9,49.5,-76.6,35.9,-80.6,21C-84.6,6.1,-84.9,-10.1,-79.7,-24.1C-74.5,-38.1,-63.8,-49.9,-51.1,-58.5C-38.4,-67.1,-23.7,-72.5,-8.4,-73.1C6.9,-73.7,21.1,-69.5,42.2,-73.1Z",
    "M39.6,-66.1C52.1,-60.1,63.5,-50.2,71.2,-37.9C78.9,-25.6,82.9,-11,82.3,3.7C81.7,18.4,76.5,33.2,67.2,45C57.9,56.8,44.5,65.6,29.9,71.1C15.3,76.6,-0.5,78.8,-15.7,76.5C-30.9,74.2,-45.5,67.4,-57,56.8C-68.5,46.2,-76.9,31.8,-79.8,16.5C-82.7,1.2,-80.1,-15,-73.6,-28.9C-67.1,-42.8,-56.7,-54.4,-44.2,-60.4C-31.7,-66.4,-17.1,-66.8,-1.1,-66.8C14.9,-66.8,27.1,-72.1,39.6,-66.1Z",
    "M35.6,-61.4C46.5,-54.3,55.9,-44.8,61.4,-33.5C66.9,-22.2,68.5,-9.1,68,-3.8C67.5,1.5,64.9,13.1,59.2,22.8C53.5,32.5,44.7,40.3,34.5,47.2C24.3,54.1,12.7,60.1,1.1,60.1C-10.5,60.1,-20.9,54.1,-29.9,47.2C-38.9,40.3,-46.5,32.5,-51.4,22.8C-56.3,13.1,-58.5,1.5,-57.6,-9.6C-56.7,-20.7,-52.7,-31.3,-46,-42.6C-39.3,-53.9,-29.9,-65.9,-19.1,-68.9C-8.3,-71.9,3.9,-65.9,16.4,-61.4C28.9,-56.9,24.7,-68.5,35.6,-61.4Z"
];

const BlobBackground = ({ color, index, className }) => {
  const colors = {
    red: "fill-red-500",
    green: "fill-green-500",
    purple: "fill-purple-500",
    orange: "fill-orange-500",
    blue: "fill-blue-500",
    rose: "fill-rose-500"
  };

  const path = BlobPaths[index % BlobPaths.length];

  return (
    <svg viewBox="-100 -100 200 200" xmlns="http://www.w3.org/2000/svg" className={className}>
      <motion.path 
        d={path} 
        className={colors[color] || colors.purple}
        initial={{ scale: 0.8, rotate: -10 }}
        whileHover={{ scale: 1.05, rotate: 5 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      />
    </svg>
  );
};

function AboutUsSection({ t }) {
  const team = [
    { name: t('aboutUs.member1'), role: t('aboutUs.role1'), email: "bhandari@taxpay.co", image: sumitImg, color: '#fbbf24', // Amber/Yellow
      github: 'https://github.com/sumitbhandari2006', instagram: 'https://www.instagram.com/yeah_sumithere', linkedin: 'https://www.linkedin.com/in/sumit-bhandari-1424b133a' },
    { name: t('aboutUs.member2'), role: t('aboutUs.role2'), email: "paliwal@taxpay.co", image: manishImg, color: '#60a5fa', // Blue
      github: 'https://github.com/Manish363-dot', instagram: 'https://www.instagram.com/manish__uk_01', linkedin: 'https://www.linkedin.com/in/manish-paliwal-389a74327' },
    { name: t('aboutUs.member3'), role: t('aboutUs.role3'), email: "bhavesh@taxpay.co", image: bhaveshImg, color: '#34d399', // Emerald/Mint
      github: 'https://github.com/bhavesh9090', instagram: 'https://www.instagram.com/bhavesh_bishtttt', linkedin: 'https://www.linkedin.com/in/bhavesh-bisht-549530328' },
    { name: t('aboutUs.member4'), role: t('aboutUs.role4'), email: "bisht@taxpay.co", image: deepakImg, color: '#a3e635', // Lime
      github: 'https://github.com/Deepakbisht010', instagram: 'https://www.instagram.com/deepak_bisht.001/', linkedin: 'https://www.linkedin.com/in/deepak-singh-a05583328/' },
    { name: t('aboutUs.member5'), role: t('aboutUs.role5'), email: "kanyal@taxpay.co", image: lalitImg, color: '#818cf8', // Indigo/Purple
      github: 'https://github.com/Lalit-73-02', instagram: 'https://www.instagram.com/?hl=en', linkedin: 'https://www.linkedin.com/in/lalit-singh-kanyal-929583328/' },
    { name: t('aboutUs.member6'), role: t('aboutUs.role6'), email: "sahil@taxpay.co", image: sahilImg, color: '#fb923c', // Orange
      github: 'https://github.com/sahil-chand-21', instagram: 'https://www.instagram.com/sahil._.chand', linkedin: 'https://www.linkedin.com/in/sahil-chand-077org' },
    { name: t('aboutUs.member7'), role: t('aboutUs.role7'), email: "raja@taxpay.co", image: rajaImg, color: '#f472b6', // Pink
      github: 'https://github.com/raja393-disigner', instagram: 'https://www.instagram.com/r_for_rautela', linkedin: 'https://www.linkedin.com/in/raja-rautela-07b589328/' },
    { name: t('aboutUs.member8'), role: t('aboutUs.role8'), email: "gaurav@taxpay.co", image: gauravImg, color: '#fbbf24', // Yellow
      github: 'https://www.instagram.com/gauri_bisht_07', instagram: 'https://instagram.com/manish', linkedin: 'https://www.linkedin.com/in/gaurav-bisht-04647a387' },
  ];

  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  return (
    <section id="about-us" className="py-24 px-4 bg-white relative overflow-hidden">
      <div className="max-w-6xl mx-auto" ref={ref}>
        <motion.div 
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-10 gap-y-20"
          variants={staggerContainer}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
        >
          {team.map((member, i) => (
            <motion.div 
              key={i} 
              className="group flex flex-col items-center text-center"
              variants={fadeInUp}
            >
              <div className="relative w-40 h-40 mb-6">
                {/* Colored Circle Background */}
                <div 
                  className="absolute inset-0 rounded-full transition-transform duration-500 group-hover:scale-110"
                  style={{ backgroundColor: member.color }}
                />
                
                {/* Person Image */}
                <div className="absolute inset-0 rounded-full overflow-hidden">
                  <img 
                    src={member.image} 
                    alt={member.name} 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                </div>
              </div>
              
              <div className="space-y-1">
                <h3 className="text-xl font-bold text-gray-900 tracking-tight">
                  {member.name}
                </h3>
                <p className="text-sm font-medium text-gray-500">
                  {member.role}
                </p>
                
                {/* Social Links - Fixed styles like screenshot */}
                <div className="flex gap-4 justify-center pt-3">
                  <a href={member.github} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-gray-600 transition-colors">
                    <FiGithub className="w-5 h-5" />
                  </a>
                  <a href={member.linkedin} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-gray-600 transition-colors">
                    <FiLinkedin className="w-5 h-5" />
                  </a>
                  <a href={member.instagram} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-gray-600 transition-colors">
                    <FiInstagram className="w-5 h-5" />
                  </a>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

// ==================== PROJECT DISCLAIMER ====================
function ProjectDisclaimer({ t }) {
  const [show, setShow] = useState(true);
  const [agreed, setAgreed] = useState(false);

  if (!show) return null;

  return (
    <motion.div 
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-lg"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <motion.div 
        className="bg-white rounded-3xl p-6 sm:p-8 w-full max-w-sm sm:max-w-md shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-gray-100 my-auto"
        initial={{ scale: 0.9, y: 30 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
      >
        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-gradient-to-br from-red-500 to-green-500 rounded-2xl flex items-center justify-center text-white mx-auto mb-4 shadow-lg">
            <FiInfo className="w-7 h-7" />
          </div>
          <h2 className="text-lg font-black text-gray-900 tracking-tight leading-tight">Important Disclaimer / महत्वपूर्ण जानकारी</h2>
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">{t('nav.zilaPanchayat')} Project</p>
        </div>
        
        <div className="space-y-4">
          <div className="space-y-3">
            <div className="flex gap-3 items-start p-3.5 bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl border border-amber-100">
              <FiZap className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-[11px] font-black text-gray-800">EDUCATIONAL ONLY / केवल शैक्षणिक कार्य</p>
                <p className="text-[10px] text-gray-500 font-medium">This site is for project demonstration only.<br/>यह वेबसाइट केवल प्रोजेक्ट प्रदर्शन के लिए है।</p>
              </div>
            </div>
            <div className="flex gap-3 items-start p-3.5 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-2xl border border-blue-100">
              <FiEye className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-[11px] font-black text-gray-800">DUMMY DATA NOTICE / डमी डेटा सूचना</p>
                <p className="text-[10px] text-gray-500 font-medium">Do not share real personal or financial info.<br/>असली व्यक्तिगत या वित्तीय जानकारी साझा न करें।</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 py-3 px-1 border-y border-gray-100 group cursor-pointer" onClick={() => setAgreed(!agreed)}>
            <motion.div 
              className={`w-5 h-5 rounded-md border-2 flex-shrink-0 flex items-center justify-center transition-all duration-300 ${agreed ? 'bg-red-500 border-red-500 text-white' : 'bg-white border-gray-300 group-hover:border-red-400'}`}
              whileTap={{ scale: 0.85 }}
            >
              {agreed && <FiCheckCircle className="w-3.5 h-3.5" />}
            </motion.div>
            <p className="text-[10px] sm:text-[11px] font-black text-gray-800 leading-tight">
              I agree to the above terms. / मैं सहमत हूँ।
            </p>
          </div>

          <motion.button 
            onClick={() => agreed && setShow(false)}
            disabled={!agreed}
            className={`w-full py-4 rounded-2xl font-black text-[11px] shadow-xl transition-all uppercase tracking-[0.2em] flex items-center justify-center gap-2 ${
              agreed 
                ? 'bg-gradient-to-r from-red-500 to-green-500 text-white hover:shadow-2xl' 
                : 'bg-gray-100 text-gray-400 cursor-not-allowed shadow-none'
            }`}
            whileHover={agreed ? { scale: 1.02, y: -2 } : {}}
            whileTap={agreed ? { scale: 0.98 } : {}}
          >
            <span>Enter Website / वेबसाइट खोलें</span>
            <FiChevronRight className="w-4 h-4" />
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function Footer({ t }) {
  return (
    <footer className="bg-gradient-to-br from-red-950 via-black to-green-950 text-gray-300 py-16 border-t-2 border-red-900/50 relative overflow-hidden">
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_20%_50%,rgba(153,27,27,0.3),transparent_50%)]" />
        <div className="absolute bottom-0 right-0 w-full h-full bg-[radial-gradient(circle_at_80%_80%,rgba(6,78,59,0.3),transparent_50%)]" />
      </div>
      <div className="max-w-6xl mx-auto px-4 relative z-10">
        <div className="grid md:grid-cols-3 gap-10 mb-10">
          <div data-aos="fade-up">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center overflow-hidden p-1.5 shadow-lg border border-white/10">
                <img src={logoImg} alt="Logo" className="w-full h-full object-contain drop-shadow-md" />
              </div>
              <span className="text-2xl font-bold text-white tracking-tight">{t('nav.logoName')}</span>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed">{t('footer.tagline')}</p>
          </div>
          <div data-aos="fade-up" data-aos-delay="100">
            <h3 className="text-lg font-bold mb-4 text-green-500">{t('footer.quickLinks')}</h3>
            <div className="space-y-2">
              {['home', 'about', 'help', 'complaint', 'aboutUs'].map((key) => (
                <a key={key} href={key === 'home' ? '/' : `#${key === 'aboutUs' ? 'about-us' : key}`}
                  className="block text-gray-400 hover:text-red-400 hover:translate-x-1 transition-all text-sm">
                  {t(`nav.${key}`)}
                </a>
              ))}
            </div>
          </div>
          <div data-aos="fade-up" data-aos-delay="200">
            <h3 className="text-lg font-bold mb-4 text-red-500">{t('footer.contact')}</h3>
            <div className="space-y-2 text-sm text-gray-400">
              <p>{t('help.address')}</p>
              <p>{t('help.phone')}</p>
              <p>{t('help.emailId')}</p>
            </div>
          </div>
        </div>
        <div className="border-t border-gray-800 pt-6 text-center text-sm text-gray-500">
          {t('footer.copyright')}
        </div>
      </div>
    </footer>
  );
}
