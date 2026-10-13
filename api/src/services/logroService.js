const mongoose = require('mongoose');
const logroRepository = require('../repositories/logroRepository.js');
const {BadRequestError, NotFoundError} = require('../errors/AppError.js');

class LogroService{
    constructor(){
        this.logroRepository = logroRepository;
    }

    obtenerTodos = async (idProyecto) => {  
        if (!mongoose.isValidObjectId(idProyecto)) {
            throw new BadRequestError("Id de proyecto inválido");
        }
        const logros = await this.logroRepository.findAllByProyecto(idProyecto);

        if (logros === null) {
            throw new NotFoundError("Proyecto no encontrado");
        }
        return logros;
    }

    obtenerPorId = async (idLogro, idProyecto) => {
        if (!mongoose.isValidObjectId(idLogro) || !mongoose.isValidObjectId(idProyecto)) {
            throw new BadRequestError("Id de logro o proyecto inválido");
        }

        const logros = await this.logroRepository.findAllByProyecto(idProyecto); 
        if (logros === null) {
            throw new NotFoundError("Proyecto no encontrado");
        }

        const logro = await this.logroRepository.findById(idLogro, idProyecto);
        if (logro === null) {
            throw new NotFoundError("Logro no encontrado");
        }
        return logro;
    }

    crear = async (idProyecto, datos) => { 
        if (!mongoose.isValidObjectId(idProyecto)) {
            throw new BadRequestError("Id de proyecto inválido");
        }

        const logros = await this.logroRepository.findAllByProyecto(idProyecto);
        if (logros === null) {
            throw new NotFoundError("Proyecto no encontrado");
        }

        return await this.logroRepository.save(idProyecto, datos);

    }

    actualizar = async (idLogro, idProyecto, cambios) => {
        await this.obtenerPorId(idLogro, idProyecto); 
        const logro = await this.logroRepository.update(idLogro, idProyecto, cambios);
        return logro;
    }

    eliminar = async (idLogro, idProyecto) => {
        await this.obtenerPorId(idLogro, idProyecto); 
        await this.logroRepository.delete(idLogro, idProyecto);
        return {mensaje: "Logro eliminado correctamente"};
    }
}

module.exports = new LogroService();