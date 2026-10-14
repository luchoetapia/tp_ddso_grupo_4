class Perfil {
    constructor(id, descripcion, habilidadesRequeridas, habilidadesOpcionales, tipoCompromiso, modalidadColaboracion) {
        this.id = id,
        this.descripcion = descripcion,
        this.habilidadesRequeridas = habilidadesRequeridas,
        this.habilidadesOpcionales = habilidadesOpcionales,
        this.tipoCompromiso = tipoCompromiso,
        this.modalidadColaboracion = modalidadColaboracion
    }

    cumpleHabilidadesRequeridas(colaborador) {
        const idsColaborador = obtenerIds(colaborador.habilidades);
        return obtenerIds(this.habilidadesRequeridas).every(id => idsColaborador.includes(id));
    }

    contarHabilidadesOpcionales(colaborador) {
        const idsColaborador = obtenerIds(colaborador.habilidades);
        return obtenerIds(this.habilidadesOpcionales).filter(id => idsColaborador.includes(id)).length;
    }
}

// Las habilidades pueden venir populadas (documentos) o como ObjectId
function obtenerIds(habilidades = []) {
    return habilidades.map(h => (h._id ?? h).toString());
}

module.exports = Perfil;
