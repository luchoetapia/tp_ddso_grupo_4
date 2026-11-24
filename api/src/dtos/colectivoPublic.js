class ColectivoPublic {
    constructor(id, nombre, active, descripcion, ubicacion, tipo, proyectos = []) {
        this.id = id;
        this.nombre = nombre;
        this.active = active;
        this.descripcion = descripcion;
        this.ubicacion = ubicacion;
        this.tipo = tipo;
        this.proyectos = proyectos.map(proyecto => {
            return {
                id: proyecto.id,
                titulo: proyecto.titulo,
                descripcion: proyecto.descripcion,
                finalizado: proyecto.finalizado,
                porcentajeFinalizado: proyecto.porcentajeFinalizado,
                perfilesAbiertos: (proyecto.perfiles ?? []).filter(perfil => perfil.busquedaAbierta).length,
                requiereRevisionManual: proyecto.requiereRevisionManual ?? false
            }
        });
    }

    static desde(colectivo) {
        return new ColectivoPublic(
            colectivo.id,
            colectivo.nombre,
            colectivo.active,
            colectivo.descripcion,
            colectivo.ubicacion,
            colectivo.tipo,
            colectivo.proyectos
        )
    }
}

module.exports = { ColectivoPublic }
