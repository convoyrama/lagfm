import { useState, useRef, useEffect, useCallback } from 'react';
import { NORMAL_PLAYLIST, JOKER_TRACK, JINGLES } from '../data/internalTracks';
import { invoke } from "@tauri-apps/api/core";

const log = (msg) => {
  console.log(`[AUDIO] ${msg}`);
};

export function useAudioPlayer(currentTrack, setCurrentTrack, translations = {}) {
  const [onAir, setOnAir] = useState(false);
  const [signal, setSignal] = useState('online');
  const [volume, setVolume] = useState(0.7);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  
  const radioRef = useRef(new Audio());
  const trayRef = useRef([]);
  const retryCount = useRef(0);
  const syncTimeout = useRef(null);
  const isInitialMount = useRef(true);
  const forcedLocal = useRef(false);
  const MAX_RETRIES = 5;

  const stateRef = useRef({ onAir, currentTrack, setCurrentTrack, translations });
  useEffect(() => {
    stateRef.current = { onAir, currentTrack, setCurrentTrack, translations };
  }, [onAir, currentTrack, setCurrentTrack, translations]);

  const isExt = useCallback((id) => {
    if (typeof id === 'string') {
        return id.startsWith('ext_') || id.startsWith('dyn_') || id.startsWith('custom_');
    }
    return id >= 100 && id < 999;
  }, []);

  const updateLink = useCallback((status) => {
    if (forcedLocal.current) {
        setSignal('fallback_active');
        return;
    }
    setSignal(prev => {
        if (isExt(stateRef.current.currentTrack.id)) return status;
        return 'online';
    });
  }, [isExt]);

  const shuffle = (array) => {
    const newArr = [...array];
    for (let i = newArr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
    }
    return newArr;
  };

  const popNext = useCallback((excludeId = -1) => {
    if (trayRef.current.length === 0) {
      if (NORMAL_PLAYLIST.length === 0) return { id: -1, title: 'No Signal', src: '' };
      trayRef.current = shuffle(NORMAL_PLAYLIST);
    }
    if (trayRef.current[0].id === excludeId && trayRef.current.length > 1) {
      const first = trayRef.current.shift();
      trayRef.current.push(first);
    }
    return trayRef.current.shift();
  }, []);

  const playedCount = useRef(0);
  const jingleLimit = useRef(Math.floor(Math.random() * 2) + 3);

  const spin = useCallback((forceInternal = false) => {
    const { currentTrack, translations } = stateRef.current;
    if (!forceInternal && isExt(currentTrack.id)) return currentTrack; 

    const currentLang = translations?.lang || 'en';
    const langJingles = JINGLES[currentLang] || JINGLES.en || [];

    if (playedCount.current >= jingleLimit.current && langJingles.length > 0) {
      playedCount.current = 0;
      jingleLimit.current = Math.floor(Math.random() * 2) + 3;
      return langJingles[Math.floor(Math.random() * langJingles.length)];
    }

    const isInternalNum = typeof currentTrack.id === 'number' && currentTrack.id < 1000;
    const isLocalStr = typeof currentTrack.id === 'string' && (currentTrack.id.startsWith('local_') || currentTrack.id === 'local_playlist');

    if (isInternalNum || isLocalStr) playedCount.current += 1;
    if (Math.random() < 0.02 && JOKER_TRACK.src) return JOKER_TRACK;
    return popNext(currentTrack.id);
  }, [isExt, popNext]);

  const applySource = useCallback(async (src, isLocal) => {
    const audio = radioRef.current;
    
    // Feedback inmediato: Semáforo en amarillo (Handshake)
    updateLink('handshake');
    
    audio.pause();
    audio.src = "";
    audio.load();
    
    if (isLocal) {
        audio.removeAttribute('crossOrigin');
        try {
            const response = await fetch(`${window.location.origin}/${src}`);
            const blob = await response.blob();
            const dataUrl = await new Promise((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result);
                reader.readAsDataURL(blob);
            });
            // Refuerzo MIME: Asegurar que WebKit sepa que es audio/mpeg
            audio.src = dataUrl.replace('data:application/octet-stream', 'data:audio/mpeg');
            
            if (!isInitialMount.current) {
                audio.play().catch(e => {
                  if (e.name !== 'AbortError') log(`[RADIO] Local playback failed: ${e.message}`);
                });
            }
        } catch (fetchErr) {
            log(`[RADIO] Local fetch failed: ${fetchErr.message}`);
            audio.src = `${window.location.origin}/${src}`;
        }
    } else {
        audio.crossOrigin = "anonymous";
        audio.src = src;
        if (!isInitialMount.current) {
            audio.play().catch(err => {
                if (err.name !== 'AbortError') log(`[RADIO] Remote Play Error: ${err.message}`);
            });
        }
    }
  }, [updateLink]);

  const retrySync = useCallback(() => {
    if (syncTimeout.current) clearTimeout(syncTimeout.current);
    if (retryCount.current < MAX_RETRIES) {
      retryCount.current += 1;
      updateLink('jitter');
      syncTimeout.current = setTimeout(() => {
        if (stateRef.current.onAir) {
          radioRef.current.load();
          radioRef.current.play().catch(e => log(`Sync failed: ${e.message}`));
        }
      }, 3000);
    } else {
      log("[RADIO] Dead link. Falling back to local library.");
      forcedLocal.current = true;
      updateLink('fallback_active');
      retryCount.current = 0;
      const nextInternal = spin(true);
      stateRef.current.setCurrentTrack(nextInternal);
    }
  }, [updateLink, spin]);

  useEffect(() => {
    const audio = radioRef.current;
    const onPlay = () => { setOnAir(true); retryCount.current = 0; };
    const onPause = () => { setOnAir(false); };
    const onPlaying = () => { setOnAir(true); updateLink('online'); };
    const onEnded = () => { if (!isExt(stateRef.current.currentTrack.id)) stateRef.current.setCurrentTrack(spin()); };
    const onError = () => { 
        const err = audio.error;
        log(`Radio Engine Error: Code ${err?.code}`);
        if (isExt(stateRef.current.currentTrack.id) && stateRef.current.onAir) retrySync();
        else updateLink('failed');
    };
    const onWaiting = () => updateLink('buffering');
    const onStalled = () => updateLink('jitter');
    const onCanPlay = () => updateLink('online');
    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onDurationChange = () => setDuration(audio.duration);

    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('playing', onPlaying);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('error', onError);
    audio.addEventListener('waiting', onWaiting);
    audio.addEventListener('stalled', onStalled);
    audio.addEventListener('canplay', onCanPlay);
    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('durationchange', onDurationChange);

    return () => {
      audio.pause();
      audio.src = "";
      audio.load();
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('playing', onPlaying);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('error', onError);
      audio.removeEventListener('waiting', onWaiting);
      audio.removeEventListener('stalled', onStalled);
      audio.removeEventListener('canplay', onCanPlay);
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('durationchange', onDurationChange);
    };
  }, [updateLink, isExt, spin, retrySync]);

  useEffect(() => {
    if ('mediaSession' in navigator && currentTrack.id !== -1) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: currentTrack.title, artist: 'LAGFM', album: 'LAGFM',
        artwork: [{ src: 'assets/logo.png', sizes: '512x512', type: 'image/png' }]
      });
    }
  }, [currentTrack]);

  useEffect(() => { radioRef.current.volume = volume * volume; }, [volume]);

  useEffect(() => {
    if (!currentTrack.src) return;
    if (currentTrack.src === 'local') {
      const firstTrack = spin(true);
      stateRef.current.setCurrentTrack(firstTrack);
      return;
    }

    const currentSrc = decodeURIComponent(radioRef.current.src || '');
    if (!currentSrc.endsWith(currentTrack.src)) {
      log(`Stream Switch: ${currentTrack.title}`);
      retryCount.current = 0;
      forcedLocal.current = false;
      if (syncTimeout.current) clearTimeout(syncTimeout.current);
      
      const isLocal = currentTrack.id.toString().startsWith('local_') || currentTrack.id.toString().startsWith('j_') || currentTrack.id === 999;
      applySource(currentTrack.src, isLocal);
      isInitialMount.current = false;
    }
  }, [currentTrack.src, applySource, spin]);

  const togglePlay = useCallback(() => {
    const audio = radioRef.current;
    if (!audio.src || audio.src === "" || stateRef.current.currentTrack.id === -1) return;
    if (audio.paused) audio.play().catch(e => log(`Play Failure: ${e.message}`));
    else audio.pause();
  }, []);

  return { onAir, signal, volume, setVolume, currentTime, duration, togglePlay, spin };
}
