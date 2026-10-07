const colaboracionRepository = require('../repositories/colaboracionRepository.js');
const proyectoService = require('./proyectoService.js');
const colaboradorService = require("./colaboradorService.js");
const { Colaboracion } = require('../models/dominio.js');
const { BadRequestError, ConflictError } = require('../errors/AppError.js');

class ColaboracionService {
    constructor() {
        this.colaboracionRepository = colaboracionRepository;
        this.proyectoService = proyectoService;
        this.colaboradorService = colaboradorService;
    }

    obtenerTodas = () => {
        return colaboracionRepository.findAll();
    }

    crear = (colaboracionData) => {

        const proyecto = this.proyectoService.obtenerPorId(colaboracionData.idProyecto);

        const colaborador = this.colaboradorService.obtenerPorId(colaboracionData.idColaborador);

        console.log(colaborador)

        if (proyecto.finalizado)
            throw new ConflictError("El proyecto ya fue finalizado y no admite nuevas personas colaboradoras")

        const tieneHabilidadRequerida = colaborador.habilidades.some(habilidad =>
            proyecto.habilidades.some(habilidadProyecto =>
                habilidadProyecto.id === habilidad.id
            )
        );

        if (!tieneHabilidadRequerida)
            throw new ConflictError("La persona colaboradora no cuenta con ninguna de las habilidades requeridas por el proyecto")


        const colaboracion = new Colaboracion(colaborador, proyecto)
        return this.colaboracionRepository.save(colaboracion)
    }
}

module.exports = new ColaboracionService();