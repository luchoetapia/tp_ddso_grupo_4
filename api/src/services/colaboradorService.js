const mongoose = require('mongoose');
const colaboradorRepository = require('../repositories/colaboradorRepository.js');
const { BadRequestError, ConflictError, NotFoundError } = require('../errors/AppError.js');
const habilidadService = require("./habilidadService.js");

// Orden de los listados: alfabético por cuenta de Git (el _id desempata para que el orden sea estable entre páginas)
const ORDEN_LISTADO = { cuentaGit: 1, _id: 1 };

const MENSAJE_USUARIO_CON_COLABORADOR = "El usuario ya tiene un perfil de colaborador asociado";

class ColaboradorService {
    constructor() {
        this.colaboradorRepository = colaboradorRepository;
        this.habilidadService = habilidadService;
    }

    obtenerTodos = async ({ pagina, limite } = {}) => {
        return await this.colaboradorRepository.buscarConPaginacion(pagina, limite, {}, ORDEN_LISTADO);
    }

    // idUsuario: usuario de la sesión que crea el perfil (queda como su cuenta)
    crear = async (datos, idUsuario) => {
        const existente = await this.colaboradorRepository.findByCuentaGit(datos.cuentaGit)
        if (existente) {
            throw new ConflictError("Ya existe un colaborador con esa cuenta de Git")
        }

        if (await this.colaboradorRepository.findByUsuario(idUsuario)) {
            throw new ConflictError(MENSAJE_USUARIO_CON_COLABORADOR)
        }

        const habilidades = await this.habilidadService.obtenerPorListaId(datos.habilidades ?? [])

        try {
            return await this.colaboradorRepository.save({
                usuario: idUsuario,
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
        } catch (error) {
            // El índice único de usuario cubre la carrera entre dos pedidos simultáneos
            if (error.code === 11000 && error.keyPattern?.usuario) throw new ConflictError(MENSAJE_USUARIO_CON_COLABORADOR)
            throw error
        }
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

    // A diferencia de la búsqueda de potenciales proyectos, acá el filtro se expresa entero en la query
    // y no hay un ranking en JS: se puede paginar directo en la BD
    obtenerColaboradoresPotenciales = async (perfiles, { pagina, limite } = {}) => {
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
        
        return await this.colaboradorRepository.buscarConPaginacion(pagina, limite, condicion, ORDEN_LISTADO)
    }

    buscarPorUsuario = async (idUsuario) => {
        return await this.colaboradorRepository.findByUsuario(idUsuario);
    }
}

module.exports = new ColaboradorService();
