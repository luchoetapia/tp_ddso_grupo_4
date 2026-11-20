const colaboracionRepository = require('../repositories/colaboracionRepository.js');
const proyectoService = require('./proyectoService.js');
const colaboradorService = require("./colaboradorService.js");
const colectivoService = require("./colectivoService.js");
const { roles } = require('../auth/models/usuario.js');
const { BadRequestError, ConflictError, ForbiddenError, NotFoundError } = require('../errors/AppError.js');

const { construirOrden } = require('./ordenamiento.js');

// Claves por las que el front puede ordenar las colaboraciones.
// La colaboración no tiene título/nombre propio (solo referencias a proyecto y colaborador): 2° criterio directo el _id
const ORDENAMIENTO = {
    campos: {
        inicio: 'inicio',
        fin: 'fin',
    },
    campoNombre: null,
    porDefecto: { orden: 'inicio', direccion: 'desc' },
};

class ColaboracionService {
    constructor() {
        this.colaboracionRepository = colaboracionRepository;
        this.proyectoService = proyectoService;
        this.colaboradorService = colaboradorService;
        this.colectivoService = colectivoService;
    }

    obtenerTodas = async ({ pagina, limite, orden, direccion } = {}) => {
        const sort = construirOrden(ORDENAMIENTO, { orden, direccion });
        return await this.colaboracionRepository.buscarConPaginacion(pagina, limite, {}, sort);
    }

    obtenerPorProyectoId = async (idProyecto) => {
        const colaboraciones = await this.colaboracionRepository.findByProyectoID(idProyecto);
        return colaboraciones;
    }

    obtenerPorColaboradorId = async (idColaborador) => {
        const colaboraciones = await this.colaboracionRepository.findByColaboradorID(idColaborador);
        return colaboraciones;
    }

    crear = async (colaboracionData) => {
        const proyecto = await this.proyectoService.obtenerPorId(colaboracionData.idProyecto);
        const colaborador = await this.colaboradorService.obtenerPorId(colaboracionData.idColaborador);

        if (proyecto.finalizado)
            throw new ConflictError("El proyecto ya fue finalizado y no admite nuevas personas colaboradoras")

        const habilidadesColaborador = colaborador.habilidades.map(h => (h._id ?? h).toString());
        const cumpleAlgunPerfil = proyecto.perfiles.some(perfil =>
            perfil.cumpleHabilidadesRequeridas(habilidadesColaborador)
        );

        if (!cumpleAlgunPerfil)
            throw new ConflictError("La persona colaboradora no cumple con las habilidades requeridas de ningún perfil del proyecto")

        const yaAnotada = await this.colaboracionRepository.findActiva(colaborador.id, proyecto.id);
        if (yaAnotada)
            throw new ConflictError("La persona colaboradora ya está anotada en este proyecto")

        const colaboradorDesnormalizado = colaboracionData.esAnonima
        ? { id: colaborador.id }
        : {
            id: colaborador.id,
            nombre: colaborador.nombre,
            apellido: colaborador.apellido,
            usuario: colaborador.usuario
        };

        const proyectosDesnormalizado = {
            id: proyecto.id,
            titulo: proyecto.titulo,
            descripcion: proyecto.descripcion
        }

        const creada = await this.colaboracionRepository.save({
            colaborador: colaboradorDesnormalizado,
            proyecto: proyectosDesnormalizado,
            perfil: colaboracionData.idPerfil,
            esAnonima: Boolean(colaboracionData.esAnonima),
            inicio: new Date()
        });

    return creada;
    }

    desanotar = async (idColaboracion, usuario) => {
        const colaboracion = await this.colaboracionRepository.findById(idColaboracion);
        if(!colaboracion) throw new NotFoundError("Colaboración no encontrada");

        await this.validarPermisoDeBaja(colaboracion, usuario);

        if(!colaboracion.estaActiva()) throw new ConflictError("La colaboración ya fue dada de baja");

        const cerrada = await this.colaboracionRepository.cerrar(idColaboracion, new Date());
        if(!cerrada) throw new ConflictError("La colaboración ya fue finalizada");

        return cerrada;
    }

    validarPermisoDeBaja = async (colaboracion, usuario) => {
        if (usuario.rol === roles.COLABORADOR) {
            const colaborador = await this.colaboradorService.buscarPorUsuario(usuario.id);

            const idColaborador = colaborador?.id ?? colaborador?._id;
            const idColaboradorColaboracion = colaboracion?.colaborador?.id ?? colaboracion?.colaborador;

            const esMismoColaborador =
                idColaborador &&
                idColaboradorColaboracion &&
                idColaborador.toString() === idColaboradorColaboracion.toString();

            if (esMismoColaborador) return;

            throw new ForbiddenError("Solo la propia persona colaboradora puede darse de baja de un proyecto");
        }

        if(usuario.rol === roles.COLECTIVO){
            const colectivo = await this.colectivoService.buscarPorUsuario(usuario.id);
            const idProyecto = (colaboracion.proyecto?.id ?? colaboracion.proyecto)?.toString();
            if(idProyecto && colectivo?.proyectos?.some(p => (p._id ?? p).toString() === idProyecto)) return;
            throw new ForbiddenError("El proyecto no pertenece a tu colectivo");
        }
         throw new ForbiddenError("No tenés permiso para dar de baja esta colaboración");
    }
};          

module.exports = new ColaboracionService();
