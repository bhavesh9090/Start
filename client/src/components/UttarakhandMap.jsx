import React, { useState } from 'react';
import { ComposableMap, Geographies, Geography } from "react-simple-maps";
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

export default React.memo(function UttarakhandMap({ onDistrictClick }) {
  const [hovered, setHovered] = useState(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e) => {
    setMousePos({ x: e.clientX, y: e.clientY });
  };

  return (
    <div className="w-full relative drop-shadow-2xl" onMouseMove={handleMouseMove}>
      <ComposableMap
        projection="geoMercator"
        projectionConfig={{
          scale: 12500,
          center: [79.3, 30.1]
        }}
        width={800}
        height={600}
        style={{ width: "100%", height: "auto" }}
      >
        <Geographies geography={geoData.features}>
          {({ geographies }) =>
            geographies.map((geo) => {
              const districtName = geo.properties.Dist_Name || geo.properties.dtname || geo.properties.district || "Unknown";
              const isHovered = hovered === geo.rsmKey;
              const baseColor = districtColors[districtName] || "#999999"; 
              
              return (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  onMouseEnter={() => {
                    setHovered({ key: geo.rsmKey, name: districtName });
                  }}
                  onMouseLeave={() => {
                    setHovered(null);
                  }}
                  onClick={() => onDistrictClick({ ...geo.properties, name: districtName })}
                  style={{
                    default: {
                      fill: baseColor,
                      stroke: "#FFFFFF",
                      strokeWidth: 1.5,
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
      </ComposableMap>

      {/* Modern Tooltip */}
      {hovered && (
        <div 
          className="fixed z-[100] pointer-events-none bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-lg shadow-xl border border-saffron-200 animate-fade-in"
          style={{ 
            left: mousePos.x + 15, 
            top: mousePos.y - 40,
          }}
        >
          <p className="text-[10px] font-black text-maroon-600 uppercase tracking-widest">{hovered.name}</p>
        </div>
      )}
    </div>
  );
});
