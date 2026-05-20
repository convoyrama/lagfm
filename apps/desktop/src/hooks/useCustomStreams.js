import { useState, useEffect, useCallback } from 'react';
import { load } from "@tauri-apps/plugin-store";

export function useCustomStreams() {
  const [customStreams, setCustomStreams] = useState([]);
  const [db, setDb] = useState(null);

  useEffect(() => {
    const boot = async () => {
      try {
        const s = await load("settings.json", { autoSave: true });
        setDb(s);
        
        let saved = await s.get("custom_streams");
        
        if (!saved) {
          const local = localStorage.getItem('lagfm_custom_streams');
          if (local) {
            console.log("[STREAMS] Migrating local stations...");
            saved = JSON.parse(local);
            await s.set("custom_streams", saved);
          }
        }

        if (saved) {
          setCustomStreams(Array.isArray(saved) ? saved : []);
          console.log(`[STREAMS] Radio list synced: ${saved.length} stations.`);
        }
      } catch (e) {
        console.error(`[STREAMS] Boot fail: ${e.message}`);
      }
    };
    boot();
  }, []);

  const addCustomStream = useCallback((name, url) => {
    if (!url || !db) return;
    const radio = {
      id: `custom_${Date.now()}`,
      title: name || 'PERSONAL RADIO',
      src: url,
      artist: 'EXTERNAL LINK',
      lyrics: 'Spinning from: ' + url
    };
    
    setCustomStreams(prev => {
      const next = [...prev, radio];
      db.set("custom_streams", next).catch(e => console.error(`[STREAMS] Save fail: ${e.message}`));
      return next;
    });

    console.log(`[STREAMS] Station added: ${radio.title}`);
    return radio;
  }, [db]);

  const removeCustomStream = useCallback((id) => {
    if (!db) return;
    setCustomStreams(prev => {
      const next = prev.filter(s => s.id !== id);
      db.set("custom_streams", next).catch(e => console.error(`[STREAMS] Removal fail: ${e.message}`));
      return next;
    });
    console.log(`[STREAMS] Radio ID removed: ${id}`);
  }, [db]);

  return { customStreams, addCustomStream, removeCustomStream, setCustomStreams };
}
