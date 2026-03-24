import { useState, useRef, useEffect } from 'react';
import { FiChevronDown } from 'react-icons/fi';

export default function CustomDropdown({ options, value, onChange, placeholder, icon: Icon, className = '' }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find(opt => opt.value === value);

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-white px-4 py-2.5 rounded-xl shadow-sm border border-gray-200 flex items-center justify-between gap-2 hover:border-saffron-300 transition-all focus:ring-4 focus:ring-saffron-500/10 active:scale-95 group"
      >
        <div className="flex items-center gap-2 truncate">
          {Icon && <Icon className="text-gray-400 group-hover:text-saffron-500 transition-colors w-4 h-4 flex-shrink-0" />}
          <span className="text-[11px] sm:text-[13px] font-black text-gray-700 truncate uppercase tracking-tight">
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </div>
        <FiChevronDown className={`w-4 h-4 text-gray-400 group-hover:text-saffron-500 transition-all ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-[100] mt-2 min-w-[200px] right-0 md:left-0 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-100 overflow-hidden animate-scale-in max-h-60 overflow-y-auto hide-scrollbar">
          <div className="p-1.5 space-y-1">
            {options.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                className={`w-full px-4 py-3 text-left text-[11px] sm:text-[12px] font-black uppercase tracking-tight transition-all rounded-xl ${
                  value === opt.value 
                    ? 'bg-saffron-500 text-white shadow-lg' 
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
