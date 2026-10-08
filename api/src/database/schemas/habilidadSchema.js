const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const habilidadSchema = new Schema({
    titulo: {type: String, required: true},
    tipoHabilidad: {type: String, enum: valuesTipoHabilidad, required: true},
    //TODO: Agregar validaciones de los campos
})