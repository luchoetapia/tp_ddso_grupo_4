class Perfil {
    constructor(id, descripcion, habilidadesRequeridas, habilidadesOpcionales, tipoCompromiso, modalidadColaboracion) {
        this.id = id,
        this.descripcion = descripcion,
        this.habilidadesRequeridas = habilidadesRequeridas,
        this.habilidadesOpcionales = habilidadesOpcionales,
        this.tipoCompromiso = tipoCompromiso,
        this.modalidadColaboracion = modalidadColaboracion
    }

    cumpleHabilidadesRequeridas(habilidades) {
        return this.habilidadesRequeridas.map(habilidad => habilidad.id.toString()).every(id => habilidades.includes(id.toString()));
    }
}

module.exports = Perfil;