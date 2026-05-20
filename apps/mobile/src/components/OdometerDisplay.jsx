import React from 'react';
import { useOdometerContext } from '../contexts/OdometerContext';
import { getDriverRankKey, formatDistance } from '../utils/formatters';
import { useAudio } from '../contexts/AudioContext';

export default function OdometerDisplay({ title, welcome }) {
  const { totalMeters } = useOdometerContext();
  const { lang, t } = useAudio();
  
  const dist = formatDistance(totalMeters, lang);
  const rankKey = getDriverRankKey(totalMeters);
  const rankName = t.ranks?.[rankKey] || rankKey.toUpperCase();

  return (
    <div className="odometer-panel">
      <h3 className="odometer-title">{title || 'REGISTRO DE RUTA'}</h3>
      <div className="odometer-display">
        <span>{dist.value}</span>
        <span className="km-unit">{dist.unit}</span>
      </div>
      <div className="driver-rank">
        <span className="rank-name">{rankName}</span>
      </div>
      <p className="odometer-subtitle">{welcome || 'Registro automático basado en el tiempo de escucha.'}</p>
    </div>
  );
}
