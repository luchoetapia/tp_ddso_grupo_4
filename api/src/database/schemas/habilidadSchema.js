const mongoose = require('mongoose');
const { TipoHabilidad, Habilidad } = require('../../models/habilidad')

const Schema = mongoose.Schema;
const valuesTipoHabilidad = Object.values(TipoHabilidad);

const habilidadSchema = new Schema({
    titulo: {type: String, required: true},
    tipoHabilidad: {type: String, enum: valuesTipoHabilidad, required: true},
    descripcion: {type: String, required: true}
}, {
    timestamps: true,
    versionKey: false,
});

// findByTitulo
habilidadSchema.index({ titulo: 1 });

habilidadSchema.loadClass(Habilidad)

module.exports = mongoose.model('Habilidad', habilidadSchema);