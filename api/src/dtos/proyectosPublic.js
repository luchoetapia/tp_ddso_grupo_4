class PerfilesPublic {
    constructor(id, titulo, habilidadesRequeridas, habilidadesOpcionales) {
        this.id = id;
        this.titulo = titulo;
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

class ProyectosPublic {
    constructor(id, nombre, descripcion, finalizado, porcentajeFinalizado, perfiles) {
        this.id = id;
        this.nombre = nombre;
        this.descripcion = descripcion;
        this.finalizado = finalizado;
        this.porcentajeFinalizado = porcentajeFinalizado;
        this.perfiles = perfiles.map(perfil => new PerfilesPublic(
            perfil.id, perfil.titulo, perfil.habilidadesRequeridas, perfil.habilidadesOpcionales)
        );
    }
}

module.exports = { ProyectosPublic }