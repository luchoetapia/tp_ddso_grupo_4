const estrategiaAceptacionInterfaz = require('../EstrategiaAceptacion.js');
const colaboracionService = require('../../../../services/colaboracionService.js');
const EstadoPostulacion = require('../../Postulaciones/EstadoPostulacion.js');

class RevisionManual extends estrategiaAceptacionInterfaz {
    constructor(proyecto) {
        super("HastaLlenarVacantes", proyecto)
    }

    evaluarPostulacion(postulacion) {
        //TODO
    }

    aplicableAProyecto(proyecto) {
        if(!this.proyecto.limiteColaboradores == 0 && !this.proyecto.limiteColaboradores == null) {
            return ;
        }

        return true;
    }
}

module.exports = HastaLlenarVacantes;