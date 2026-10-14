const mongoose = require('mongoose');
const proyectoRepository = require('../repositories/proyectoRepository.js');
const {BadRequestError, NotFoundError} = require('../errors/AppError.js');

class LogroService{
    constructor(){
        this.proyectoRepository = proyectoRepository;
    }

    toDTO = (logro) => {
        return {
            id: logro.id || logro._id?.toString(),
            titulo: logro.titulo,
            descripcion: logro.descripcion
        };
    }

    toDTO = (logro) => {
        return {
            id: logro.id || logro._id?.toString(),
            titulo: logro.titulo,
            descripcion: logro.descripcion
        };
    }

    obtenerTodos = async (idProyecto) => {  
        if (!mongoose.isValidObjectId(idProyecto)) 
            throw new BadRequestError("Id de proyecto inválido");
        
        const logros = await this.proyectoRepository.logrosDelProyecto(idProyecto);

        if (logros === null) 
            throw new NotFoundError("Proyecto no encontrado");
        }
        return logros.map(l => this.toDTO(l));
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
        }
        return this.toDTO(logro);
    }

    crear = async (idProyecto, datos) => {
        if (!mongoose.isValidObjectId(idProyecto)) {
            throw new BadRequestError("Id de proyecto inválido");
        }

        const proyecto = await this.proyectoRepository.agregarLogro(idProyecto, datos);
        if (proyecto === null)
            throw new NotFoundError("Proyecto no encontrado");

        const creado = await this.logroRepository.save(idProyecto, datos);
        return this.toDTO(creado);

    }

    actualizar = async (idLogro, idProyecto, cambios) => {
        await this.obtenerPorId(idLogro, idProyecto); 
        const logro = await this.logroRepository.update(idLogro, idProyecto, cambios);
        return this.toDTO(logro);
    }

    eliminar = async (idLogro, idProyecto) => {
        await this.obtenerPorId(idLogro, idProyecto); 
        await this.logroRepository.delete(idLogro, idProyecto);
        return this.toDTO({mensaje: "Logro eliminado correctamente"});
    }
}

module.exports = new LogroService();