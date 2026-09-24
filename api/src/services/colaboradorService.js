const colaboradorRepository = require('../repositories/colaboradorRepository.js');
const { Colaborador } = require('../models/dominio.js');
const { ConflictError, NotFoundError } = require('../errors/AppError.js');
const colaboracionService = require('./colaboracionService.js');
const habilidadService = require("./habilidadService.js");


class ColaboradorService {
    constructor() {
        this.colaboradorRepository = colaboradorRepository;
        this.colaboracionService = colaboracionService;
        this.habilidadService = habilidadService;
    }

    crear = (datos) => {
        const existente = this.colaboradorRepository.findByCuentaGit(datos.cuentaGit)

        if (existente) {
            throw new ConflictError("Ya existe un colaborador con esa cuenta de Git")
        }

        const habilidadesColaborador = this.habilidadService.obtenerPorListaId(datos.habilidades);

        const colaborador = new Colaborador(
            datos.nombre,
            datos.apellido,
            datos.nombreFantasia,
            datos.cuentaGit,
            habilidadesColaborador,
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

module.exports = new ColaboradorService();
