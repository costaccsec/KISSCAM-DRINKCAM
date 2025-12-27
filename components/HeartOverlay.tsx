
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
  
  const theme = isKiss ? {
    border: 'border-pink-500',
    text: 'text-pink-600',
    bg: 'bg-pink-600',
    glow: 'shadow-[0_0_50px_rgba(236,72,153,0.6)]',
    titleGradient: 'from-pink-500 via-red-500 to-pink-600',
  } : {
    border: 'border-amber-500',
    text: 'text-amber-500',
    bg: 'bg-amber-600',
    glow: 'shadow-[0_0_50px_rgba(245,158,11,0.6)]',
    titleGradient: 'from-amber-400 via-orange-500 to-yellow-500',
  };

  if (!active) return null;

  return (
    <div className={`absolute inset-0 pointer-events-none z-10 overflow-hidden rounded-2xl border-[12px] ${theme.border} ${theme.glow}`}>
      
      {/* --- DECORATIONS: PARTICLES --- */}
      <div className="absolute inset-0 overflow-hidden">
        {isKiss ? (
          <>
            {[...Array(15)].map((_, i) => (
              <div 
                key={i}
                className="absolute animate-float text-red-500 opacity-80"
                style={{
                  left: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 5}s`,
                  animationDuration: `${3 + Math.random() * 4}s`,
                }}
              >
                <Heart size={20 + Math.random() * 60} fill="currentColor" />
              </div>
            ))}
            <div className="absolute top-10 left-10 animate-pulse-heart text-pink-400"><Heart size={120} fill="currentColor" /></div>
            <div className="absolute bottom-40 right-10 animate-pulse-heart text-red-600" style={{animationDelay: '0.3s'}}><Heart size={100} fill="currentColor" /></div>
          </>
        ) : (
          <>
            {[...Array(20)].map((_, i) => (
              <div 
                key={i}
                className="absolute animate-bubble bg-white/40 border-2 border-white rounded-full"
                style={{
                  width: `${10 + Math.random() * 40}px`,
                  height: `${10 + Math.random() * 40}px`,
                  left: `${Math.random() * 100}%`,
                  bottom: '-50px',
                  animationDelay: `${Math.random() * 4}s`,
                }}
              />
            ))}
            <div className="absolute bottom-10 left-10 animate-wiggle text-amber-400"><Beer size={140} fill="currentColor" /></div>
            <div className="absolute bottom-10 right-10 animate-wiggle text-orange-500" style={{animationDelay: '0.2s'}}><Beer size={140} fill="currentColor" /></div>
          </>
        )}
      </div>

      {/* --- MASSIVE BRANDING TITLE --- */}
      <div className="absolute bottom-0 left-0 right-0 h-1/3 flex items-center justify-center">
        <div className="relative group">
           <h1 className={`
             font-black text-[8rem] md:text-[12rem] italic uppercase tracking-tighter text-transparent bg-clip-text bg-gradient-to-b ${theme.titleGradient}
             drop-shadow-[0_10px_10px_rgba(0,0,0,0.9)] text-stroke-white
           `}
           style={{
             filter: 'drop-shadow(0 0 30px rgba(0,0,0,0.8))'
           }}
           >
             {isKiss ? "KISS" : "DRINK"}
           </h1>
           <div className={`
             absolute -bottom-8 left-1/2 -translate-x-1/2 font-black text-6xl md:text-8xl italic uppercase text-white drop-shadow-lg
           `}>
             CAM
           </div>
        </div>
      </div>

      {/* --- STATUS LABEL --- */}
      {label && (
        <div className="absolute top-10 left-10">
           <div className={`
             px-8 py-3 rounded-2xl font-black text-2xl md:text-4xl text-white shadow-2xl border-4 border-white transform -rotate-3
             ${theme.bg}
           `}>
             {label}
           </div>
        </div>
      )}
      
      {/* Corner Sparkles */}
      <div className="absolute top-4 right-4 animate-spin-slow text-yellow-300"><Sparkles size={60} /></div>
      <div className="absolute bottom-4 left-4 animate-pulse text-white"><Sparkles size={40} /></div>
    </div>
  );
};

export default CamOverlay;
