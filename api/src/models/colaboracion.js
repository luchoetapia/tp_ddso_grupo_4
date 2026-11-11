class Colaboracion {
    constructor(colaborador, proyecto, esAnonima = false, inicio, fin = null) {
        this.colaborador = colaborador;
        this.proyecto = proyecto;
        this.esAnonima = esAnonima;
        this.inicio = inicio;
        this.fin = fin || null;
    }

    estaActiva() {
    return !this.fin;
    }
}

module.exports = { Colaboracion }