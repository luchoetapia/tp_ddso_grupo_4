const EstadoPostulacion = require('./EstadoPostulacion.js');

class Postulacion {
    constructor(colaborador, proyecto, perfil, mensaje = "", estado = EstadoPostulacion.PENDIENTE, fecha = new Date()) {
        this.colaborador = colaborador;
        this.proyecto = proyecto;
        this.perfil = perfil;
        this.mensaje = mensaje;
        this.estado = estado;
        this.fecha = fecha;
    }
}

module.exports = Postulacion;