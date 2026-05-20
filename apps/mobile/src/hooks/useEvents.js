import { useState, useEffect } from 'react';
import { fetchTruckersMPEvents } from '../services/api';

export function useEvents(showToast) {
  const [tmpEvents, setTmpEvents] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(false);

  const fetchEvents = async () => {
    setLoadingEvents(true);
    try {
      const events = await fetchTruckersMPEvents();
      setTmpEvents(events);
    } catch (error) {
      if (showToast) showToast("Error al cargar eventos: " + error.message, 'error');
      setTmpEvents([]); // Clear events on error
    } finally {
      setLoadingEvents(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  return { tmpEvents, loadingEvents, fetchEvents };
}
