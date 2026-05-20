import { useState, useEffect, useCallback } from 'react';
import { load } from "@tauri-apps/plugin-store";

export function useFavorites() {
  const [favorites, setFavorites] = useState([]);
  const [db, setDb] = useState(null);

  useEffect(() => {
    const boot = async () => {
      try {
        const s = await load("settings.json", { autoSave: true });
        setDb(s);
        
        let saved = await s.get("favorites");
        
        if (!saved) {
          const local = localStorage.getItem('lagfm_favorites');
          if (local) {
            console.log("[FAVS] Migrating from old local storage...");
            saved = JSON.parse(local);
            await s.set("favorites", saved);
          }
        }

        if (saved) {
          const clean = Array.isArray(saved) ? saved.map(id => id.toString()) : [];
          setFavorites(clean);
          console.log(`[FAVS] Sync complete: ${clean.length} tracks.`);
        }
      } catch (e) {
        console.error(`[FAVS] Boot Error: ${e.message}`);
      }
    };
    boot();
  }, []);

  const toggleFavorite = useCallback((id) => {
    if (!id || !db) return;
    
    const key = id.toString();
    setFavorites(prev => {
      const isFav = prev.includes(key);
      const next = isFav ? prev.filter(f => f !== key) : [...prev, key];

      db.set("favorites", next).catch(e => console.error(`[FAV] Save Fail: ${e.message}`));
      return next;
    });
  }, [db]);

  const isFavorite = useCallback((id) => {
    if (!id) return false;
    return favorites.includes(id.toString());
  }, [favorites]);

  return { favorites, toggleFavorite, isFavorite, setFavorites };
}
