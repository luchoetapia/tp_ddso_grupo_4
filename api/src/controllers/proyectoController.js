const { z } = require('zod');
const proyectoService = require('../services/proyectoService.js');
const colectivoService = require('../services/colectivoService.js');
const perfilService = require('../services/perfilService.js');
const logroService = require('../services/logroService.js');
const { Periodo } = require("../models/dominio.js");
const { BadRequestError } = require('../errors/AppError.js');

const proyectoSchema = z.object({
    titulo: z.string().min(1),
    descripcion: z.string().optional(),
    perfiles: z.array(z.string()).default([]),
    enlaceSistema: z.string().url().nullable().optional(),
    enlaceCodigoFuente: z.string().url().nullable().optional()
}).strict();

class ProyectoController {
    constructor() {
        this.proyectoService = proyectoService;
        this.colectivoService = colectivoService
        this.perfilService = perfilService;
        this.logroService = logroService
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
            const perfiles  = await this.perfilService.obtenerTodas();
            lista = [
                {
                    titulo: "Plataforma Educativa",
                    descripcion: "Desarrollo de aula virtual accesible",
                    perfiles: perfiles.slice(0, 2).map(p => p._id.toString()),
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

    obtenerLogrosDeUnProyecto = async (req, res) => {
        const { id } = req.params;
        
        const logros = await this.logroService.obtenerTodos(id);
        res.status(200).json(logros);
    }

    obtenerLogroPorId = async (req, res) => {
        const { id, idLogro } = req.params;

        const logro = await this.logroService.obtenerPorId(idLogro, id);
        res.status(200).json(logro);
    }

    crearLogro = async (req, res) => {
        const { id } = req.params;
        const datos = req.body;

        const logroCreado = await this.logroService.crear(id, datos);
        res.status(201).json({ message: 'Logro creado exitosamente', data: logroCreado });
    }

    actualizarLogro = async (req, res) => {
        const { id, idLogro } = req.params;
        const cambios = req.body;

        const logroActualizado = await this.logroService.actualizar(idLogro, id, cambios);
        res.status(200).json({ message: 'Logro actualizado exitosamente', data: logroActualizado });
    }

    eliminarLogro = async (req, res) => {
        const { id, idLogro } = req.params;

        const resultado = await this.logroService.eliminar(idLogro, id);
        res.status(200).json(resultado);
    }
}

module.exports = { ProyectoController };
