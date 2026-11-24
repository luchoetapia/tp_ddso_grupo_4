const mongoose = require('mongoose');
const { Notificacion } = require('../../models/Notificacion');
const Schema = mongoose.Schema;

const notificacionSchema = new Schema({
    destinatario: { type: Schema.Types.ObjectId, ref: 'Usuario', required: true },
    mensaje: { type: String, required: true },
    automatica: { type: Boolean, default: false },
    fecha: { type: Date, default: Date.now }
}, {
    timestamps: true,
    versionKey: false
});

// findByDestinatario ordenado por fecha descendente
notificacionSchema.index({ destinatario: 1, fecha: -1 });

notificacionSchema.loadClass(Notificacion);

module.exports = mongoose.model('Notificacion', notificacionSchema);
