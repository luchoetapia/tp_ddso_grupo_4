const mongoose = require('mongoose');
const colaboradorRepository = require('../repositories/colaboradorRepository.js');
const { BadRequestError, ConflictError, NotFoundError } = require('../errors/AppError.js');
const habilidadService = require("./habilidadService.js");

class ColaboradorService {
    constructor() {
        this.colaboradorRepository = colaboradorRepository;
        this.habilidadService = habilidadService;
    }

    toDTO = (colaborador) => {
        return {
            id: colaborador.id || colaborador._id?.toString(),
            nombre: colaborador.nombre,
            apellido: colaborador.apellido,
            nombreFantasia: colaborador.nombreFantasia,
            cuentaGit: colaborador.cuentaGit,
            habilidades: colaborador.habilidades ? colaborador.habilidades.map(h => (typeof h === 'object' && h.toDTO ? h.toDTO() : h)) : [],
            pronombres: colaborador.pronombres,
            presentacion: colaborador.presentacion,
            deseaSerContactado: colaborador.deseaSerContactado ?? false
        };
    }

    obtenerTodos = async () => {
        const colaboradores = await this.colaboradorRepository.findAll();
        return colaboradores.map(this.toDTO);
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
        return this.toDTO(creado);
    }

    obtenerPorId = async (id) => {
        if (!mongoose.isValidObjectId(id)) {
            throw new BadRequestError("Id de colaborador inválido")
        }

        const colaborador = await this.colaboradorRepository.findById(id)
        if (!colaborador) {
            throw new NotFoundError("Colaborador no encontrado")
        }
        return this.toDTO(colaborador);
    }

    obtenerPorCuentaGit = async (cuentaGit) => {
        const colaborador = await this.colaboradorRepository.findByCuentaGit(cuentaGit)
        if (!colaborador) {
            throw new NotFoundError("Colaborador no encontrado")
        }
        return this.toDTO(colaborador);
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
