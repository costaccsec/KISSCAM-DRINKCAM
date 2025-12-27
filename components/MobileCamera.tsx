
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
  const streamRef = useRef<MediaStream | null>(null);

  const connectToHost = useCallback((peer: Peer, hostId: string) => {
    console.log("Attempting to connect to host:", hostId);
    
    // 1. Data connection for layout control
    const conn = peer.connect(hostId, {
      reliable: true
    });
    
    conn.on('open', () => {
      console.log("Connected to Host Control");
      setIsConnected(true);
      connRef.current = conn;
      
      // If we already have a stream, call the host immediately on connection
      if (streamRef.current) {
        console.log("Stream ready, calling host...");
        peer.call(hostId, streamRef.current);
      }
    });

    conn.on('data', (data: any) => {
      if (data.type === 'STATUS' && data.mode) {
        setCurrentMode(data.mode);
      }
    });

    conn.on('close', () => setIsConnected(false));
    conn.on('error', (err) => {
      console.error("Connection error:", err);
      setIsConnected(false);
    });
  }, []);

  useEffect(() => {
    // Generate a unique ID to avoid collisions
    // We add a short random suffix to handle quick refreshes
    const randomSuffix = Math.floor(Math.random() * 1000);
    const peerId = `lovelens-${roomId}-${role === Role.CAM_1 ? 'cam1' : 'cam2'}-${randomSuffix}`;
    const hostId = `lovelens-${roomId}-host`;
    
    const peer = new Peer(peerId);
    peerRef.current = peer;

    peer.on('open', () => {
      console.log('My Unique Peer ID:', peerId);
      connectToHost(peer, hostId);
    });

    peer.on('error', (err) => {
      console.error("PeerJS Error:", err);
      if (err.type === 'peer-unavailable') {
        console.warn("Host not found, retrying in 3s...");
        setTimeout(() => connectToHost(peer, hostId), 3000);
      }
    });

    return () => {
      peer.destroy();
    };
  }, [roomId, role, connectToHost]);

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
        audio: false
      });
      setStream(newStream);
      streamRef.current = newStream;
      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
      }
      
      // If peer is already open and connected, initiate the call
      if (peerRef.current && isConnected) {
        const hostId = `lovelens-${roomId}-host`;
        peerRef.current.call(hostId, newStream);
      }

    } catch (err) {
      console.error("Error accessing camera:", err);
    }
  }, [facingMode, roomId, isConnected, stream]);

  useEffect(() => {
    startCamera();
    return () => {
      if (stream) stream.getTracks().forEach(track => track.stop());
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
      <div className="flex-1 relative flex items-center justify-center">
        <video 
          ref={videoRef} 
          autoPlay 
          playsInline 
          muted 
          className="absolute min-w-full min-h-full object-cover"
        />
        
        <CamOverlay mode={currentMode} label={!isConnected ? "CONNECTING..." : undefined} />

        <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md px-4 py-2 rounded-full flex items-center gap-3 z-20 border border-white/10 shadow-lg">
          {isConnected ? <Wifi className="text-green-400 w-4 h-4" /> : <WifiOff className="text-red-400 w-4 h-4 animate-pulse" />}
          <div className="flex flex-col leading-none">
            <span className="text-[10px] text-gray-400 font-mono uppercase tracking-widest">ROOM: {roomId}</span>
            <span className="text-xs font-bold font-mono">{role === Role.CAM_1 ? 'CAMERA 1' : 'CAMERA 2'}</span>
          </div>
        </div>

        <div className="absolute right-4 top-24 flex flex-col gap-4 z-30">
          <button onClick={() => sendLayoutCommand('split')} className={`w-16 h-16 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-white flex flex-col items-center justify-center hover:${themeColor} active:scale-95 transition shadow-2xl`}>
            <Layout size={24} />
            <span className="text-[10px] font-bold mt-1">SPLIT</span>
          </button>
          <button onClick={() => sendLayoutCommand('full_cam1')} className={`w-16 h-16 rounded-full bg-black/60 backdrop-blur-md border border-white/20 flex flex-col items-center justify-center hover:${themeColor} active:scale-95 transition shadow-2xl ${role === Role.CAM_1 ? `ring-4 ${ringColor} bg-white/20` : ''}`}>
            <Smartphone size={24} />
            <span className="text-[10px] font-bold mt-1 uppercase">Cam 1</span>
          </button>
          <button onClick={() => sendLayoutCommand('full_cam2')} className={`w-16 h-16 rounded-full bg-black/60 backdrop-blur-md border border-white/20 flex flex-col items-center justify-center hover:${themeColor} active:scale-95 transition shadow-2xl ${role === Role.CAM_2 ? `ring-4 ${ringColor} bg-white/20` : ''}`}>
            <Smartphone size={24} />
            <span className="text-[10px] font-bold mt-1 uppercase">Cam 2</span>
          </button>
        </div>
      </div>

      <div className="bg-gradient-to-t from-black via-black/80 to-transparent pt-12 pb-10 px-8 flex justify-between items-end z-30">
        <button onClick={onLeave} className="w-16 h-16 rounded-full bg-red-600/20 backdrop-blur hover:bg-red-600 flex items-center justify-center transition text-white border border-white/20 shadow-xl">
          <LogOut size={28} />
        </button>

        <div className="relative">
           <div className={`w-24 h-24 rounded-full border-4 flex items-center justify-center transition-all ${isConnected ? 'border-white animate-pulse' : 'border-gray-700'}`}>
             <div className={`w-20 h-20 rounded-full transition-all duration-500 ${isConnected ? 'bg-red-600 scale-100' : 'bg-gray-800 scale-90'}`} />
           </div>
        </div>

        <button onClick={toggleCamera} className="w-16 h-16 rounded-full bg-white/10 backdrop-blur hover:bg-white/20 flex items-center justify-center transition text-white border border-white/20 shadow-xl">
          <RefreshCw size={28} />
        </button>
      </div>
    </div>
  );
};

export default MobileCamera;
