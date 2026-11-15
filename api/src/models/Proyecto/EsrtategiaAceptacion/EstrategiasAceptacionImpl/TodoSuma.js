const EstrategiaAceptacion = require('../EstrategiaAceptacion.js');
const EstadoPostulacion = require('../../Postulaciones/EstadoPostulacion.js');

class TodoSuma extends EstrategiaAceptacion {
    constructor(proyecto = null) {
        super("TodoSuma", proyecto);
    }

    evaluarPostulacion(postulacion) {
        postulacion.estado = EstadoPostulacion.ACEPTADA;
        return postulacion;
    }

    aplicableAProyecto(proyecto) {
        const p = proyecto ?? this.proyecto;
        if (!p) return true;
        if (typeof p.tieneLimite === 'function') {
            return !p.tieneLimite();
        }
        if (!p.perfiles || p.perfiles.length === 0) return true;
        return p.perfiles.every(perfil => perfil.limiteColaboraciones == null);
    }
}

module.exports = TodoSuma;
