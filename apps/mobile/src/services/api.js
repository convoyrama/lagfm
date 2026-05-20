import { CapacitorHttp } from '@capacitor/core';

const TRUCKERSMP_API_URL = 'https://api.truckersmp.com/v2/events';
const STREAMS_JSON_URL = `${import.meta.env.VITE_DATA_URL}/streams.json`;

/**
 * Fetches events from the TruckersMP API.
 * @returns {Promise<Array<Object>>} A promise that resolves to an array of event objects.
 */
export const fetchTruckersMPEvents = async () => {
  try {
    const response = await CapacitorHttp.get({
      url: TRUCKERSMP_API_URL,
      connectTimeout: 10000,
      readTimeout: 10000
    });

    if (response.status === 200) {
      const data = response.data;
      if (data && !data.error && data.response) {
        const res = data.response;
        const allRaw = [...(res.featured || []), ...(res.now || []), ...(res.today || [])];

        const uniqueMap = new Map();
        allRaw.forEach(item => {
          if (!uniqueMap.has(item.id)) {
            uniqueMap.set(item.id, {
              id: item.id,
              name: item.name,
              start_at: item.start_at,
              departure_city: item.departure?.city || item.departure_city || 'Desconocido'
            });
          }
        });
        return Array.from(uniqueMap.values());
      } else {
        throw new Error('API response error or empty data for TruckersMP events.');
      }
    } else {
      throw new Error(`Failed to fetch TruckersMP events: Status ${response.status}`);
    }
  } catch (err) {
    console.error("[TMP] Events API fetch failed:", err);
    throw err; // Re-throw the error to be caught by the calling hook
  }
};

/**
 * Fetches the list of dynamic streams from a JSON file.
 * @returns {Promise<Array<Object>>} A promise that resolves to an array of stream objects.
 */
export const fetchDynamicStreams = async () => {
  try {
    const response = await CapacitorHttp.get({
      url: STREAMS_JSON_URL,
      connectTimeout: 10000,
      readTimeout: 10000
    });

    if (response.status === 200) {
      const data = response.data;
      if (data && Array.isArray(data)) return data;
      else throw new Error('Dynamic streams data is not an array or is empty.');
    } else {
      throw new Error(`Failed to fetch dynamic streams: Status ${response.status}`);
    }
  } catch (err) {
    console.error("[CONFIG] Dynamic streams fetch failed:", err);
    throw err; // Re-throw the error to be caught by the calling hook
  }
};
