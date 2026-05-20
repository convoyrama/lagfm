import React, { useState } from 'react';
import { 
  Info, List, Globe, Circle, Sun, Moon, Truck, Calendar, Gauge, Wifi, Terminal 
} from 'lucide-react';
import { useAudio } from '../contexts/AudioContext';

export default function ActionBar({ 
  panel, setPanel, isAwake, setIsAwake, sleepTimer, setSleepTimer, fetchEvents
}) {
  const [page, setPage] = useState(0);
  const { taping, toggleRecording, tapeReady } = useAudio();
  
  const totalPages = 3;
  const minutesLeft = Math.ceil(sleepTimer / 60);

  const cycleSleep = () => {
    if (sleepTimer === 0) setSleepTimer(30 * 60);
    else if (sleepTimer <= 30 * 60) setSleepTimer(60 * 60);
    else setSleepTimer(0);
  };

  return (
    <div className="action-bar">
      <div className="nav-char" onClick={() => setPage(p => (p - 1 + totalPages) % totalPages)}>&lt;</div>

      <div className="action-buttons-container">
        {page === 0 && (
          <>
            <button className={`action-btn ${panel === 'info' ? 'active' : ''}`} onClick={() => setPanel('info')}><Info size={20} /></button>
            <button className={`action-btn ${panel === 'list' ? 'active' : ''}`} onClick={() => setPanel('list')}><List size={20} /></button>
            <button className={`action-btn ${panel === 'custom' ? 'active' : ''}`} onClick={() => setPanel('custom')}><Globe size={20} /></button>
            <button className={`action-btn rec-btn ${taping ? 'recording' : ''}`} onClick={toggleRecording} disabled={!tapeReady}><Circle size={20} /></button>
          </>
        )}

        {page === 1 && (
          <>
            <button className={`action-btn ${isAwake ? 'active' : ''}`} onClick={() => setIsAwake(!isAwake)}><Sun size={20} /></button>
            <button className={`action-btn ${panel === 'odometer' ? 'active' : ''}`} onClick={() => setPanel('odometer')}><Truck size={20} /></button>
            <button className={`action-btn ${panel === 'events' ? 'active' : ''}`} onClick={() => { setPanel('events'); fetchEvents && fetchEvents(); }}><Calendar size={20} /></button>
            <button className={`action-btn ${sleepTimer > 0 ? 'active' : ''}`} onClick={cycleSleep}>{sleepTimer > 0 ? <span>{minutesLeft}m</span> : <Moon size={20} />}</button>
          </>
        )}

        {page === 2 && (
          <div style={{ display: 'flex', gap: '15px' }}>
            <button className={`action-btn ${panel === 'remote' ? 'active' : ''}`} onClick={() => setPanel('remote')}><Wifi size={18} /></button>
            <button className={`action-btn ${panel === 'hub' ? 'active' : ''}`} onClick={() => setPanel('hub')}><Gauge size={22} /></button>
            <button className={`action-btn ${panel === 'console' ? 'active' : ''}`} onClick={() => setPanel('console')}><Terminal size={18} /></button>
          </div>
        )}
      </div>

      <div className="nav-char" onClick={() => setPage(p => (p + 1) % totalPages)}>&gt;</div>
    </div>
  );
}
