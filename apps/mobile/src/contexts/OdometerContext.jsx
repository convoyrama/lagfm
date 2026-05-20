import React, { createContext, useContext } from 'react';
import { useOdometer } from '../hooks/useOdometer';
import { useAudio } from './AudioContext';

const OdometerContext = createContext();

export function OdometerProvider({ children, getWelcomeLyrics }) {
  const { onAir, setCurrentTrack, lang, t } = useAudio();
  const odometerData = useOdometer(onAir, getWelcomeLyrics, setCurrentTrack, lang, t);

  return (
    <OdometerContext.Provider value={odometerData}>
      {children}
    </OdometerContext.Provider>
  );
}

export function useOdometerContext() {
  const context = useContext(OdometerContext);
  if (!context) throw new Error('useOdometerContext must be used within an OdometerProvider');
  return context;
}
