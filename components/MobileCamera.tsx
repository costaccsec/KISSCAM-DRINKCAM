import React, { useEffect, useRef, useState, useCallback } from 'react';
import { RefreshCw, Wifi, WifiOff, Layout, Smartphone, LogOut } from 'lucide-react';
import { Role, LayoutMode, AppMode } from '../types';
import CamOverlay from './HeartOverlay';
import Peer, { DataConnection } from 'peerjs';

interface MobileCameraProps {
  role: Role;
  mode: AppMode;
  onLeave: () => void;
  roomId: string;
}

const MobileCamera: React.FC<MobileCameraProps> = ({ role, mode: initialMode, onLeave, roomId }) => {
  const [currentMode, setCurrentMode] = useState<AppMode>(initialMode);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  
  const peerRef = useRef<Peer | null>(null);
  const connRef = useRef<DataConnection | null>(null);

  // Initialize PeerJS Client
  useEffect(() => {
    const peerId = `lovelens-${roomId}-${role === Role.CAM_1 ? 'cam1' : 'cam2'}`;
    const hostId = `lovelens-${roomId}-host`;
    
    const peer = new Peer(peerId);
    peerRef.current = peer;

    peer.on('open', () => {
      console.log('My Peer ID:', peerId);
      connectToHost(peer, hostId);
    });

    peer.on('error', (err) => {
      console.error(err);
      setIsConnected(false);
      // Retry connection if ID is taken (maybe refresh?) or just alert
    });

    return () => {
      peer.destroy();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId, role]);

  const connectToHost = (peer: Peer, hostId: string) => {
    // 1. Open Data Connection for commands
    const conn = peer.connect(hostId);
    
    conn.on('open', () => {
      console.log("Connected to Host Control");
      setIsConnected(true);
      connRef.current = conn;
    });

    conn.on('data', (data: any) => {
      if (data.type === 'STATUS' && data.mode) {
        setCurrentMode(data.mode);
      }
    });

    conn.on('close', () => setIsConnected(false));
    conn.on('error', () => setIsConnected(false));

    // 2. Initiate Video Call if stream exists
    if (stream) {
      callHost(peer, hostId, stream);
    }
  };

  const callHost = (peer: Peer, hostId: string, streamToCall: MediaStream) => {
    const call = peer.call(hostId, streamToCall);
    call.on('close', () => {
      console.log("Call ended");
    });
  };

  const startCamera = useCallback(async () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    try {
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false // Host usually doesn't need audio for kiss cam, prevents feedback loop
      });
      setStream(newStream);
      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
      }
      
      // If peer is ready, call host
      if (peerRef.current && !peerRef.current.disconnected) {
        const hostId = `lovelens-${roomId}-host`;
        callHost(peerRef.current, hostId, newStream);
      }

    } catch (err) {
      console.error("Error accessing camera:", err);
      alert("Could not access camera. Please allow permissions.");
    }
  }, [facingMode, roomId]);

  useEffect(() => {
    startCamera();
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [facingMode, startCamera]);

  const sendLayoutCommand = (layout: LayoutMode) => {
    if (connRef.current && connRef.current.open) {
      connRef.current.send({
        type: 'COMMAND',
        source: role,
        layout
      });
    }
  };

  const toggleCamera = () => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  };

  const themeColor = currentMode === 'KISS' ? 'bg-pink-600' : 'bg-amber-600';
  const ringColor = currentMode === 'KISS' ? 'ring-pink-400' : 'ring-amber-400';

  return (
    <div className="flex flex-col h-screen bg-black text-white relative overflow-hidden">
      {/* Viewfinder */}
      <div className="flex-1 relative flex items-center justify-center">
        <video 
          ref={videoRef} 
          autoPlay 
          playsInline 
          muted 
          className="absolute min-w-full min-h-full object-cover"
        />
        
        {/* Cam Overlay */}
        <CamOverlay mode={currentMode} />

        {/* Status Indicators */}
        <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md px-4 py-2 rounded-full flex items-center gap-3 z-20 border border-white/10 shadow-lg">
          {isConnected ? <Wifi className="text-green-400 w-4 h-4" /> : <WifiOff className="text-red-400 w-4 h-4 animate-pulse" />}
          <div className="flex flex-col leading-none">
            <span className="text-[10px] text-gray-400 font-mono">ROOM: {roomId}</span>
            <span className="text-xs font-bold font-mono">{role === Role.CAM_1 ? 'CAM 1' : 'CAM 2'}</span>
          </div>
        </div>

        {/* Director Controls (Right Side) */}
        <div className="absolute right-4 top-24 flex flex-col gap-4 z-30">
          <div className="text-[10px] text-center font-bold text-white/50 mb-1 uppercase tracking-wider">Director</div>
          <button 
            onClick={() => sendLayoutCommand('split')}
            className={`w-14 h-14 rounded-full bg-black/40 backdrop-blur-md border border-white/20 text-white flex flex-col items-center justify-center hover:${themeColor} active:scale-95 transition shadow-xl`}
            title="Switch Host to Split View"
          >
            <Layout size={20} />
            <span className="text-[8px] font-bold mt-1">SPLIT</span>
          </button>
          
          <button 
            onClick={() => sendLayoutCommand('full_cam1')}
            className={`w-14 h-14 rounded-full bg-black/40 backdrop-blur-md border border-white/20 flex flex-col items-center justify-center hover:${themeColor} active:scale-95 transition shadow-xl ${role === Role.CAM_1 ? `ring-2 ${ringColor} bg-white/10` : ''}`}
            title="Switch Host to Cam 1"
          >
            <Smartphone size={20} />
            <span className="text-[8px] font-bold mt-1">CAM 1</span>
          </button>

          <button 
            onClick={() => sendLayoutCommand('full_cam2')}
            className={`w-14 h-14 rounded-full bg-black/40 backdrop-blur-md border border-white/20 flex flex-col items-center justify-center hover:${themeColor} active:scale-95 transition shadow-xl ${role === Role.CAM_2 ? `ring-2 ${ringColor} bg-white/10` : ''}`}
            title="Switch Host to Cam 2"
          >
            <Smartphone size={20} />
            <span className="text-[8px] font-bold mt-1">CAM 2</span>
          </button>
        </div>
      </div>

      {/* Footer Controls */}
      <div className="bg-gradient-to-t from-black via-black/80 to-transparent pt-12 pb-8 px-8 flex justify-between items-end z-30">
        <button 
          onClick={onLeave}
          className="w-12 h-12 rounded-full bg-gray-800/80 backdrop-blur hover:bg-red-900/80 flex items-center justify-center transition text-white border border-white/10"
        >
          <LogOut size={20} />
        </button>

        {/* Rec Button (Visual Only for operator) */}
        <div className="relative group">
           <div className={`w-20 h-20 rounded-full border-4 flex items-center justify-center transition ${isConnected ? 'border-white' : 'border-gray-600'}`}>
             <div className={`w-16 h-16 rounded-full transition-all duration-500 ${isConnected ? 'bg-red-500 scale-100 animate-pulse' : 'bg-gray-500 scale-90'}`} />
           </div>
           {!isConnected && <span className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap text-xs bg-red-600 text-white px-2 py-1 rounded">Connecting...</span>}
        </div>

        <button 
          onClick={toggleCamera}
          className="w-12 h-12 rounded-full bg-gray-800/80 backdrop-blur hover:bg-gray-700/80 flex items-center justify-center transition text-white border border-white/10"
        >
          <RefreshCw size={20} />
        </button>
      </div>
    </div>
  );
};

export default MobileCamera;