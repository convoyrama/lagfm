export const getDriverRank = (meters) => {
    if (meters < 1000) return "NOVATO";
    if (meters < 10000) return "CHOFER";
    return "LEYENDA";
};
