class ColaboracionRepository {
    constructor() {
        this.colaboraciones = [];
    }

    findAll() {
        return this.colaboraciones;
    }

    save(colaboracion) {
        this.colaboraciones.push(colaboracion);
        return colaboracion;
    }
}

module.exports = new ColaboracionRepository();
