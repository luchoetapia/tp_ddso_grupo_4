const { z } = require('zod');
const proyectoService = require('../services/proyectoService.js');
const colectivoService = require('../services/colectivoService.js');
const perfilService = require('../services/perfilService.js');
const notificacionService = require('../services/notificacionService.js');
const {Periodo} = require("../models/dominio.js");
const { BadRequestError } = require('../errors/AppError.js');

const proyectoSchema = z.object({
    titulo: z.string().min(1),
    descripcion: z.string().optional(),
    perfiles: z.array(z.string()).default([]),
    enlaceSistema: z.string().url().nullable().optional(),
    enlaceCodigoFuente: z.string().url().nullable().optional()
}).strict();

const contactoSchema = z.object({
    cuentaGit: z.string().min(1),
    mensaje: z.string().min(1)
}).strict();

class ProyectoController {
    constructor() {
        this.proyectoService = proyectoService;
        this.colectivoService = colectivoService
        this.perfilService = perfilService;
        this.notificacionService = notificacionService;
    }

    obtenerProyectos = async (req, res) => {
        const proyectos = await this.proyectoService.obtenerTodos();
        res.status(200).json(proyectos)
    }

    crearProyecto = async (req, res) => {
        const resultado = proyectoSchema.safeParse(req.body)
        if (resultado.error) {
            throw new BadRequestError("Datos inválidos", resultado.error.issues)
        }
        const proyectoNuevo = await this.proyectoService.crear(resultado.data)
        res.status(201).json({ message: 'Proyecto creado exitosamente', data: proyectoNuevo })
    }

    obtenerProyectoPorId = async (req, res) => {
        const proyecto = await this.proyectoService.obtenerPorId(req.params.id)
        res.status(200).json(proyecto)
    }

    finalizarProyecto = async (req, res) => {
        const { id } = req.params;
        const { idColectivo } = req.body ?? {};

        if (!idColectivo) {
            throw new BadRequestError("Se requiere idColectivo para finalizar el proyecto");
        }

        const proyecto = await this.colectivoService.finalizarProyecto(idColectivo, id);

        res.status(200).json({
            message: 'Proyecto finalizado exitosamente por el colectivo',
            data: proyecto
        });
    }

    llenarDatosPrueba = async (req, res) => {
        let lista = Array.isArray(req.body) && req.body.length > 0 ? req.body : null;

        if (!lista) {
            const perfiles = await this.perfilService.obtenerTodos();
            lista = [
                {
                    titulo: "Plataforma Educativa",
                    descripcion: "Desarrollo de aula virtual accesible",
                    perfiles: perfiles.slice(0, 2).map(p => p.id),
                }
            ];
        }

        const creados = [];
        for (const datos of lista) {
            const resultado = proyectoSchema.safeParse(datos)
            if (resultado.error) {
                throw new BadRequestError("Datos inválidos", resultado.error.issues)
            }
            creados.push(await this.proyectoService.crear(resultado.data));
        }

        return res.status(201).json({ status: "success", data: creados });
    }

    buscarPotencialesColaboradores = async (req, res) => {
        const { id, idPerfil } = req.params;

        const potencialesColaboradores = await this.proyectoService.buscarPotencialesColaboradores(id, idPerfil);
        res.status(200).json(potencialesColaboradores);
    }

    contactarColaborador = async (req, res) => {
        const resultado = contactoSchema.safeParse(req.body)
        if (resultado.error) {
            throw new BadRequestError("Datos inválidos", resultado.error.issues)
        }

        const { id, idPerfil } = req.params;
        const { cuentaGit, mensaje } = resultado.data;
        const notificacion = await this.notificacionService.contactarColaborador(id, idPerfil, cuentaGit, mensaje);
        res.status(201).json({ message: 'Colaborador contactado exitosamente', data: notificacion });
    }
}

module.exports = { ProyectoController };
