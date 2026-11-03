const proyectoService = require('../services/proyectoService.js');
const colectivoService = require('../services/colectivoService.js');
const notificacionService = require('../services/notificacionService.js');
const logroService = require('../services/logroService.js');
const {Periodo} = require("../models/proyecto.js");
const { BadRequestError } = require('../errors/AppError.js');
const { validarCreacionProyecto } = require('../validators/proyectosValidator.js');
const { ProyectoPublic, ProyectoDetalle } = require('../dtos/proyectoPublic.js');
const { PerfilPublic } = require('../dtos/perfilPublic.js');
const { LogroPublic } = require('../dtos/logroPublic.js');
const { ColaboradorPublic } = require('../dtos/colaboradorPublic.js');
const { NotificacionPublic } = require('../dtos/notificacionPublic.js');

class ProyectoController {
    constructor() {
        this.proyectoService = proyectoService;
        this.colectivoService = colectivoService
        this.notificacionService = notificacionService;
        this.logroService = logroService;
    }

    obtenerProyectos = async (req, res) => {
        const proyectos = await this.proyectoService.obtenerTodos();
        res.status(200).json(proyectos.map(ProyectoPublic.desde))
    }

    crearProyecto = async (req, res) => {
        const proyectoNuevo = await this.proyectoService.crear(req.body)
        res.status(201).json({ message: 'Proyecto creado exitosamente', data: ProyectoDetalle.desde(proyectoNuevo) })
    }

    obtenerProyectoPorId = async (req, res) => {
        const proyecto = await this.proyectoService.obtenerPorId(req.params.id)
        res.status(200).json(ProyectoDetalle.desde(proyecto))
    }

    finalizarProyecto = async (req, res) => {
        const { id } = req.params;
        const { idColectivo } = req.body;

        const proyecto = await this.colectivoService.finalizarProyecto(idColectivo, id);

        res.status(200).json({
            message: 'Proyecto finalizado exitosamente por el colectivo',
            data: ProyectoDetalle.desde(proyecto)
        });
    }

    llenarDatosPrueba = async (req, res) => {
        let lista = Array.isArray(req.body) && req.body.length > 0 ? req.body : null;

        if (!lista) {
            lista = [
                {
                    titulo: "Plataforma Educativa",
                    descripcion: "Desarrollo de aula virtual accesible",
                    perfiles: [
                        {
                            titulo: "Desarrollador Backend",
                            descripcion: "Desarrollador Backend Node.js / Express",
                            tipoCompromiso: { cantHoras: 10, periodo: Periodo.SEMANAL },
                            modalidadColaboracion: { incentivoEconomico: 0, posibleContratacion: true },
                            busquedaAbierta: true,
                            limiteColaboraciones: 2,
                            fechaFinBusqueda: new Date(new Date().setMonth(new Date().getMonth() + 2))
                        },
                        {
                            titulo: "Diseñador UX/UI",
                            descripcion: "Diseñador UX/UI para Aplicaciones Web",
                            tipoCompromiso: { cantHoras: 20, periodo: Periodo.MENSUAL },
                            modalidadColaboracion: { incentivoEconomico: 15000, posibleContratacion: false },
                            busquedaAbierta: false,
                            limiteColaboraciones: 1
                        }
                    ],
                }
            ];
        }

        const creados = [];
        for (const datos of lista) {
            const resultado = validarCreacionProyecto.safeParse(datos)
            if (resultado.error) {
                throw new BadRequestError("Datos inválidos", resultado.error.issues)
            }
            creados.push(await this.proyectoService.crear(resultado.data));
        }

        return res.status(201).json({ status: "success", data: creados.map(ProyectoPublic.desde) });
    }

    obtenerPerfilesDeUnProyecto = async (req, res) => {
        const { id } = req.params;

        const perfiles = await this.proyectoService.obtenerPerfiles(id);
        res.status(200).json(perfiles.map(PerfilPublic.desde));
    }

    obtenerPerfilPorId = async (req, res) => {
        const { id, idPerfil } = req.params;

        const perfil = await this.proyectoService.perfilPerteneceAProyecto(id, idPerfil);
        res.status(200).json(PerfilPublic.desde(perfil));
    }

    crearPerfil = async (req, res) => {
        const { id } = req.params;

        const perfilCreado = await this.proyectoService.agregarPerfil(id, req.body);
        res.status(201).json({ message: 'Perfil creado exitosamente', data: PerfilPublic.desde(perfilCreado) });
    }

    actualizarPerfil = async (req, res) => {
        const { id, idPerfil } = req.params;

        const perfilActualizado = await this.proyectoService.modificarPerfil(id, idPerfil, req.body);
        res.status(200).json({ message: 'Perfil actualizado exitosamente', data: PerfilPublic.desde(perfilActualizado) });
    }

    eliminarPerfil = async (req, res) => {
        const { id, idPerfil } = req.params;

        await this.proyectoService.eliminarPerfil(id, idPerfil);
        res.status(200).json({ message: 'Perfil eliminado exitosamente' });
    }

    buscarPotencialesColaboradores = async (req, res) => {
        const { id, idPerfil } = req.params;

        const potencialesColaboradores = await this.proyectoService.buscarPotencialesColaboradores(id, idPerfil);
        res.status(200).json(potencialesColaboradores.map(ColaboradorPublic.desde));
    }

    contactarColaborador = async (req, res) => {
        const { id, idPerfil } = req.params;
        const { cuentaGit, mensaje } = req.body;
        const notificacion = await this.notificacionService.contactarColaborador(id, idPerfil, cuentaGit, mensaje);
        res.status(201).json({ message: 'Colaborador contactado exitosamente', data: NotificacionPublic.desde(notificacion) });
    }
    
    obtenerLogrosDeUnProyecto = async (req, res) => {
        const { id } = req.params;

        const logros = await this.logroService.obtenerTodos(id);
        res.status(200).json(logros.map(LogroPublic.desde));
    }

    obtenerLogroPorId = async (req, res) => {
        const { id, idLogro } = req.params;

        const logro = await this.logroService.obtenerPorId(idLogro, id);
        res.status(200).json(LogroPublic.desde(logro));
    }

    crearLogro = async (req, res) => {
        const { id } = req.params;
        const datos = req.body;

        const logroCreado = await this.logroService.crear(id, datos);
        res.status(201).json({ message: 'Logro creado exitosamente', data: LogroPublic.desde(logroCreado) });
    }

    actualizarLogro = async (req, res) => {
        const { id, idLogro } = req.params;
        const cambios = req.body;

        const logroActualizado = await this.logroService.actualizar(idLogro, id, cambios);
        res.status(200).json({ message: 'Logro actualizado exitosamente', data: LogroPublic.desde(logroActualizado) });
    }

    eliminarLogro = async (req, res) => {
        const { id, idLogro } = req.params;

        const resultado = await this.logroService.eliminar(idLogro, id);
        res.status(200).json(resultado);
    }
}

module.exports = { ProyectoController };
