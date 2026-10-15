const estrategiaAceptacionInterfaz = require('../EstrategiaAceptacion.js');
const {BadRequestError} = require("../../../../errors/AppError.js");
const colaboracionService = require('../../../../services/colaboracionService.js');

class HastaLlenarVacantes extends estrategiaAceptacionInterfaz {
    constructor(proyecto) {
        super("HastaLlenarVacantes", proyecto)
    }

    evaluarColaborador(colaborador) {
        const colaboraciones = colaboracionService.obtenerPorProyectoId(this.proyecto.id);
        const cantidadColaboradores = colaboraciones.length;
        if(cantidadColaboradores >= this.proyecto.limite) {
            return false;
        }
        return true;
    }
}

module.exports = HastaLlenarVacantes;