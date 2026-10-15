const estrategiaAceptacionInterfaz = require('../EstrategiaAceptacion.js');
const {BadRequestError} = require("../../../../errors/AppError.js");

class HastaLlenarVacantes extends estrategiaAceptacionInterfaz {
    constructor(proyecto) {
        super("HastaLlenarVacantes", proyecto)
    }

    evaluarColaborador(colaborador) {
        const cantidadColaboradores = 0; //TODO: Solicitar la cantidad de colaboradores a ColaboracionService.
        if(cantidadColaboradores < this.proyecto.limite - 1) {
            throw BadRequestError(`${this.nombre} requiere que el proyecto no tenga limite, pero el proyecto tiene limite ${this.limite}.` )
        }
        return true;
    }
}

module.exports = HastaLlenarVacantes;