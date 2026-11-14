const colectivoService = require('../services/colectivoService.js');
const { TipoColectivo } = require('../models/colectivo.js');
const { BadRequestError } = require('../errors/AppError.js');
const { validarCreacionColectivo } = require('../validators/colectivosValidator.js');
const { ColectivoPublic } = require('../dtos/colectivoPublic.js');
const { Paginado } = require('../dtos/paginado.js');
const { crearUsuarioDeSemilla } = require('../auth/usuarioSemilla.js');
const { roles } = require('../auth/models/usuario.js');

class ColectivoController {
    constructor() {
        this.colectivoService = colectivoService;
    }

    obtenerColectivos = async (req, res) => {
        const { activos, pagina, limite, orden, direccion } = req.query;

        const resultado = activos === 'true'
            ? await this.colectivoService.obtenerActivos({ pagina, limite, orden, direccion })
            : await this.colectivoService.obtenerTodos({ pagina, limite, orden, direccion });

        res.status(200).json(Paginado.desde(resultado.colectivos, resultado, ColectivoPublic))
    }

    crearColectivo = async (req, res) => {
        const colectivoNuevo = await this.colectivoService.crear(req.body, req.usuario.id)
        res.status(201).json({ message: 'Colectivo creado exitosamente', data: ColectivoPublic.desde(colectivoNuevo) })
    }

    obtenerColectivoPorId = async (req, res) => {
        const colectivo = await this.colectivoService.obtenerPorId(req.params.id)
        res.status(200).json(ColectivoPublic.desde(colectivo))
    }

    desactivarColectivo = async (req, res) => {
        const { id } = req.params;
        const resultado = await this.colectivoService.desactivarColectivo(id);
        
        res.status(200).json(resultado);
    }

    llenarDatosPrueba = async (req, res) => {
        const COLECTIVOS_INICIALES = [
            {
                nombre: "Colectivo Software Libre",
                descripcion: "Comunidad enfocada en desarrollo de software abierto",
                ubicacion: "Buenos Aires",
                tipo: TipoColectivo.ONG,
                proyectos: []
            },
            {
                nombre: "Tech For Good",
                descripcion: "Proyectos tecnológicos con impacto social",
                ubicacion: "Córdoba",
                tipo: TipoColectivo.FUNDACION,
                proyectos: []
            }
        ];

        const lista = Array.isArray(req.body) && req.body.length > 0 ? req.body : COLECTIVOS_INICIALES;

        const creados = [];
        for (const datos of lista) {
            const resultado = validarCreacionColectivo.safeParse(datos)
            if (resultado.error) {
                throw new BadRequestError("Datos inválidos", resultado.error.issues)
            }
            const usuario = await crearUsuarioDeSemilla(resultado.data.nombre, roles.COLECTIVO)
            creados.push(await this.colectivoService.crear(resultado.data, usuario.id));
        }

        return res.status(201).json({ status: "success", data: creados.map(ColectivoPublic.desde) });
    }
}

module.exports = { ColectivoController };
