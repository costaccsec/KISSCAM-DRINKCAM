import React, { useState, useEffect } from 'react';
import { Role, AppMode } from './types';
import HostDisplay from './components/HostDisplay';
import MobileCamera from './components/MobileCamera';
import { Camera, Monitor, Heart, Beer, ArrowRight, Smartphone, Settings } from 'lucide-react';

const App: React.FC = () => {
  const [currentRole, setCurrentRole] = useState<Role>(Role.NONE);
  const [appMode, setAppMode] = useState<AppMode>('KISS');
  const [roomCode, setRoomCode] = useState<string>('');

  const renderContent = () => {
    switch (currentRole) {
      case Role.HOST:
        return <HostDisplay onLeave={() => setCurrentRole(Role.NONE)} mode={appMode} roomId={roomCode} />;
      case Role.CAM_1:
        return <MobileCamera role={Role.CAM_1} onLeave={() => setCurrentRole(Role.NONE)} mode={appMode} roomId={roomCode} />;
      case Role.CAM_2:
        return <MobileCamera role={Role.CAM_2} onLeave={() => setCurrentRole(Role.NONE)} mode={appMode} roomId={roomCode} />;
      default:
        return <LandingPage onJoin={(role, code) => {
          setRoomCode(code);
          setCurrentRole(role);
        }} mode={appMode} setMode={setAppMode} />;
    }
  };

  return (
    <div className="min-h-screen">
      {renderContent()}
    </div>
  );
};

interface LandingProps {
  onJoin: (role: Role, code: string) => void;
  mode: AppMode;
  setMode: (mode: AppMode) => void;
}

