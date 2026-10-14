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

    toDTO = (perfil) => {
        return {
            id: perfil.id || perfil._id?.toString(),
            descripcion: perfil.descripcion,
            habilidadesRequeridas: perfil.habilidadesRequeridas ? perfil.habilidadesRequeridas.map(h => (typeof h === 'object' && h.toDTO ? h.toDTO() : h)) : [],
            habilidadesOpcionales: perfil.habilidadesOpcionales ? perfil.habilidadesOpcionales.map(h => (typeof h === 'object' && h.toDTO ? h.toDTO() : h)) : [],
            tipoCompromiso: perfil.tipoCompromiso,
            modalidadColaboracion: perfil.modalidadColaboracion
        };
    }

    obtenerTodos = async () => {
        const perfiles = await this.perfilRepository.findAll();
        return perfiles.map(this.toDTO);
    }

    obtenerPorId = async (id) => {
        if (!mongoose.isValidObjectId(id)) {
            throw new BadRequestError("Id de perfil inválido");
        }
        const perfil = await this.perfilRepository.findById(id);
        if (!perfil) {
            throw new NotFoundError("Perfil no encontrado");
        }
        return this.toDTO(perfil);
    }

    crear = async (datos) => {
        if (datos.habilidadesRequeridas && datos.habilidadesRequeridas.length > 0) {
            await this.habilidadService.obtenerPorListaId(datos.habilidadesRequeridas);
        }
        
    
        if (datos.habilidadesOpcionales && datos.habilidadesOpcionales.length > 0) {
            await this.habilidadService.obtenerPorListaId(datos.habilidadesOpcionales);
        }

        const creado = await this.perfilRepository.save(datos);
        return this.toDTO(creado);
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
        const actualizado = await this.perfilRepository.update(id, datos);
        return this.toDTO(actualizado);
    }

    buscarColaboradoras = async (id) => {
        const perfil = await this.obtenerPorId(id);
        return await this.colaboradorService.buscarPorPerfil(perfil);
    }

    eliminar = async (id) => {
        await this.obtenerPorId(id); 
        return await this.perfilRepository.delete(id);
    }

    perfilesQueCumplenHabilidadesRequeridas = async (habilidades) => {
        const perfiles = await this.perfilRepository.findAll();
        return perfiles.filter(perfil => perfil.cumpleHabilidadesRequeridas(habilidades));
    }
}

module.exports = new PerfilService();