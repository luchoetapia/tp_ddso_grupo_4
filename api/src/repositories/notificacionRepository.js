const NotificacionModel = require('../database/schemas/notificacionSchema.js');

class NotificacionRepository {
    async findByDestinatario(idColaborador) {
        return await NotificacionModel.find({ destinatario: idColaborador })
            .sort({ fecha: -1 })
            .populate(['proyecto', 'perfil']);
    }

    async save(datos) {
        const notificacion = new NotificacionModel(datos);
        await notificacion.save();
        return await notificacion.populate(['proyecto', 'perfil']);
    }
}

module.exports = new NotificacionRepository();
