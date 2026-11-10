class Colaboracion {
    constructor(colaborador, proyecto, esAnonima = false, inicio, fin = null, perfil = null) {
        this.colaborador = colaborador;
        this.proyecto = proyecto;
        this.esAnonima = esAnonima;
        this.inicio = inicio;
        this.fin = fin || null;
        this.perfil = perfil;
    }
}

module.exports = { Colaboracion }