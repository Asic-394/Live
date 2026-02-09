import React, { useState, useRef } from 'react';
import ProfileMenu from './ProfileMenu';

interface ProfileIconProps {
  className?: string;
}

export default function ProfileIcon({ className = '' }: ProfileIconProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  return (
    <>
      <button
        ref={buttonRef}
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        className={`relative p-2 rounded-lg hover:bg-white/10 transition-all duration-200 
                    ${isMenuOpen ? 'bg-white/10' : ''} ${className}`}
        title="Profile"
        aria-label="User profile"
      >
        {/* Avatar with gradient */}
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 
                        flex items-center justify-center text-white font-bold text-xs
                        shadow-lg shadow-blue-500/30">
          MJ
        </div>
        {/* Active indicator */}
        <div className="absolute bottom-1 right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full 
                        border-2 border-[#16181f]" />
      </button>

      <ProfileMenu 
        isOpen={isMenuOpen} 
        onClose={() => setIsMenuOpen(false)}
        anchorEl={buttonRef.current}
      />
    </>
  );
}
