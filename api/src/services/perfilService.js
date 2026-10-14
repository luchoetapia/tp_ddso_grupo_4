const mongoose = require('mongoose');
const perfilRepository = require('../repositories/perfilRepository.js');
const habilidadService = require('./habilidadService.js');
const colaboradorService = require('./colaboradorService.js');
const { BadRequestError, NotFoundError } = require('../errors/AppError.js');

class PerfilService {
    constructor() {
        this.perfilRepository = perfilRepository;
        this.habilidadService = habilidadService;
        this.colaboradorService = colaboradorService;
    }

    obtenerTodos = async () => {
        return await this.perfilRepository.findAll();
    }

    obtenerPorId = async (id) => {
        if (!mongoose.isValidObjectId(id)) {
            throw new BadRequestError("Id de perfil inválido");
        }
        const perfil = await this.perfilRepository.findById(id);
        if (!perfil) {
            throw new NotFoundError("Perfil no encontrado");
        }
        return perfil;
    }

    crear = async (datos) => {
        if (datos.habilidadesRequeridas && datos.habilidadesRequeridas.length > 0) {
            await this.habilidadService.obtenerPorListaId(datos.habilidadesRequeridas);
        }
        
    
        if (datos.habilidadesOpcionales && datos.habilidadesOpcionales.length > 0) {
            await this.habilidadService.obtenerPorListaId(datos.habilidadesOpcionales);
        }

        return await this.perfilRepository.save(datos);
    }

    crearVarios = async (listaDatos) => {
        const creados = [];
        for (const datos of listaDatos) {
            creados.push(await this.crear(datos));
        }
        return creados;
    }

    actualizar = async (id, datos) => {
        await this.obtenerPorId(id); 
        return await this.perfilRepository.update(id, datos);
    }

    buscarColaboradoras = async (id) => {
        const perfil = await this.obtenerPorId(id);
        return await this.colaboradorService.buscarPorPerfil(perfil);
    }

    eliminar = async (id) => {
        await this.obtenerPorId(id); 
        return await this.perfilRepository.delete(id);
    }
}

module.exports = new PerfilService();