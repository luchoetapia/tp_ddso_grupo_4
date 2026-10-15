const perfilService = require('../services/perfilService.js');
const { Periodo } = require('../models/dominio.js');
const { BadRequestError } = require('../errors/AppError.js');
const { validarCreacionPerfil } = require('../validators/perfilesValidator.js');

class PerfilController {
    constructor() {
        this.perfilService = perfilService;
    }

    obtenerPerfiles = async (req, res) => {
        const perfiles = await this.perfilService.obtenerTodos();
        res.status(200).json(perfiles);
    }

    obtenerPerfilPorId = async (req, res) => {
        const perfil = await this.perfilService.obtenerPorId(req.params.id);
        res.status(200).json(perfil);
    }

    crearPerfil = async (req, res) => {
        const perfilNuevo = await this.perfilService.crear(req.body);
        res.status(201).json({ message: 'Perfil creado exitosamente', data: perfilNuevo });
    }

    actualizarPerfil = async (req, res) => {
        const perfilActualizado = await this.perfilService.actualizar(req.params.id, req.body);
        res.status(200).json({ message: 'Perfil actualizado exitosamente', data: perfilActualizado });
    }

    eliminarPerfil = async (req, res) => {
        await this.perfilService.eliminar(req.params.id);
        res.status(200).json({ message: 'Perfil eliminado exitosamente' });
    }

    llenarDatosPrueba = async (req, res) => {
        const PERFILES_INICIALES = [
            {
                descripcion: "Desarrollador Backend Node.js / Express",
                habilidadesRequeridas: [], 
                habilidadesOpcionales: [],
                tipoCompromiso: {
                    cantHoras: 10,
                    periodo: Periodo.SEMANAL
                },
                modalidadColaboracion: {
                    incentivoEconomico: 0,
                    posibleContratacion: true
                }
            },
            {
                descripcion: "Diseñador UX/UI para Aplicaciones Web",
                habilidadesRequeridas: [],
                habilidadesOpcionales: [],
                tipoCompromiso: {
                    cantHoras: 20,
                    periodo: Periodo.MENSUAL
                },
                modalidadColaboracion: {
                    incentivoEconomico: 15000,
                    posibleContratacion: false
                }
            }
        ];

        const lista = Array.isArray(req.body) && req.body.length > 0 ? req.body : PERFILES_INICIALES;

        const creados = [];
        for (const datos of lista) {
            const resultado = validarCreacionPerfil.safeParse(datos);
            if (resultado.error) {
                throw new BadRequestError("Datos inválidos en seed de perfil", resultado.error.issues);
            }
            creados.push(await this.perfilService.crear(resultado.data));
        }

        return res.status(201).json({ status: "success", data: creados });
    }
}

module.exports = { PerfilController };