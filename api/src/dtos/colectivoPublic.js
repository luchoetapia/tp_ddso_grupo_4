class ColectivoPublic {
    constructor(id, nombre, descripcion, ubicacion, tipo, proyectos) {
        this.id = id;
        this.nombre = nombre;
        this.descripcion = descripcion;
        this.ubicacion = ubicacion;
        this.tipo = tipo;
        this.proyectos = proyectos.map(proyecto => {
            return {
                id: proyecto.id,
                titulo: proyecto.titulo,
                finalizado: proyecto.finalizado
            }
        });
    }
}

module.exports = { ColectivoPublic }