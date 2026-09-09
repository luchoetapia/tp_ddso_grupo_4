class Colectivo {
    constructor(id, nombre, descripcion, ubicacion, tipo, proyectos) {
        this.id = id
        this.nombre = nombre
        this.descripcion = descripcion
        this.ubicacion = ubicacion
        this.tipo = tipo
        this.proyectos = proyectos
    }
}

class Proyecto {
    constructor(id, titulo, descripcion, habilidades, tipoCompromiso, modalidadColaboracion, finalizado = false) {
        this.id = id
        this.titulo = titulo
        this.descripcion = descripcion
        this.habilidades = habilidades
        this.tipoCompromiso = tipoCompromiso
        this.modalidadColaboracion = modalidadColaboracion
        this.finalizado = finalizado
    }
}

class TipoCompromiso {
    constructor(cantHoras, periodo) {
        this.cantHoras = cantHoras
        this.periodo = periodo
    }
}

class Habilidad {
    constructor(id, titulo, tipoHabilidad, descripcion) {
        this.id = id
        this.titulo = titulo
        this.tipoHabilidad = tipoHabilidad
        this.descripcion = descripcion
    }
}

class Colaborador {
    constructor(id, nombre, apellido, nombreFantasia, cuentaGit, habilidades, pronombres, presentacion) {
        this.id = id;
        this.nombre = nombre
        this.apellido = apellido
        this.nombreFantasia = nombreFantasia
        this.cuentaGit = cuentaGit
        this.habilidades = habilidades
        this.pronombres = pronombres
        this.presentacion = presentacion
    }
}

class Colaboracion {
    constructor(colaborador, proyecto) {
        this.colaborador = colaborador
        this.proyecto = proyecto
    }
}

class ModalidadColaboracion {
    constructor(incentivoEconomico, posibleContractacion) {
        this.incentivoEconomico = incentivoEconomico
        this.posibleContractacion = posibleContractacion
    } 
}

const Periodo = {
    SEMANAL: 'semanal',
    MENSUAL: 'mensual',
    TOTAL: 'total'
}

const TipoColectivo = {
    FUNDACION: 'fundacion',
    ASOCIACION_BARRIAL: 'asociacion_barrial',
    ONG: 'ong',
    ASAMBLEA: 'asamblea',
}

const TipoHabilidad = {
    PROGRAMACION: 'programacion',
    DISEÑO: 'diseño',
    MARKETING: 'marketing',
    COMUNICACION: 'comunicacion',
    GESTION_PROYECTOS: 'gestion_proyectos',
    COLABORACION: 'colaboracion',
}

module.exports = {
    Colectivo, Proyecto, TipoCompromiso, Habilidad, Colaborador, Colaboracion,
    ModalidadColaboracion, Periodo, TipoColectivo, TipoHabilidad
}