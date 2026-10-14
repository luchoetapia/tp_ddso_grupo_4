const { z } = require('zod');
const logroService = require('../services/logroService.js');
const { BadRequestError } = require('../errors/AppError.js');

const logroSchema = z.object({
    titulo: z.string().min(1),
    descripcion: z.string().min(1)
}).strict();

class LogroController {
    constructor() {
        this.logroService = logroService;
    }

    obtenerLogros = async (req, res) => {
        const logros = await this.logroService.obtenerTodos(req.params.idProyecto);
        res.status(200).json(logros);
    }

    obtenerLogroPorId = async (req, res) => {
        const logro = await this.logroService.obtenerPorId(req.params.idLogro, req.params.idProyecto);
        res.status(200).json(logro);
    }

    crearLogro = async (req, res) => {
        const resultado = logroSchema.safeParse(req.body);  
        if (resultado.error) {
            throw new BadRequestError("Datos inválidos", resultado.error.issues);
        }   
        const logroNuevo = await this.logroService.crear(req.params.idProyecto, resultado.data);
        res.status(201).json({ message: 'Logro creado exitosamente', data: logroNuevo });
    }

    actualizarLogro = async (req, res) => {
        const resultado = logroSchema.safeParse(req.body); 
        if (resultado.error) {
            throw new BadRequestError("Datos inválidos", resultado.error.issues);
        }   
        const logroActualizado = await this.logroService.actualizar(req.params.idLogro, req.params.idProyecto, resultado.data);
        res.status(200).json({ message: 'Logro actualizado exitosamente', data: logroActualizado });
    }

    eliminarLogro = async (req, res) => {
        const resultado= await this.logroService.eliminar(req.params.idLogro, req.params.idProyecto);
        res.status(200).json(resultado);
    }

    llenarDatosPrueba = async (req, res) => {
        const LOGROS_INICIALES = [
            {
                titulo: "Lanzamiento de versión Beta",
                descripcion: "Se desplegó la primera versión funcional del sistema para pruebas con usuarios finales."
            },
            {
                titulo: "Primeros 100 usuarios registrados",
                descripcion: "La plataforma alcanzó el hito de 100 colaboradores registrados activos."
            }
        ];

        const lista = Array.isArray(req.body) && req.body.length > 0 ? req.body : LOGROS_INICIALES;

        const creados = [];
        for (const datos of lista) {
            const resultado = logroSchema.safeParse(datos);
            if (resultado.error) {
                throw new BadRequestError("Datos inválidos en seed de logro", resultado.error.issues);
            }
            creados.push(await this.logroService.crear(resultado.data));
        }

        return res.status(201).json({ status: "success", data: creados });
    }
}

module.exports = {LogroController};