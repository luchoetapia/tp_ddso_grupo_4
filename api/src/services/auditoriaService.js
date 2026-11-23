const auditoriaRepository = require('../repositories/auditoriaRepository.js');
const colectivoRepository = require('../repositories/colectivoRepository.js');
const { NotFoundError } = require('../errors/AppError.js');

const idDe = (ref) => (ref?._id ?? ref)?.toString() ?? null;

class AuditoriaService {
    constructor() {
        this.auditoriaRepository = auditoriaRepository;
        this.colectivoRepository = colectivoRepository;
    }

    registrar = async ({ accion, entidad, autor = null, idColectivo = null, idProyecto = null, detalle = null }) => {
        const colectivo = idColectivo ?? await this.colectivoDelProyecto(idProyecto);

        return await this.auditoriaRepository.save({
            accion,
            entidad: { tipo: entidad.tipo, id: idDe(entidad.id) },
            autor: autor ? { id: autor.id, username: autor.username, rol: autor.rol } : null,
            colectivo: idDe(colectivo),
            detalle,
            fecha: new Date()
        });
    }

    colectivoDelProyecto = async (idProyecto) => {
        if (!idProyecto) return null;
        const [colectivo] = await this.colectivoRepository.findBy({ proyectos: idProyecto });
        return colectivo?._id ?? colectivo?.id ?? null;
    }

    listar = async ({ pagina = 1, limite = 10, ...filtros } = {}) => {
        return await this.auditoriaRepository.buscarConPaginacion(pagina, limite, construirFiltros(filtros));
    }

    listarDelColectivo = async (idUsuario, { pagina = 1, limite = 10, ...filtros } = {}) => {
        const colectivo = await this.colectivoRepository.findByUsuario(idUsuario);
        if (!colectivo) throw new NotFoundError("El usuario no tiene un colectivo asociado");

        const { idColectivo, ...resto } = filtros;
        return await this.auditoriaRepository.buscarConPaginacion(pagina, limite, construirFiltros({ ...resto, idColectivo: colectivo.id }));
    }
}

const construirFiltros = ({ accion, tipoEntidad, idEntidad, idColectivo, idAutor, desde, hasta } = {}) => {
    const filtros = {};
    if (accion) filtros.accion = accion;
    if (tipoEntidad) filtros['entidad.tipo'] = tipoEntidad;
    if (idEntidad) filtros['entidad.id'] = idEntidad;
    if (idColectivo) filtros.colectivo = idColectivo;
    if (idAutor) filtros['autor.id'] = idAutor;
    if (desde || hasta) {
        filtros.fecha = {};
        if (desde) filtros.fecha.$gte = desde;
        if (hasta) filtros.fecha.$lte = hasta;
    }
    return filtros;
};

module.exports = new AuditoriaService();
