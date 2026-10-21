const mongoose = require('mongoose');
const { Notificacion } = require('../../models/Notificacion');
const Schema = mongoose.Schema;

const notificacionSchema = new Schema({
    destinatario: { type: Schema.Types.ObjectId, ref: 'Colaborador', required: true },

    proyecto: {
        id: { type: Schema.Types.ObjectId, ref: 'Proyecto', required: true },
        titulo: { type: String, required: true }
    },
    perfil: {
        id: { type: Schema.Types.ObjectId, ref: 'Perfil', required: true },
        descripcion: { type: String, required: true }
    },
    mensaje: { type: String, required: true },
    fecha: { type: Date, default: Date.now }
}, {
    timestamps: true,
    versionKey: false
});

notificacionSchema.loadClass(Notificacion);

module.exports = mongoose.model('Notificacion', notificacionSchema);
