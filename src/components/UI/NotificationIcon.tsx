import React from 'react';

interface NotificationIconProps {
  className?: string;
  count?: number;
  onClick?: () => void;
}

export default function NotificationIcon({ className = '', count = 0, onClick }: NotificationIconProps) {
  return (
    <button
      onClick={onClick}
      className={`relative p-2 rounded-lg hover:bg-white/10 transition-all duration-200 ${className}`}
      title="Notifications"
      aria-label="Notifications"
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {/* Bell shape */}
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>
      {count > 0 && (
        <span className="absolute top-1 right-1 flex items-center justify-center w-4 h-4 text-[10px] font-bold text-white bg-red-500 rounded-full">
          {count > 9 ? '9+' : count}
        </span>
      )}
    </button>
  );
}
