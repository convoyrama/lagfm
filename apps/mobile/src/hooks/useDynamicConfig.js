import { useState, useEffect } from 'react';
import { CapacitorHttp } from '@capacitor/core';

export function useDynamicConfig() {
  const [dynamicStreams, setDynamicStreams] = useState([]);
  const [loadingStreams, setLoadingStreams] = useState(true);
  const [eventsConfig, setEventsConfig] = useState(null);

  useEffect(() => {
    const fetchCloudData = async () => {
      setLoadingStreams(true);
      try {
        const baseUrl = import.meta.env.VITE_DATA_URL;
        const sRes = await CapacitorHttp.get({ url: `${baseUrl}/streams.json` });
        if (sRes.status === 200 && Array.isArray(sRes.data)) setDynamicStreams(sRes.data);
        
        const eRes = await CapacitorHttp.get({ url: `${baseUrl}/events_config.json` });
        if (eRes.status === 200) setEventsConfig(eRes.data);
      } catch (e) { 
        console.error("[CONFIG] Cloud data fail:", e); 
      } finally { 
        setLoadingStreams(false); 
      }
    };
    fetchCloudData();
  }, []);

  return { dynamicStreams, loadingStreams, eventsConfig };
}
