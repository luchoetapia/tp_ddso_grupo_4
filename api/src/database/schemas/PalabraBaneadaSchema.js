const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const paginable = require('../plugins/paginable')
const { PalabraBaneada } = require('../../models/PalabraBaneada');

const palabraBaneadaSchema = new Schema({
    palabra: { type: String, required: true },
    activa: { type: Boolean, default: true }
}, { timestamps: true, versionKey: false });

palabraBaneadaSchema.index({ palabra: 1 }, { unique: true });
palabraBaneadaSchema.index({ activa: 1 });

palabraBaneadaSchema.loadClass(PalabraBaneada);
palabraBaneadaSchema.plugin(paginable);

module.exports = mongoose.model('PalabraBaneada', palabraBaneadaSchema);