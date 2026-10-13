const { z } = require('zod');
const proyectoService = require('../services/proyectoService.js');
const colectivoService = require('../services/colectivoService.js');
const habilidadService = require('../services/habilidadService.js');
const {Periodo} = require("../models/dominio.js");
const { BadRequestError } = require('../errors/AppError.js');

const proyectoSchema = z.object({
    titulo: z.string().min(1),
    descripcion: z.string().optional(),
    habilidades: z.array(z.string()).optional(),
    tipoCompromiso: z.object({
        cantHoras: z.number().positive(),
        periodo: z.enum(Object.values(Periodo))
    }),
    modalidadColaboracion: z.object({
        incentivoEconomico: z.float32(),
        posibleContratacion: z.boolean()
    })
}).strict();

class ProyectoController {
    constructor() {
        this.proyectoService = proyectoService;
        this.colectivoService = colectivoService
        this.habilidadService = habilidadService
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
            const habilidades = await this.habilidadService.obtenerTodas();
            lista = [
                {
                    titulo: "Plataforma Educativa",
                    descripcion: "Desarrollo de aula virtual accesible",
                    habilidades: habilidades.slice(0, 2).map(h => h._id.toString()),
                    tipoCompromiso: {
                        cantHoras: 10,
                        periodo: Periodo.SEMANAL
                    },
                    modalidadColaboracion: {
                        incentivoEconomico: 0,
                        posibleContratacion: false
                    }
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
}

module.exports = { ProyectoController };
