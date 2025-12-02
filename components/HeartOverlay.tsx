import React from 'react';
import { Heart, Beer, Wine, Sparkles } from 'lucide-react';
import { AppMode } from '../types';

interface CamOverlayProps {
  label?: string;
  active?: boolean;
  mode: AppMode;
}

const CamOverlay: React.FC<CamOverlayProps> = ({ label, active = true, mode }) => {
  const isKiss = mode === 'KISS';
  
  // Theme Configuration
  const theme = {
    primary: isKiss ? 'text-pink-500 fill-pink-500' : 'text-yellow-500 fill-yellow-500',
    border: isKiss ? 'border-pink-500/50' : 'border-yellow-500/50',
    bannerBg: isKiss ? 'bg-pink-600' : 'bg-amber-500',
    bannerBorder: isKiss ? 'border-pink-400' : 'border-amber-400',
    text: isKiss ? 'text-pink-600' : 'text-amber-600',
    iconFill: isKiss ? 'fill-pink-600' : 'fill-amber-600',
    IconMain: isKiss ? Heart : Beer,
    IconDecor: isKiss ? Heart : Sparkles,
    defaultLabel: isKiss ? "KISS CAM" : "DRINK CAM",
    bottomText: isKiss ? "LIVE LOVE FEED" : "CHEERS LIVE FEED",
    animation: isKiss ? "animate-pulse-heart" : "animate-bounce"
  };

  const displayLabel = label || theme.defaultLabel;

  return (
    <div className="absolute inset-0 pointer-events-none z-10 flex flex-col items-center justify-between p-4 overflow-hidden">
      {/* Top Decoration */}
      <div className="w-full flex justify-between items-start">
        <theme.IconMain className={`${theme.primary} w-12 h-12 ${theme.animation}`} />
        <div className={`${theme.bannerBg} text-white px-8 py-2 rounded-b-3xl shadow-lg border-x-4 border-b-4 border-white`}>
          <h1 className="text-3xl font-black tracking-widest uppercase drop-shadow-md whitespace-nowrap">{displayLabel}</h1>
        </div>
        <theme.IconMain className={`${theme.primary} w-12 h-12 ${theme.animation}`} />
      </div>

      {/* Center Frame Effect (Vignette) */}
      <div className={`absolute inset-0 border-[20px] rounded-3xl transition-colors duration-500 ${active ? theme.border : 'border-gray-400/30'}`}></div>

      {/* Bottom Decoration */}
      <div className="w-full flex justify-center items-end pb-4">
        <div className={`bg-white/90 backdrop-blur px-6 py-2 rounded-full border-2 ${theme.bannerBorder} shadow-xl`}>
           <p className={`${theme.text} font-bold text-lg flex items-center gap-2`}>
             <theme.IconDecor size={20} className={theme.iconFill} />
             {theme.bottomText}
             <theme.IconDecor size={20} className={theme.iconFill} />
           </p>
        </div>
      </div>
    </div>
  );
};

export default CamOverlay;