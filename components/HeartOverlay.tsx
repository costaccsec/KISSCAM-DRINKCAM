import React from 'react';
import { Heart, Beer, Sparkles } from 'lucide-react';
import { AppMode } from '../types';

interface CamOverlayProps {
  label?: string;
  active?: boolean;
  mode: AppMode;
}

const CamOverlay: React.FC<CamOverlayProps> = ({ label, active = true, mode }) => {
  const isKiss = mode === 'KISS';
  const colorClass = isKiss ? 'text-pink-500' : 'text-amber-500';
  const borderClass = isKiss ? 'border-pink-500' : 'border-amber-500';

  if (!active) return null;

  return (
    <div className="absolute inset-0 pointer-events-none z-10 p-4">
      {/* Corner Accents */}
      <div className={`absolute top-4 left-4 w-16 h-16 border-t-8 border-l-8 ${borderClass} rounded-tl-3xl opacity-80 shadow-sm`} />
      <div className={`absolute top-4 right-4 w-16 h-16 border-t-8 border-r-8 ${borderClass} rounded-tr-3xl opacity-80 shadow-sm`} />
      <div className={`absolute bottom-4 left-4 w-16 h-16 border-b-8 border-l-8 ${borderClass} rounded-bl-3xl opacity-80 shadow-sm`} />
      <div className={`absolute bottom-4 right-4 w-16 h-16 border-b-8 border-r-8 ${borderClass} rounded-br-3xl opacity-80 shadow-sm`} />

      {/* Floating Icons Animation */}
      <div className="absolute inset-0 overflow-hidden opacity-60">
        <div className={`absolute top-1/4 left-1/4 animate-bounce-in ${colorClass}`}>
          {isKiss ? <Heart size={40} fill="currentColor" /> : <Beer size={40} />}
        </div>
        <div className={`absolute bottom-1/3 right-1/4 animate-pulse-heart ${colorClass}`} style={{ animationDelay: '0.5s' }}>
          {isKiss ? <Heart size={32} fill="currentColor" /> : <Sparkles size={32} />}
        </div>
        <div className={`absolute top-1/3 right-10 animate-bounce ${colorClass}`} style={{ animationDuration: '3s' }}>
          {isKiss ? <Sparkles size={24} /> : <Beer size={24} />}
        </div>
      </div>

      {/* Label Box */}
      {label && (
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 w-full text-center">
           <div className={`${isKiss ? 'bg-pink-600' : 'bg-amber-600'} text-white px-8 py-2 rounded-full font-black text-xl md:text-3xl shadow-lg border-4 border-white transform rotate-1 inline-block whitespace-nowrap`}>
             {label}
           </div>
        </div>
      )}
      
      {/* Branding */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2">
        <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/20 shadow-md">
           {isKiss ? <Heart size={16} className="text-pink-500" fill="currentColor" /> : <Beer size={16} className="text-amber-500" />}
           <span className="text-white font-bold text-xs md:text-sm tracking-widest uppercase">
             {isKiss ? 'Kiss Cam' : 'Drink Cam'}
           </span>
        </div>
      </div>
    </div>
  );
};

export default CamOverlay;