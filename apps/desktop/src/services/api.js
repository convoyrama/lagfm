const TRUCKERSMP_API_URL = 'https://api.truckersmp.com/v2/events';
const rawUrl = import.meta.env.VITE_DATA_URL;
const DATA_BASE_URL = (rawUrl && rawUrl !== 'undefined' && rawUrl !== '') ? rawUrl : 'https://convoyrama.github.io/lagfm';
const STREAMS_JSON_URL = `${DATA_BASE_URL}/streams.json`;

/**
 * Fetches events from the TruckersMP API.
 * @returns {Promise<Array<Object>>} A promise that resolves to an array of event objects.
 */
export const fetchTruckersMPEvents = async () => {
  try {
    console.log(`[NET] Fetching events: ${TRUCKERSMP_API_URL}`);
    const response = await fetch(TRUCKERSMP_API_URL);

    if (response.ok) {
      const data = await response.json();
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
    throw err; 
  }
};

/**
 * Fetches the list of dynamic streams from a JSON file.
 * @returns {Promise<Array<Object>>} A promise that resolves to an array of stream objects.
 */
export const fetchDynamicStreams = async () => {
  try {
    console.log(`[NET] Fetching streams: ${STREAMS_JSON_URL}`);
    const response = await fetch(STREAMS_JSON_URL);

    if (response.ok) {
      const data = await response.json();
      if (data && Array.isArray(data)) return data;
      else throw new Error('Dynamic streams data is not an array or is empty.');
    } else {
      throw new Error(`Failed to fetch dynamic streams: Status ${response.status}`);
    }
  } catch (err) {
    console.error("[CONFIG] Dynamic streams fetch failed:", err);
    throw err;
  }
};