const LandingPage: React.FC<LandingProps> = ({ onJoin, mode, setMode }) => {
  const [inputCode, setInputCode] = useState('');
  const [hostCustomCode, setHostCustomCode] = useState('');
  const isKiss = mode === 'KISS';
  
  // Generate a random 4-character code for the Host
  const generateRoomCode = () => {
    return Math.random().toString(36).substring(2, 6).toUpperCase();
  };

  const handleHostStart = () => {
    // Use custom code if provided, otherwise generate random
    const code = hostCustomCode.trim() ? hostCustomCode.toUpperCase() : generateRoomCode();
    // Validate length slightly if custom
    if (hostCustomCode.trim() && hostCustomCode.length < 3) {
        alert("Room code must be at least 3 characters");
        return;
    }
    onJoin(Role.HOST, code);
  };

  const handleCamJoin = (role: Role) => {
    if (inputCode.length < 3) {
      alert("Please enter a valid Room Code from the Host screen.");
      return;
    }
    onJoin(role, inputCode.toUpperCase());
  };
  
  // Theme variants
  const bgGradient = isKiss 
    ? "from-pink-500 via-red-500 to-purple-600" 
    : "from-amber-500 via-orange-500 to-yellow-600";
  
  const iconColor = isKiss ? "bg-pink-500" : "bg-amber-500";
  const buttonHover = isKiss ? "hover:bg-pink-500/20" : "hover:bg-amber-500/20";
  const borderColor = isKiss ? "focus:border-pink-300" : "focus:border-amber-300";

  return (
    <div className={`min-h-screen bg-gradient-to-br ${bgGradient} flex items-center justify-center p-4 transition-colors duration-500`}>
      <div className="max-w-4xl w-full bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl p-6 md:p-12 border border-white/20 text-white">
        
        {/* Header Section */}
        <div className="text-center mb-10">
          {/* Mode Toggler */}
          <div className="flex justify-center mb-6 bg-black/20 rounded-full p-1 w-fit mx-auto backdrop-blur-md">
            <button 
              onClick={() => setMode('KISS')}
              className={`px-6 py-2 rounded-full font-bold transition-all flex items-center gap-2 ${isKiss ? 'bg-white text-pink-600 shadow-lg scale-105' : 'text-white/70 hover:text-white'}`}
            >
              <Heart size={18} className={isKiss ? 'fill-pink-600' : ''} />
              KISS CAM
            </button>
            <button 
              onClick={() => setMode('DRINK')}
              className={`px-6 py-2 rounded-full font-bold transition-all flex items-center gap-2 ${!isKiss ? 'bg-white text-amber-600 shadow-lg scale-105' : 'text-white/70 hover:text-white'}`}
            >
              <Beer size={18} className={!isKiss ? 'fill-amber-600' : ''} />
              DRINK CAM
            </button>
          </div>

          <h1 className="text-5xl md:text-7xl font-black mb-2 drop-shadow-md tracking-tight">
            {isKiss ? "LoveLens" : "DrinkLens"}
          </h1>
          <p className="text-xl md:text-2xl font-light opacity-90">
            {isKiss ? "Interactive Kiss Cam System" : "Interactive Party Cam System"}
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 md:gap-12">
           {/* Host Column */}
           <div className="flex flex-col gap-4">
             <div className="flex items-center gap-3 mb-2 opacity-80">
                <Monitor size={20} />
                <span className="font-bold tracking-widest text-xs uppercase">For Projector</span>
             </div>
             
             <div className="bg-white/5 border-2 border-white/30 hover:border-white/50 rounded-3xl p-6 transition-all duration-300 flex flex-col h-full">
               <div className="flex-1 flex flex-col items-center justify-center text-center mb-6">
                 <div className="bg-white/10 p-4 rounded-full mb-4">
                   <Monitor className="w-10 h-10" />
                 </div>
                 <h2 className="text-2xl font-bold mb-1">Create Host</h2>
                 <p className="text-sm opacity-70">Start a new room and display the feed.</p>
               </div>
               
               <div className="mb-4">
                  <label className="text-xs uppercase font-bold tracking-wider opacity-60 mb-1 block">Custom Room Code (Optional)</label>
                  <div className="relative">
                    <input 
                        type="text" 
                        maxLength={8}
                        value={hostCustomCode}
                        onChange={(e) => setHostCustomCode(e.target.value.toUpperCase())}
                        placeholder="AUTO"
                        className={`w-full bg-black/20 border border-white/20 rounded-lg px-4 py-3 font-mono font-bold tracking-widest text-lg focus:outline-none ${borderColor} focus:bg-black/30 transition-colors placeholder:text-white/20`}
                    />
                    <Settings className="absolute right-3 top-1/2 -translate-y-1/2 opacity-50 w-4 h-4" />
                  </div>
               </div>

               <button 
                onClick={handleHostStart}
                className="w-full bg-white text-gray-900 px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-gray-100 transition-all active:scale-95 shadow-lg"
               >
                 START HOSTING <ArrowRight size={18} />
               </button>
             </div>
           </div>

           {/* Camera Column */}
           <div className="flex flex-col gap-4">
             <div className="flex items-center gap-3 mb-2 opacity-80">
                <Smartphone size={20} />
                <span className="font-bold tracking-widest text-xs uppercase">For Mobile</span>
             </div>
             
             <div className="bg-white/5 border-2 border-white/30 rounded-3xl p-6 md:p-8 h-full flex flex-col justify-between">
               <div>
                  <label className="block text-sm font-bold mb-3 uppercase tracking-wider opacity-80">Enter Room Code</label>
                  <input 
                    type="text" 
                    maxLength={8}
                    value={inputCode}
                    onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                    placeholder="CODE"
                    className={`w-full bg-black/20 border border-white/20 rounded-xl px-4 py-4 text-center text-3xl font-mono font-bold tracking-[0.2em] mb-6 focus:outline-none ${borderColor} focus:bg-black/40 transition-colors placeholder:text-white/20`}
                  />
               </div>
               
               <div className="space-y-3">
                 <button 
                   onClick={() => handleCamJoin(Role.CAM_1)}
                   disabled={inputCode.length < 3}
                   className={`w-full ${buttonHover} border border-white/20 rounded-xl p-4 transition-all flex items-center justify-between group disabled:opacity-50 disabled:cursor-not-allowed`}
                 >
                   <div className="flex items-center gap-3">
                     <div className={`${iconColor} p-2 rounded-lg`}>
                       <Camera size={20} className="text-white" />
                     </div>
                     <span className="font-bold">Join as CAM 1</span>
                   </div>
                   <ArrowRight className="opacity-0 group-hover:opacity-100 transition-opacity" size={18} />
                 </button>

                 <button 
                   onClick={() => handleCamJoin(Role.CAM_2)}
                   disabled={inputCode.length < 3}
                   className={`w-full ${buttonHover} border border-white/20 rounded-xl p-4 transition-all flex items-center justify-between group disabled:opacity-50 disabled:cursor-not-allowed`}
                 >
                   <div className="flex items-center gap-3">
                     <div className={`${isKiss ? 'bg-purple-500' : 'bg-orange-500'} p-2 rounded-lg`}>
                       <Camera size={20} className="text-white" />
                     </div>
                     <span className="font-bold">Join as CAM 2</span>
                   </div>
                   <ArrowRight className="opacity-0 group-hover:opacity-100 transition-opacity" size={18} />
                 </button>
               </div>
             </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default App;