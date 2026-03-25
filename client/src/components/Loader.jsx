import React from 'react';
import logoImg from '../assets/logo.png';

const Loader = ({ size = 'medium', message }) => {
  const sizeClasses = {
    small: 'w-12 h-12',
    medium: 'w-24 h-24',
    large: 'w-40 h-40'
  };

  return (
    <div className="flex flex-col items-center justify-center p-8 animate-fade-in">
      <div className={`relative ${sizeClasses[size]}`}>
        {/* Background Ghost Logo */}
        <img 
          src={logoImg} 
          alt="Loading Background" 
          className="w-full h-full object-contain opacity-10 grayscale"
        />
        
        {/* Filling Water Logo */}
        <div className="absolute bottom-0 left-0 w-full overflow-hidden animate-water-fill">
          <img 
            src={logoImg} 
            alt="Loading Fill" 
            className="w-full h-full object-contain"
            style={{ 
              height: sizeClasses[size].split(' ')[1].replace('h-', '') * 4, // Approx correction
              width: '100%',
              objectPosition: 'bottom'
            }}
          />
        </div>
        
        {/* Wave Overlay Effect */}
        <div className="absolute inset-0 bg-gradient-to-t from-saffron-500/20 to-transparent opacity-50"></div>
      </div>
      
      {message && (
        <p className="mt-4 text-sm font-bold text-maroon-400 animate-pulse uppercase tracking-widest">
          {message}...
        </p>
      )}
    </div>
  );
};

export default Loader;
