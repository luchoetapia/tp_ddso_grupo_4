const mongoose = require('mongoose');
const reporteRepository = require('../repositories/reporteRepository.js');
const colectivoRepository = require('../repositories/colectivoRepository.js');
const { EstadoReporte, TipoEntidadReportada } = require('../models/Reporte.js');
const { BadRequestError, ConflictError, NotFoundError } = require('../errors/AppError.js');

class ReporteService {
    constructor() {
        this.reporteRepository = reporteRepository;
        this.colectivoRepository = colectivoRepository;
    }

    crear = async ({ tipoEntidad, idEntidad, motivo }) => {
        if (!Object.values(TipoEntidadReportada).includes(tipoEntidad)) {
            throw new BadRequestError(`Tipo de entidad inválido: ${tipoEntidad}`);
        }
        if (!mongoose.isValidObjectId(idEntidad)) {
            throw new BadRequestError("Id de entidad inválido");
        }
        if (!motivo?.trim()) {
            throw new BadRequestError("El motivo es obligatorio");
        }
        if (!await this.reporteRepository.existeEntidad(tipoEntidad, idEntidad)) {
            throw new NotFoundError(`${tipoEntidad} no encontrado`);
        }

        return await this.reporteRepository.save({
            entidad: { tipo: tipoEntidad, id: idEntidad },
            motivo: motivo.trim(),
            duenio: await this.buscarDuenio(tipoEntidad, idEntidad)
        });
    }

    // El dueño de un proyecto es el usuario del colectivo que lo tiene en su lista de proyectos
    buscarDuenio = async (tipoEntidad, idEntidad) => {
        if (tipoEntidad === TipoEntidadReportada.COLECTIVO) {
            const colectivo = await this.colectivoRepository.findById(idEntidad);
            return colectivo?.usuario ?? null;
        }

        if (tipoEntidad === TipoEntidadReportada.PROYECTO) {
            const [colectivo] = await this.colectivoRepository.findBy({ proyectos: idEntidad });
            return colectivo?.usuario ?? null;
        }

        return null;
    }

    obtenerPorId = async (id) => {
        if (!mongoose.isValidObjectId(id)) {
            throw new BadRequestError("Id de reporte inválido");
        }

        const reporte = await this.reporteRepository.findById(id);
        if (!reporte) {
            throw new NotFoundError("Reporte no encontrado");
        }

        return reporte;
    }

    listar = async ({ pagina = 1, limite = 10, estado, tipoEntidad } = {}) => {
        const filtros = {};
        if (estado) filtros.estado = estado;
        if (tipoEntidad) filtros['entidad.tipo'] = tipoEntidad;

        return await this.reporteRepository.buscarConPaginacion(pagina, limite, filtros);
    }

    // Le avisa al usuario para que edite el contenido; si se vuelve a notificar se actualiza la fecha
    notificar = async (id) => {
        await this.obtenerPendiente(id);

        const reporte = await this.reporteRepository.marcarNotificado(id);
        if (!reporte) {
            throw new ConflictError("El reporte ya fue resuelto por otro admin");
        }

        return reporte;
    }

    // Se llama cuando el usuario edita la entidad; devuelve cuántos reportes se solucionaron
    solucionarPorEntidad = async (idEntidad) => {
        return await this.reporteRepository.solucionarNotificados(idEntidad);
    }

    // Validar = el contenido es inapropiado: se elimina la entidad reportada
    validar = async (id, idAdmin, comentario) => {
        const reporte = await this.obtenerPendiente(id);

        // entidad.id viene populado; si es null la entidad ya no existe
        const entidad = reporte.entidad.id;
        if (entidad) {
            await this.reporteRepository.eliminarEntidad(reporte.entidad.tipo, entidad._id ?? entidad);
        }

        return await this.cerrar(id, EstadoReporte.VALIDADO, idAdmin, comentario);
    }

    // Rechazar = falso positivo, el contenido es válido en su contexto
    rechazar = async (id, idAdmin, comentario) => {
        await this.obtenerPendiente(id);
        return await this.cerrar(id, EstadoReporte.RECHAZADO, idAdmin, comentario);
    }

    obtenerPendiente = async (id) => {
        const reporte = await this.obtenerPorId(id);

        if (!reporte.estaPendiente()) {
            throw new ConflictError(`El reporte ya fue resuelto como '${reporte.estado}'`);
        }

        return reporte;
    }

    cerrar = async (id, estado, idAdmin, comentario = null) => {
        const resuelto = await this.reporteRepository.resolver(id, estado, idAdmin, comentario);
        // Otro admin lo resolvió entre la lectura y la actualización
        if (!resuelto) {
            throw new ConflictError("El reporte ya fue resuelto por otro admin");
        }

        return resuelto;
    }
}

module.exports = new ReporteService();
