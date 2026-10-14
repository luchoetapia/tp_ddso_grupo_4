const mongoose = require('mongoose');
const colaboradorRepository = require('../repositories/colaboradorRepository.js');
const { BadRequestError, ConflictError, NotFoundError } = require('../errors/AppError.js');
const habilidadService = require("./habilidadService.js");

class ColaboradorService {
    constructor() {
        this.colaboradorRepository = colaboradorRepository;
        this.habilidadService = habilidadService;
    }

    obtenerTodos = async () => {
        return await this.colaboradorRepository.findAll()
    }

    crear = async (datos) => {
        const existente = await this.colaboradorRepository.findByCuentaGit(datos.cuentaGit)
        if (existente) {
            throw new ConflictError("Ya existe un colaborador con esa cuenta de Git")
        }

        const habilidades = await this.habilidadService.obtenerPorListaId(datos.habilidades ?? [])

        return await this.colaboradorRepository.save({
            nombre: datos.nombre,
            apellido: datos.apellido,
            nombreFantasia: datos.nombreFantasia,
            cuentaGit: datos.cuentaGit,
            habilidades: habilidades.map(h => h._id),
            pronombres: datos.pronombres,
            presentacion: datos.presentacion
        })
    }

    obtenerPorId = async (id) => {
        if (!mongoose.isValidObjectId(id)) {
            throw new BadRequestError("Id de colaborador inválido")
        }

        const colaborador = await this.colaboradorRepository.findById(id)
        if (!colaborador) {
            throw new NotFoundError("Colaborador no encontrado")
        }
        return colaborador;
    }

    buscarPorPerfil = async (perfil) => {
        const idsRequeridas = perfil.habilidadesRequeridas.map(h => h._id ?? h)
        const candidatas = await this.colaboradorRepository.findByHabilidades(idsRequeridas)

        return candidatas
            .filter(c => perfil.cumpleHabilidadesRequeridas(c))
            .map(c => ({
                ...c.toObject(),
                cantHabilidadesOpcionales: perfil.contarHabilidadesOpcionales(c)
            }))
            .sort((a, b) => b.cantHabilidadesOpcionales - a.cantHabilidadesOpcionales)
    }

    obtenerPorCuentaGit = async (cuentaGit) => {
        const colaborador = await this.colaboradorRepository.findByCuentaGit(cuentaGit)
        if (!colaborador) {
            throw new NotFoundError("Colaborador no encontrado")
        }
        return colaborador
    }
}

module.exports = new ColaboradorService();
