import { useState, useEffect } from 'react';
import { Network } from '@capacitor/network';

export function useTrafficLight(isPlaying, audioStatus) {
  const [isOnline, setIsOnline] = useState(true);
  const [status, setStatus] = useState('red');
  const [isBlinking, setIsBlinking] = useState(false);

  useEffect(() => {
    const checkNetwork = async () => {
      const status = await Network.getStatus();
      setIsOnline(status.connected);
    };
    checkNetwork();

    const handler = Network.addListener('networkStatusChange', status => {
      setIsOnline(status.connected);
    });

    return () => {
      handler.then(h => h.remove());
    };
  }, []);

  useEffect(() => {
    // Logica de semaforo de señal.
    if (!isOnline) {
      if (!isPlaying) {
        setStatus('red');
        setIsBlinking(true); // Sin musica ni red.
      } else {
        setStatus('yellow');
        setIsBlinking(true); // Microcortes detectados.
      }
    } else {
      if (!isPlaying) {
        setStatus('red');
        setIsBlinking(false); // Esperando play.
      } else if (audioStatus === 'online') {
        setStatus('green');
        setIsBlinking(false); // Señal OK.
      } else {
        setStatus('yellow');
        setIsBlinking(false); // Errores de buffer.
      }
    }
  }, [isPlaying, audioStatus, isOnline]);

  return { status, isBlinking };
}
