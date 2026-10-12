const mongoose = require('mongoose');

const {tipoHabilidad} = require('../../models/dominio')

const Schema = mongoose.Schema;

const valuesTipoHabilidad = Object.values(tipoHabilidad);

const habilidadSchema = new Schema({
    titulo: {type: String, required: true},
    tipoHabilidad: {type: String, enum: valuesTipoHabilidad, required: true},
    descripcion: {type: String, requiered: true}
}, {
    timestamps: true,
    versionKey: false,
});

module.exports = mongoose.model('Habilidad', habilidadSchema);