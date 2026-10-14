const { z } = require('zod');
const colaboradorService = require('../services/colaboradorService.js');
const colaboracionService = require('../services/colaboracionService.js');
const habilidadService = require('../services/habilidadService.js');
const proyectoService = require('../services/proyectoService.js');
const { BadRequestError } = require('../errors/AppError.js');

const colaboradorSchema = z.object({
    nombre: z.string().min(1),
    apellido: z.string().min(1),
    nombreFantasia: z.string().optional(),
    cuentaGit: z.string().min(1),
    habilidades: z.array(z.string()).default([]),
    pronombres: z.string().optional(),
    presentacion: z.string().max(300).optional(),
}).strict()

class ColaboradorController {
    constructor() {
        this.colaboradorService = colaboradorService;
        this.colaboracionService = colaboracionService;
        this.habilidadService = habilidadService;
        this.proyectoService = proyectoService;
    }

    obtenerColaboradores = async (req, res) => {
        const colaboradores = await this.colaboradorService.obtenerTodos();
        res.status(200).json(colaboradores)
    }

    crearColaborador = async (req, res) => {
        const resultado = colaboradorSchema.safeParse(req.body)
        if (resultado.error) {
            throw new BadRequestError("Datos inválidos", resultado.error.issues)
        }

        const colaboradoraNueva = await this.colaboradorService.crear(resultado.data)
        res.status(201).json({ message: 'Colaboradora creada exitosamente', data: colaboradoraNueva })
    }

    obtenerColaboradorPorCuentaGit = async (req, res) => {
        const colaborador = await this.colaboradorService.obtenerPorCuentaGit(req.params.cuentaGit)
        res.status(200).json(colaborador)
    }

    anotarColaboradorAProyecto = async (req, res) => {
        const { cuentaGit, idProyecto } = req.params;
        const colaborador = await this.colaboradorService.obtenerPorCuentaGit(cuentaGit)
        const colaboracion = await this.colaboracionService.crear({
            idColaborador: colaborador._id.toString(),
            idProyecto
        })
        res.status(200).json({ message: 'Colaboradora anotada al proyecto exitosamente', data: colaboracion })
    }

    llenarDatosPrueba = async (req, res) => {
        let lista = Array.isArray(req.body) && req.body.length > 0 ? req.body : null;

        if (!lista) {
            const ids = (await this.habilidadService.obtenerTodas()).map(h => h.id);
            lista = [
                {
                    nombre: "Juan",
                    apellido: "Pérez",
                    nombreFantasia: "Juani",
                    cuentaGit: "juanperez",
                    habilidades: ids.slice(0, 2),
                    pronombres: "Él",
                    presentacion: "Desarrollador backend apasionado por Node.js"
                },
                {
                    nombre: "María",
                    apellido: "Gómez",
                    nombreFantasia: "Mari",
                    cuentaGit: "mariagomez",
                    habilidades: ids.slice(1, 2),
                    pronombres: "Ella",
                    presentacion: "Frontend dev y diseñadora UX"
                }
            ];
        }

        const creados = [];
        for (const datos of lista) {
            const resultado = colaboradorSchema.safeParse(datos)
            if (resultado.error) {
                throw new BadRequestError("Datos inválidos", resultado.error.issues)
            }
            creados.push(await this.colaboradorService.crear(resultado.data));
        }

        return res.status(201).json({ status: "success", data: creados });
    }

    buscarPotencialesProyectos = async (req, res) => {
        const proyectos = await this.proyectoService.buscarPotencialesProyectos(req.params.cuentaGit);
        res.status(200).json(proyectos);
    }
}

module.exports = { ColaboradorController };
