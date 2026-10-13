const mongoose = require('mongoose');
const { Colaboracion } = require('../../models/dominio.js');

const Schema = mongoose.Schema;

const colaboracionSchema = new Schema({
    colaborador: { type: Schema.Types.ObjectId, ref: 'Colaborador', required: true },
    proyecto: { type: Schema.Types.ObjectId, ref: 'Proyecto', required: true },
    inicio: { type: Date, required: true },
    fin: { type: Date, default: null },
    esAnonima: { type: Boolean, default: false }
}, {
    timestamps: true,
    versionKey: false,
});

colaboracionSchema.loadClass(Colaboracion);

module.exports = mongoose.model('Colaboracion', colaboracionSchema);