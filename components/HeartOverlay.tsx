import React from 'react';
import { Heart, Beer, Sparkles } from 'lucide-react';
import { AppMode } from '../types';

interface CamOverlayProps {
  label?: string; // e.g. "WAITING", "CAM 1"
  active?: boolean;
  mode: AppMode;
}

const CamOverlay: React.FC<CamOverlayProps> = ({ label, active = true, mode }) => {
  const isKiss = mode === 'KISS';
  
  // Theme Configurations
  const theme = isKiss ? {
    border: 'border-pink-500',
    text: 'text-pink-600',
    bg: 'bg-pink-600',
    shadow: 'shadow-pink-500/50',
    titleGradient: 'from-pink-500 via-red-500 to-pink-600',
  } : {
    border: 'border-amber-500',
    text: 'text-amber-500',
    bg: 'bg-amber-600',
    shadow: 'shadow-amber-500/50',
    titleGradient: 'from-amber-400 via-orange-500 to-yellow-500',
  };

  if (!active) return null;

  return (
    <div className={`absolute inset-0 pointer-events-none z-10 overflow-hidden rounded-2xl border-[6px] ${theme.border} shadow-[inset_0_0_40px_rgba(0,0,0,0.3)]`}>
      
      {/* --- DECORATIONS: PARTICLES --- */}
      <div className="absolute inset-0 opacity-90">
        {isKiss ? (
          // KISS CAM PARTICLES (Lots of Hearts)
          <>
            <div className="absolute top-4 left-4 animate-bounce-in text-red-500"><Heart size={64} fill="currentColor" /></div>
            <div className="absolute top-10 right-10 animate-pulse-heart text-pink-400" style={{animationDuration: '1.5s'}}><Heart size={48} fill="currentColor" /></div>
            <div className="absolute bottom-32 left-8 animate-bounce text-pink-600" style={{animationDuration: '3s'}}><Heart size={56} fill="currentColor" /></div>
            <div className="absolute top-1/2 right-4 animate-pulse text-red-400"><Heart size={40} fill="currentColor" /></div>
            <div className="absolute bottom-1/4 left-1/4 opacity-60 animate-bounce-in" style={{animationDelay: '1s'}}><Heart size={32} /></div>
            <div className="absolute top-1/3 right-1/4 opacity-60 animate-pulse-heart text-rose-300" style={{animationDelay: '0.5s'}}><Heart size={48} fill="currentColor" /></div>
            
            {/* Sparkles */}
            <div className="absolute top-20 left-1/3 text-yellow-300 animate-spin-slow"><Sparkles size={32} /></div>
            <div className="absolute bottom-20 right-1/3 text-white animate-pulse"><Sparkles size={40} /></div>
          </>
        ) : (
          // DRINK CAM PARTICLES (Beers & Bubbles)
          <>
             {/* Big Beers */}
            <div className="absolute top-4 left-4 animate-bounce text-amber-400"><Beer size={64} fill="currentColor" /></div>
            <div className="absolute bottom-32 right-4 animate-bounce text-orange-500" style={{animationDuration: '2.5s'}}><Beer size={56} fill="currentColor" /></div>
            
            {/* Bubbles (Simulated by Circles/Glass) */}
            <div className="absolute bottom-10 left-10 text-yellow-400 animate-bounce opacity-80" style={{animationDuration: '4s'}}><div className="w-8 h-8 rounded-full border-4 border-current bg-white/20"></div></div>
            <div className="absolute top-1/2 right-8 text-amber-300 animate-pulse opacity-60"><div className="w-6 h-6 rounded-full border-2 border-current"></div></div>
            <div className="absolute top-20 left-20 text-white opacity-40 animate-ping"><div className="w-4 h-4 rounded-full bg-white"></div></div>
            <div className="absolute bottom-1/3 left-1/2 text-amber-200 opacity-50 animate-bounce" style={{animationDelay: '1s'}}><div className="w-10 h-10 rounded-full border-4 border-current"></div></div>
            
            {/* Sparkles */}
            <div className="absolute top-10 right-1/3 text-yellow-200 animate-pulse"><Sparkles size={48} /></div>
            <div className="absolute bottom-1/4 left-8 text-white animate-spin-slow"><Sparkles size={32} /></div>
          </>
        )}
      </div>

      {/* --- MASSIVE BRANDING TITLE (Bottom Center) --- */}
      <div className="absolute bottom-6 left-0 right-0 flex flex-col items-center justify-center">
        {/* The Glow Behind */}
        <div className={`absolute bottom-2 w-3/4 h-24 blur-3xl opacity-60 ${theme.bg}`}></div>
        
        {/* The Text */}
        <div className="relative transform rotate-[-2deg]">
           <h1 className={`
             font-black text-6xl md:text-8xl italic uppercase tracking-tighter text-transparent bg-clip-text bg-gradient-to-b ${theme.titleGradient}
             drop-shadow-[0_4px_4px_rgba(0,0,0,0.8)]
           `}
           style={{
             WebkitTextStroke: '3px white',
             filter: 'drop-shadow(0 0 10px rgba(0,0,0,0.5))'
           }}
           >
             {isKiss ? "KISS CAM" : "DRINK CAM"}
           </h1>
           {/* Decorative Icon next to text */}
           <div className="absolute -right-12 -top-4 animate-bounce-in">
              {isKiss ? 
                <Heart size={64} className="text-pink-500 drop-shadow-lg" fill="#fff" /> : 
                <Beer size={64} className="text-amber-500 drop-shadow-lg" fill="#fff" />
              }
           </div>
           <div className="absolute -left-10 bottom-2 animate-pulse-heart">
              {isKiss ? 
                <Heart size={48} className="text-red-500 drop-shadow-lg" fill="currentColor" /> : 
                <Sparkles size={48} className="text-yellow-400 drop-shadow-lg" fill="currentColor" />
              }
           </div>
        </div>
      </div>

      {/* --- STATUS LABEL (Top Center) --- */}
      {label && (
        <div className="absolute top-6 left-1/2 -translate-x-1/2">
           <div className={`
             px-6 py-2 rounded-full font-bold text-xl md:text-2xl text-white shadow-xl border-4 border-white
             ${theme.bg}
           `}>
             {label}
           </div>
        </div>
      )}
    </div>
  );
};

export default CamOverlay;