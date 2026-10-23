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
        const colaboradores = await this.colaboradorRepository.findAll();
        return colaboradores;
    }

    crear = async (datos) => {
        const existente = await this.colaboradorRepository.findByCuentaGit(datos.cuentaGit)
        if (existente) {
            throw new ConflictError("Ya existe un colaborador con esa cuenta de Git")
        }

        const habilidades = await this.habilidadService.obtenerPorListaId(datos.habilidades ?? [])

        const creado = await this.colaboradorRepository.save({
            nombre: datos.nombre,
            apellido: datos.apellido,
            nombreFantasia: datos.nombreFantasia,
            cuentaGit: datos.cuentaGit,
            habilidades: habilidades.map(h => h.id),
            pronombres: datos.pronombres,
            presentacion: datos.presentacion,
            deseaSerContactado: datos.deseaSerContactado ?? false,
            contactos: datos.contactos ?? []
        })
        return creado;
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

    obtenerPorCuentaGit = async (cuentaGit) => {
        const colaborador = await this.colaboradorRepository.findByCuentaGit(cuentaGit)
        if (!colaborador) {
            throw new NotFoundError("Colaborador no encontrado")
        }
        return colaborador;
    }

    obtenerContactos = async (cuentaGit) => {
        const colaborador = await this.colaboradorRepository.findByCuentaGit(cuentaGit)
        if (!colaborador) {
            throw new NotFoundError("Colaborador no encontrado")
        }
        return colaborador.contactos.map(c => ({ medio: c.medio, valor: c.valor }));
    }

    obtenerColaboradoresPotenciales = (perfiles) => {
        const habilidadesRequeridas = perfiles
            .filter(perfil => perfil.habilidadesRequeridas && perfil.habilidadesRequeridas.length > 0)
            .map(
                perfil => perfil.habilidadesRequeridas.filter(h => h._id).map(h => (h._id))
            )
            .filter(conjunto => conjunto.length > 0);

        // El colaborador debe tener todas las habilidades de al menos un conjunto
        const condicion = habilidadesRequeridas.length > 0
            ? { $or: habilidadesRequeridas.map(conjunto => ({ habilidades: { $all: conjunto } })) }
            : {}
        
        return this.colaboradorRepository.findByCondition(condicion)
    }
}

module.exports = new ColaboradorService();
