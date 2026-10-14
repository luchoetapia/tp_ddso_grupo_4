const mongoose = require('mongoose');
const proyectoRepository = require('../repositories/proyectoRepository.js');
const {BadRequestError, NotFoundError} = require('../errors/AppError.js');

class LogroService{
    constructor(){
        this.proyectoRepository = proyectoRepository;
    }

    obtenerTodos = async (idProyecto) => {  
        if (!mongoose.isValidObjectId(idProyecto)) 
            throw new BadRequestError("Id de proyecto inválido");
        
        const logros = await this.proyectoRepository.logrosDelProyecto(idProyecto);

        if (logros === null) 
            throw new NotFoundError("Proyecto no encontrado");
        return logros;
    }

    obtenerPorId = async (idLogro, idProyecto) => {
        if (!mongoose.isValidObjectId(idLogro) || !mongoose.isValidObjectId(idProyecto))
            throw new BadRequestError("Id de logro o proyecto inválido");

        const logros = await this.proyectoRepository.logrosDelProyecto(idProyecto);
        if (logros === null)
            throw new NotFoundError("Proyecto no encontrado");

        const logro = logros.id(idLogro);
        if (!logro)
            throw new NotFoundError("Logro no encontrado");
        return logro;
    }

    crear = async (idProyecto, datos) => {
        if (!mongoose.isValidObjectId(idProyecto)) {
            throw new BadRequestError("Id de proyecto inválido");
        }

        const proyecto = await this.proyectoRepository.agregarLogro(idProyecto, datos);
        if (proyecto === null)
            throw new NotFoundError("Proyecto no encontrado");

        return proyecto.logros.at(-1);
    }

    actualizar = async (idLogro, idProyecto, cambios) => {
        if (!mongoose.isValidObjectId(idLogro) || !mongoose.isValidObjectId(idProyecto))
            throw new BadRequestError("Id de logro o proyecto inválido");

        const proyecto = await this.proyectoRepository.modificarLogro(idProyecto, idLogro, cambios);
        if (!proyecto)
            throw new NotFoundError("Logro o proyecto no encontrado");

        return proyecto.logros.id(idLogro);
    }

    eliminar = async (idLogro, idProyecto) => {
        if (!mongoose.isValidObjectId(idLogro) || !mongoose.isValidObjectId(idProyecto))
            throw new BadRequestError("Id de logro o proyecto inválido");

        const proyecto = await this.proyectoRepository.eliminarLogro(idProyecto, idLogro);
        if (!proyecto) 
            throw new NotFoundError("Logro o proyecto no encontrado");

        return {mensaje: "Logro eliminado correctamente"};
    }
}

module.exports = new LogroService();