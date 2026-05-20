import { useState, useEffect } from 'react';
import { fetchDynamicStreams } from '../services/api';

export function useDynamicStreams(showToast) {
  const [dynamicStreams, setDynamicStreams] = useState([]);
  const [loadingStreams, setLoadingStreams] = useState(true);

  // Carga dinámica de emisoras
  useEffect(() => {
    const fetchStreams = async () => {
      setLoadingStreams(true);
      try {
        const streams = await fetchDynamicStreams();
        setDynamicStreams(streams);
      } catch (error) {
        if (showToast) showToast("Error al cargar emisoras: " + error.message, 'error');
        setDynamicStreams([]); // Clear streams on error
      } finally {
        setLoadingStreams(false);
      }
    };

    fetchStreams();
  }, []);

  return { dynamicStreams, loadingStreams };
}
