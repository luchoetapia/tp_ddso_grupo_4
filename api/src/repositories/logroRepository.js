const ProyectoModel = require('../database/schemas/logroSchema.js');

class LogroRepository {
    async findAllByProyecto(idProyecto) {
        const proyecto = await ProyectoModel.findById(idProyecto);
        return proyecto ? proyecto.logros : null;
    }

    async findById(idLogro, idProyecto) {
         const proyecto = await ProyectoModel.findById(idProyecto);

        if (!proyecto) {
            return null;
        }

        return proyecto.logros.id(idLogro);
    }

    async save(idProyecto, datos) {
        const proyecto = await ProyectoModel.findById(idProyecto);

        if (!proyecto) {
            return null;
        }

        proyecto.logros.push(datos);
        await proyecto.save();

        return proyecto.logros[proyecto.logros.length - 1];
    }

    async update(idLogro, idProyecto, cambios) {
        const proyecto = await ProyectoModel.findById(idProyecto);

        if (!proyecto) {
            return null;
        }

        const logro = proyecto.logros.id(idLogro);

        if (!logro) {
            return null;
        }

        logro.set(cambios);
        await proyecto.save();

        return logro;
    }

    async delete(idLogro, idProyecto) {
        const proyecto = await ProyectoModel.findById(idProyecto);

        if (!proyecto) {
            return null;
        }

        const logro = proyecto.logros.id(idLogro);

        if (!logro) {
            return null;
        }

        proyecto.logros.pull(idLogro);
        await proyecto.save();

        return logro;
    }
}

module.exports = new LogroRepository();
