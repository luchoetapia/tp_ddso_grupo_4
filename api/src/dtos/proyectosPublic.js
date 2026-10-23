class ProyectosPublic {
    constructor(id, nombre, descripcion, finalizado, porcentajeFinalizado, habilidadesRequeridas, habilidadesOpcionales) {
        this.id = id;
        this.nombre = nombre;
        this.descripcion = descripcion;
        this.finalizado = finalizado;
        this.porcentajeFinalizado = porcentajeFinalizado;
        this.habilidadesRequeridas = obtenerHabilidades(habilidadesRequeridas);
        this.habilidadesOpcionales = obtenerHabilidades(habilidadesOpcionales);
    }

    _obtenerHabilidades(habilidades) {
        return habilidades.map(habilidad => {
            return {
                id: habilidad.nombre,
                nombre: habilidad.nombre
            }
        });
    }
}