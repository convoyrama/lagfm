import React, { useState, useEffect } from 'react';
import './App.css';

import StatusHeader from './components/StatusHeader.jsx';
import TrackInfo from './components/TrackInfo.jsx';
import VolumeDial from './components/VolumeDial.jsx';
import RadioPanels from './components/RadioPanels.jsx';
import ActionBar from './components/ActionBar.jsx';
import AppFooter from './components/AppFooter.jsx';

import { useAudio } from './contexts/AudioContext';
import { useLAGNode } from './contexts/LAGNodeContext';
import { OdometerProvider } from './contexts/OdometerContext';
import { useTMPEvents } from './hooks/useTMPEvents';
import { useDynamicConfig } from './hooks/useDynamicConfig';
import { useBackgroundResilience } from './hooks/useBackgroundResilience';
import { useTrafficLight } from './hooks/useTrafficLight';
import { useUpdater } from './hooks/useUpdater';
import { useToast } from './hooks/useToast';

import { getWelcomeLyrics } from './utils/formatters';

export default function App() {
  return (
    <OdometerProvider getWelcomeLyrics={getWelcomeLyrics}>
      <AppLayout />
    </OdometerProvider>
  );
}

function AppLayout() {
  const [panel, setPanel] = useState(null);
  const [isAwake, setIsAwake] = useState(false);
  const [sleepTimer, setSleepTimer] = useState(0);
  const [ping, setPing] = useState(150);
  const [showVolume, setShowVolume] = useState(false);
  const currentVersion = '6.0.1';
  
  const { 
    currentTrack, onAir, togglePlay, volume, setVolume, signal, t 
  } = useAudio();
  
  const { connectionStatus: plpStatus } = useLAGNode();
  const { dynamicStreams, loadingStreams, eventsConfig } = useDynamicConfig();
  const { tmpEvents, loadingEvents, fetchEvents } = useTMPEvents(eventsConfig);
  const { status: trafficColor, isBlinking: trafficBlink } = useTrafficLight(onAir, signal);
  const { showToast } = useToast();
  const { updateVersion, showUpdateNotice } = useUpdater(currentVersion, showToast);

  useBackgroundResilience(onAir, plpStatus, currentTrack, isAwake);

  useEffect(() => {
    // Ping simulado para indicador de señal.
    const interval = setInterval(() => {
      setPing(Math.floor(Math.random() * 50 + 60));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleSetPanel = (p) => {
    // Switch de paneles. Hub activa awake automaticamente.
    if (panel === p) {
      setPanel(null);
      setIsAwake(false);
    } else {
      setPanel(p);
      setIsAwake(p === 'hub');
      if (p === 'hub') setSleepTimer(0);
    }
  };

  return (
    <div className="radio-container">
      <div className="scanline"></div>
      
      <StatusHeader 
        trafficStatus={trafficColor} 
        isBlinking={trafficBlink} 
        ping={ping} 
        hasUpdate={!!updateVersion}
        showUpdateNotice={showUpdateNotice}
      />

      <div className="main-display">
        {panel !== 'hub' && (
          <>
            <TrackInfo currentTrack={currentTrack} signal={signal} t={t} />
            <VolumeDial 
              volume={volume} setVolume={setVolume} 
              onAir={onAir} togglePlay={togglePlay} 
              showVolume={showVolume} setShowVolume={setShowVolume}
            />
          </>
        )}

        <RadioPanels 
          panel={panel} 
          setPanel={handleSetPanel} 
          dynamicStreams={dynamicStreams}
          loadingStreams={loadingStreams}
          tmpEvents={tmpEvents}
          loadingEvents={loadingEvents}
          fetchEvents={fetchEvents}
        />
      </div>

      <ActionBar 
        panel={panel} 
        setPanel={handleSetPanel} 
        isAwake={isAwake}
        setIsAwake={setIsAwake}
        sleepTimer={sleepTimer}
        setSleepTimer={setSleepTimer}
        fetchEvents={fetchEvents}
      />

      <AppFooter t={t} />
    </div>
  );
}
