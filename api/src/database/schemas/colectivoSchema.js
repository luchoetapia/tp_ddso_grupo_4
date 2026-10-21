const mongoose = require('mongoose');
const { TipoColectivo, Colectivo } = require('../../models/colectivo')

const Schema = mongoose.Schema;
const valuesTipoColectivo = Object.values(TipoColectivo);


const colectivoSchema = new Schema({
    nombre: { type: String, required: true },
    active: { type: Boolean, default: true },
    descripcion: { type: String, default: "" },
    ubicacion: { type: String, default: null },
    tipo: { type: String, enum: valuesTipoColectivo, required: true },
    proyectos: [{ type: Schema.Types.ObjectId, ref: 'Proyecto' }]
}, {
    timestamps: true,
    versionKey: false,
})

colectivoSchema.loadClass(Colectivo);

module.exports = mongoose.model('Colectivo', colectivoSchema);