class ColaboradorRepository {
    constructor() {
        this.colaboradores = [];
    }

    findAll() {
        return this.colaboradores;
    }

    findByCuentaGit(cuentaGit) {
        return this.colaboradores.find(c => c.cuentaGit === cuentaGit);
    }

    save(colaborador) {
        this.colaboradores.push(colaborador);
        return colaborador;
    }
  
}

module.exports = new ColaboradorRepository();
