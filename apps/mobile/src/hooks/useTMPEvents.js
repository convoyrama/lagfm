import { useState } from 'react';
import { CapacitorHttp } from '@capacitor/core';

export function useTMPEvents(config, log) {
  const [tmpEvents, setTmpEvents] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(false);

  const fetchEvents = async () => {
    setLoadingEvents(true);
    // Sync con API de TruckersMP.
    if (log) log("[TMP] Syncing events...");
    try {
      const res = await CapacitorHttp.get({ url: 'https://api.truckersmp.com/v2/events' });
      
      if (res.status === 200 && res.data?.response) {
        const raw = res.data.response;
        let pool = [];
        const cats = config?.categories || ['today', 'now', 'featured'];
        
        // Filtro por categorias habilitadas.
        Object.keys(raw).forEach(k => {
          if (cats.includes(k) && Array.isArray(raw[k])) pool = [...pool, ...raw[k]];
        });
        
        // Rango de dias para el lookahead.
        const days = config?.filters?.max_days_lookahead || 1;
        const dates = [];
        for (let i = 0; i < days; i++) {
          const d = new Date();
          d.setDate(d.getDate() + i);
          dates.push(d.toISOString().split('T')[0]);
          dates.push(d.toLocaleDateString('en-CA'));
        }

        const filtered = pool.filter(ev => {
          // Filtrado estricto: fecha, oficiales y concurrencia.
          if (!ev?.start_at) return false;
          if (!dates.some(d => ev.start_at.startsWith(d))) return false;
          if (config?.filters?.only_official && ev.event_type?.key !== 'official') return false;
          if (ev.attendees < (config?.filters?.min_attendees || 0)) return false;
          return true;
        });
        
        // Limpieza de duplicados por ID y sort cronologico.
        const unique = Array.from(new Map(filtered.map(e => [e.id, e])).values());
        unique.sort((a, b) => new Date(a.start_at + " UTC") - new Date(b.start_at + " UTC"));
        setTmpEvents(unique);
      }
    } catch (e) { 
      if (log) log(`[TMP] Fetch Fail: ${e.message}`); 
    } finally { 
      setLoadingEvents(false); 
    }
  };

  return { tmpEvents, loadingEvents, fetchEvents };
}
