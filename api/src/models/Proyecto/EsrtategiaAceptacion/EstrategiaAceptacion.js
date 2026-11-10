class EstrategiaAceptacion {
    constructor(nombre, proyecto = null) {
        this.nombre = nombre;
        this.proyecto = proyecto;
    }

    evaluarPostulacion(postulacion) {
        throw new Error("Método abstracto 'evaluarPostulacion' debe ser implementado");
    }

    aplicableAProyecto(proyecto) {
        throw new Error("Método abstracto 'aplicableAProyecto' debe ser implementado");
    }
}

module.exports = EstrategiaAceptacion;
