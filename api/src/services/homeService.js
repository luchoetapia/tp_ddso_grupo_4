const colaboracionRepository = require('../repositories/colaboracionRepository');
const colectivoRepository = require('../repositories/colectivoRepository');
const proyectoRepository = require('../repositories/proyectoRepository');

class HomeService {
    constructor() {
        this.colaboracionRepository = colaboracionRepository;
        this.colectivoRepository = colectivoRepository;
        this.proyectoRepository = proyectoRepository;
    }

    async contadores() {
        const [totalColectivos, proyectosActivos, colaboradores, habilidadesBuscadas] = await Promise.all([
            this.colectivoRepository.totalActivos(),
            this.proyectoRepository.totalActivos(),
            this.colaboracionRepository.totalColaboradoresDistintos(),
            this.proyectoRepository.totalHabilidadesBuscadas()
        ]);

        return { totalColectivos, proyectosActivos, colaboradores, habilidadesBuscadas };
    }
}

module.exports = new HomeService();
