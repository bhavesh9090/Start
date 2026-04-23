import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { motion, useInView, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { 
  FiShield, FiZap, FiEye, FiGlobe, FiMail, FiPhone, FiMapPin, FiClock, 
  FiSend, FiUsers, FiChevronRight, FiCheckCircle, FiInfo, FiFileText, 
  FiLayout, FiTruck, FiShoppingBag, FiTool, FiActivity, FiMessageSquare,
  FiCreditCard, FiBell, FiLock, FiArrowRight, FiStar, FiClipboard, FiSearch, FiMousePointer,
  FiFacebook, FiTwitter, FiInstagram, FiLinkedin, FiGithub 
} from 'react-icons/fi';
import { complaintAPI, authAPI, helpAPI } from '../services/api';
import UttarakhandMap from '../components/UttarakhandMap';
import ChatBot from '../components/ChatBot';
// Supabase Storage Configuration
const BUCKET_NAME = "assets";
const STORAGE_BASE = `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/${BUCKET_NAME}`;

const ASSET_IMAGES = {
  sumit: `${STORAGE_BASE}/sumit.png`,
  manish: `${STORAGE_BASE}/manish.jpeg`,
  bhavesh: `${STORAGE_BASE}/bhavesh.jpeg`,
  deepak: `${STORAGE_BASE}/deepak.png`,
  lalit: `${STORAGE_BASE}/lalit.jpeg`,
  sahil: `${STORAGE_BASE}/sahil.jpeg`,
  raja: `${STORAGE_BASE}/raja.jpeg`,
  gaurav: `${STORAGE_BASE}/gaurav.jpeg`,
  logo: `${STORAGE_BASE}/logo.png`
};

// Shared helper to render title with the last word highlighted
const renderTitle = (text, highlightClass = "text-highlight") => {
  if (!text) return "";
  const words = text.split(' ');
  if (words.length <= 1) return text;
  const lastWord = words.pop();
  return (
    <>
      {words.join(' ')}{' '}
      <span className={highlightClass}>{lastWord}</span>
    </>
  );
};
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
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <div className="min-h-screen bg-white text-gray-800 overflow-hidden">
      <HeroSection t={t} isMobile={isMobile} />
      <DevbhoomiBanner />
      <HowItWorksSection t={t} />
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

// ==================== HOW IT WORKS SECTION ====================
function HowItWorksSection({ t }) {
  const steps = [
    {
      num: '01',
      icon: <FiClipboard className="w-6 h-6" />,
      title: t('howItWorks.step1.title'),
      desc: t('howItWorks.step1.desc'),
      color: "red"
    },
    {
      num: '02',
      icon: <FiSearch className="w-6 h-6" />,
      title: t('howItWorks.step2.title'),
      desc: t('howItWorks.step2.desc'),
      color: "green"
    },
    {
      num: '03',
      icon: <FiMousePointer className="w-6 h-6" />,
      title: t('howItWorks.step3.title'),
      desc: t('howItWorks.step3.desc'),
      color: "red"
    }
  ];

  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section className="hiw-section" id="howitworks" ref={ref}>
      <div className="hiw-bg-pattern"></div>
      <div className="hiw-blob-red"></div>
      <div className="hiw-blob-green"></div>
      
      <div className="max-w-6xl mx-auto px-4 relative z-10">
        <div className="text-center mb-20 relative">
          <motion.span 
            className="text-[#e03434] tracking-widest uppercase font-bold text-sm mb-3 block"
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5 }}
          >
            {t('howItWorks.eyebrow')}
          </motion.span>
          <motion.h2 
            className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-[#1a1a1a] leading-tight font-outfit"
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            {t('howItWorks.heading').split('<br/>')[0]}<br/>
            <span className="text-[#e03434]">{t('howItWorks.heading').split('<br/>')[1]}</span>
          </motion.h2>
          <motion.p
            className="text-gray-500 mt-5 max-w-xl mx-auto text-lg"
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            {t('howItWorks.subtitle')}
          </motion.p>
        </div>

        <div className="relative">
          {/* Animated Dashed Line with traveling dot */}
          <div className="hiw-dashed-line hidden md:block">
            <div className="hiw-traveling-dot"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative z-10">
            {steps.map((step, index) => (
              <motion.div 
                key={index}
                className="hiw-premium-card group relative"
                initial={{ opacity: 0, y: 30 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: 0.3 + (index * 0.15) }}
              >
                {/* Background Watermark Number */}
                <div className="hiw-watermark-num">{step.num}</div>

                {/* Content */}
                <div className="relative z-10 flex flex-col items-center text-center h-full bg-white rounded-[20px] p-8 shadow-[0_8px_32px_rgba(0,0,0,0.07)] hover:-translate-y-2 transition-all duration-300 border border-gray-50 hover:shadow-[0_20px_40px_rgba(224,52,52,0.08)]">
                  
                  {/* Icon Circle */}
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-6 transition-all duration-300 ${
                    step.color === 'red' 
                      ? 'bg-red-50 text-[#e03434] group-hover:bg-[#e03434] group-hover:text-white group-hover:shadow-[0_0_20px_rgba(224,52,52,0.4)]' 
                      : 'bg-green-50 text-[#22c87a] group-hover:bg-[#22c87a] group-hover:text-white group-hover:shadow-[0_0_20px_rgba(34,200,122,0.4)]'
                  }`}>
                    {step.icon}
                  </div>

                  <h3 className="text-xl font-bold text-[#1a1a1a] font-outfit mb-3">{step.title}</h3>
                  <p className="text-gray-600 leading-relaxed flex-grow hiw-desc text-[15px]" dangerouslySetInnerHTML={{ __html: step.desc }}></p>
                  
                  {/* Step Pill */}
                  <div className="mt-8">
                    <span className="inline-block px-4 py-1.5 bg-red-50 text-[#e03434] text-[11px] font-black uppercase tracking-widest rounded-full">
                      Step {index + 1} of 3
                    </span>
                  </div>
                </div>

                {/* Connector Arrows */}
                {index < steps.length - 1 && (
                  <>
                    {/* Desktop Curved Arrow */}
                    <div className="hidden md:block absolute top-[40%] -right-[30px] w-20 pointer-events-none z-[1] opacity-60">
                      <svg viewBox="0 0 100 40" fill="transparent" className="w-full h-full text-[#e03434] stroke-current stroke-[3] stroke-dasharray-[4,4] animate-[pulse_2s_infinite]">
                        <path d="M0,20 Q50,-10 100,20" markerEnd="url(#arrowhead)"/>
                        <defs>
                          <marker id="arrowhead" markerWidth="6" markerHeight="4" refX="5" refY="2" orient="auto">
                            <polygon points="0 0, 6 2, 0 4" fill="#e03434" />
                          </marker>
                        </defs>
                      </svg>
                    </div>
                    {/* Mobile Downward Arrow */}
                    <div className="block md:hidden absolute left-1/2 -bottom-[40px] -translate-x-1/2 h-8 w-8 pointer-events-none z-[1] opacity-60">
                      <svg viewBox="0 0 20 40" fill="transparent" className="w-full h-full text-[#e03434] stroke-current stroke-[3] stroke-dasharray-[4,4] animate-[pulse_2s_infinite]">
                        <path d="M10,0 L10,36" markerEnd="url(#arrowhead-mob)"/>
                        <defs>
                          <marker id="arrowhead-mob" markerWidth="6" markerHeight="4" refX="5" refY="2" orient="auto">
                            <polygon points="0 0, 6 2, 0 4" fill="#e03434" />
                          </marker>
                        </defs>
                      </svg>
                    </div>
                  </>
                )}
              </motion.div>
            ))}
          </div>
        </div>

        {/* CTA Area */}
        <motion.div 
           className="mt-20 text-center"
           initial={{ opacity: 0, y: 30 }}
           animate={isInView ? { opacity: 1, y: 0 } : {}}
           transition={{ duration: 0.5, delay: 0.8 }}
        >
          <motion.div 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Link to="/register" className="inline-flex items-center gap-3 bg-[#e03434] text-white font-bold px-10 py-4 text-lg rounded-full shadow-[0_10px_30px_rgba(224,52,52,0.3)] hover:bg-[#c92a2a] hover:shadow-[0_15px_40px_rgba(224,52,52,0.4)] transition-all transform group">
              Get Started Now
              <FiArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>
          <div className="mt-6 flex items-center justify-center gap-2 text-[13px] text-gray-500 font-medium">
            <FiLock className="w-4 h-4 text-[#22c87a]" /> 
            <span>Secure &middot; Instant &middot; Government Verified</span>
          </div>
        </motion.div>

      </div>
    </section>
  );
}

// ==================== DEVBHOOMI BANNER ====================
function DevbhoomiBanner() {
  const items = [
    '🏔️ Uttarakhand Devbhoomi',
    '✦',
    '🏔️ उत्तराखंड देवभूमि',
    '✦',
    '🕉️ Land of the Gods',
    '✦',
    '🕉️ देवों की भूमि',
    '✦',
    '🏛️ Zila Panchayat',
    '✦',
    '🏛️ जिला पंचायत',
    '✦',
  ];

  // Duplicate items 4 times for seamless infinite scroll
  const marqueeItems = [...items, ...items, ...items, ...items];

  return (
    <div className="relative py-3 overflow-hidden my-0">
      <div className="relative bg-black py-5 overflow-hidden border-y border-white/10 shadow-[0_4px_30px_rgba(0,0,0,0.4)] -rotate-1 scale-x-[1.12]">
        {/* Fade edges */}
        <div className="absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-black to-transparent z-10 pointer-events-none" />
        <div className="absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-black to-transparent z-10 pointer-events-none" />

        <div className="flex whitespace-nowrap animate-marquee-scroll">
          {marqueeItems.map((item, i) => (
            item === '✦' ? (
              <span key={i} className="mx-6 text-white/40 text-lg flex-shrink-0">✦</span>
            ) : (
              <span
                key={i}
                className="mx-6 text-sm sm:text-base font-bold text-white tracking-wider uppercase flex-shrink-0 hover:text-white/60 transition-colors cursor-default"
              >
                {item}
              </span>
            )
          ))}
        </div>
      </div>
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
function HeroSection({ t, isMobile }) {
  const [selectedDistrict, setSelectedDistrict] = useState(null);
  const heroRef = useRef(null);
  const [titleIdx, setTitleIdx] = useState(0);

  const heroTitles = [
    "ई-टैक्सपे",
    "E-TaxPay"
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setTitleIdx(prev => (prev + 1) % 2);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section ref={heroRef} className="hero-gov mountain-bg text-left relative selection:bg-red-500/20">
      <div className="hero-gov-pattern"></div>
      <div className="hero-gov-blob-red"></div>
      <div className="hero-gov-blob-green"></div>
      <div className="hero-gov-arc"></div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 w-full pt-10">
        <div className="grid lg:grid-cols-[1fr_1fr] gap-12 items-center">
          
          {/* Left Text Content */}
          <motion.div 
            className="flex flex-col items-center lg:items-start text-center lg:text-left"
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
          >
            <motion.div variants={fadeInUp} className="hero-gov-badge mb-6 shadow-sm">
              <span className="w-4 h-4 flex items-center justify-center rounded-full bg-red-100 text-[10px]">🏛</span>
              {t('hero.govBadge')}
            </motion.div>
            
            <AnimatePresence mode="wait">
              <motion.h1 
                key={titleIdx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4 }}
                className="hero-gov-heading"
              >
                {heroTitles[titleIdx]}
              </motion.h1>
            </AnimatePresence>
            
            <motion.p variants={fadeInUp} className="hero-gov-subheading">
              {t('hero.subtitle')}
            </motion.p>
            
            <motion.p variants={fadeInUp} className="hero-gov-desc mb-10">
              {t('hero.description')}
            </motion.p>
            
            <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row items-center gap-4 mb-14 w-full justify-center lg:justify-start">
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.95 }} className="w-full sm:w-auto">
                <Link to="/register" className="btn-gov-primary w-full justify-center group flex items-center gap-2">
                  {t('hero.cta')}
                  <FiArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </motion.div>
              <motion.a 
                href="#about" 
                whileHover={{ scale: 1.02 }} 
                whileTap={{ scale: 0.95 }} 
                className="btn-gov-secondary w-full sm:w-auto text-center"
              >
                {t('hero.learnMore')}
              </motion.a>
            </motion.div>

            {/* Animated Stats */}
            <motion.div variants={fadeInUp} className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
              {[
                { value: '13', label: t('hero.districts'), suffix: '' },
                { value: '500', label: t('hero.registeredShops'), suffix: '+' },
                { value: '100', label: t('hero.secure'), suffix: '%' },
                { value: '24/7', label: t('hero.support'), suffix: '', isStatic: true },
              ].map((stat, i) => (
                <div key={i} className="hero-gov-stat-card">
                  <span className="hero-gov-stat-val">
                    {stat.isStatic ? stat.value : <AnimatedCounter target={stat.value} suffix={stat.suffix} />}
                  </span>
                  <span className="hero-gov-stat-label">{stat.label}</span>
                </div>
              ))}
            </motion.div>
          </motion.div>

          {/* Right Map Visual */}
          <motion.div 
            className="flex flex-col justify-center items-center relative mt-16 lg:mt-0 lg:scale-[1.7] xl:scale-[2]"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            <div className="absolute inset-0 bg-gradient-to-tr from-red-500/10 to-green-500/10 rounded-full blur-3xl -z-10 animate-pulse" />

            <div className={`w-full flex justify-center relative ${isMobile ? '' : 'animate-float'}`}>
              <div className="w-full drop-shadow-[0_20px_40px_rgba(0,0,0,0.08)]">
                <UttarakhandMap 
                  onDistrictClick={useCallback((district) => setSelectedDistrict({
                    ...district,
                    ...districtDetails[district.name]
                  }), [])} 
                />
              </div>
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

// ==================== ABOUT SECTION — BENTO DARK ====================
function AboutSection({ t }) {
  const features = [
    {
      icon: FiShield,
      title: t('about.feature1Title'),
      desc: t('about.feature1Desc'),
      badge: 'badge-crimson',
      glow: 'glow-crimson',
      layout: 'bento-card-wide',
      iconColor: '#f87171',
    },
    {
      icon: FiCreditCard,
      title: t('about.feature2Title'),
      desc: t('about.feature2Desc'),
      badge: 'badge-emerald',
      glow: 'glow-emerald',
      layout: 'bento-card-normal',
      iconColor: '#34d399',
    },
    {
      icon: FiActivity,
      title: t('about.feature3Title'),
      desc: t('about.feature3Desc'),
      badge: 'badge-crimson',
      glow: 'glow-crimson',
      layout: 'bento-card-normal',
      iconColor: '#f87171',
    },
    {
      icon: FiMessageSquare,
      title: t('about.feature4Title'),
      desc: t('about.feature4Desc'),
      badge: 'badge-emerald',
      glow: 'glow-emerald',
      layout: 'bento-card-normal',
      iconColor: '#34d399',
    },
    {
      icon: FiBell,
      title: t('about.feature5Title'),
      desc: t('about.feature5Desc'),
      badge: 'badge-crimson',
      glow: 'glow-crimson',
      layout: 'bento-card-normal',
      iconColor: '#f87171',
    },
    {
      icon: FiLock,
      title: t('about.feature6Title'),
      desc: t('about.feature6Desc'),
      badge: 'badge-emerald',
      glow: 'glow-emerald',
      layout: 'bento-card-wide',
      iconColor: '#34d399',
    },
  ];

  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const cardVariants = {
    hidden: { opacity: 0, y: 50, scale: 0.95 },
    visible: (i) => ({
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.7,
        delay: i * 0.1,
        ease: [0.25, 0.46, 0.45, 0.94],
      },
    }),
  };

  return (
    <section id="about" className="mission-section py-28 px-4">
      {/* Animated Mesh Gradient Blobs */}
      <div className="mesh-blob mesh-blob-1" />
      <div className="mesh-blob mesh-blob-2" />
      <div className="mesh-blob mesh-blob-3" />

      {/* Noise Texture */}
      <div className="mission-noise" />

      {/* Faint Grid Lines */}
      <div className="mission-grid-lines" />

      <div className="max-w-6xl mx-auto relative z-10" ref={ref}>
        {/* Header */}
        <div className="text-center mb-20">
          <motion.span
            className="mission-eyebrow inline-block mb-5"
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5 }}
          >
            {t('about.eyebrow')}
          </motion.span>

          <motion.h2 
            className="mission-heading"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            {renderTitle(t('about.title'))}
          </motion.h2>

          <motion.p
            className="mission-subtitle mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            {t('about.description')}
          </motion.p>
        </div>

        {/* Bento Grid */}
        <div className="bento-grid">
          {features.map((f, i) => (
            <motion.div
              key={i}
              className={`bento-glass-card ${f.glow} ${f.layout} hover-lift cursor-default`}
              whileHover={{ scale: 1.02 }}
              custom={i}
              variants={cardVariants}
              initial="hidden"
              animate={isInView ? "visible" : "hidden"}
            >
              {/* Shimmer Effect */}
              <div className="card-shimmer" />

              {/* Icon Badge */}
              <div className={`bento-icon-badge ${f.badge}`}>
                <f.icon style={{ width: 26, height: 26, color: f.iconColor }} />
              </div>

              {/* Content */}
              <h3 className="bento-card-title">{f.title}</h3>
              <p className="bento-card-desc">{f.desc}</p>
            </motion.div>
          ))}
        </div>
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
    <section id="help" className="help-section py-28 px-4">
      {/* Background Blobs */}
      <div className="help-bg-blob help-blob-red" />
      <div className="help-bg-blob help-blob-green" />
      
      <div className="max-w-6xl mx-auto relative z-10">
        <div className="text-center mb-16" data-aos="fade-up">
          <span className="help-eyebrow mb-4 block">{t('help.supportEyebrow')}</span>
          <h2 className="help-heading mb-4">
            {renderTitle(t('help.title'), "text-red-600")}
          </h2>
          <p className="help-subtitle max-w-2xl mx-auto">
            {t('help.description')}
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 gap-8 lg:gap-16 items-start">
          {/* Left Column - Contact Form */}
          <motion.form 
            onSubmit={handleSubmit} 
            className="help-card-form p-8 md:p-10 space-y-6"
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div>
              <input type="text" placeholder={t('help.name')} className="help-input"
                value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} required />
            </div>
            <div>
              <input type="email" placeholder={t('help.email')} className="help-input"
                value={form.email} onChange={(e) => setForm({...form, email: e.target.value})} required />
            </div>
            <div>
              <input type="tel" placeholder={t('help.mobile')} className="help-input"
                value={form.mobile} onChange={(e) => setForm({...form, mobile: e.target.value.replace(/\D/g, '').slice(0, 10)})} maxLength="10" />
            </div>
            <div>
              <textarea placeholder={t('help.message')} rows={4} className="help-input resize-none"
                value={form.message} onChange={(e) => setForm({...form, message: e.target.value})} required />
            </div>
            <motion.button 
              type="submit" 
              className="btn-crimson w-full flex items-center justify-center gap-3"
              whileTap={{ scale: 0.98 }}
            >
              <FiSend className="w-5 h-5" />
              {sent ? `✓ ${t('tax.sent')}` : t('help.submit')}
            </motion.button>
          </motion.form>

          {/* Right Column - Contact Info Panel */}
          <motion.div 
            className="help-card-info p-8 md:p-10 space-y-8"
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <h3 className="info-title">{t('help.contactTitle')}</h3>
            <div className="space-y-4">
              <div className="info-row">
                <div className="info-icon-badge badge-red-light">
                  <FiMapPin className="w-5 h-5" />
                </div>
                <div className="info-text">📍 {t('help.address')}</div>
              </div>
              
              <div className="info-row">
                <div className="info-icon-badge badge-red-light">
                  <FiPhone className="w-5 h-5" />
                </div>
                <div className="info-text">📞 {t('help.phone')}</div>
              </div>
              
              <div className="info-row">
                <div className="info-icon-badge badge-green-light">
                  <FiMail className="w-5 h-5" />
                </div>
                <div className="info-text">✉️ {t('help.emailId')}</div>
              </div>
              
              <div className="info-row">
                <div className="info-icon-badge badge-green-light">
                  <FiClock className="w-5 h-5" />
                </div>
                <div className="info-text">🕐 {t('help.hours')}</div>
              </div>
            </div>
          </motion.div>
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
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

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
    <section id="complaint" className="grievance-section py-28 px-4">
      {/* Soft Glow Blobs */}
      <div className="grievance-bg-blob grievance-blob-red" />
      <div className="grievance-bg-blob grievance-blob-green" />
      
      <div className="max-w-4xl mx-auto relative z-10">
        <div className="text-center mb-12" data-aos="fade-up">
          <span className="grievance-eyebrow mb-4 block">{t('complaintSection.grievanceCell')}</span>
          <h2 className="grievance-heading mb-4">
            {renderTitle(t('complaintSection.title'), "text-red-600")}
          </h2>
          <div className="flex justify-center mb-4">
            <div className="routing-badge">
              <span className="routing-dot" />
              {t('complaintSection.routingActive')}
            </div>
          </div>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto">
            {t('complaintSection.description')}
          </p>
        </div>
        
        <motion.div
           initial={{ opacity: 0, y: 40 }}
           whileInView={{ opacity: 1, y: 0 }}
           viewport={{ once: true }}
           transition={{ duration: 0.7 }}
        >
          <form 
            onSubmit={handleComplaintSubmit} 
            className="grievance-card"
          >
            {/* Step Indicator */}
            <div className="step-indicator">
              <span className="step-active"><span className="step-dot"/> {t('complaintSection.step1')}</span>
              <span className="step-arrow">→</span>
              <span>{t('complaintSection.step2')}</span>
              <span className="step-arrow">→</span>
              <span>{t('complaintSection.step3')}</span>
            </div>

            <div className="space-y-6">
              {/* Row 1: Name and Mobile */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className={`float-group ${form.name ? 'has-value' : ''}`}>
                  <input type="text" className="float-input" placeholder=" "
                    value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} required />
                  <label className="float-label">{t('complaintSection.name')}</label>
                </div>
                <div className={`float-group ${form.mobile ? 'has-value' : ''}`}>
                  <input type="tel" className="float-input" placeholder=" "
                    value={form.mobile} onChange={(e) => setForm({...form, mobile: e.target.value.replace(/\D/g, '').slice(0, 10)})} maxLength="10" required />
                  <label className="float-label">{t('complaintSection.mobile')}</label>
                </div>
              </div>

              {/* Row 2: District and Subject */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className={`float-group relative ${form.district_id || isDropdownOpen ? 'has-value' : ''}`}>
                  <div 
                    className="float-input float-select cursor-pointer flex items-center justify-between"
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  >
                    <span className={form.district_id ? "text-[#1a1a1a]" : "text-transparent select-none"}>
                      {form.district_id ? districts.find(d => d.id === form.district_id)?.name + ' Admin' : t('common.select')}
                    </span>
                  </div>
                  <label className="float-label flex items-center pointer-events-none">
                    {t('complaintSection.selectDistrict')}
                    <span className="info-tooltip-icon ml-2 pointer-events-auto cursor-help" title={t('complaintSection.tooltip')}>i</span>
                  </label>
                  
                  <AnimatePresence>
                    {isDropdownOpen && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setIsDropdownOpen(false)} />
                        <motion.div 
                          initial={{ opacity: 0, y: 10, scale: 0.98 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 10, scale: 0.98 }}
                          transition={{ duration: 0.2 }}
                          className="absolute z-50 w-full mt-2 bg-white border border-gray-100 rounded-2xl shadow-[0_15px_40px_rgba(0,0,0,0.12)] overflow-hidden max-h-60 overflow-y-auto"
                        >
                          {districts.map(d => (
                            <div 
                              key={d.id} 
                              onClick={() => {
                                setForm({...form, district_id: d.id});
                                setIsDropdownOpen(false);
                              }}
                              className={`px-5 py-3 cursor-pointer transition-all duration-200 flex items-center gap-3 border-b border-gray-50 last:border-0 ${form.district_id === d.id ? 'bg-red-50 text-[#e03434] font-bold' : 'hover:bg-gray-50 text-gray-700 font-medium'}`}
                            >
                              <span className={`w-2 h-2 rounded-full transition-colors ${form.district_id === d.id ? 'bg-[#e03434] shadow-[0_0_8px_rgba(224,52,52,0.5)]' : 'bg-gray-200'}`}></span>
                              {d.name} Admin
                            </div>
                          ))}
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>
                <div className={`float-group ${form.subject ? 'has-value' : ''}`}>
                  <input type="text" className="float-input" placeholder=" "
                    value={form.subject} onChange={(e) => setForm({...form, subject: e.target.value})} required />
                  <label className="float-label">{t('complaintSection.subject')}</label>
                </div>
              </div>

              {/* Row 3: Description */}
              <div className={`float-group float-group-textarea ${form.description ? 'has-value' : ''}`}>
                <textarea 
                  className="float-input resize-none h-36" 
                  placeholder=" "
                  value={form.description} 
                  onChange={(e) => setForm({...form, description: e.target.value})} 
                  required 
                />
                <label className="float-label">{t('complaintSection.description_field')}</label>
                <div className="char-counter">{form.description.length}/1000</div>
              </div>

              {/* Submit Action */}
              <div className="pt-4">
                <motion.button 
                  type="submit" 
                  disabled={loading}
                  className="btn-emerald"
                  whileTap={{ scale: 0.98 }}
                >
                  <span>{loading ? t('common.loading') : t('complaintSection.submit')}</span>
                  {!loading && <FiSend className="w-5 h-5 btn-emerald-icon" />}
                </motion.button>
                <div className="secure-note">
                  <FiLock className="w-3.5 h-3.5" />
                  <span>{t('complaintSection.secureNote')}</span>
                </div>
              </div>
            </div>
          </form>
        </motion.div>
      </div>
    </section>
  );
  
}

function AboutUsSection({ t }) {
  const team = [
    { name: t('aboutUs.member1'), role: t('aboutUs.role1'), email: "bhandari@taxpay.co", image: ASSET_IMAGES.sumit, 
      github: 'https://github.com/sumitbhandari2006', instagram: 'https://www.instagram.com/yeah_sumithere', linkedin: 'https://www.linkedin.com/in/sumit-bhandari-1424b133a' },
    { name: t('aboutUs.member2'), role: t('aboutUs.role2'), email: "paliwal@taxpay.co", image: ASSET_IMAGES.manish, isCoFounder: true,
      github: 'https://github.com/Manish363-dot', instagram: 'https://www.instagram.com/manish__uk_01', linkedin: 'https://www.linkedin.com/in/manish-paliwal-389a74327' },
    { name: t('aboutUs.member3'), role: t('aboutUs.role3'), email: "bhavesh@taxpay.co", image: ASSET_IMAGES.bhavesh, 
      github: 'https://github.com/bhavesh9090', instagram: 'https://www.instagram.com/bhavesh_bishtttt', linkedin: 'https://www.linkedin.com/in/bhavesh-bisht-549530328' },
    { name: t('aboutUs.member4'), role: t('aboutUs.role4'), email: "bisht@taxpay.co", image: ASSET_IMAGES.deepak, 
      github: 'https://github.com/Deepakbisht010', instagram: 'https://www.instagram.com/deepak_bisht.001/', linkedin: 'https://www.linkedin.com/in/deepak-singh-a05583328/' },
    { name: t('aboutUs.member5'), role: t('aboutUs.role5'), email: "kanyal@taxpay.co", image: ASSET_IMAGES.lalit, 
      github: 'https://github.com/Lalit-73-02', instagram: 'https://www.instagram.com/?hl=en', linkedin: 'https://www.linkedin.com/in/lalit-singh-kanyal-929583328/' },
    { name: t('aboutUs.member6'), role: t('aboutUs.role6'), email: "sahil@taxpay.co", image: ASSET_IMAGES.sahil, 
      github: 'https://github.com/sahil-chand-21', instagram: 'https://www.instagram.com/sahil._.chand', linkedin: 'https://www.linkedin.com/in/sahil-chand-077org' },
    { name: t('aboutUs.member7'), role: t('aboutUs.role7'), email: "raja@taxpay.co", image: ASSET_IMAGES.raja, 
      github: 'https://github.com/raja393-disigner', instagram: 'https://www.instagram.com/r_for_rautela', linkedin: 'https://www.linkedin.com/in/raja-rautela-07b589328/' },
    { name: t('aboutUs.member8'), role: t('aboutUs.role8'), email: "gaurav@taxpay.co", image: ASSET_IMAGES.gaurav, 
      github: 'https://www.instagram.com/gauri_bisht_07', instagram: 'https://instagram.com/manish', linkedin: 'https://www.linkedin.com/in/gaurav-bisht-04647a387' },
  ];

  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  return (
    <section id="about-us" className="team-section">
      <div className="team-bg-blob team-blob-red" />
      <div className="team-bg-blob team-blob-green" />

      <div className="team-header-container" ref={ref}>
        <motion.span 
          className="team-eyebrow"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
        >
          {t('aboutUs.eyebrow')}
        </motion.span>
        <motion.h2 
          className="team-heading"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          {renderTitle(t('aboutUs.title'), "text-red-600")}
        </motion.h2>
        <motion.p 
          className="team-subtitle"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, delay: 0.2 }}
        >
          {t('aboutUs.subtitle')}
        </motion.p>
      </div>

      <div className="team-grid">
        {team.map((member, i) => {
          const isRed = i % 2 === 0;
          return (
            <motion.div 
              key={i} 
              className={`team-card group ${isRed ? 'accent-red' : 'accent-green'}`}
              initial={{ opacity: 0, y: 40 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.1 * i }}
              title={member.name}
            >
              <div className="team-photo-wrapper">
                <img src={member.image} alt={member.name} loading="lazy" className="team-photo" />
              </div>
              
              <div className="team-info">
                <h3 className="team-name">{member.name}</h3>
                <p className="team-role">{member.role}</p>
                
                <div className="flex justify-center gap-3 mt-4 h-9 opacity-0 translate-y-3 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-400 ease-out pointer-events-none group-hover:pointer-events-auto">
                  {member.github && (
                    <a href={member.github} target="_blank" rel="noopener noreferrer" className={`w-9 h-9 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-500 transition-colors ${isRed ? 'hover:bg-red-50 hover:text-[#e03434] hover:border-red-100' : 'hover:bg-green-50 hover:text-[#22c87a] hover:border-green-100'}`}>
                      <FiGithub size={16} />
                    </a>
                  )}
                  {member.linkedin && (
                    <a href={member.linkedin} target="_blank" rel="noopener noreferrer" className={`w-9 h-9 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-500 transition-colors ${isRed ? 'hover:bg-red-50 hover:text-[#e03434] hover:border-red-100' : 'hover:bg-green-50 hover:text-[#22c87a] hover:border-green-100'}`}>
                      <FiLinkedin size={16} />
                    </a>
                  )}
                  {member.instagram && (
                    <a href={member.instagram} target="_blank" rel="noopener noreferrer" className={`w-9 h-9 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-500 transition-colors ${isRed ? 'hover:bg-red-50 hover:text-[#e03434] hover:border-red-100' : 'hover:bg-green-50 hover:text-[#22c87a] hover:border-green-100'}`}>
                      <FiInstagram size={16} />
                    </a>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}

// ==================== PROJECT DISCLAIMER ====================
function ProjectDisclaimer({ t }) {
  const [show, setShow] = useState(() => localStorage.getItem('eTaxPayDisclaimerAgreed') !== 'true');
  const [agreed, setAgreed] = useState(false);

  const handleAgreeAndEnter = () => {
    if (agreed) {
      localStorage.setItem('eTaxPayDisclaimerAgreed', 'true');
      setShow(false);
    }
  };

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
            onClick={handleAgreeAndEnter}
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
                <img src={ASSET_IMAGES.logo} alt="Logo" className="w-full h-full object-contain drop-shadow-md" />
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
