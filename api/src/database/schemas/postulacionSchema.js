const mongoose = require('mongoose');
const Postulacion = require('../../models/Proyecto/Postulaciones/Postulacion.js');
const EstadoPostulacion = require('../../models/Proyecto/Postulaciones/EstadoPostulacion.js');

const Schema = mongoose.Schema;
const estadosValidos = Object.values(EstadoPostulacion);

const postulacionSchema = new Schema({
    colaborador: { type: Schema.Types.ObjectId, ref: 'Colaborador', required: true },
    proyecto: { type: Schema.Types.ObjectId, ref: 'Proyecto', required: true },
    perfil: { type: Schema.Types.ObjectId, required: true },
    mensaje: { type: String, default: "" },
    estado: { type: String, enum: estadosValidos, default: EstadoPostulacion.PENDIENTE },
    fecha: { type: Date, default: Date.now }
}, {
    timestamps: true,
    versionKey: false
});

// Índice para verificar duplicados activos o búsquedas por colaborador y perfil
postulacionSchema.index({ colaborador: 1, proyecto: 1, perfil: 1, estado: 1 });
// Índice para búsquedas por proyecto / perfil / estado
postulacionSchema.index({ proyecto: 1, perfil: 1, estado: 1 });

postulacionSchema.loadClass(Postulacion);

module.exports = mongoose.model('Postulacion', postulacionSchema);
