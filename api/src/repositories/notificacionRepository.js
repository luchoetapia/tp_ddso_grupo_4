const NotificacionModel = require('../database/schemas/notificacionSchema.js');

class NotificacionRepository {
    async findByDestinatario(idUsuario) {
        return await NotificacionModel.find({ destinatario: idUsuario })
            .sort({ fecha: -1 });
    }

    async save(datos) {
        const notificacion = new NotificacionModel(datos);
        return await notificacion.save();
    }
}

module.exports = new NotificacionRepository();
