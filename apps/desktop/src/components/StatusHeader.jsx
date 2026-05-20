import React, { useState, useEffect } from 'react';
import { Zap } from 'lucide-react';
import logo from '../assets/branding/logo2800x512.svg';

export default function StatusHeader({
  signal, onAir, isOnline, t
}) {
  const [ping, setPing] = useState(42);
  const brandLink = import.meta.env.VITE_SITE_URL;
  useEffect(() => {
    const interval = setInterval(() => {
      const isSpike = Math.random() > 0.90;
      const newPing = isSpike 
        ? Math.floor(Math.random() * 700) + 200 
        : Math.floor(Math.random() * 45) + 20;
      setPing(newPing);
    }, 2500);

    return () => clearInterval(interval);
  }, []);

  const getEffectiveStatus = () => {
    if (!onAir && signal !== 'handshake' && signal !== 'pinging') return 'paused';
    
    if (!isOnline) {
      if (signal === 'fallback_active' || signal === 'online') {
        return 'fallback_active';
      }
      return 'jitter';
    }

    return signal;
  };

  const effectiveStatus = getEffectiveStatus();

  const statusInfo = {
    online: { color: 'green', text: t.status_ok },
    buffering: { color: 'yellow', text: t.status_buffering, blink: 'blink-yellow' },
    handshake: { color: 'yellow', text: t.handshake, blink: 'blink-yellow' },
    pinging: { color: 'yellow', text: t.pinging, blink: 'blink-yellow' },
    jitter: { color: 'yellow', text: t.status_jitter },
    fallback_active: { color: 'red', text: t.status_fallback, blink: 'blink-red' },
    failed: { color: 'red', text: t.failed },
    paused: { color: 'red', text: t.status_paused }
  };

  const currentStatus = statusInfo[effectiveStatus] || statusInfo.online;

  return (
    <div className="top-ui">
      <div className="traffic-light" title={currentStatus.text}>
        <div className={`light red ${currentStatus.color === 'red' ? 'active' : ''} ${currentStatus.blink === 'blink-red' ? 'blink-red' : ''}`}></div>
        <div className={`light yellow ${currentStatus.color === 'yellow' ? 'active' : ''} ${currentStatus.blink === 'blink-yellow' ? 'blink-yellow' : ''}`}></div>
        <div className={`light green ${currentStatus.color === 'green' ? 'active' : ''}`}></div>
      </div>
      
      <div className="brand-container">
        <a href={brandLink} target="_blank" rel="noopener noreferrer" className="brand">
          <img src={logo} alt="LAGFM Logo" style={{ height: '18px' }} />
        </a>
      </div>
      
      <div className={`ping-display ${ping > 150 ? (ping > 300 ? 'lag-spike' : 'lag-warning') : ''}`}>
        <Zap size={10} />
        <span>{ping}ms</span>
      </div>
    </div>
  );
}


