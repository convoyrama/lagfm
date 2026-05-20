export const formatDistance = (meters, lang) => {
  const isMetric = lang !== 'en';
  const factor = 0.621371;
  const distKm = meters / 1000;
  const value = isMetric ? distKm : distKm * factor;
  const unit = isMetric ? 'KM' : 'MI';
  return {
    value: value.toFixed(1),
    unit,
    full: `${value.toFixed(1)} ${unit}`
  };
};

export const getWelcomeLyrics = (meters, lang, t) => {
  const dist = formatDistance(meters, lang);
  const isSpanish = lang === 'es';
  const isPortuguese = lang === 'pt';
  
  if (isSpanish) {
    return `BIENVENIDO A LAGFM

Tu compañera de ruta incansable. Sintoniza la mejor selección para el asfalto virtual, relájate en la cabina y deja que el ritmo te guíe hacia tu próximo destino.

🛣️ RUTA MUSICAL RECORRIDA:
${dist.full}

¡BUEN VIAJE, CAMIONERO!`;
  }

  if (isPortuguese) {
    return `BEM-VINDO À LAGFM

Sua parceira de estrada incansável. Sintonize a melhor seleção para o asfalto virtual, relaxe na cabine e deixe o ritmo guiá-lo até seu próximo destino.

🛣️ ROTA MUSICAL PERCORRIDA:
${dist.full}

BOA VIAGEM, CAMINHONEIRO!`;
  }

  return `WELCOME TO LAGFM

Your tireless road companion. Tune into the best selection for the virtual asphalt, relax in the cabin, and let the rhythm guide you to your next destination.

🛣️ MUSICAL ROUTE TRAVELED:
${dist.full}

HAVE A GOOD TRIP, TRUCKER!`;
};

export const getDriverRankKey = (meters) => {
  const km = meters / 1000;
  if (km >= 300000) return "rank12";
  if (km >= 150000) return "rank11";
  if (km >= 75000) return "rank10";
  if (km >= 40000) return "rank9";
  if (km >= 20000) return "rank8";
  if (km >= 10000) return "rank7";
  if (km >= 6000) return "rank6";
  if (km >= 3000) return "rank5";
  if (km >= 1500) return "rank4";
  if (km >= 500) return "rank3";
  if (km >= 100) return "rank2";
  if (km >= 10) return "rank1";
  return "rank0";
};

export const getDriverRank = (meters) => {
  const km = meters / 1000;
  if (km >= 300000) return "Maestro del Universo Desconocido";
  if (km >= 150000) return "Arquitecto de Realidades";
  if (km >= 75000) return "Navegante Interdimensional";
  if (km >= 40000) return "Piloto Estelar";
  if (km >= 20000) return "Leyenda de la Carretera";
  if (km >= 10000) return "Maestro del Volante";
  if (km >= 6000) return "Veterano del Camino";
  if (km >= 3000) return "Viajero Consolidado";
  if (km >= 1500) return "Camionero Senior";
  if (km >= 500) return "Explorador de Rutas";
  if (km >= 100) return "Conductor en Formación";
  if (km >= 10) return "Novato del Asfalto";
  return "Chofer";
};
