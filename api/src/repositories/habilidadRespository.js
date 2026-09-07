export class HabilidadRepository {
    constructor() {
        this.habilidades = [];
    }

    findAll() {
        return this.habilidades;
    }

    findByCuentaGit(cuentaGit) {
        return this.habilidades.find(h => h.cuentaGit === cuentaGit);
    }

    save(habilidad) {
        this.habilidades.push(habilidad);
        return habilidad;
    }
}