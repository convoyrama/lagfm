import React from 'react';
import { Wifi, WifiOff, Loader2 } from 'lucide-react';

export default function TrackInfo({ currentTrack, signal, t }) {
  return (
    <div className="track-meta">
      <h2 className="track-title">{currentTrack.title}</h2>
      <p className="track-artist">{currentTrack.artist}</p>
      
      <div className={`connection-tag ${signal}`}>
        {signal === 'online' && <Wifi size={14} />}
        {signal === 'failed' && <WifiOff size={14} />}
        {(signal === 'pinging' || signal === 'handshake') && 
         <Loader2 size={14} className="spin" />}
        <span>{t?.[signal] || t?.connecting || signal}</span>
      </div>
    </div>
  );
}
