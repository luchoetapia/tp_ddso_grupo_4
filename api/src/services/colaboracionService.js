const { ColaboracionRepository } = require('../repositories/colaboracionRepository.js');
const { ProyectoService } = require('./proyectoService.js');
const { Colaboracion } = require('../models/dominio.js');
const { BadRequestError, ConflictError } = require('../errors/AppError.js');

class ColaboracionService {
    constructor(colaboracionRepository = new ColaboracionRepository(), proyectoService = new ProyectoService()) {
        this.colaboracionRepository = colaboracionRepository;
        this.proyectoService = proyectoService;
    }

    crear = (colaborador, idProyecto) => {
        const proyecto = this.proyectoService.obtenerPorId(idProyecto)

        if (proyecto.finalizado) {
            throw new ConflictError("El proyecto ya fue finalizado y no admite nuevas personas colaboradoras")
        }

        const tieneHabilidadRequerida = colaborador.habilidades.some(h => (proyecto.habilidades || []).includes(h))
        if (!tieneHabilidadRequerida) {
            throw new BadRequestError("La persona colaboradora no cuenta con ninguna de las habilidades requeridas por el proyecto")
        }

        const colaboracion = new Colaboracion(colaborador, proyecto)
        return this.colaboracionRepository.save(colaboracion)
    }
}

module.exports = { ColaboracionService };