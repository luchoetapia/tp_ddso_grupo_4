const { z } = require('zod');
const proyectoService = require('../services/proyectoService.js');
const colectivoService = require('../services/colectivoService.js');
const {Periodo} = require("../models/dominio.js");
const { BadRequestError } = require('../errors/AppError.js');

const proyectoSchema = z.object({
    id: z.number().int().positive(),
    titulo: z.string().min(1),
    descripcion: z.string().optional(),
    habilidades: z.array(z.number().int().positive()).optional(),
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
    }

    obtenerProyectos = (req, res) => {
        const proyectos = this.proyectoService.obtenerTodos();
        res.status(200).json(proyectos)
    }

    crearProyecto = (req, res) => {
        const resultado = proyectoSchema.safeParse(req.body)
        if (resultado.error) {
            throw new BadRequestError("Datos inválidos", resultado.error.issues)
        }
        const proyectoNuevo = this.proyectoService.crear(resultado.data)
        res.status(201).json({ message: 'Proyecto creado exitosamente', data: proyectoNuevo })
    }

    obtenerProyectoPorId = (req, res) => {
        const { id } = req.params
        const proyecto = this.proyectoService.obtenerPorId(parseInt(id))

        if (!proyecto) {
            return res.status(404).json({ message: 'Proyecto no encontrado' })
        }
        res.status(200).json(proyecto)
    }

    finalizarProyecto = (req, res) => {
        const { id } = req.params;
        const { idColectivo } = req.body; 

        if (!idColectivo) {
            throw new BadRequestError("Se requiere idColectivo para finalizar el proyecto");
        }

        const proyecto = this.colectivoService.finalizarProyecto(parseInt(idColectivo, 10), parseInt(id, 10));
    
        res.status(200).json({ 
            message: 'Proyecto finalizado exitosamente por el colectivo', 
            data: proyecto 
        });
    }

    seed = (req, res) => {
        const PROYECTOS_INICIALES = [
            {
                id: 1,
                titulo: "Plataforma Educativa",
                descripcion: "Desarrollo de aula virtual accesible",
                habilidades: [1, 2],
                tipoCompromiso: {
                    cantHoras: 10,
                    periodo: "SEMANAL" 
            },
                modalidadColaboracion: {
                incentivoEconomico: 0,
                posibleContratacion: false
            }
            }
        ];

        const lista = Array.isArray(req.body) && req.body.length > 0 ? req.body : PROYECTOS_INICIALES;
        const creados = lista.map(datos => this.proyectoService.crear(datos));

        return res.status(201).json({ status: "success", data: creados });
    }
}

module.exports = { ProyectoController };
