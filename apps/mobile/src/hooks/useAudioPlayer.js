import { useState, useRef, useEffect, useCallback } from 'react';
import { NORMAL_PLAYLIST, JOKER_TRACK, JINGLES } from '../data/internalTracks';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';

export function useAudioPlayer(currentTrack, setCurrentTrack, lang) {
  const [onAir, setOnAir] = useState(false);
  const [signal, setSignal] = useState('online');
  const [volume, setVolume] = useState(0.7);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [taping, setTaping] = useState(false);
  const [tapeReady, setTapeReady] = useState(true);
  const [favorites, setFavorites] = useState([]);
  const [personalStreams, setPersonalStreams] = useState([]);
  
  const radioRef = useRef(new Audio());
  const deckRef = useRef(null);
  const reelsRef = useRef([]);

  const retryCount = useRef(0);
  const MAX_RETRIES = 3;
  const syncTimeout = useRef(null);

  const shuffle = (array) => {
    const newArr = [...array];
    for (let i = newArr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
    }
    return newArr;
  };

  const trayRef = useRef([]);

  const popNext = useCallback((excludeId = -1) => {
    // Barajado de playlist.
    if (trayRef.current.length === 0) {
      trayRef.current = shuffle(NORMAL_PLAYLIST);
    }
    // Evitar duplicacion inmediata.
    if (trayRef.current[0].id === excludeId && trayRef.current.length > 1) {
      const first = trayRef.current.shift();
      trayRef.current.push(first);
    }
    return trayRef.current.shift();
  }, []);

  const playedCount = useRef(0);
  const jingleLimit = useRef(Math.floor(Math.random() * 3) + 3);

  const isExt = useCallback((id) => {
    // Identifica stream externo o personalizado.
    if (typeof id === 'string') {
        return id.startsWith('ext_') || id.startsWith('dyn_') || id.startsWith('custom_') || (typeof id === 'number' && id >= 100 && id < 999);
    }
    return id >= 100 && id < 999;
  }, []);

  const spin = useCallback((forceInternal = false) => {
    if (!forceInternal && isExt(currentTrack.id)) return currentTrack; 
    
    // Insercion de jingles.
    if (playedCount.current >= jingleLimit.current) {
      playedCount.current = 0;
      jingleLimit.current = Math.floor(Math.random() * 3) + 3;
      const langJingles = JINGLES[lang] || JINGLES.en;
      return langJingles[Math.floor(Math.random() * langJingles.length)];
    }
    
    const isLocalStr = typeof currentTrack.id === 'string' && currentTrack.id.startsWith('local_');
    const isInternalNum = typeof currentTrack.id === 'number' && currentTrack.id < 100;

    if (isLocalStr || isInternalNum) playedCount.current += 1;

    // 2% de probabilidad para track Joker.
    if (Math.random() < 0.02) return JOKER_TRACK;
    return popNext(currentTrack.id);
  }, [currentTrack.id, popNext, lang, isExt]);

  const dropToLocal = useCallback(() => {
    // Fallback a libreria local si falla el stream.
    console.warn("[RADIO] Link broken. Forcing local originals.");
    retryCount.current = 0;
    const next = spin(true);
    setCurrentTrack(next);
  }, [spin, setCurrentTrack]);

  const hotStart = useCallback(async () => {
    const audio = radioRef.current;
    if (!audio.src || audio.src === "") return;

    try {
      const playPromise = audio.play();
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error("SYNC_TIMEOUT")), 10000)
      );
      await Promise.race([playPromise, timeoutPromise]);
      retryCount.current = 0;
    } catch (err) {
      console.error("[RADIO] Sync Error:", err.message);
      if (isExt(currentTrack.id)) {
        if (err.name !== 'AbortError') retrySync();
      }
    }
  }, [currentTrack.id, isExt]);

  function retrySync() {
    if (retryCount.current < MAX_RETRIES) {
      retryCount.current += 1;
      const delay = retryCount.current * 3000;
      console.log(`[RADIO] Retrying sync (${retryCount.current}/${MAX_RETRIES}) in ${delay}ms...`);
      
      if (syncTimeout.current) clearTimeout(syncTimeout.current);
      syncTimeout.current = setTimeout(() => {
        const audio = radioRef.current;
        const oldSrc = audio.src;
        audio.src = "";
        audio.load();
        audio.src = oldSrc;
        hotStart();
      }, delay);
    } else {
      dropToLocal();
    }
  }

  useEffect(() => {
    const audio = radioRef.current;
    
    const onPlay = () => { 
      setOnAir(true); 
      if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'playing'; 
    };
    
    const onPause = () => { 
      setOnAir(false); 
      if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'paused'; 
    };

    const onPlaying = () => {
      setOnAir(true);
      setSignal('online');
    };

    const onEnded = () => { 
      if (!isExt(currentTrack.id)) {
        setCurrentTrack(spin()); 
      }
    };

    const updateLink = (status) => { 
      setSignal(prev => {
        if (isExt(currentTrack.id)) return status;
        return 'online';
      });
    };

    const onError = () => { 
      console.error("[RADIO] Stream Error."); 
      updateLink('failed'); 
      if (isExt(currentTrack.id)) retrySync(); 
    };

    const onStalled = () => {
      if (isExt(currentTrack.id)) {
        console.warn("[RADIO] Data stalled.");
        if (syncTimeout.current) clearTimeout(syncTimeout.current);
        syncTimeout.current = setTimeout(() => { 
          if (audio.paused || audio.readyState < 2) retrySync(); 
        }, 5000);
      }
    };

    const onWaiting = () => {
      if (isExt(currentTrack.id)) {
        updateLink('handshake');
      }
    };

    const onCanPlay = () => {
      if (isExt(currentTrack.id)) {
        updateLink('online');
        if (onAir) hotStart();
      }
    };

    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onLoadedMetadata = () => setDuration(audio.duration);
    const onLoadStart = () => updateLink('pinging');

    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('playing', onPlaying);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('loadstart', onLoadStart);
    audio.addEventListener('waiting', onWaiting);
    audio.addEventListener('stalled', onStalled);
    audio.addEventListener('canplay', onCanPlay);
    audio.addEventListener('error', onError);

    return () => {
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('playing', onPlaying);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('loadstart', onLoadStart);
      audio.removeEventListener('waiting', onWaiting);
      audio.removeEventListener('stalled', onStalled);
      audio.removeEventListener('canplay', onCanPlay);
      audio.removeEventListener('error', onError);
      if (syncTimeout.current) clearTimeout(syncTimeout.current);
    };
  }, [currentTrack.id, spin, setCurrentTrack, onAir, hotStart, isExt]);

  useEffect(() => {
    if ('mediaSession' in navigator && currentTrack.id !== -1) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: currentTrack.title, artist: currentTrack.artist || 'LAGFM', album: 'LAGFM',
        artwork: [{ src: 'assets/logo.png', sizes: '512x512', type: 'image/png' }]
      });
    }
  }, [currentTrack]);

  useEffect(() => { radioRef.current.volume = volume * volume; }, [volume]);

  useEffect(() => {
    const audio = radioRef.current;
    if (!currentTrack.src || currentTrack.src === 'local') { retryCount.current = 0; return; }
    retryCount.current = 0;
    if (syncTimeout.current) clearTimeout(syncTimeout.current);
    const isLocal = currentTrack.src.startsWith('music/') || currentTrack.src.startsWith('sounds/');
    const finalSrc = currentTrack.src;
    const currentSrc = decodeURIComponent(audio.src || '');
    if (!currentSrc.endsWith(currentTrack.src)) {
      audio.pause();
      if (isLocal) audio.removeAttribute('crossOrigin'); else audio.crossOrigin = "anonymous";
      audio.src = finalSrc;
      hotStart();
    }
  }, [currentTrack.src, hotStart]);

  const togglePlay = () => {
    const audio = radioRef.current;
    if (currentTrack.id === -1) {
      setCurrentTrack(spin(true));
      return;
    }
    if (!audio.src || audio.src === "" || currentTrack.src === 'local') return;
    if (audio.paused) hotStart(); else audio.pause();
  };

  const toggleRecording = () => { if (!taping) startRecording(); else stopRecording(); };

  const startRecording = () => {
    try {
      const audio = radioRef.current;
      if (!audio || !audio.src || audio.src === "") { alert("No hay audio para grabar."); return; }
      let stream = null;
      try { stream = audio.captureStream ? audio.captureStream() : (audio.mozCaptureStream ? audio.mozCaptureStream() : null); } catch (e) { alert("Esta emisora protege su señal (CORS)."); return; }
      if (!stream) { alert("Grabación no soportada."); return; }
      const recorder = new MediaRecorder(stream);
      deckRef.current = recorder;
      reelsRef.current = [];
      recorder.ondataavailable = (e) => { if (e.data.size > 0) reelsRef.current.push(e.data); };
      recorder.onstop = async () => {
        if (reelsRef.current.length === 0) return;
        const blob = new Blob(reelsRef.current, { type: 'audio/webm' });
        const fileName = `LAG_REC_${Date.now()}.webm`;
        if (Capacitor.isNativePlatform()) {
          const reader = new FileReader(); reader.readAsDataURL(blob);
          reader.onloadend = async () => {
            const base64 = reader.result.split(',')[1];
            try { await Filesystem.writeFile({ path: fileName, data: base64, directory: Directory.Documents }); alert(`GUARDADO: ${fileName}`); } catch (e) { alert("Error al guardar."); }
          };
        } else {
          const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = fileName; a.click();
        }
      };
      recorder.start();
      setTaping(true);
    } catch (e) { alert("Error al iniciar grabación."); setTaping(false); }
  };

  const stopRecording = () => { if (deckRef.current && deckRef.current.state !== 'inactive') { deckRef.current.stop(); setTaping(false); } };

  useEffect(() => {
    const loadFavs = async () => {
      try {
        const { value } = await Preferences.get({ key: 'lagfm_favs' });
        if (value) setFavorites(JSON.parse(value));
      } catch (e) { console.error("[STORAGE] Error loading favs:", e); }
    };
    loadFavs();
  }, []);

  const toggleFavorite = useCallback(async (id) => {
    setFavorites(prev => {
      const newFavs = prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id];
      Preferences.set({ key: 'lagfm_favs', value: JSON.stringify(newFavs) }).catch(console.error);
      return newFavs;
    });
  }, []);

  useEffect(() => {
    const loadPersonal = async () => {
      try {
        const { value } = await Preferences.get({ key: 'lagfm_personal' });
        if (value) setPersonalStreams(JSON.parse(value));
      } catch (e) { console.error("[STORAGE] Error loading personal streams:", e); }
    };
    loadPersonal();
  }, []);

  const addPersonalStream = useCallback(async (url, customTitle = "") => {
    if (!url) return;
    const { value } = await Preferences.get({ key: 'lagfm_personal' });
    const current = value ? JSON.parse(value) : [];
    const id = current.length > 0 ? Math.max(...current.map(s => s.id)) + 1 : 201;
    const title = customTitle.trim() || `Stream #${id - 200}`;
    const newEntry = { id, title, artist: 'PERSONAL', src: url.trim() };
    const newStreams = [...current, newEntry];
    await Preferences.set({ key: 'lagfm_personal', value: JSON.stringify(newStreams) });
    setPersonalStreams(newStreams);
  }, []);

  const removePersonalStream = useCallback(async (id) => {
    const { value } = await Preferences.get({ key: 'lagfm_personal' });
    if (!value) return;
    const newStreams = JSON.parse(value).filter(s => s.id !== id);
    await Preferences.set({ key: 'lagfm_personal', value: JSON.stringify(newStreams) });
    setPersonalStreams(newStreams);
    setFavorites(prev => {
      if (prev.includes(id)) {
        const filtered = prev.filter(f => f !== id);
        Preferences.set({ key: 'lagfm_favs', value: JSON.stringify(filtered) });
        return filtered;
      }
      return prev;
    });
  }, []);

  const backupPersonalStreams = useCallback(async () => {
    const data = JSON.stringify(personalStreams);
    if (Capacitor.isNativePlatform()) {
      const fileName = `LAGFM_BACKUP_${Date.now()}.json`;
      try {
        const reader = new FileReader();
        const blob = new Blob([data], { type: 'application/json' });
        reader.readAsDataURL(blob);
        reader.onloadend = async () => {
          try {
            const base64 = reader.result.split(',')[1];
            await Filesystem.writeFile({ path: fileName, data: base64, directory: Directory.Documents });
            alert(`BACKUP GUARDADO: ${fileName}`);
          } catch (e) { alert("Error al escribir archivo."); }
        };
      } catch (e) { alert("Error al procesar backup."); }
    } else {
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `LAGFM_BACKUP.json`;
      a.click();
    }
  }, [personalStreams]);

  const restorePersonalStreams = useCallback(async (jsonString) => {
    try {
      const data = JSON.parse(jsonString);
      if (Array.isArray(data)) {
        const isValid = data.every(s => s.id && s.src && s.title);
        if (!isValid) throw new Error("FORMATO_INVALIDO");
        await Preferences.set({ key: 'lagfm_personal', value: JSON.stringify(data) });
        setPersonalStreams(data);
        alert("Lista restaurada con éxito.");
      }
    } catch (e) { alert("Error: El archivo no es un backup válido de LAGFM"); }
  }, []);

  return {
    onAir, signal, volume, setVolume,
    currentTime, duration, togglePlay,
    taping, toggleRecording, tapeReady,
    spin, favorites, toggleFavorite,
    personalStreams, addPersonalStream, removePersonalStream,
    backupPersonalStreams, restorePersonalStreams
  };
}
