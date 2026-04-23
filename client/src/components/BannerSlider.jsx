import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';

const BUCKET_NAME = "assets";
// Sanitize URL to remove trailing slash if exists
const baseUrl = import.meta.env.VITE_SUPABASE_URL?.replace(/\/$/, "");
const STORAGE_BASE = `${baseUrl}/storage/v1/object/public/${BUCKET_NAME}`;

const BannerSlider = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const v = "v1";

  const banners = [
    { image: `${STORAGE_BASE}/1.jpg?${v}` },
    { image: `${STORAGE_BASE}/2.jpg?${v}` },
    { image: `${STORAGE_BASE}/3.webp?${v}` },
    { image: `${STORAGE_BASE}/4.jpg?${v}` },
    { image: `${STORAGE_BASE}/5.jpg?${v}` }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      handleNext();
    }, 6000);
    return () => clearInterval(timer);
  }, [currentIndex]);

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % banners.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length);
  };

  return (
    <div className="relative w-full max-w-[1400px] mx-auto px-2 sm:px-4 py-8 group">
      <div className="relative h-[450px] sm:h-[500px] lg:h-[600px] w-full overflow-hidden rounded-[2.5rem] sm:rounded-[3.5rem] shadow-2xl border border-gray-100 bg-white">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, scale: 1.02 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
            className="absolute inset-0"
          >
            {/* Image Layer */}
            <img
              src={banners[currentIndex].image}
              alt="Uttarakhand Panorama"
              className="w-full h-full object-cover"
            />

            {/* Subtle Gradient Overlay for Depth only */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
          </motion.div>
        </AnimatePresence>

        {/* Navigation Buttons - Hidden on Mobile */}
        <button
          onClick={handlePrev}
          className="hidden lg:flex absolute left-8 top-1/2 -translate-y-1/2 w-14 h-14 bg-white/10 backdrop-blur-md text-white rounded-full items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-white/20 border border-white/20"
        >
          <FiChevronLeft className="w-8 h-8" />
        </button>
        <button
          onClick={handleNext}
          className="hidden lg:flex absolute right-8 top-1/2 -translate-y-1/2 w-14 h-14 bg-white/10 backdrop-blur-md text-white rounded-full items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-white/20 border border-white/20"
        >
          <FiChevronRight className="w-8 h-8" />
        </button>

        {/* Indicators */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2">
          {banners.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentIndex(i)}
              className={`h-1.5 transition-all duration-500 rounded-full ${currentIndex === i ? 'w-10 bg-white' : 'w-2 bg-white/40 hover:bg-white/60'
                }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default BannerSlider;
