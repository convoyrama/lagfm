import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { useAudioPlayer } from '../hooks/useAudioPlayer';
import { NORMAL_PLAYLIST, JOKER_TRACK, JINGLES } from '../data/internalTracks';
import { TRANSLATIONS } from '../data/translations';
import { Preferences } from '@capacitor/preferences';

const AudioContext = createContext();

export function AudioProvider({ children }) {
  const [lang, setLangState] = useState('en');
  const [currentTrack, setCurrentTrack] = useState({
    id: -1,
    title: 'STARTING ROUTE',
    artist: "LAGFM NETWORK",
    src: 'local'
  });

  useEffect(() => {
    const loadLang = async () => {
      const { value } = await Preferences.get({ key: 'lagfm_lang' });
      if (value) setLangState(value);
    };
    loadLang();
  }, []);

  const setLang = async (newLang) => {
    setLangState(newLang);
    await Preferences.set({ key: 'lagfm_lang', value: newLang });
  };

  const t = useMemo(() => TRANSLATIONS[lang] || TRANSLATIONS.en, [lang]);

  useEffect(() => {
    if (currentTrack.id === -1) {
      setCurrentTrack(prev => ({
        ...prev,
        title: t.starting_route,
        artist: t.app_station
      }));
    }
  }, [lang, t]);

  const radio = useAudioPlayer(currentTrack, setCurrentTrack, lang);

  return (
    <AudioContext.Provider value={{ 
  ...radio,
      onAir: radio.onAir,
      signal: radio.signal,
      currentTrack, 
      setCurrentTrack,
      favorites: radio.favorites,
      toggleFavorite: radio.toggleFavorite,
      personalStreams: radio.personalStreams,
      addPersonalStream: radio.addPersonalStream,
      removePersonalStream: radio.removePersonalStream,
      backupPersonalStreams: radio.backupPersonalStreams,
      restorePersonalStreams: radio.restorePersonalStreams,
      lang,
      setLang,
      t,
      NORMAL_PLAYLIST,
      JOKER_TRACK,
      JINGLES
    }}>
      {children}
    </AudioContext.Provider>
  );
}

export function useAudio() {
  const context = useContext(AudioContext);
  if (!context) throw new Error('useAudio must be used within an AudioProvider');
  return context;
}
