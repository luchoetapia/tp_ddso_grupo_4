const mongoose = require('mongoose');
const paginable = require('../plugins/paginable');
const { Colaboracion } = require('../../models/colaboracion.js');

const Schema = mongoose.Schema;

const colaboracionSchema = new Schema({
    colaborador: {
        id: { type: Schema.Types.ObjectId, required: true},
        nombre: { type: String },
        apellido: { type: String },
        usuario: { type: Schema.Types.ObjectId, ref: 'Usuario' },
    },
    proyecto: { 
        id: { type: Schema.Types.ObjectId, required: true},
        titulo: { type: String, required: true },
        descripcion: { type: String, required: true }
    },
    perfil: { type: Schema.Types.ObjectId, required: true },
    inicio: { type: Date, required: true },
    fin: { type: Date, default: null },
    esAnonima: { type: Boolean, default: false }
}, {
    timestamps: true,
    versionKey: false,
});

// findActiva: colaboración abierta de un colaborador en un proyecto
colaboracionSchema.index({ 'colaborador.id': 1, 'proyecto.id': 1, fin: 1 });
// Conteo de colaboraciones activas por perfil en un proyecto
colaboracionSchema.index({ 'proyecto.id': 1, perfil: 1, fin: 1 });

colaboracionSchema.loadClass(Colaboracion);

colaboracionSchema.plugin(paginable);

module.exports = mongoose.model('Colaboracion', colaboracionSchema);