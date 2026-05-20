import { useState, useEffect, useMemo, useCallback } from 'react';
import { invoke } from "@tauri-apps/api/core";
import { save, open } from "@tauri-apps/plugin-dialog";
import { writeTextFile, readTextFile } from "@tauri-apps/plugin-fs";
import { TRANSLATIONS } from './data/translations';
import { EXTERNAL_STREAMS } from './data/externalStreams';
import { useAudioPlayer } from './hooks/useAudioPlayer';
import { useDynamicStreams } from './hooks/useDynamicStreams';
import { useFavorites } from './hooks/useFavorites';
import { useCustomStreams } from './hooks/useCustomStreams';

import StatusHeader from './components/StatusHeader';
import TrackInfo from './components/TrackInfo';
import VolumeDial from './components/VolumeDial';
import RadioPanels from './components/RadioPanels';
import AppFooter from './components/AppFooter';

import './App.css';

const log = (msg) => {
  console.log(`[FRONTEND] ${msg}`);
};

const DEFAULT_TRACK = { 
  id: -1, 
  title: 'LAGFM', 
  artist: 'SIGNAL READY', 
  src: '', 
  lyrics: 'Welcome to LAGFM Desktop.' 
};

function App() {
  const [lang, setLang] = useState('es');
  const t = TRANSLATIONS[lang] || TRANSLATIONS.es;
  
  const [currentTrack, setCurrentTrack] = useState(DEFAULT_TRACK);
  const [panel, setPanel] = useState('list');
  const [customUrl, setCustomUrl] = useState('');
  const [customName, setCustomName] = useState('');
  const [showVolume, setShowVolume] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  const APP_VERSION = "6.0.1";
  
  const { favorites, toggleFavorite, isFavorite, setFavorites } = useFavorites();
  const { customStreams, addCustomStream, removeCustomStream, setCustomStreams } = useCustomStreams();
  
  const { 
    onAir, signal, volume, setVolume, togglePlay 
  } = useAudioPlayer(currentTrack, setCurrentTrack, {
    lang,
    fallback_artist: t.fallback_artist,
    fallback_lyrics: t.fallback_lyrics,
    originals_artist: t.originals_artist,
    originals_lyrics: t.originals_lyrics
  });

  const backupData = useCallback(async () => {
    try {
      log("[BACKUP] Starting native process...");
      const backupObject = {
        version: APP_VERSION,
        customStreams,
        favorites,
        timestamp: new Date().toISOString()
      };
      
      const content = JSON.stringify(backupObject, null, 2);
      const filePath = await save({
        filters: [{ name: 'LAGFM Backup', extensions: ['json'] }],
        defaultPath: `LAGFM_BACKUP_${Date.now()}.json`
      });

      if (filePath) {
        await writeTextFile(filePath, content);
        log(`[BACKUP] Saved to: ${filePath}`);
        alert(t.backup_success || "Backup saved.");
      }
    } catch (err) {
      log(`[BACKUP] Error: ${err.message}`);
      alert("Save Error: " + err.message);
    }
  }, [customStreams, favorites, t.backup_success]);

  const restoreData = useCallback(async (manualContent = null) => {
    try {
      let jsonString = manualContent;

      if (!jsonString) {
        log("[RESTORE] Opening picker...");
        const selected = await open({
          multiple: false,
          filters: [{ name: 'LAGFM Backup', extensions: ['json'] }]
        });

        if (!selected) return;
        jsonString = await readTextFile(selected);
      }

      const data = JSON.parse(jsonString);
      log("Processing restore file...");

      let streamsToRestore = [];
      let favsToRestore = [];

      if (Array.isArray(data)) {
        streamsToRestore = data;
      } else if (data.customStreams) {
        streamsToRestore = data.customStreams;
        favsToRestore = data.favorites || [];
      } else {
        throw new Error("Invalid format");
      }

      const isValid = streamsToRestore.every(s => s.id && s.src && s.title);
      if (!isValid) throw new Error("Invalid station data");

      if (window.confirm(t.restore_confirm || "Restore data? This will overwrite your current list.")) {
        setCustomStreams(streamsToRestore);
        if (favsToRestore.length > 0) setFavorites(favsToRestore);
        log("Restore complete.");
        alert(t.restore_success || "Data restored successfully.");
      }
    } catch (e) {
      log(`Restore Error: ${e.message}`);
      alert("Error: Not a valid LAGFM backup.");
    }
  }, [setCustomStreams, setFavorites, t.restore_confirm, t.restore_success]);

  const { dynamicStreams, loadingStreams } = useDynamicStreams();

  useEffect(() => {
    // Sincronización de estado online con el navegador.
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const STREAMS_LIST = useMemo(() => {
    const list = [{ id: 'local_playlist', title: t.local_playlist, src: 'local', lyrics: t.tuning_local }];
    const dynIds = new Set(dynamicStreams.map(s => s.id));
    EXTERNAL_STREAMS.forEach(s => {
      if (!dynIds.has(s.id)) list.push({ ...s, id: `ext_${s.id}` });
    });
    dynamicStreams.forEach(s => list.push({ ...s, id: `dyn_${s.id}` }));
    customStreams.forEach(s => list.push(s));
    return list;
  }, [t.local_playlist, t.tuning_local, dynamicStreams, customStreams]);

  const SORTED_STREAMS = useMemo(() => {
    const list = [...STREAMS_LIST];
    return list.sort((a, b) => {
      if (a.id === 'local_playlist') return -1;
      if (b.id === 'local_playlist') return 1;
      const aFav = isFavorite(a.id);
      const bFav = isFavorite(b.id);
      if (aFav && !bFav) return -1;
      if (!aFav && bFav) return 1;
      return a.title.localeCompare(b.title);
    });
  }, [STREAMS_LIST, isFavorite]);

  useEffect(() => {
    if (currentTrack.id === -1 && STREAMS_LIST.length > 0) {
        const first = SORTED_STREAMS.find(s => s.id !== 'local_playlist') || SORTED_STREAMS[0];
        setCurrentTrack({
            ...first,
            artist: t.live_broadcast,
            lyrics: first.desc?.[lang] || first.desc?.es || t.info_description
        });
    }
  }, [STREAMS_LIST.length, favorites.length, lang, t, SORTED_STREAMS, currentTrack.id]);

  const selectStream = useCallback((stream) => {
    log(`Selecting stream: ${stream.title} (ID: ${stream.id})`);
    setCurrentTrack({
      ...stream,
      artist: t.live_broadcast,
      lyrics: stream.desc?.[lang] || stream.desc?.es || t.info_description
    });
  }, [lang, t]);

  const connectCustomStream = useCallback(() => {
    if (!customUrl) return;
    log(`Connecting preview stream: ${customUrl}`);
    setCurrentTrack({
      id: 'custom_preview',
      title: customName || 'PREVIEW',
      artist: 'EXTERNAL URL',
      src: customUrl,
      lyrics: 'Playing: ' + customUrl
    });
  }, [customUrl, customName]);

  const saveCustomStream = useCallback(() => {
    if (!customUrl) return;
    log(`Saving custom stream: ${customName} - ${customUrl}`);
    addCustomStream(customName, customUrl);
    setCustomName('');
    setCustomUrl('');
  }, [customName, customUrl, addCustomStream]);

  useEffect(() => {
    const userLang = navigator.language.split('-')[0];
    if (['es', 'pt', 'en'].includes(userLang)) setLang(userLang);
    log("LAGFM Desktop Mounted.");
  }, []);

  return (
    <div className="radio-container">
      <div className="scanline"></div>
      <StatusHeader signal={signal} onAir={onAir} isOnline={isOnline} t={t} />
      <div className="main-display">
        <TrackInfo currentTrack={currentTrack} signal={signal} t={t} />
        <VolumeDial volume={volume} setVolume={setVolume} onAir={onAir} togglePlay={togglePlay} showVolume={showVolume} setShowVolume={setShowVolume} />
        <RadioPanels 
          panel={panel} setPanel={setPanel} currentTrack={currentTrack} STREAMS_LIST={SORTED_STREAMS} 
          selectStream={selectStream} customUrl={customUrl} setCustomUrl={setCustomUrl} 
          customName={customName} setCustomName={setCustomName} 
          connectCustomStream={connectCustomStream} saveCustomStream={saveCustomStream} 
          customStreamsList={customStreams} removeCustomStream={removeCustomStream} 
          t={t} loadingStreams={loadingStreams} toggleFavorite={toggleFavorite} 
          isFavorite={isFavorite} backupData={backupData} restoreData={restoreData} 
        />
      </div>
      <div className="action-bar">
        <div className="action-buttons-container">
            <button onClick={() => setPanel('list')} className={`action-btn ${panel === 'list' ? 'active' : ''}`}>📡</button>
            <button onClick={() => setPanel('custom')} className={`action-btn ${panel === 'custom' ? 'active' : ''}`}>🔗</button>
        </div>
        <div className="lang-switcher-inline" style={{ display: 'flex', gap: '5px' }}>
            <button onClick={() => setLang('es')} className={lang === 'es' ? 'active' : ''} style={{ background: 'none', border: 'none', color: lang === 'es' ? 'var(--vtc-green)' : '#444', fontSize: '0.6rem', cursor: 'pointer' }}>ES</button>
            <button onClick={() => setLang('en')} className={lang === 'en' ? 'active' : ''} style={{ background: 'none', border: 'none', color: lang === 'en' ? 'var(--vtc-green)' : '#444', fontSize: '0.6rem', cursor: 'pointer' }}>EN</button>
            <button onClick={() => setLang('pt')} className={lang === 'pt' ? 'active' : ''} style={{ background: 'none', border: 'none', color: lang === 'pt' ? 'var(--vtc-green)' : '#444', fontSize: '0.6rem', cursor: 'pointer' }}>PT</button>
        </div>
      </div>
      <AppFooter t={t} version={APP_VERSION} />
    </div>
  );
}

export default App;
