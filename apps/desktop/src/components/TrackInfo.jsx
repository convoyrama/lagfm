import React from 'react';
import { Wifi, WifiOff, Loader2 } from 'lucide-react';

export default function TrackInfo({ currentTrack, signal, t }) {
  // Mapeo amigable para el usuario final (usando traducciones)
  const getStatusText = () => {
    if (signal === 'handshake') return t.handshake || '...';
    if (signal === 'pinging') return t.pinging || '...';
    if (signal === 'online') return t.connected || 'LIVE';
    if (signal === 'failed') return t.failed || 'OFFLINE';
    return t[signal] || signal;
  };

  return (
    <div className="track-meta">
      <h2 className="track-title">{currentTrack.title}</h2>
      <p className="track-artist">{currentTrack.artist}</p>
      
      <div className={`connection-tag ${signal}`}>
        {signal === 'online' && <Wifi size={14} />}
        {signal === 'failed' && <WifiOff size={14} />}
        {(signal === 'pinging' || signal === 'handshake') && 
         <Loader2 size={14} className="spin" />}
        <span>{getStatusText()}</span>
      </div>
    </div>
  );
}
