import React from 'react';

interface BlueYonderLogoProps {
  className?: string;
}

export default function BlueYonderLogo({ className = '' }: BlueYonderLogoProps) {
  return (
    <svg 
      className={className || 'h-6'}
      viewBox="0 0 58.2 58.2"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g transform="translate(-74.534 -260.66)">
        <g transform="translate(74.534 260.66)">
          <path 
            fill="currentColor"
            d="M29.1,0c-5,0-9,4-9,9s4,9,9,9c5,0,9-4,9-9l0,0C38.1,4,34.1,0,29.1,0z M29.1,58.2c5,0,9-4,9-9
            s-4-9-9-9c-5,0-9,4-9,9l0,0C20.1,54.2,24.1,58.2,29.1,58.2z M31,29.1c0,0.9,0.5,1.6,1.3,2l0,0l13.1,6.2l0,0
            c4.5,2.1,9.9,0.2,12-4.3c2.1-4.5,0.2-9.9-4.3-12c-2.4-1.1-5.2-1.1-7.7,0l0,0l-13.1,6.2l0,0C31.5,27.5,31,28.3,31,29.1L31,29.1z
            M27.2,29.1c0-0.9-0.5-1.6-1.3-2l0,0l-13.1-6.2l0,0c-4.5-2.1-9.9-0.2-12,4.3c-2.1,4.5-0.2,9.9,4.3,12c2.4,1.1,5.2,1.1,7.7,0l0,0
            l13.1-6.2l0,0C26.7,30.7,27.2,30,27.2,29.1L27.2,29.1z"
          />
        </g>
      </g>
    </svg>
  );
}
