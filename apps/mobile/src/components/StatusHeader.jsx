import React from 'react';
import { Zap } from 'lucide-react';
import logo from '../assets/branding/logo2800x512.svg';
import { useOdometerContext } from '../contexts/OdometerContext';
import { useAudio } from '../contexts/AudioContext';
import { formatDistance } from '../utils/formatters';

export default function StatusHeader({ trafficStatus, isBlinking, ping, hasUpdate, showUpdateNotice }) {
  const { totalMeters } = useOdometerContext();
  const { signal, t, lang } = useAudio();

  const dist = formatDistance(totalMeters, lang);
  const brandLink = hasUpdate 
    ? `https://github.com/CONVOYRAMA/lagfm/releases` 
    : import.meta.env.VITE_SITE_URL;

  return (
    <div className="top-ui">
      <div className={`traffic-light ${isBlinking ? 'blink-warning' : ''}`}>
        <div className={`light red ${trafficStatus === 'red' ? 'active' : ''}`}></div>
        <div className={`light yellow ${trafficStatus === 'yellow' ? 'active' : ''}`}></div>
        <div className={`light green ${trafficStatus === 'green' ? 'active' : ''}`}></div>
      </div>

      <div className="brand-container">
        <a href={brandLink} target="_blank" rel="noopener noreferrer" className={`brand ${hasUpdate ? 'update-glow' : ''}`}>
          {showUpdateNotice ? (
            <h1>{t?.update_available || 'UPDATE'}</h1>
          ) : (
            <img src={logo} alt="LAGFM Logo" style={{ height: '18px' }} />
          )}
        </a>
        <span className="odometer-mini">{dist.full}</span>
      </div>


      <div className={`ping-display ${ping > 300 ? 'lag-spike' : ''}`}>
        <Zap size={10} />
        <span>{signal === 'online' ? `${ping || 150}ms` : '---'}</span>
      </div>
    </div>
  );
}
