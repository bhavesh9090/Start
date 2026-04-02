import React, { useState, useEffect, useRef } from 'react';
import { ComposableMap, Geographies, Geography, Marker } from "react-simple-maps";
import geoData from '../data/uttarakhand.json';

// Exact colors matching the Pinterest reference design for a stunning map
const districtColors = {
  "Uttarkashi": "#df2c3d", // Red
  "Dehradun": "#b33f92", // Purple
  "Tehri Garhwal": "#00a9d8", // Blue
  "Garhwal": "#d96b27", // Known as Pauri Garhwal - Orange
  "Pauri Garhwal": "#d96b27", // Orange
  "Rudraprayag": "#fea23b", // Light Orange
  "Chamoli": "#6dba44", // Green
  "Pithoragarh": "#b64e16", // Brown/Orange
  "Bageshwar": "#e0901a", // Deep Yellow/Orange
  "Almora": "#8f2b71", // Dark Purple
  "Champawat": "#5b8c2c", // Olive Green
  "Nainital": "#00819a", // Teal
  "Udham Singh Nagar": "#e32d39", // Red
  "Hardwar": "#ac1b27", // Dark Red
  "Haridwar": "#ac1b27", // Alias
};
const districtCentroids = [
  { name: "Uttarkashi", label: "UTTARKASHI", coordinates: [78.50, 31.02], size: "14px", smSize: "20px" },
  { name: "Dehradun", label: "DEHRADUN", coordinates: [77.96, 30.40], size: "8px", smSize: "14px" },
  { name: "Tehri Garhwal", label: "TEHRI\nGARHWAL", coordinates: [78.65, 30.38], size: "9px", smSize: "15px" },
  { name: "Rudraprayag", label: "RUDRA-\nPRAYAG", coordinates: [79.02, 30.52], size: "7px", smSize: "12px" },
  { name: "Chamoli", label: "CHAMOLI", coordinates: [79.40, 30.48], smCoordinates: [79.46, 30.55], size: "14px", smSize: "20px" },
  { name: "Pithoragarh", label: "PITHORAGARH", coordinates: [80.35, 30.05], size: "13px", smSize: "18px" },
  { name: "Bageshwar", label: "BAGESHWAR", coordinates: [79.82, 29.85], size: "7px", smSize: "12px" },
  { name: "Almora", label: "ALMORA", coordinates: [79.58, 29.70], size: "10px", smSize: "16px" },
  { name: "Champawat", label: "CHAMPAWAT", coordinates: [80.08, 29.28], size: "8px", smSize: "14px" },
  { name: "Nainital", label: "NAINITAL", coordinates: [79.52, 29.42], size: "10px", smSize: "16px" },
  { name: "Udham Singh Nagar", label: "UDHAM SINGH\nNAGAR", coordinates: [79.48, 28.98], size: "7px", smSize: "12px" },
  { name: "Haridwar", label: "HARIDWAR", coordinates: [78.08, 29.88], size: "10px", smSize: "16px" },
  { name: "Pauri Garhwal", label: "PAURI\nGARHWAL", coordinates: [78.78, 29.98], size: "11px", smSize: "17px" },
];

export default React.memo(function UttarakhandMap({ onDistrictClick }) {
  const [hovered, setHovered] = useState(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isTouch, setIsTouch] = useState(false);
  const mapRef = useRef(null);

  useEffect(() => {
    // Detect if device is touch-based or has a small screen
    const checkTouch = () => {
      setIsTouch('ontouchstart' in window || navigator.maxTouchPoints > 0 || window.innerWidth < 1024);
    };
    checkTouch();
    window.addEventListener('resize', checkTouch);
    return () => window.removeEventListener('resize', checkTouch);
  }, []);

  const handleMouseMove = (e) => {
    // Completely skip state updates on touch devices to prevent lag
    if (isTouch) return;
    setMousePos({ x: e.clientX, y: e.clientY });
  };

  return (
    <div className="w-full relative drop-shadow-2xl" onMouseMove={handleMouseMove} ref={mapRef}>
      <ComposableMap
        projection="geoMercator"
        projectionConfig={{
          scale: 11000,
          center: [79.3, 30.1]
        }}
        width={800}
        height={700}
        style={{ width: "100%", height: "auto" }}
      >
        <Geographies geography={geoData.features}>
          {({ geographies }) =>
            geographies.map((geo) => {
              const districtName = geo.properties.Dist_Name || geo.properties.dtname || geo.properties.district || "Unknown";
              const isHovered = hovered?.key === geo.rsmKey;
              const baseColor = districtColors[districtName] || "#999999"; 
              
              return (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  onMouseEnter={(e) => {
                    // On touch, we show tooltip but don't follow mouse
                    const rect = mapRef.current?.getBoundingClientRect();
                    setHovered({ 
                      key: geo.rsmKey, 
                      name: districtName,
                      // For mobile, we can use a static offset from the touch point or element
                      touchX: e.clientX,
                      touchY: e.clientY
                    });
                  }}
                  onMouseLeave={() => {
                    setHovered(null);
                  }}
                  onClick={() => onDistrictClick({ ...geo.properties, name: districtName })}
                  style={{
                    default: {
                      fill: baseColor,
                      stroke: "#FFFFFF",
                      strokeWidth: isTouch ? 1 : 1.5, // Thinner stroke on mobile for cleaner look
                      outline: "none",
                      transition: "all 250ms"
                    },
                    hover: {
                      fill: baseColor,
                      stroke: "#fcd34d",
                      strokeWidth: 3,
                      opacity: 0.9,
                      outline: "none",
                      cursor: "pointer",
                    },
                    pressed: {
                      fill: baseColor,
                      stroke: "#FFFFFF",
                      strokeWidth: 2,
                      outline: "none",
                    }
                  }}
                />
              );
            })
          }
        </Geographies>

        {/* District Labels */}
        {districtCentroids.map(({ name, label, coordinates, smCoordinates, size, smSize }) => (
          <Marker key={name} coordinates={isTouch && smCoordinates ? smCoordinates : coordinates}>
            <text
              textAnchor="middle"
              dominantBaseline="central"
              className="fill-white font-black pointer-events-none select-none"
              style={{
                fontSize: isTouch ? smSize : size,
                textShadow: "0 0 5px rgba(0,0,0,1), 0 0 3px rgba(0,0,0,0.8)",
                letterSpacing: "0.1em",
                filter: "drop-shadow(1px 1px 1px rgba(0,0,0,0.3))"
              }}
            >
              {label.split('\n').map((line, index, arr) => (
                <tspan 
                  key={index} 
                  x="0" 
                  dy={index === 0 ? "0" : "1.1em"} 
                  alignmentBaseline="central"
                >
                  {line}
                </tspan>
              ))}
            </text>
          </Marker>
        ))}
      </ComposableMap>

      {/* Modern Tooltip */}
      {hovered && (
        <div 
          className="fixed z-[100] pointer-events-none bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-lg shadow-xl border border-saffron-200 animate-fade-in"
          style={{ 
            left: isTouch ? hovered.touchX : mousePos.x + 15, 
            top: isTouch ? hovered.touchY - 50 : mousePos.y - 40,
            transform: isTouch ? 'translateX(-50%)' : 'none'
          }}
        >
          <p className="text-[10px] font-black text-maroon-600 uppercase tracking-widest">{hovered.name}</p>
        </div>
      )}
    </div>
  );
});
