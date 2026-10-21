class Proyecto {
    constructor(id, titulo, descripcion, perfiles, finalizado = false, porcentajeFinalizado = 0, enlaceSistema, enlaceCodigoFuente, logros = []) {
        this.id = id
        this.titulo = titulo
        this.descripcion = descripcion
        this.perfiles = perfiles
        this.finalizado = finalizado
        this.porcentajeFinalizado = porcentajeFinalizado
        this.enlaceSistema = enlaceSistema
        this.enlaceCodigoFuente = enlaceCodigoFuente
        this.logros = logros
    }
}

class Perfil {
    constructor(id, titulo, descripcion, habilidadesRequeridas, habilidadesOpcionales, tipoCompromiso, modalidadColaboracion) {
        this.id = id,
        this.titulo = titulo,
        this.descripcion = descripcion,
        this.habilidadesRequeridas = habilidadesRequeridas,
        this.habilidadesOpcionales = habilidadesOpcionales,
        this.tipoCompromiso = tipoCompromiso,
        this.modalidadColaboracion = modalidadColaboracion
    }

    cumpleHabilidadesRequeridas(habilidades) {
        // Las habilidades requeridas pueden venir populadas (documentos) o como ObjectId
        return this.habilidadesRequeridas.map(habilidad => 
            (habilidad._id ?? '')
                .toString())
                .every(id => habilidades.includes(id)
        );
    }
}

class TipoCompromiso {
    constructor(cantHoras, periodo) {
        this.cantHoras = cantHoras
        this.periodo = periodo
    }
}

class ModalidadColaboracion {
    constructor(incentivoEconomico, posibleContratacion) {
        this.incentivoEconomico = incentivoEconomico
        this.posibleContratacion = posibleContratacion
    } 
}

class Logro {
    constructor(id, titulo, descripcion) {
        this.id = id,
        this.titulo = titulo,
        this.descripcion = descripcion
    }
}

const Periodo = {
    SEMANAL: 'semanal',
    MENSUAL: 'mensual',
    TOTAL: 'total'
}

module.exports = { Proyecto, Perfil, TipoCompromiso, ModalidadColaboracion, Logro, Periodo }