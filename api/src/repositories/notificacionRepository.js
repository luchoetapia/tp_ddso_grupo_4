const NotificacionModel = require('../database/schemas/notificacionSchema.js');

class NotificacionRepository {
    // idsUsuarios: id o lista de ids de usuario
    async findByDestinatario(idsUsuarios) {
        const ids = [].concat(idsUsuarios);
        return await NotificacionModel.find({ destinatario: { $in: ids } })
            .sort({ fecha: -1 });
    }

    async save(datos) {
        const notificacion = new NotificacionModel(datos);
        return await notificacion.save();
    }
}

module.exports = new NotificacionRepository();
