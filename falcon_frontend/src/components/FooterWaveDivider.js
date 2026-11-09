import React from 'react';

/**
 * FooterWaveDivider Component
 * 
 * Exact decorative top wave for the footer matching reference design:
 * - Transparent background above wave
 * - Metallic Gold gradient upper stroke (#C49A45 to #F5D477)
 * - Deep Forest Green (#043927) main footer background fill
 */
const FooterWaveDivider = ({ className = '' }) => {
  return (
    <div className={`w-full overflow-hidden leading-none select-none pointer-events-none ${className}`}>
      <svg
        viewBox="0 0 1728 160"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-auto block"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="footerGoldGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#C49A45" />
            <stop offset="35%" stopColor="#F5D477" />
            <stop offset="70%" stopColor="#E5C158" />
            <stop offset="100%" stopColor="#C49A45" />
          </linearGradient>
        </defs>

        {/* 1. Metallic Gold Upper Wave Layer */}
        <path
          d="M 0 0 C 150 75, 300 110, 450 110 C 750 110, 1050 10, 1350 10 C 1500 10, 1620 35, 1728 65 L 1728 85 C 1620 55, 1500 30, 1350 30 C 1050 30, 750 130, 450 130 C 300 130, 150 95, 0 20 Z"
          fill="url(#footerGoldGradient)"
        />

        {/* 2. Deep Forest Green Main Footer Fill */}
        <path
          d="M 0 20 C 150 95, 300 130, 450 130 C 750 130, 1050 30, 1350 30 C 1500 30, 1620 55, 1728 85 L 1728 160 L 0 160 Z"
          fill="#043927"
        />
      </svg>
    </div>
  );
};

export default FooterWaveDivider;
