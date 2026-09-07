export class ColectivoRepository {
    constructor() {
        this.colectivos = [];
    }

    findAll() {
        return this.colectivos;
    }

    findByCuentaGit(cuentaGit) {
        return this.colectivos.find(c => c.cuentaGit === cuentaGit);
    }

    save(colectivo) {
        this.colectivos.push(colectivo);
        return colectivo;
    }
}