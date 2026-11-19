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
        const [proyectos, colectivos, colaboraciones, habilidadesBuscadas] = await Promise.all([
            this.proyectoRepository.estadisticasGlobales(),
            this.colectivoRepository.estadisticasGlobales(),
            this.colaboracionRepository.estadisticasGlobales(),
            this.proyectoRepository.totalHabilidadesBuscadas()
        ]);

        return {
        // Compatibilidad con las claves que usa el frontend actual
            totalColectivos: colectivos.activos,
            proyectosActivos: proyectos.activos,
            colaboradores: colaboraciones.colaboradores,
            habilidadesBuscadas,

            proyectosTotales: proyectos.total,
            proyectosFinalizados: proyectos.finalizados,
            colectivosTotales: colectivos.total,
            colectivosActivos: colectivos.activos,
            colectivosDesactivados: colectivos.desactivados,
            colaboracionesTotales: colaboraciones.colaboracionesTotales,
            colaboracionesActivas: colaboraciones.colaboracionesActivas,
            colaboracionesFinalizadas: colaboraciones.colaboracionesFinalizadas
        };
    }

    async rankingHabilidades() {
        return await this.proyectoRepository.rankingHabilidades(TOP_HABILIDADES);
    }
}

module.exports = new HomeService();
