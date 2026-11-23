const mongoose = require('mongoose');
const paginable = require('../plugins/paginable');
const { TipoColectivo, Colectivo } = require('../../models/colectivo')

const Schema = mongoose.Schema;
const valuesTipoColectivo = Object.values(TipoColectivo);


const colectivoSchema = new Schema({
    nombre: { type: String, required: true },
    active: { type: Boolean, default: true },
    // Cuenta titular (la que registró el colectivo)
    usuario: { type: Schema.Types.ObjectId, ref: 'Usuario', required: true },
    // Cuentas adicionales que también administran el colectivo
    administradores: [{ type: Schema.Types.ObjectId, ref: 'Usuario' }],
    descripcion: { type: String, required: true },
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
// Un usuario tiene como máximo un colectivo (parcial: ignora documentos viejos sin usuario)
colectivoSchema.index({ usuario: 1 }, { unique: true, partialFilterExpression: { usuario: { $exists: true } } });

colectivoSchema.index({ administradores: 1 });

colectivoSchema.loadClass(Colectivo);

colectivoSchema.plugin(paginable);

module.exports = mongoose.model('Colectivo', colectivoSchema);