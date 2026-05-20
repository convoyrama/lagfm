import { useState, useEffect, useRef } from 'react';
import { Preferences } from '@capacitor/preferences';
import { App } from '@capacitor/app';

export function useOdometer(isPlaying, getWelcomeLyrics, setCurrentTrack, lang, t) {
  const [totalMeters, setTotalMeters] = useState(0);
  const accumulatedMetersRef = useRef(0);
  const lastSavedMetersRef = useRef(0);

  // Carga de estado persistido.
  useEffect(() => {
    const loadData = async () => {
      const { value } = await Preferences.get({ key: 'totalMeters' });
      if (value) {
        const m = parseInt(value, 10);
        if (!isNaN(m)) {
          setTotalMeters(m);
          lastSavedMetersRef.current = m;
          if (setCurrentTrack) {
             setCurrentTrack(prev => ({ ...prev, lyrics: getWelcomeLyrics(m, lang, t) }));
          }
        }
      }
    };
    loadData();
  }, [lang, t]); // Recargar si cambia el idioma para actualizar las lyrics de bienvenida

  // Persistencia en disco.
  const persistToDisk = async (meters) => {
    if (meters === lastSavedMetersRef.current) return;
    try {
      await Preferences.set({ key: 'totalMeters', value: meters.toString() });
      lastSavedMetersRef.current = meters;
      // console.log("Odometer persisted to disk:", meters);
    } catch (e) { console.error("[ODOMETER] Persistence fail:", e); }
  };

  // Logica de incremento y guardado periodico.
  useEffect(() => {
    if (!isPlaying) {
      persistToDisk(totalMeters);
      return;
    }

    const interval = setInterval(() => {
      const increment = 250; 
      setTotalMeters(prev => {
        const next = prev + increment;
        accumulatedMetersRef.current += increment;

        // Persisto cada 7.5km (5 min aprox).
        if (accumulatedMetersRef.current >= 7500) { 
          persistToDisk(next);
          accumulatedMetersRef.current = 0;
        }

        return next;
      });
    }, 10000);

    return () => clearInterval(interval);
  }, [isPlaying]);

  const totalMetersRef = useRef(totalMeters);
  useEffect(() => { totalMetersRef.current = totalMeters; }, [totalMeters]);

  // Resiliencia: guardado al pausar o cerrar la app.
  useEffect(() => {
    if (!App || !App.addListener) return;

    const setupListener = async () => {
      try {
        const listener = await App.addListener('appStateChange', ({ isActive }) => {
          if (!isActive) {
            persistToDisk(totalMetersRef.current);
          }
        });
        return listener;
      } catch (e) {
        console.warn("[ODOMETER] App listener setup failed:", e);
        return null;
      }
    };
    
    const listenerPromise = setupListener();
    return () => {
      listenerPromise.then(l => {
        if (l && l.remove) l.remove();
      });
    };
  }, []);

  return { totalMeters };
}
