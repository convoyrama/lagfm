import React, { useRef } from 'react';
import { Play, Pause, Volume2 } from 'lucide-react';

export default function VolumeDial({ volume, setVolume, onAir, togglePlay, showVolume, setShowVolume }) {
  const dialRef = useRef(null);
  const volumeTimeout = useRef(null);

  const handleVolumeDial = (e) => {
    if (!dialRef.current) return;
    
    if (e.target.closest('.big-play-button')) return;

    setShowVolume(true);
    if (volumeTimeout.current) clearTimeout(volumeTimeout.current);

    const rect = dialRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    
    const angle = Math.atan2(clientY - centerY, clientX - centerX);
    let vol = (angle + Math.PI / 2) / (2 * Math.PI);
    if (vol < 0) vol += 1;
    
    setVolume(Math.min(Math.max(vol, 0.01), 1));
  };

  const handleDialRelease = () => {
    volumeTimeout.current = setTimeout(() => setShowVolume(false), 2000);
  };

  return (
    <div className="dial-wrapper" ref={dialRef} 
         onMouseDown={(e) => { 
           if (e.target.closest('.big-play-button')) return;
           window.addEventListener('mousemove', handleVolumeDial); 
           window.addEventListener('mouseup', () => {
             window.removeEventListener('mousemove', handleVolumeDial);
             handleDialRelease();
           }, {once: true}); 
         }}
         onTouchStart={(e) => {
           if (e.target.closest('.big-play-button')) return;
           handleVolumeDial(e);
         }}
         onTouchMove={handleVolumeDial}
         onTouchEnd={handleDialRelease}>
      
      <svg className="volume-ring" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="45" className="ring-bg" />
        <circle cx="50" cy="50" r="45" className="ring-fill" 
                style={{ strokeDashoffset: 283 - (283 * volume) }} />
      </svg>

      <button 
        onClick={(e) => {
          e.stopPropagation();
          togglePlay();
        }} 
        className={`big-play-button ${onAir ? 'is-playing' : ''}`}
      >
        {onAir ? <Pause size={32} fill="currentColor" /> : <Play size={32} fill="currentColor" />}
      </button>

      <div className={`volume-icon-overlay ${showVolume ? 'visible' : ''}`}>
        <Volume2 size={14} />
        <span>{Math.round(volume * 100)}%</span>
      </div>
    </div>
  );
}
