const EstrategiaAceptacion = require('../EstrategiaAceptacion.js');

class RevisionManual extends EstrategiaAceptacion {
    constructor(proyecto = null) {
        super("RevisionManual", proyecto);
    }

    evaluarPostulacion(postulacion) {
        // En revisión manual no se realizan aceptaciones ni rechazos automáticos
        return postulacion;
    }

    aplicableAProyecto(proyecto) {
        return true;
    }
}

module.exports = RevisionManual;
