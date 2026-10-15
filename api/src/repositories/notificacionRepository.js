const NotificacionModel = require('../database/schemas/notificacionSchema.js');

class NotificacionRepository {
    async findByDestinatario(idColaborador) {
        return await NotificacionModel.find({ destinatario: idColaborador })
            .sort({ fecha: -1 });
    }

    async save(datos) {
        const notificacion = new NotificacionModel(datos);
        return await notificacion.save();
    }
}

module.exports = new NotificacionRepository();
