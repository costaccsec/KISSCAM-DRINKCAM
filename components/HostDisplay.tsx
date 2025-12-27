
import React, { useEffect, useRef, useState } from 'react';
import { Grid, Sparkles, AlertCircle, Wifi, Monitor } from 'lucide-react';
import { Role, GeminiCommentary, LayoutMode, AppMode, Language } from '../types';
import CamOverlay from './HeartOverlay';
import { analyzeFrame } from '../services/geminiService';
import Peer, { MediaConnection, DataConnection } from 'peerjs';

interface HostDisplayProps {
  onLeave: () => void;
  mode: AppMode;
  roomId: string;
}

const HostDisplay: React.FC<HostDisplayProps> = ({ onLeave, mode, roomId }) => {
  const [cam1Stream, setCam1Stream] = useState<MediaStream | null>(null);
  const [cam2Stream, setCam2Stream] = useState<MediaStream | null>(null);
  const [activeLayout, setActiveLayout] = useState<LayoutMode>('split');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [commentary, setCommentary] = useState<GeminiCommentary | null>(null);
  const [language, setLanguage] = useState<Language>('TH');
  
  const peerRef = useRef<Peer | null>(null);
  const cam1VideoRef = useRef<HTMLVideoElement>(null);
  const cam2VideoRef = useRef<HTMLVideoElement>(null);
  const connectionsRef = useRef<DataConnection[]>([]);
  const modeRef = useRef(mode);

  useEffect(() => {
    modeRef.current = mode;
    connectionsRef.current.forEach(conn => {
        if (conn.open) conn.send({ type: 'STATUS', mode });
    });
  }, [mode]);

  useEffect(() => {
    const hostId = `lovelens-${roomId}-host`;
    const peer = new Peer(hostId);
    peerRef.current = peer;

    peer.on('open', (id) => {
      console.log('Host Online with ID:', id);
    });

    peer.on('call', (call: MediaConnection) => {
      console.log("Incoming call from:", call.peer);
      call.answer(); 

      // Support IDs with random suffixes
      const isCam1 = call.peer.includes('cam1');
      const isCam2 = call.peer.includes('cam2');

      call.on('stream', (remoteStream) => {
        if (isCam1) {
          setCam1Stream(remoteStream);
          if (cam1VideoRef.current) cam1VideoRef.current.srcObject = remoteStream;
        } else if (isCam2) {
          setCam2Stream(remoteStream);
          if (cam2VideoRef.current) cam2VideoRef.current.srcObject = remoteStream;
        }
      });
      
      call.on('close', () => {
         if (isCam1) setCam1Stream(null);
         if (isCam2) setCam2Stream(null);
      });
    });

    peer.on('connection', (conn: DataConnection) => {
      console.log("New data connection from:", conn.peer);
      connectionsRef.current.push(conn);
      
      conn.on('open', () => {
        conn.send({ type: 'STATUS', mode: modeRef.current });
      });

      conn.on('data', (data: any) => {
        if (data.type === 'COMMAND' && data.layout) {
          setActiveLayout(data.layout);
        }
      });
      
      conn.on('close', () => {
        connectionsRef.current = connectionsRef.current.filter(c => c !== conn);
      });
    });

    return () => {
      peer.destroy();
      connectionsRef.current = [];
    };
  }, [roomId]);

  const handleAIReaction = async () => {
    let videoElement = null;
    if (activeLayout === 'full_cam1') videoElement = cam1VideoRef.current;
    else if (activeLayout === 'full_cam2') videoElement = cam2VideoRef.current;
    else videoElement = cam1VideoRef.current || cam2VideoRef.current;

    if (!videoElement || videoElement.readyState !== 4) {
      alert("No active video feed!");
      return;
    }

    setIsAnalyzing(true);
    setCommentary(null);

    const canvas = document.createElement('canvas');
    canvas.width = videoElement.videoWidth;
    canvas.height = videoElement.videoHeight;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoElement, 0, 0);
      const base64Image = canvas.toDataURL('image/jpeg', 0.8);
      try {
        const result = await analyzeFrame(base64Image, mode, language);
        setCommentary(result);
        setTimeout(() => setCommentary(null), 8000);
      } catch (e) { console.error(e); }
    }
    setIsAnalyzing(false);
  };

  const CommentaryBox = () => {
    if (!commentary) return null;
    const colors = {
      romantic: 'bg-pink-600', funny: 'bg-yellow-500', hype: 'bg-red-600',
      awkward: 'bg-blue-500', party: 'bg-purple-600', spilled: 'bg-orange-600'
    };
    const bgClass = colors[commentary.mood] || 'bg-gray-600';

    return (
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 animate-bounce-in w-full max-w-4xl px-4">
         <div className={`${bgClass} text-white p-12 rounded-[4rem] shadow-2xl border-[12px] border-white text-center relative overflow-hidden`}>
            <div className="absolute inset-0 bg-gradient-to-b from-white/30 to-transparent"></div>
            <div className="relative z-10">
              <div className="text-6xl md:text-8xl font-black mb-6 uppercase italic drop-shadow-2xl tracking-tighter transform -rotate-2">
                {commentary.score > 80 ? (mode === 'KISS' ? "😘 KISS ALERT!" : "🍻 BOTTOMS UP!") : "👀 WATCH THIS!"}
              </div>
              <p className="text-4xl md:text-6xl font-black leading-tight mb-8 drop-shadow-xl">"{commentary.text}"</p>
              <div className="bg-white text-black rounded-full px-12 py-4 inline-block shadow-2xl transform rotate-1">
                 <span className="font-black text-3xl md:text-5xl uppercase italic tracking-tighter">
                   {mode === 'KISS' ? 'KISS' : 'PARTY'} SCORE: {commentary.score}/100
                 </span>
              </div>
            </div>
         </div>
      </div>
    );
  };

  const isKiss = mode === 'KISS';
  const borderColor = isKiss ? 'border-pink-500' : 'border-amber-500';
  const glowColor = isKiss ? 'rgba(236,72,153,0.4)' : 'rgba(245,158,11,0.4)';

  return (
    <div className="h-screen bg-black flex flex-col overflow-hidden relative">
      <video ref={cam1VideoRef} autoPlay playsInline muted className="hidden" />
      <video ref={cam2VideoRef} autoPlay playsInline muted className="hidden" />

      <div className="h-24 bg-gray-900/80 backdrop-blur-xl border-b-4 border-white/10 flex items-center justify-between px-10 z-40 shrink-0">
        <div className="flex items-center gap-8">
          <div className="bg-white text-black px-6 py-2 rounded-2xl font-black text-3xl font-mono tracking-widest shadow-xl">
            {roomId}
          </div>
          <h1 className={`${isKiss ? 'text-pink-500' : 'text-amber-500'} font-black text-4xl tracking-tighter italic uppercase`}>
            {isKiss ? "LOVELENS" : "DRINKLENS"}
          </h1>
        </div>
        
        <div className="flex items-center gap-4">
          <button onClick={() => setActiveLayout('split')} className={`p-4 rounded-2xl transition ${activeLayout === 'split' ? 'bg-white text-black scale-110 shadow-2xl' : 'text-white/40'}`}><Grid size={32} /></button>
          <button onClick={() => setActiveLayout('full_cam1')} className={`px-6 py-3 rounded-2xl font-black transition ${activeLayout === 'full_cam1' ? 'bg-white text-black scale-110 shadow-2xl' : 'text-white/40'}`}>CAM 1</button>
          <button onClick={() => setActiveLayout('full_cam2')} className={`px-6 py-3 rounded-2xl font-black transition ${activeLayout === 'full_cam2' ? 'bg-white text-black scale-110 shadow-2xl' : 'text-white/40'}`}>CAM 2</button>
        </div>

        <div className="flex gap-6 items-center">
           <div className="flex items-center bg-white/10 rounded-full p-1.5 border border-white/20">
             <button onClick={() => setLanguage('TH')} className={`px-5 py-2 rounded-full text-lg font-black transition-all ${language === 'TH' ? 'bg-white text-black' : 'text-white/50'}`}>TH</button>
             <button onClick={() => setLanguage('EN')} className={`px-5 py-2 rounded-full text-lg font-black transition-all ${language === 'EN' ? 'bg-white text-black' : 'text-white/50'}`}>EN</button>
           </div>
           <button
             onClick={handleAIReaction}
             disabled={isAnalyzing || (!cam1Stream && !cam2Stream)}
             className={`bg-white text-black disabled:opacity-50 px-8 py-4 rounded-2xl font-black text-xl flex items-center gap-3 transition-all transform active:scale-95 shadow-2xl`}
           >
             <Sparkles size={24} className="fill-current" />
             {isAnalyzing ? "JUDGING..." : "AI JUDGE"}
           </button>
           <button onClick={onLeave} className="text-white/30 hover:text-white font-black text-sm uppercase">Exit</button>
        </div>
      </div>

      <div className="flex-1 relative bg-gray-950 p-6 flex items-center justify-center overflow-hidden">
         <CommentaryBox />
         
         {activeLayout === 'split' && (
           <div className="flex items-center justify-center gap-8 w-full h-full max-w-[95vw]">
             <div className={`relative aspect-video w-full rounded-[3rem] overflow-hidden bg-gray-900 border-[10px] ${borderColor} shadow-2xl`} style={{boxShadow: `0 0 60px ${glowColor}`}}>
               {cam1Stream ? <VideoFeed stream={cam1Stream} /> : <WaitingState label="CAM 1 OFFLINE" />}
               <CamOverlay mode={mode} label="CAMERA 1" />
             </div>
             <div className={`relative aspect-video w-full rounded-[3rem] overflow-hidden bg-gray-900 border-[10px] ${borderColor} shadow-2xl`} style={{boxShadow: `0 0 60px ${glowColor}`}}>
               {cam2Stream ? <VideoFeed stream={cam2Stream} /> : <WaitingState label="CAM 2 OFFLINE" />}
               <CamOverlay mode={mode} label="CAMERA 2" />
             </div>
           </div>
         )}

         {activeLayout.startsWith('full') && (
            <div className={`relative aspect-video w-full max-h-full rounded-[4rem] overflow-hidden bg-gray-900 border-[15px] ${borderColor} shadow-2xl`} style={{boxShadow: `0 0 100px ${glowColor}`}}>
               {activeLayout === 'full_cam1' ? (
                 cam1Stream ? <VideoFeed stream={cam1Stream} /> : <WaitingState label="CONNECTING TO CAM 1..." />
               ) : (
                 cam2Stream ? <VideoFeed stream={cam2Stream} /> : <WaitingState label="CONNECTING TO CAM 2..." />
               )}
               <CamOverlay mode={mode} label={activeLayout === 'full_cam1' ? "LIVE: CAM 1" : "LIVE: CAM 2"} />
            </div>
         )}
      </div>
    </div>
  );
};

const VideoFeed = ({ stream }: { stream: MediaStream }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  useEffect(() => { if (videoRef.current) videoRef.current.srcObject = stream; }, [stream]);
  return <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />;
};

const WaitingState = ({ label }: { label: string }) => (
  <div className="flex flex-col items-center justify-center h-full text-white/20 gap-6 bg-gray-900">
     <Monitor size={80} className="animate-pulse" />
     <p className="font-black tracking-[0.3em] text-2xl uppercase">{label}</p>
  </div>
);

export default HostDisplay;
