const { BadRequestError } = require('../errors/AppError.js');

// Arma el objeto sort de Mongo a partir de la clave de orden que elige el front.
// Cada service declara su configuración:
//   campos:      clave pública (la que manda el front) → campo real del documento
//   campoNombre: título/nombre de la entidad, segundo criterio (siempre alfabético)
//   porDefecto:  orden y dirección cuando el front no manda nada
// El _id va siempre último para que el orden sea estable entre páginas.
const construirOrden = ({ campos, campoNombre = null, porDefecto }, { orden, direccion } = {}) => {
    const clave = orden ?? porDefecto.orden;
    if (!Object.hasOwn(campos, clave)) {
        throw new BadRequestError(`No se puede ordenar por '${clave}'`, { opciones: Object.keys(campos) });
    }

    // Si el front elige el orden pero no la dirección, va ascendente; sin nada, la del orden por defecto
    const sentido = (direccion ?? (orden ? 'asc' : porDefecto.direccion)) === 'desc' ? -1 : 1;

    const sort = { [campos[clave]]: sentido };
    if (campoNombre && !(campoNombre in sort)) sort[campoNombre] = 1;
    if (!('_id' in sort)) sort._id = 1;
    return sort;
};

module.exports = { construirOrden };
