const habilidadService = require('../services/habilidadService.js');
const { TipoHabilidad } = require('../models/habilidad.js');
const { BadRequestError } = require('../errors/AppError.js');
const { validarCreacionHabilidad } = require('../validators/habilidadesValidator.js');
const { HabilidadPublic } = require('../dtos/habilidadPublic.js');

class HabilidadController {
    constructor() {
        this.habilidadService = habilidadService;
    }

    obtenerHabilidades = async (req, res) => {
        const habilidades = await this.habilidadService.obtenerTodas();
        res.status(200).json(habilidades.map(HabilidadPublic.desde))
    }

    crearHabilidad = async (req, res) => {
        const habilidadNueva = await this.habilidadService.crear(req.body)
        res.status(201).json({ message: 'Habilidad creada exitosamente', data: HabilidadPublic.desde(habilidadNueva) })
    }

    obtenerHabilidadPorId = async (req, res) => {
        const habilidad = await this.habilidadService.obtenerPorId(req.params.id)
        res.status(200).json(HabilidadPublic.desde(habilidad))
    }

    llenarDatosPrueba = async (req, res) => {
        const HABILIDADES_INICIALES = [
            {
                titulo: "JavaScript",
                tipoHabilidad: TipoHabilidad.PROGRAMACION,
                descripcion: "Lenguaje de programación de desarrollo web"
            },
            {
                titulo: "Node.js",
                tipoHabilidad: TipoHabilidad.PROGRAMACION,
                descripcion: "Entorno de ejecución para JavaScript"
            }
        ];

        const lista = Array.isArray(req.body) && req.body.length > 0 ? req.body : HABILIDADES_INICIALES;

        const creadas = [];
        for (const datos of lista) {
            const resultado = validarCreacionHabilidad.safeParse(datos)
            if (resultado.error) {
                throw new BadRequestError("Datos inválidos", resultado.error.issues)
            }
            creadas.push(await this.habilidadService.crear(resultado.data));
        }

        return res.status(201).json({ status: "success", data: creadas.map(HabilidadPublic.desde) });
    }
}

module.exports = { HabilidadController };
