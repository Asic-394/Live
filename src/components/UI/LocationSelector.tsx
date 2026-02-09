import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '../../state/store';

export default function LocationSelector() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const currentSite = useStore((state) => state.currentSite);
  const setSite = useStore((state) => state.setSite);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Future: fetch sites from API or config
  const availableSites = [currentSite];

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-white/5 transition-colors group"
        title="Select location"
      >
        {/* Map Pin Icon */}
        <svg
          className="w-4 h-4 text-gray-400 group-hover:text-gray-300"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
        
        <span className="text-sm font-medium text-gray-300 group-hover:text-gray-100 hidden lg:inline">
          {currentSite.name}
        </span>
        
        {/* Dropdown chevron */}
        <svg
          className={`w-4 h-4 text-gray-400 transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-64 glass-panel rounded-lg shadow-xl border border-white/10 z-50 animate-fade-in">
          <div className="p-2">
            {availableSites.map((site) => (
              <button
                key={site.id}
                onClick={() => {
                  setSite(site);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                  currentSite.id === site.id
                    ? 'bg-blue-500/20 text-blue-300'
                    : 'hover:bg-white/5 text-gray-300'
                }`}
              >
                <div className="flex items-start gap-2">
                  <svg
                    className="w-4 h-4 mt-0.5 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  <div className="flex-1">
                    <div className="text-sm font-medium">{site.name}</div>
                    <div className="text-xs text-gray-400 mt-0.5">{site.location}</div>
                  </div>
                  {currentSite.id === site.id && (
                    <svg
                      className="w-4 h-4 text-blue-400 flex-shrink-0"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </div>
              </button>
            ))}
          </div>
          
          {/* Future: Add "Add Location" option */}
          <div className="border-t border-white/5 p-2">
            <div className="px-3 py-2 text-xs text-gray-500">
              Multiple sites coming soon
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
