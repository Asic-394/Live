import React from 'react';

interface WarehouseIconProps {
  className?: string;
}

export default function WarehouseIcon({ className = '' }: WarehouseIconProps) {
  return (
    <svg
      className={className || 'w-6 h-6'}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* Building base */}
      <path d="M3 21h18" />
      {/* Main building structure */}
      <path d="M5 21V7l7-4 7 4v14" />
      {/* Roof */}
      <path d="M5 7h14" />
      {/* Horizontal shelves */}
      <path d="M9 10h6" />
      <path d="M9 14h6" />
      <path d="M9 18h6" />
    </svg>
  );
}
