import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '../../state/store';

interface ProfileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  anchorEl: HTMLElement | null;
}

export default function ProfileMenu({ isOpen, onClose, anchorEl }: ProfileMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const theme = useStore((state) => state.theme);
  const setTheme = useStore((state) => state.setTheme);
  const useRealShadows = useStore((state) => state.useRealShadows);
  const setUseRealShadows = useStore((state) => state.setUseRealShadows);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        anchorEl &&
        !anchorEl.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose, anchorEl]);

  if (!isOpen) return null;

  return (
    <div
      ref={menuRef}
      className="fixed top-14 right-6 z-30 w-80 glass-panel rounded-lg shadow-2xl 
                 border border-white/10 animate-fade-in"
    >
      {/* Profile Header */}
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 
                          flex items-center justify-center text-white font-bold text-lg
                          shadow-lg shadow-blue-500/30">
            MJ
          </div>
          {/* Info */}
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-gray-100">Marcus Johnson</h3>
            <p className="text-xs text-gray-400">Warehouse Operations Manager</p>
          </div>
        </div>
        <div className="mt-3 text-xs text-gray-500">
          <div className="flex items-center gap-2">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <span>mjohnson@warehouse.com</span>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <span>Central Distribution Facility</span>
          </div>
        </div>
      </div>

      {/* Settings Section */}
      <div className="p-3">
        <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-2">
          Display Settings
        </h4>

        {/* Theme Toggle */}
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg
                     hover:bg-white/5 transition-all group"
        >
          <div className="flex items-center gap-3">
            {theme === 'dark' ? (
              <svg className="w-5 h-5 text-gray-400 group-hover:text-gray-200" 
                   fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                      d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            ) : (
              <svg className="w-5 h-5 text-gray-400 group-hover:text-gray-200" 
                   fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                      d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            )}
            <div className="text-left">
              <div className="text-sm text-gray-200">Theme</div>
              <div className="text-xs text-gray-500">
                {theme === 'dark' ? 'Dark mode' : 'Light mode'}
              </div>
            </div>
          </div>
          <div className={`w-10 h-6 rounded-full transition-colors duration-200 relative
                          ${theme === 'dark' ? 'bg-blue-500' : 'bg-gray-600'}`}>
            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform duration-200
                            ${theme === 'dark' ? 'translate-x-5' : 'translate-x-1'}`} />
          </div>
        </button>

        {/* Shadow Toggle */}
        <button
          onClick={() => setUseRealShadows(!useRealShadows)}
          className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg
                     hover:bg-white/5 transition-all group mt-1"
        >
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-gray-400 group-hover:text-gray-200" 
                 fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            <div className="text-left">
              <div className="text-sm text-gray-200">Real-time Shadows</div>
              <div className="text-xs text-gray-500">
                {useRealShadows ? 'Enabled' : 'Disabled'}
              </div>
            </div>
          </div>
          <div className={`w-10 h-6 rounded-full transition-colors duration-200 relative
                          ${useRealShadows ? 'bg-blue-500' : 'bg-gray-600'}`}>
            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform duration-200
                            ${useRealShadows ? 'translate-x-5' : 'translate-x-1'}`} />
          </div>
        </button>
      </div>

      {/* Quick Stats */}
      <div className="p-3 border-t border-white/10">
        <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-2">
          Quick Stats
        </h4>
        <div className="grid grid-cols-2 gap-2">
          <div className="px-3 py-2 rounded-lg bg-white/5">
            <div className="text-xs text-gray-400">Today's Shift</div>
            <div className="text-sm font-semibold text-gray-200">6h 23m</div>
          </div>
          <div className="px-3 py-2 rounded-lg bg-white/5">
            <div className="text-xs text-gray-400">Active Alerts</div>
            <div className="text-sm font-semibold text-amber-400">3</div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="p-2 border-t border-white/10">
        <button
          className="w-full px-3 py-2 text-sm text-gray-400 hover:text-gray-200 
                     hover:bg-white/5 rounded-lg transition-all text-left
                     flex items-center gap-2"
          onClick={onClose}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Account Settings
        </button>
        <button
          className="w-full px-3 py-2 text-sm text-gray-400 hover:text-red-400 
                     hover:bg-red-500/10 rounded-lg transition-all text-left
                     flex items-center gap-2"
          onClick={onClose}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Sign Out
        </button>
      </div>
    </div>
  );
}
