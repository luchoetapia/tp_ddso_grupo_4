const mongoose = require('mongoose');
const paginable = require('../plugins/paginable');
const { Reporte, EstadoReporte, TipoEntidadReportada } = require('../../models/Reporte');

const Schema = mongoose.Schema;

const entidadReportadaSchema = new Schema({
    tipo: { type: String, enum: Object.values(TipoEntidadReportada), required: true },
    id: { type: Schema.Types.ObjectId, refPath: 'entidad.tipo', required: true }
}, { _id: false });

const reporteSchema = new Schema({
    entidad: { type: entidadReportadaSchema, required: true },
    motivo: { type: String, required: true, trim: true },
    // Solo para proyectos y postulaciones: usuario a notificar si se elimina el contenido
    duenio: { type: Schema.Types.ObjectId, ref: 'Usuario', default: null },
    estado: { type: String, enum: Object.values(EstadoReporte), default: EstadoReporte.PENDIENTE },
    // Se le avisó al usuario para que edite; el reporte sigue pendiente
    notificado: { type: Boolean, default: false },
    fechaNotificacion: { type: Date, default: null },
    fechaSolucion: { type: Date, default: null },
    revisadoPor: { type: Schema.Types.ObjectId, ref: 'Usuario', default: null },
    fechaRevision: { type: Date, default: null },
    comentarioRevision: { type: String, default: null }
}, { timestamps: true, versionKey: false });

// Bandeja del admin: por estado, más recientes primero
reporteSchema.index({ estado: 1, createdAt: -1 });
// Reportes de una entidad puntual
reporteSchema.index({ 'entidad.id': 1 });

reporteSchema.loadClass(Reporte);
reporteSchema.plugin(paginable);

module.exports = mongoose.model('Reporte', reporteSchema);
