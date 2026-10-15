const estrategiaAceptacionInterfaz = require('../EstrategiaAceptacion.js');
const {BadRequestError} = require("../../../../errors/AppError.js");

class TodoSuma extends estrategiaAceptacionInterfaz {
    constructor(proyecto) {
        super("TodoSuma", proyecto)
    }

    evaluarColaborador(colaborador) {
        if(this.proyecto.limiteColaboradores != null) {
            throw BadRequestError(`${this.nombre} requiere que el proyecto no tenga limite, pero el proyecto tiene limite ${this. proyecto.limiteColaboradores}.` )
        }
        return true;
    }
}

module.exports = TodoSuma;