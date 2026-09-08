class HabilidadRepository {
    constructor() {
        this.habilidades = [];
    }

    findAll() {
        return this.habilidades;
    }

    findByTitulo(titulo) {
        return this.habilidades.find(h => h.titulo === titulo);
    }

    findById(id) {
        return this.habilidades.find(h => h.id === id);
    }

    save(habilidad) {
        this.habilidades.push(habilidad);
        return habilidad;
    }
}

module.exports = { HabilidadRepository };
