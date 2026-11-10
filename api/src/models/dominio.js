const { obtenerEstrategia } = require('./Proyecto/EsrtategiaAceptacion/index.js');
const { ConflictError } = require('../errors/AppError.js');

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

class Habilidad {
    constructor(id, titulo, tipoHabilidad, descripcion) {
        this.id = id
        this.titulo = titulo
        this.tipoHabilidad = tipoHabilidad
        this.descripcion = descripcion
    }
}

class Colaborador {
    constructor(nombre, apellido, nombreFantasia, cuentaGit, habilidades, pronombres, presentacion, deseaSerContactado, contactos) {
        this.nombre = nombre
        this.apellido = apellido
        this.nombreFantasia = nombreFantasia
        this.cuentaGit = cuentaGit
        this.habilidades = habilidades
        this.pronombres = pronombres
        this.presentacion = presentacion
        this.deseaSerContactado = deseaSerContactado
        this.contactos = contactos
    }
}



class Colaboracion {
    constructor(colaborador, proyecto, esAnonima = false, inicio, fin = null, perfil = null) {
        this.colaborador = colaborador;
        this.proyecto = proyecto;
        this.esAnonima = esAnonima;
        this.inicio = inicio;
        this.fin = fin || null;
        this.perfil = perfil;
    }
}

// class ModalidadColaboracion {
//     constructor(incentivoEconomico, posibleContractacion) {
//         this.incentivoEconomico = incentivoEconomico
//         this.posibleContractacion = posibleContractacion
//     } 
// }

// const Periodo = {
//     SEMANAL: 'semanal',
//     MENSUAL: 'mensual',
//     TOTAL: 'total'
// }

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
    Colectivo, Habilidad, Colaborador, Colaboracion,
    ModalidadColaboracion, Periodo, TipoColectivo, TipoHabilidad
}