const mongoose = require('mongoose');
const { Colaboracion } = require('../../models/colaboracion.js');

const Schema = mongoose.Schema;

const colaboracionSchema = new Schema({
    colaborador: { type: Schema.Types.ObjectId, ref: 'Colaborador', required: true },
    proyecto: { type: Schema.Types.ObjectId, ref: 'Proyecto', required: true },
    perfil: { type: Schema.Types.ObjectId, required: true },
    inicio: { type: Date, required: true },
    fin: { type: Date, default: null },
    esAnonima: { type: Boolean, default: false }
}, {
    timestamps: true,
    versionKey: false,
});

// findActiva: colaboración abierta de un colaborador en un proyecto
colaboracionSchema.index({ colaborador: 1, proyecto: 1, fin: 1 });
// Conteo de colaboraciones activas por perfil en un proyecto
colaboracionSchema.index({ proyecto: 1, perfil: 1, fin: 1 });

colaboracionSchema.loadClass(Colaboracion);

module.exports = mongoose.model('Colaboracion', colaboracionSchema);