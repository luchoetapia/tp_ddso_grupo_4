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

        const habilidadesColaborador = colaborador.habilidades.map(h => (h._id ?? h).toString());
        const cumpleAlgunPerfil = proyecto.perfiles.some(perfil =>
            perfil.cumpleHabilidadesRequeridas(habilidadesColaborador)
        );

        if (!cumpleAlgunPerfil)
            throw new ConflictError("La persona colaboradora no cumple con las habilidades requeridas de ningún perfil del proyecto")

        const yaAnotada = await this.colaboracionRepository.findActiva(colaborador.id, proyecto.id);
        if (yaAnotada)
            throw new ConflictError("La persona colaboradora ya está anotada en este proyecto")

        const creada = await this.colaboracionRepository.save({
            colaborador: colaborador.id,
            proyecto: proyecto.id,
            inicio: new Date()
        });
        return this.toDTO(creada);
    }
}

module.exports = new ColaboracionService();
