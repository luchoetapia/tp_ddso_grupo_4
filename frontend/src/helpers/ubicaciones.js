// Mismos valores que UBICACIONES_PREDEFINIDAS en la API (models/colectivo.js).
// Además de estas, la ubicación puede ser una ciudad o barrio en texto libre.
export const PROVINCIAS = [
    "Buenos Aires", "Catamarca", "Chaco", "Chubut", "Córdoba", "Corrientes", "Entre Ríos", "Formosa",
    "Jujuy", "La Pampa", "La Rioja", "Mendoza", "Misiones", "Neuquén", "Río Negro", "Salta", "San Juan",
    "San Luis", "Santa Cruz", "Santa Fe", "Santiago del Estero", "Tierra del Fuego", "Tucumán",
];

export const UBICACIONES_PREDEFINIDAS = ["Argentina", "CABA", ...PROVINCIAS];

export const esUbicacionPredefinida = (ubicacion) => UBICACIONES_PREDEFINIDAS.includes(ubicacion);
