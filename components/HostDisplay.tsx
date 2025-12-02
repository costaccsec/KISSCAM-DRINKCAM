import React, { useEffect, useRef, useState } from 'react';
import { Grid, Sparkles, AlertCircle, Wifi } from 'lucide-react';
import { Role, GeminiCommentary, LayoutMode, AppMode } from '../types';
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
  
  const peerRef = useRef<Peer | null>(null);
  const cam1VideoRef = useRef<HTMLVideoElement>(null);
  const cam2VideoRef = useRef<HTMLVideoElement>(null);
  
  // Keep track of connections to send status updates
  const connectionsRef = useRef<DataConnection[]>([]);

  // Initialize PeerJS Host
  useEffect(() => {
    // ID format: lovelens-[ROOM_ID]-host
    const peerId = `lovelens-${roomId}-host`;
    const peer = new Peer(peerId);
    peerRef.current = peer;

    peer.on('open', (id) => {
      console.log('Host Peer ID:', id);
    });

    // Handle Incoming Video Calls
    peer.on('call', (call: MediaConnection) => {
      console.log("Incoming call from:", call.peer);
      call.answer(); // Answer without stream (Host is receive-only for video)

      const callerRole = call.peer.includes('cam1') ? Role.CAM_1 : (call.peer.includes('cam2') ? Role.CAM_2 : null);

      call.on('stream', (remoteStream) => {
        if (callerRole === Role.CAM_1) {
          setCam1Stream(remoteStream);
          if (cam1VideoRef.current) cam1VideoRef.current.srcObject = remoteStream;
        } else if (callerRole === Role.CAM_2) {
          setCam2Stream(remoteStream);
          if (cam2VideoRef.current) cam2VideoRef.current.srcObject = remoteStream;
        }
      });
      
      call.on('close', () => {
         if (callerRole === Role.CAM_1) setCam1Stream(null);
         if (callerRole === Role.CAM_2) setCam2Stream(null);
      });
    });

    // Handle Incoming Data Commands (Remote Controls)
    peer.on('connection', (conn: DataConnection) => {
      connectionsRef.current.push(conn);
      
      // Send initial mode to the connected camera
      conn.on('open', () => {
        conn.send({ type: 'STATUS', mode });
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
    };
  }, [roomId, mode]);

  // Sync Mode changes to connected cameras
  useEffect(() => {
    connectionsRef.current.forEach(conn => {
      if (conn.open) {
        conn.send({ type: 'STATUS', mode });
      }
    });
  }, [mode]);

  const handleAIReaction = async () => {
    let videoElement = null;
    
    // Choose which video to capture based on layout
    if (activeLayout === 'full_cam1') videoElement = cam1VideoRef.current;
    else if (activeLayout === 'full_cam2') videoElement = cam2VideoRef.current;
    else {
      // In split view, prefer cam 1, fallback to cam 2
      videoElement = cam1VideoRef.current || cam2VideoRef.current;
    }

    if (!videoElement || videoElement.readyState !== 4) { // 4 = HAVE_ENOUGH_DATA
      alert("No active video feed to analyze!");
      return;
    }

    setIsAnalyzing(true);
    setCommentary(null);

    // Capture frame to canvas
    const canvas = document.createElement('canvas');
    canvas.width = videoElement.videoWidth;
    canvas.height = videoElement.videoHeight;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoElement, 0, 0);
      const base64Image = canvas.toDataURL('image/jpeg', 0.8);
      
      try {
        const result = await analyzeFrame(base64Image, mode);
        setCommentary(result);
        
        // Auto-clear commentary after 8 seconds
        setTimeout(() => setCommentary(null), 8000);
      } catch (e) {
        console.error(e);
      }
    }
    setIsAnalyzing(false);
  };

  const CommentaryBox = () => {
    if (!commentary) return null;
    
    const colors = {
      romantic: 'bg-pink-600',
      funny: 'bg-yellow-500',
      hype: 'bg-red-600',
      awkward: 'bg-blue-500',
      party: 'bg-purple-600',
      spilled: 'bg-orange-600'
    };

    const bgClass = colors[commentary.mood] || 'bg-gray-600';

    return (
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 animate-bounce-in w-full max-w-3xl px-4">
         <div className={`transform ${bgClass} text-white p-8 rounded-[3rem] shadow-2xl border-8 border-white text-center relative overflow-hidden`}>
            {/* Glossy overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent pointer-events-none"></div>
            
            <div className="relative z-10">
              <div className="text-5xl md:text-6xl font-black mb-4 uppercase italic drop-shadow-lg tracking-tighter transform -rotate-2">
                {commentary.score > 80 ? (mode === 'KISS' ? "😘 KISS ALERT!" : "🍻 CHEERS ALERT!") : "👀 OBSERVATION"}
              </div>
              <p className="text-3xl md:text-4xl font-bold leading-tight mb-6 drop-shadow-md">"{commentary.text}"</p>
              <div className="bg-white text-gray-900 rounded-full px-8 py-2 inline-block shadow-lg transform rotate-1">
                 <span className="font-mono font-black text-2xl md:text-3xl">
                   {mode === 'KISS' ? 'KISS' : 'PARTY'} SCORE: {commentary.score}/100
                 </span>
              </div>
            </div>
         </div>
      </div>
    );
  };

  // Theme Styles
  const isKiss = mode === 'KISS';
  const accentColor = isKiss ? 'bg-pink-600' : 'bg-amber-600';
  const borderColor = isKiss ? 'border-pink-500' : 'border-amber-500';
  const titleColor = isKiss ? 'text-pink-500' : 'text-amber-500';
  const glowColor = isKiss ? 'rgba(236,72,153,0.3)' : 'rgba(245,158,11,0.3)';

  return (
    <div className="h-screen bg-gray-900 flex flex-col overflow-hidden relative">
      {/* Hidden Video Elements for Logic */}
      <video ref={cam1VideoRef} autoPlay playsInline muted className="hidden" />
      <video ref={cam2VideoRef} autoPlay playsInline muted className="hidden" />

      {/* Top Control Bar */}
      <div className="h-20 bg-gray-900 border-b border-gray-800 flex items-center justify-between px-8 z-40">
        <div className="flex items-center gap-6">
          <div>
            <div className="text-xs text-gray-500 font-mono mb-1 uppercase tracking-widest">Room Code</div>
            <div className="bg-gray-800 text-white px-4 py-1 rounded text-2xl font-mono font-bold tracking-widest border border-gray-700">
              {roomId}
            </div>
          </div>
          <div className="h-10 w-px bg-gray-800 mx-2"></div>
          <h1 className={`${titleColor} font-black text-3xl tracking-tighter`}>
            {isKiss ? "LOVELENS HOST" : "DRINKLENS HOST"}
          </h1>
        </div>
        
        <div className="flex items-center gap-2 bg-gray-800 p-1.5 rounded-lg border border-gray-700">
          <button 
            onClick={() => setActiveLayout('split')}
            className={`p-3 rounded-md hover:bg-gray-700 transition ${activeLayout === 'split' ? `${accentColor} text-white shadow-lg` : 'text-gray-400'}`}
            title="Split View"
          >
            <Grid size={20} />
          </button>
          <button 
            onClick={() => setActiveLayout('full_cam1')}
            className={`px-4 py-2 rounded-md hover:bg-gray-700 transition ${activeLayout === 'full_cam1' ? `${accentColor} text-white shadow-lg` : 'text-gray-400'}`}
          >
            <span className="font-bold text-sm">CAM 1</span>
          </button>
          <button 
            onClick={() => setActiveLayout('full_cam2')}
            className={`px-4 py-2 rounded-md hover:bg-gray-700 transition ${activeLayout === 'full_cam2' ? `${accentColor} text-white shadow-lg` : 'text-gray-400'}`}
          >
             <span className="font-bold text-sm">CAM 2</span>
          </button>
        </div>

        <div className="flex gap-4 items-center">
           <div className="flex gap-2 mr-4">
             <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold border ${cam1Stream ? 'bg-green-900/30 border-green-500/50 text-green-400' : 'bg-red-900/30 border-red-500/50 text-red-400'}`}>
                <Wifi size={12} /> CAM 1
             </div>
             <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold border ${cam2Stream ? 'bg-green-900/30 border-green-500/50 text-green-400' : 'bg-red-900/30 border-red-500/50 text-red-400'}`}>
                <Wifi size={12} /> CAM 2
             </div>
           </div>

           <button
             onClick={handleAIReaction}
             disabled={isAnalyzing || (!cam1Stream && !cam2Stream)}
             className={`${isKiss ? 'bg-white text-pink-600 hover:bg-pink-50' : 'bg-white text-amber-600 hover:bg-amber-50'} disabled:opacity-50 disabled:cursor-not-allowed px-6 py-3 rounded-full font-black flex items-center gap-2 transition-all transform active:scale-95 shadow-[0_0_20px_rgba(255,255,255,0.3)]`}
           >
             <Sparkles size={20} className={isKiss ? 'fill-pink-600' : 'fill-amber-600'} />
             {isAnalyzing ? "JUDGING..." : "AI JUDGE"}
           </button>
           <button onClick={onLeave} className="text-gray-600 hover:text-white font-mono text-sm ml-4">EXIT</button>
        </div>
      </div>

      {/* Main Display Area */}
      <div className="flex-1 relative bg-black p-4 md:p-8">
         <CommentaryBox />
         
         {activeLayout === 'split' && (
           <div className="grid grid-cols-2 gap-4 md:gap-8 h-full">
             {/* Feed 1 */}
             <div className={`relative rounded-3xl overflow-hidden bg-gray-800 border-4 ${borderColor} transition-all duration-500`} style={{boxShadow: `0 0 30px ${glowColor}`}}>
               {cam1Stream ? (
                 <VideoFeed stream={cam1Stream} />
               ) : (
                 <div className="flex flex-col items-center justify-center h-full text-gray-600 gap-4 animate-pulse">
                   <div className="w-20 h-20 rounded-full bg-gray-700 flex items-center justify-center">
                     <AlertCircle size={40} />
                   </div>
                   <p className="font-mono tracking-widest">WAITING FOR CAM 1</p>
                 </div>
               )}
               <div className={`absolute top-6 left-6 ${accentColor} text-white px-4 py-2 rounded-full text-lg font-bold shadow-lg z-20`}>CAM 1</div>
             </div>

             {/* Feed 2 */}
             <div className={`relative rounded-3xl overflow-hidden bg-gray-800 border-4 ${borderColor} transition-all duration-500`} style={{boxShadow: `0 0 30px ${glowColor}`}}>
               {cam2Stream ? (
                 <VideoFeed stream={cam2Stream} />
               ) : (
                 <div className="flex flex-col items-center justify-center h-full text-gray-600 gap-4 animate-pulse">
                   <div className="w-20 h-20 rounded-full bg-gray-700 flex items-center justify-center">
                     <AlertCircle size={40} />
                   </div>
                   <p className="font-mono tracking-widest">WAITING FOR CAM 2</p>
                 </div>
               )}
               <div className={`absolute top-6 left-6 ${accentColor} text-white px-4 py-2 rounded-full text-lg font-bold shadow-lg z-20`}>CAM 2</div>
             </div>

             {/* Unified Overlay */}
             <CamOverlay label={isKiss ? "DOUBLE TROUBLE" : "DOUBLE SHOTS"} mode={mode} />
           </div>
         )}

         {activeLayout === 'full_cam1' && (
            <div className={`relative w-full h-full rounded-3xl overflow-hidden bg-gray-800 border-4 ${borderColor}`} style={{boxShadow: `0 0 50px ${glowColor}`}}>
               {cam1Stream ? (
                 <VideoFeed stream={cam1Stream} />
               ) : (
                  <div className="flex items-center justify-center h-full text-gray-500">Connecting to Cam 1...</div>
               )}
               <CamOverlay mode={mode} />
            </div>
         )}

         {activeLayout === 'full_cam2' && (
            <div className={`relative w-full h-full rounded-3xl overflow-hidden bg-gray-800 border-4 ${borderColor}`} style={{boxShadow: `0 0 50px ${glowColor}`}}>
               {cam2Stream ? (
                 <VideoFeed stream={cam2Stream} />
               ) : (
                  <div className="flex items-center justify-center h-full text-gray-500">Connecting to Cam 2...</div>
               )}
               <CamOverlay mode={mode} />
            </div>
         )}
      </div>
    </div>
  );
};

// Helper component to render stream
const VideoFeed = ({ stream }: { stream: MediaStream }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);
  return <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />;
};

export default HostDisplay;