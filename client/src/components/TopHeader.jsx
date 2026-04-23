import React from 'react';
import { motion } from 'framer-motion';

const BUCKET_NAME = "assets";
// Sanitize URL to remove trailing slash if exists
const baseUrl = import.meta.env.VITE_SUPABASE_URL?.replace(/\/$/, "");
const STORAGE_BASE = `${baseUrl}/storage/v1/object/public/${BUCKET_NAME}`;

const TopHeader = () => {
  const v = "v1";
  const headerBg = `${STORAGE_BASE}/BG.jpg?${v}`;
  const emblem = `${STORAGE_BASE}/emblem.webp?${v}`;
  const ukLogo = `${STORAGE_BASE}/logo.png?${v}`;
  const diLogo = `${STORAGE_BASE}/di.png?${v}`;
  const azadiLogo = `${STORAGE_BASE}/75.png?${v}`;
  return (
    <div
      className="w-full border-b border-white/10 py-4 px-4 sm:px-6 lg:px-10 overflow-hidden relative bg-[#0a0a0a]"
      style={{
        backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.35), rgba(0, 0, 0, 0.45)), url(${headerBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}
    >
      {/* Background Decorative Element (Subtle Mountain Silhouette) */}
      <div className="absolute inset-0 opacity-[0.08] pointer-events-none select-none">
        <svg viewBox="0 0 1000 100" className="w-full h-full preserve-3d">
          <path d="M0 100 L100 40 L200 80 L300 20 L400 90 L500 50 L600 85 L700 30 L800 70 L900 10 L1000 100 Z" fill="white" />
        </svg>
      </div>

      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 relative z-10 font-bold">
        {/* Left Section: Gov Emblems */}
        <div className="flex items-center gap-8">
          <img
            src={emblem}
            alt="Emblem of India"
            className="h-10 sm:h-16 object-contain"
          />
          <img
            src={ukLogo}
            alt="Uttarakhand Logo"
            className="h-10 sm:h-16 object-contain"
          />
        </div>

        {/* Center Section: Text Branding */}
        <div className="text-center md:flex-1">
          <h1 className="text-xl sm:text-3xl font-black text-white tracking-tight leading-none mb-2 drop-shadow-[0_2px_10px_rgba(0,0,0,0.5)]">
            Department of Zila Panchayat
          </h1>
          <p className="text-[10px] sm:text-[13px] font-black text-white/90 uppercase tracking-[0.3em] drop-shadow-[0_1px_5px_rgba(0,0,0,0.5)]">
            Government of Uttarakhand
          </p>
        </div>

        {/* Right Section: Digital India & Azadi */}
        <div className="flex items-center gap-8">
          <img
            src={diLogo}
            alt="Digital India"
            className="h-10 sm:h-14 object-contain hidden sm:block"
          />
          <img
            src={azadiLogo}
            alt="Azadi Ka Amrit Mahotsav"
            className="h-10 sm:h-12 object-contain"
          />
        </div>
      </div>
    </div>
  );
};

export default TopHeader;
