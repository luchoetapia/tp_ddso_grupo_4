const mongoose = require('mongoose');
const { TipoColectivo, Colectivo } = require('../../models/colectivo')

const Schema = mongoose.Schema;
const valuesTipoColectivo = Object.values(TipoColectivo);


const colectivoSchema = new Schema({
    nombre: { type: String, required: true },
    active: { type: Boolean, default: true },
    usuario: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    descripcion: { type: String, default: "" },
    ubicacion: { type: String, default: null },
    tipo: { type: String, enum: valuesTipoColectivo, required: true },
    proyectos: [{ type: Schema.Types.ObjectId, ref: 'Proyecto' }]
}, {
    timestamps: true,
    versionKey: false,
})

// findByNombre
colectivoSchema.index({ nombre: 1 });
// Listado de colectivos activos
colectivoSchema.index({ active: 1 });

colectivoSchema.loadClass(Colectivo);

module.exports = mongoose.model('Colectivo', colectivoSchema);