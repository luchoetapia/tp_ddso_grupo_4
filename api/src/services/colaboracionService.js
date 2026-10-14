const colaboracionRepository = require('../repositories/colaboracionRepository.js');
const proyectoService = require('./proyectoService.js');
const colaboradorService = require("./colaboradorService.js");
const { BadRequestError, ConflictError } = require('../errors/AppError.js');

class ColaboracionService {
    constructor() {
        this.colaboracionRepository = colaboracionRepository;
        this.proyectoService = proyectoService;
        this.colaboradorService = colaboradorService;
    }

    toDTO = (colaboracion) => {
        return {
            id: colaboracion.id || colaboracion._id?.toString(),
            colaborador: colaboracion.colaborador ? (colaboracion.colaborador.toDTO ? colaboracion.colaborador.toDTO() : colaboracion.colaborador) : null,
            proyecto: colaboracion.proyecto ? (colaboracion.proyecto.toDTO ? colaboracion.proyecto.toDTO() : colaboracion.proyecto) : null,
            inicio: colaboracion.inicio,
            fin: colaboracion.fin,
            esAnonima: colaboracion.esAnonima
        };
    }

    obtenerTodas = async () => {
        const colaboraciones = await this.colaboracionRepository.findAll();
        return colaboraciones.map(this.toDTO);
    }

    crear = async (colaboracionData) => {
        const proyecto = await this.proyectoService.obtenerPorId(colaboracionData.idProyecto);
        const colaborador = await this.colaboradorService.obtenerPorId(colaboracionData.idColaborador);

        if (proyecto.finalizado)
            throw new ConflictError("El proyecto ya fue finalizado y no admite nuevas personas colaboradoras")

        const idsHabilidadesProyecto = proyecto.habilidades.map(h => h._id.toString());
        const tieneHabilidadRequerida = colaborador.habilidades.some(h =>
            idsHabilidadesProyecto.includes(h._id.toString())
        );

        if (!tieneHabilidadRequerida)
            throw new ConflictError("La persona colaboradora no cuenta con ninguna de las habilidades requeridas por el proyecto")


        const yaAnotada = await this.colaboracionRepository.findActiva(colaborador._id, proyecto._id);
        if (yaAnotada)
            throw new ConflictError("La persona colaboradora ya está anotada en este proyecto")

        const creada = await this.colaboracionRepository.save({
            colaborador: colaborador._id,
            proyecto: proyecto._id,
            inicio: new Date()
        });
        return this.toDTO(creada);
    }
}

module.exports = new ColaboracionService();
