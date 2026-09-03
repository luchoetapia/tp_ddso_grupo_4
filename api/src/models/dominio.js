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
    constructor(id, titulo, descripcion, habilidades, tipoCompromiso, modalidadColaboracion) {
        this.id = id
        this.titulo = titulo
        this.descripcion = descripcion
        this.habilidades = habilidades
        this.tipoCompromiso = tipoCompromiso
        this.modalidadColaboracion = modalidadColaboracion
    }
}

class tipoCompromiso {
    constructor(cantHoras, periodo) {
        this.cantHoras = cantHoras
        this.periodo = periodo
    }
}

class Habilidad {
    constructor(id, titulo, descripcion) {
        this.id = id
        this.titulo = titulo
        this.descripcion = descripcion
    }
}

class Colaborador {
    constructor(nombre, apellido, nombreFantasia, git, habilidades, pronombres, presentacion) {
        this.nombre = nombre
        this.apellido = apellido
        this.nombreFantasia = nombreFantasia
        this.git = git
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

module.exports = {
    Colectivo, Proyecto, tipoCompromiso, Habilidad, Colaborador, Colaboracion,
    ModalidadColaboracion, Periodo, TipoColectivo
}