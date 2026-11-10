const estrategiaAceptacionInterfaz = require('../EstrategiaAceptacion.js');
const EstadoPostulacion = require('../../Postulaciones/EstadoPostulacion.js');

class TodoSuma extends estrategiaAceptacionInterfaz {
    constructor(proyecto) {
        super("TodoSuma", proyecto)
    }

    evaluarColaborador(postulacion) {
        postulacion.estado = EstadoPostulacion.ACEPTADA;
    }

    aplicableAProyecto(proyecto) {
        if(!this.proyecto.limiteColaboradores == 0 && !this.proyecto.limiteColaboradores == null) {
            return ;
        }

        return true;
    }
}

module.exports = TodoSuma;