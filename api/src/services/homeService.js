const colaboracionRepository = require('../repositories/colaboracionRepository');
const colectivoRepository = require('../repositories/colectivoRepository');
const proyectoRepository = require('../repositories/proyectoRepository');

// Cantidad de habilidades que muestra el ranking del home
const TOP_HABILIDADES = 5;

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

    async rankingHabilidades() {
        return await this.proyectoRepository.rankingHabilidades(TOP_HABILIDADES);
    }
}

module.exports = new HomeService();
