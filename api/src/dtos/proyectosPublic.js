class ProyectosPublic {
    constructor(id, nombre, descripcion, finalizado, porcentajeFinalizado, habilidadesRequeridas, habilidadesOpcionales) {
        this.id = id;
        this.nombre = nombre;
        this.descripcion = descripcion;
        this.finalizado = finalizado;
        this.porcentajeFinalizado = porcentajeFinalizado;
        this.habilidadesRequeridas = this._obtenerHabilidades(habilidadesRequeridas);
        this.habilidadesOpcionales = this._obtenerHabilidades(habilidadesOpcionales);
    }

    _obtenerHabilidades(habilidades) {
        return habilidades.map(habilidad => {
            return {
                id: habilidad.id,
                nombre: habilidad.titulo
            }
        });
    }
}

module.exports = { ProyectosPublic }