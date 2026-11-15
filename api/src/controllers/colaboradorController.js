const colaboradorService = require('../services/colaboradorService.js');
const colaboracionService = require('../services/colaboracionService.js');
const habilidadService = require('../services/habilidadService.js');
const proyectoService = require('../services/proyectoService.js');
const notificacionService = require('../services/notificacionService.js');
const { BadRequestError } = require('../errors/AppError.js');
const { validarCreacionColaborador } = require('../validators/colaboradoresValidator.js');
const { ColaboradorPublic } = require('../dtos/colaboradorPublic.js');
const { ColaboracionPublic } = require('../dtos/colaboracionPublic.js');
const { ProyectoPublic } = require('../dtos/proyectoPublic.js');
const { NotificacionPublic } = require('../dtos/notificacionPublic.js');
const { crearUsuarioDeSemilla } = require('../auth/usuarioSemilla.js');
const { roles } = require('../auth/models/usuario.js');

class ColaboradorController {
    constructor() {
        this.colaboradorService = colaboradorService;
        this.colaboracionService = colaboracionService;
        this.habilidadService = habilidadService;
        this.proyectoService = proyectoService;
        this.notificacionService = notificacionService;
    }

    obtenerColaboradores = async (req, res) => {
        const colaboradores = await this.colaboradorService.obtenerTodos();
        res.status(200).json(colaboradores.map(ColaboradorPublic.desde))
    }

    crearColaborador = async (req, res) => {
        const colaboradoraNueva = await this.colaboradorService.crear(req.body, req.usuario.id)
        res.status(201).json({ message: 'Colaboradora creada exitosamente', data: ColaboradorPublic.desde(colaboradoraNueva) })
    }

    obtenerColaboradorPorCuentaGit = async (req, res) => {
        const colaborador = await this.colaboradorService.obtenerPorCuentaGit(req.params.cuentaGit)
        res.status(200).json(ColaboradorPublic.desde(colaborador))
    }

    anotarColaboradorAProyecto = async (req, res) => {
        const { cuentaGit, idProyecto } = req.params;
        const colaborador = await this.colaboradorService.obtenerPorCuentaGit(cuentaGit)
        const colaboracion = await this.colaboracionService.crear({
            idColaborador: colaborador.id,
            idProyecto
        })
        res.status(200).json({ message: 'Colaboradora anotada al proyecto exitosamente', data: ColaboracionPublic.desde(colaboracion) })
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
            const resultado = validarCreacionColaborador.safeParse(datos)
            if (resultado.error) {
                throw new BadRequestError("Datos inválidos", resultado.error.issues)
            }
            const usuario = await crearUsuarioDeSemilla(resultado.data.cuentaGit, roles.COLABORADOR)
            creados.push(await this.colaboradorService.crear(resultado.data, usuario.id));
        }

        return res.status(201).json({ status: "success", data: creados.map(ColaboradorPublic.desde) });
    }

    buscarPotencialesProyectos = async (req, res) => {
        const colaborador = await this.colaboradorService.obtenerPorCuentaGit(req.params.cuentaGit);
        const idsHabilidades = colaborador.habilidades.map(h => (h._id ?? h).toString());

        const proyectos = await this.proyectoService.buscarPotencialesProyectos(idsHabilidades);
        res.status(200).json(proyectos.map(ProyectoPublic.desde));
    }

    obtenerNotificaciones = async (req, res) => {
        const notificaciones = await this.notificacionService.obtenerPorColaborador(req.params.cuentaGit);
        res.status(200).json(notificaciones.map(NotificacionPublic.desde));
    }
}

module.exports = { ColaboradorController };
