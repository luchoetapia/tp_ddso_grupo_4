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
        // Las habilidades requeridas pueden venir populadas (documentos) o como ObjectId
        return this.habilidadesRequeridas.map(habilidad => (habilidad._id ?? habilidad).toString()).every(id => habilidades.includes(id));
    }
}

module.exports = Perfil;