class ColectivoRepository {
    constructor() {
        this.colectivos = [];
    }

    findAll() {
        return this.colectivos;
    }

    findByNombre(nombre) {
        return this.colectivos.find(c => c.nombre === nombre);
    }

    findById(id) {
        return this.colectivos.find(c => c.id === id);
    }

    save(colectivo) {
        this.colectivos.push(colectivo);
        return colectivo;
    }
}

module.exports = new ColectivoRepository();
