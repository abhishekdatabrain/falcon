import React from 'react';

/**
 * WaveDivider Component
 * 
 * Renders the exact uploaded gold & forest green wave image divider.
 */
const WaveDivider = ({ className = '' }) => {
  return (
    <div className={`w-full overflow-hidden leading-none select-none pointer-events-none ${className}`}>
      <img
        src="/hero_wave_exact.png"
        alt="Hero Wave Divider"
        className="w-full h-auto block object-cover w-full"
      />
    </div>
  );
};

export default WaveDivider;
