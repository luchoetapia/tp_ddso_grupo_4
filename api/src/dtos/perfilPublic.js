const { HabilidadResumen } = require('./habilidadPublic.js');

class PerfilPublic {
    constructor(id, titulo, descripcion, habilidadesRequeridas, habilidadesOpcionales, tipoCompromiso, modalidadColaboracion) {
        this.id = id
        this.titulo = titulo
        this.descripcion = descripcion
        this.habilidadesRequeridas = HabilidadResumen.desdeLista(habilidadesRequeridas)
        this.habilidadesOpcionales = HabilidadResumen.desdeLista(habilidadesOpcionales)
        this.tipoCompromiso = {
            cantHoras: tipoCompromiso?.cantHoras,
            periodo: tipoCompromiso?.periodo
        }
        this.modalidadColaboracion = {
            incentivoEconomico: modalidadColaboracion?.incentivoEconomico,
            posibleContratacion: modalidadColaboracion?.posibleContratacion
        }
    }

    static desde(perfil) {
        return new PerfilPublic(
            perfil.id,
            perfil.titulo,
            perfil.descripcion,
            perfil.habilidadesRequeridas,
            perfil.habilidadesOpcionales,
            perfil.tipoCompromiso,
            perfil.modalidadColaboracion
        )
    }
}

// Vista reducida del perfil para los listados de proyectos
class PerfilResumen {
    constructor(id, titulo, habilidadesRequeridas, habilidadesOpcionales) {
        this.id = id
        this.titulo = titulo
        this.habilidadesRequeridas = HabilidadResumen.desdeLista(habilidadesRequeridas)
        this.habilidadesOpcionales = HabilidadResumen.desdeLista(habilidadesOpcionales)
    }

    static desde(perfil) {
        return new PerfilResumen(perfil.id, perfil.titulo, perfil.habilidadesRequeridas, perfil.habilidadesOpcionales)
    }
}

module.exports = { PerfilPublic, PerfilResumen }
