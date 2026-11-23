const colectivoService = require('../services/colectivoService.js');
const { TipoColectivo } = require('../models/colectivo.js');
const { BadRequestError, NotFoundError } = require('../errors/AppError.js');
const { validarCreacionColectivo } = require('../validators/colectivosValidator.js');
const { ColectivoPublic } = require('../dtos/colectivoPublic.js');
const { Paginado } = require('../dtos/paginado.js');
const { ColaboradorCompatible } = require('../dtos/colaboradorPublic.js');
const { AdministradorPublic } = require('../dtos/administradorPublic.js');
const { AvisoModeracion } = require('../dtos/reportePublic.js');
const reporteService = require('../services/reporteService.js');
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
        const resultado = await this.colectivoService.desactivarColectivo(id, req.usuario);
        
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

     obtenerMiColectivo = async (req, res) => {
        const colectivo = await this.colectivoService.buscarPorUsuario(req.usuario.id)
        res.status(200).json(ColectivoPublic.desde(colectivo))
    }

    actualizarMiColectivo = async (req, res) => {
        const colectivo = await this.colectivoService.actualizarPorUsuario(req.usuario.id, req.body)
        res.status(200).json({ message: 'Colectivo actualizado exitosamente', data: ColectivoPublic.desde(colectivo) })
    }

    // Correcciones que moderación le pidió a la organización (los avisos van a la cuenta titular)
    obtenerMisAvisosModeracion = async (req, res) => {
        const colectivo = await this.colectivoService.buscarPorUsuario(req.usuario.id);
        if (!colectivo) throw new NotFoundError('El usuario no tiene un colectivo asociado');

        const avisos = await reporteService.obtenerAvisosDe(colectivo.usuario);
        res.status(200).json(avisos.map(AvisoModeracion.desde));
    }

    obtenerMisEstadisticas = async (req, res) => {
        const colectivo = await this.colectivoService.buscarPorUsuario(req.usuario.id);
        if (!colectivo) throw new NotFoundError('El usuario no tiene un colectivo asociado');

        const estadisticas = await this.colectivoService.obtenerEstadisticas(colectivo.id);
        res.status(200).json(estadisticas);
    }

    obtenerMisAdministradores = async (req, res) => {
        const { administradores, puedeGestionar } = await this.colectivoService.obtenerAdministradores(req.usuario.id);
        res.status(200).json({ puedeGestionar, data: administradores.map(AdministradorPublic.desde) });
    }

    agregarAdministrador = async (req, res) => {
        const { colectivo, administrador } = await this.colectivoService.agregarAdministrador(req.usuario.id, req.body);
        res.locals.idColectivo = colectivo.id;
        res.status(201).json({
            message: 'Administrador agregado exitosamente',
            data: AdministradorPublic.desde({ usuario: administrador, esTitular: false })
        });
    }

    quitarAdministrador = async (req, res) => {
        const { colectivo, administrador } = await this.colectivoService.quitarAdministrador(req.usuario.id, req.params.idUsuario);
        res.locals.idColectivo = colectivo.id;
        res.locals.administrador = administrador;
        res.status(200).json({ message: 'Administrador quitado exitosamente' });
    }

    obtenerMisPotencialesColaboradores = async (req, res) => {
        const colectivo = await this.colectivoService.buscarPorUsuario(req.usuario.id);
        if (!colectivo) throw new NotFoundError('El usuario no tiene un colectivo asociado');

        const { proyectos, pagina, limite, orden, direccion } = req.query;
        const resultado = await this.colectivoService.obtenerPotencialesColaboradores(
            colectivo.id,
            proyectos ?? [],
            { pagina, limite, orden, direccion }
        );

        res.status(200).json(Paginado.desde(resultado.colaboradores, resultado, ColaboradorCompatible));
    }
}

module.exports = { ColectivoController };
