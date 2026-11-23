const mongoose = require('mongoose');
const ReporteModel = require('../database/schemas/reporteSchema.js');
const { EstadoReporte } = require('../models/Reporte.js');

// Registra los modelos que puede referenciar entidad.tipo
require('../database/schemas/proyectoSchema.js');
require('../database/schemas/postulacionSchema.js');
require('../database/schemas/colaboradorSchema.js');
require('../database/schemas/colectivoSchema.js');
require('../auth/models/usuarioSchema.js');

// entidad.id no se popula: si la entidad se eliminó, populate lo pisaría con null y se perdería el id
const REFERENCIAS = [
    { path: 'duenio', select: 'username email' },
    { path: 'revisadoPor', select: 'username' }
];

class ReporteRepository {
    async save(datos) {
        const reporte = await ReporteModel.create(datos);
        return await reporte.populate(REFERENCIAS);
    }

    async findById(id) {
        return await ReporteModel.findById(id).populate(REFERENCIAS);
    }

    async buscarConPaginacion(pagina = 1, limite = 10, filtros = {}, orden = { createdAt: -1 }) {
        limite = Math.min(limite, 100);

        const [reportes, total] = await Promise.all([
            ReporteModel.find(filtros).paginar({ pagina, limite, orden }).populate(REFERENCIAS),
            ReporteModel.countDocuments(filtros)
        ]);

        return { reportes, total, pagina, limite, totalPaginas: Math.ceil(total / limite) };
    }

    // Filtra por PENDIENTE para que dos admins no resuelvan el mismo reporte; devuelve null si ya estaba resuelto
    async resolver(id, estado, idAdmin, comentario = null) {
        return await ReporteModel.findOneAndUpdate(
            { _id: id, estado: EstadoReporte.PENDIENTE },
            { estado, revisadoPor: idAdmin, fechaRevision: new Date(), comentarioRevision: comentario },
            { new: true }
        ).populate(REFERENCIAS);
    }

    async existePendiente(idEntidad) {
        return Boolean(await ReporteModel.exists({ 'entidad.id': idEntidad, estado: EstadoReporte.PENDIENTE }));
    }

    async marcarNotificado(id, duenio = undefined) {
        const cambios = { notificado: true, fechaNotificacion: new Date() };
        if (duenio) cambios.duenio = duenio;

        return await ReporteModel.findOneAndUpdate(
            { _id: id, estado: EstadoReporte.PENDIENTE },
            cambios,
            { new: true }
        ).populate(REFERENCIAS);
    }

    async buscarNotificadosPendientesDe(duenio) {
        return await ReporteModel.find({ duenio, estado: EstadoReporte.PENDIENTE, notificado: true })
            .sort({ fechaNotificacion: -1 });
    }

    async solucionarNotificados(idEntidad) {
        const { modifiedCount } = await ReporteModel.updateMany(
            { 'entidad.id': idEntidad, estado: EstadoReporte.PENDIENTE, notificado: true },
            { estado: EstadoReporte.SOLUCIONADO, fechaSolucion: new Date() }
        );
        return modifiedCount;
    }

    async solucionarPendientes(idEntidad) {
        const pendientes = await ReporteModel.find({ 'entidad.id': idEntidad, estado: EstadoReporte.PENDIENTE }, { _id: 1 });
        if (pendientes.length === 0) return [];

        const ids = pendientes.map(({ _id }) => _id);
        await ReporteModel.updateMany(
            { _id: { $in: ids }, estado: EstadoReporte.PENDIENTE },
            { estado: EstadoReporte.SOLUCIONADO, fechaSolucion: new Date() }
        );
        return await ReporteModel.find({ _id: { $in: ids }, estado: EstadoReporte.SOLUCIONADO }).populate(REFERENCIAS);
    }

    async actualizarPendiente(idEntidad, motivo, reglas) {
        return await ReporteModel.findOneAndUpdate(
            { 'entidad.id': idEntidad, estado: EstadoReporte.PENDIENTE },
            { motivo, reglas, fechaUltimoCambio: new Date() },
            { new: true }
        ).populate(REFERENCIAS);
    }

    async eliminarEntidad(tipo, id) {
        return await mongoose.model(tipo).findByIdAndDelete(id);
    }

    async buscarEntidad(tipo, id) {
        return await mongoose.model(tipo).findById(id);
    }

    async existeEntidad(tipo, id) {
        return Boolean(await mongoose.model(tipo).exists({ _id: id }));
    }
}

module.exports = new ReporteRepository();
