const mongoose = require('mongoose');
const colaboradorRepository = require('../repositories/colaboradorRepository.js');
const colectivoRepository = require('../repositories/colectivoRepository.js');
const postulacionRepository = require('../repositories/postulacionRepository.js');
const { BadRequestError, ConflictError, ForbiddenError, NotFoundError } = require('../errors/AppError.js');
const { roles } = require('../auth/models/usuario.js');
const habilidadService = require("./habilidadService.js");

const { construirOrden } = require('./ordenamiento.js');

// Claves por las que el front puede ordenar las colaboradoras (2° criterio: cuenta de Git, 3°: _id)
const ORDENAMIENTO = {
    campos: {
        cuentaGit: 'cuentaGit',
        nombre: 'nombre',
    },
    campoNombre: 'cuentaGit',
    porDefecto: { orden: 'cuentaGit', direccion: 'asc' },
};

const MENSAJE_USUARIO_CON_COLABORADOR = "El usuario ya tiene un perfil de colaborador asociado";

class ColaboradorService {
    constructor() {
        this.colaboradorRepository = colaboradorRepository;
        this.habilidadService = habilidadService;
        this.colectivoRepository = colectivoRepository;
        this.postulacionRepository = postulacionRepository;
    }

    obtenerTodos = async ({ pagina, limite, orden, direccion } = {}) => {
        const sort = construirOrden(ORDENAMIENTO, { orden, direccion });
        return await this.colaboradorRepository.buscarConPaginacion(pagina, limite, {}, sort);
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

    obtenerContactosAutorizados = async (cuentaGit, usuario) => {
        const colaborador = await this.obtenerPorCuentaGit(cuentaGit)

        if (!(await this.puedeVerContactos(colaborador, usuario))) {
            throw new ForbiddenError("No tenés acceso a los datos de contacto de esta colaboradora")
        }
        return colaborador.contactos.map(c => ({ medio: c.medio, valor: c.valor }));
    }

    puedeVerContactos = async (colaborador, usuario) => {
        if (usuario.rol === roles.ADMIN) return true;

        if (usuario.rol === roles.COLABORADOR) {
            return colaborador.usuario?.toString() === usuario.id;
        }

        if (usuario.rol === roles.COLECTIVO) {
            const colectivo = await this.colectivoRepository.findByUsuario(usuario.id);
            if (!colectivo || colectivo.proyectos.length === 0) return false;
            return await this.postulacionRepository.existeAceptadaEnProyectos(colaborador.id, colectivo.proyectos);
        }

        return false;
    }

    // A diferencia de la búsqueda de potenciales proyectos, acá el filtro se expresa entero en la query
    // y no hay un ranking en JS: se puede paginar directo en la BD
    obtenerColaboradoresPotenciales = async (perfiles, { pagina, limite, orden, direccion } = {}) => {
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
        
        const sort = construirOrden(ORDENAMIENTO, { orden, direccion });
        return await this.colaboradorRepository.buscarConPaginacion(pagina, limite, condicion, sort)
    }

    buscarPorUsuario = async (idUsuario) => {
        return await this.colaboradorRepository.findByUsuario(idUsuario);
    }
}

module.exports = new ColaboradorService();
