class ProyectoRepository {
    constructor() {
        this.proyectos = [];
    }

    findAll() {
        return this.proyectos;
    }

    findByTitulo(titulo) {
        return this.proyectos.find(p => p.titulo === titulo);
    }

    findById(id) {
        return this.proyectos.find(p => p.id === id);
    }

    save(proyecto) {
        this.proyectos.push(proyecto);
        return proyecto;
    }
}

module.exports = { ProyectoRepository };
