const mongoose = require('mongoose');
const colaboradorRepository = require('../repositories/colaboradorRepository.js');
const { BadRequestError, ConflictError, NotFoundError } = require('../errors/AppError.js');
const habilidadService = require("./habilidadService.js");
const perfilService = require("./perfilService.js");
const proyectoService = require("./proyectoService.js");

class ColaboradorService {
    constructor() {
        this.colaboradorRepository = colaboradorRepository;
        this.habilidadService = habilidadService;
        this.perfilService = perfilService;
        this.proyectoService = proyectoService;
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
            presentacion: colaborador.presentacion
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
            habilidades: habilidades.map(h => h._id),
            pronombres: datos.pronombres,
            presentacion: datos.presentacion
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
        return this.toDTO(colaborador);
    }

    buscarPotencialesProyectos = async (idColaborador) => {
        const colaborador = await this.obtenerPorId(idColaborador);
        const habilidadesColaborador = colaborador.habilidades.map(h => h._id ?? h);
       
        const perfiles = await this.perfilService.perfilesQueCumplenHabilidadesRequeridas(idColaborador);
       
        const proyectosActivos = await this.proyectoService.proyectosActivos();

        const proyectos = proyectosActivos.filter(proyecto => {
            return proyecto.perfiles.some(perfil => perfiles.some(p => p.id === perfil));
        });
        return proyectos;
    }
}

module.exports = new ColaboradorService();
