export class ProyectoRepository {
    constructor() {
        this.proyectos = [];
    }

    findAll() {
        return this.proyectos;
    }

    findByCuentaGit(cuentaGit) {
        return this.proyectos.find(p => p.cuentaGit === cuentaGit);
    }

    save(proyecto) {
        this.proyectos.push(proyecto);
        return proyecto;
    }
}