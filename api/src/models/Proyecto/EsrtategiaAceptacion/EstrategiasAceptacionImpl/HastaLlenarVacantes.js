const estrategiaAceptacionInterfaz = require('../EstrategiaAceptacion.js');
const colaboracionService = require('../../../../services/colaboracionService.js');
const EstadoPostulacion = require('../../Postulaciones/EstadoPostulacion.js');

class HastaLlenarVacantes extends estrategiaAceptacionInterfaz {
    constructor(proyecto) {
        super("HastaLlenarVacantes", proyecto)
    }

    evaluarPostulacion(postulacion) {
        //TODO Usar postulacion y Estado
        const colaboraciones = colaboracionService.obtenerPorProyectoId(this.proyecto.id);
        const cantidadColaboradores = colaboraciones.length;
        if(cantidadColaboradores >= this.proyecto.limite) {
            return false;
        }
        return;
    }

    aplicableAProyecto(proyecto) {
        if(!this.proyecto.limiteColaboradores == 0 && !this.proyecto.limiteColaboradores == null) {
            return ;
        }

        return true;
    }
}

module.exports = HastaLlenarVacantes;