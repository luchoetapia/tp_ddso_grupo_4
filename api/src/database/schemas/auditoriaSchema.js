const mongoose = require('mongoose');
const paginable = require('../plugins/paginable');
const { Auditoria, AccionAuditada, TipoEntidadAuditada } = require('../../models/Auditoria');
const { roles } = require('../../auth/models/usuario');

const Schema = mongoose.Schema;

const entidadAuditadaSchema = new Schema({
    tipo: { type: String, enum: Object.values(TipoEntidadAuditada), required: true },
    id: { type: Schema.Types.ObjectId, required: true }
}, { _id: false });

const autorSchema = new Schema({
    id: { type: Schema.Types.ObjectId, ref: 'Usuario', required: true },
    username: { type: String, required: true },
    rol: { type: String, enum: Object.values(roles), required: true }
}, { _id: false });

const auditoriaSchema = new Schema({
    accion: { type: String, enum: Object.values(AccionAuditada), required: true },
    entidad: { type: entidadAuditadaSchema, required: true },
    autor: { type: autorSchema, default: null },
    colectivo: { type: Schema.Types.ObjectId, ref: 'Colectivo', default: null },
    detalle: { type: String, default: null },
    fecha: { type: Date, default: Date.now, required: true }
}, { versionKey: false });

auditoriaSchema.index({ fecha: -1 });
auditoriaSchema.index({ colectivo: 1, fecha: -1 });

auditoriaSchema.index({ 'entidad.id': 1, fecha: -1 });
auditoriaSchema.index({ 'autor.id': 1, fecha: -1 });

auditoriaSchema.loadClass(Auditoria);
auditoriaSchema.plugin(paginable);

module.exports = mongoose.model('Auditoria', auditoriaSchema, 'auditorias');
