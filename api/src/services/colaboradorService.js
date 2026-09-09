const { ColaboradorRepository } = require('../repositories/colaboradorRepository.js');
const { Colaborador } = require('../models/dominio.js');
const { ConflictError, NotFoundError } = require('../errors/AppError.js');
const { ColaboracionService } = require('./colaboracionService.js');

class ColaboradorService {
    constructor(colaboradorRepository = new ColaboradorRepository(), colaboracionService = new ColaboracionService()) {
        this.colaboradorRepository = colaboradorRepository;
        this.colaboracionService = colaboracionService;
    }

    obtenerTodos = () => {
        return this.colaboradorRepository.findAll();
    }

    crear = (datos) => {
        const existente = this.colaboradorRepository.findByCuentaGit(datos.cuentaGit)
        if (existente) {
            throw new ConflictError("Ya existe un colaborador con esa cuenta de Git")
        }

        const colaborador = new Colaborador(
            datos.nombre,
            datos.apellido,
            datos.nombreFantasia,
            datos.cuentaGit,
            datos.habilidades,
            datos.pronombres,
            datos.presentacion
        )

        return this.colaboradorRepository.save(colaborador)
    }

    obtenerPorCuentaGit = (cuentaGit) => {
        const colaborador = this.colaboradorRepository.findByCuentaGit(cuentaGit)
        if (!colaborador) {
            throw new NotFoundError("Colaborador no encontrado")
        }
        return colaborador
    }

    anotarAProyecto = (colaborador, idProyecto) => {
        return this.colaboracionService.crear(colaborador, idProyecto)
    }
}

module.exports = { ColaboradorService };
