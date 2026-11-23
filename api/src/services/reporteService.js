const mongoose = require('mongoose');
const reporteRepository = require('../repositories/reporteRepository.js');
const colectivoRepository = require('../repositories/colectivoRepository.js');
const palabraBaneadaService = require('./palabraBaneadaSevice.js');
const { EstadoReporte, TipoEntidadReportada } = require('../models/Reporte.js');
const { BadRequestError, ConflictError, NotFoundError } = require('../errors/AppError.js');

const { crearReglas, textosDe } = require('../models/moderacion/ReglasModeracion.js');
const { obtenerNotificador } = require('../models/Notificacion.js');
const { MedioDeContacto } = require('../models/Contacto.js');
const AuthRepository = require('../auth/authRepository.js');

const loguearError = (contexto, error) =>
    console.error(`\x1b[31m${new Date().toISOString()} | ${contexto} | ${error.name}: ${error.message}\n${error.stack}\x1b[0m`);

class ReporteService {
    constructor() {
        this.reporteRepository = reporteRepository;
        this.colectivoRepository = colectivoRepository;
        this.palabraBaneadaService = palabraBaneadaService;
        // Reglas de moderación automática (models/moderacion/ReglasModeracion.js)
        this.reglas = crearReglas({ palabraBaneadaService });
    }

    // Se crea recién al usarse (solo para avisar a los administradores)
    get authRepository() { return this._authRepository ??= new AuthRepository() }
    set authRepository(repositorio) { this._authRepository = repositorio }

    crear = async ({ tipoEntidad, idEntidad, motivo }) => {
        if (!Object.values(TipoEntidadReportada).includes(tipoEntidad)) {
            throw new BadRequestError(`Tipo de entidad inválido: ${tipoEntidad}`);
        }
        if (!mongoose.isValidObjectId(idEntidad)) {
            throw new BadRequestError("Id de entidad inválido");
        }
        if (!motivo?.trim()) {
            throw new BadRequestError("El motivo es obligatorio");
        }
        if (!await this.reporteRepository.existeEntidad(tipoEntidad, idEntidad)) {
            throw new NotFoundError(`${tipoEntidad} no encontrado`);
        }

        return await this.registrar(tipoEntidad, idEntidad, motivo.trim());
    }

    // reglas: reglas de moderación que lo dispararon (vacío si el reporte se cargó a mano)
    registrar = async (tipoEntidad, idEntidad, motivo, reglas = []) => {
        return await this.reporteRepository.save({
            entidad: { tipo: tipoEntidad, id: idEntidad },
            motivo,
            reglas,
            duenio: await this.buscarDuenio(tipoEntidad, idEntidad)
        });
    }

    // No se espera: el request responde sin esperar la revisión y un error solo se loguea
    revisarEnSegundoPlano = (tipoEntidad, entidad) => {
        this.moderar(tipoEntidad, entidad).catch(error => {
            loguearError(`Moderación automática de ${tipoEntidad} ${entidad?.id ?? entidad?._id}`, error);
        });
    }

    // Moderación automática. Se llama después de guardar la entidad, con el documento completo:
    // corre las reglas que le aplican; si incumple alguna genera un reporte para revisión manual y avisa
    // a los administradores; si cumple todas, da por solucionados los reportes que se le habían notificado.
    moderar = async (tipoEntidad, entidad) => {
        const idEntidad = entidad.id ?? entidad._id;
        const reglas = this.reglas.filter(regla => regla.aplicaA(tipoEntidad, entidad));
        const resultados = await Promise.allSettled(reglas.map(regla => regla.evaluar(tipoEntidad, entidad)));

        const incumplidas = [];
        let sinVerificar = false;
        resultados.forEach((resultado, i) => {
            if (resultado.status === 'rejected') {
                // No se pudo verificar (p. ej. sin red): no se marca ni se da por cumplida
                sinVerificar = true;
                loguearError(`Regla '${reglas[i].nombre}' sobre ${tipoEntidad} ${idEntidad}`, resultado.reason);
            } else if (resultado.value) {
                incumplidas.push({ regla: reglas[i].nombre, motivo: resultado.value });
            }
        });

        if (incumplidas.length === 0) {
            if (!sinVerificar) await this.solucionarPorEntidad(idEntidad);
            return null;
        }

        // Mientras haya un reporte pendiente de la entidad no se genera otro
        if (await this.reporteRepository.existePendiente(idEntidad)) return null;

        const reporte = await this.registrar(
            tipoEntidad,
            idEntidad,
            incumplidas.map(({ motivo }) => motivo).join(' | '),
            incumplidas.map(({ regla }) => regla)
        );
        this.notificarAdministradoresEnSegundoPlano(reporte);
        return reporte;
    }

    // Nombre anterior, de cuando solo se revisaban las palabras baneadas
    revisarPalabrasBaneadas = (tipoEntidad, entidad) => this.moderar(tipoEntidad, entidad);

    // Aviso a todos los administradores activos por sus medios externos (en la app lo ven en Moderación)
    notificarAdministradoresEnSegundoPlano = (reporte) => {
        this.notificarAdministradores(reporte).catch(error => loguearError(`Aviso a administradores del reporte ${reporte?.id}`, error));
    }

    notificarAdministradores = async (reporte) => {
        const administradores = await this.authRepository.obtenerAdministradoresActivos();
        const notificador = obtenerNotificador(MedioDeContacto.EMAIL);
        const aviso = {
            generarTexto: () => `[Moderación] Nuevo reporte automático sobre ${reporte.entidad.tipo} ${reporte.entidad.id}: ${reporte.motivo}. Revisalo en Moderación.`,
        };

        administradores.forEach(admin => notificador.enviar({ medio: MedioDeContacto.EMAIL, valor: admin.email }, aviso));
        return administradores.length;
    }

    // El dueño de un proyecto es el usuario del colectivo que lo tiene en su lista de proyectos
    buscarDuenio = async (tipoEntidad, idEntidad) => {
        if (tipoEntidad === TipoEntidadReportada.COLECTIVO) {
            const colectivo = await this.colectivoRepository.findById(idEntidad);
            return colectivo?.usuario ?? null;
        }

        if (tipoEntidad === TipoEntidadReportada.PROYECTO) {
            const [colectivo] = await this.colectivoRepository.findBy({ proyectos: idEntidad });
            return colectivo?.usuario ?? null;
        }

        return null;
    }

    obtenerPorId = async (id) => {
        if (!mongoose.isValidObjectId(id)) {
            throw new BadRequestError("Id de reporte inválido");
        }

        const reporte = await this.reporteRepository.findById(id);
        if (!reporte) {
            throw new NotFoundError("Reporte no encontrado");
        }

        return reporte;
    }

    // Detalle para que el admin revise: el reporte + los textos actuales de la entidad (null si se eliminó)
    obtenerDetalle = async (id) => {
        const reporte = await this.obtenerPorId(id);
        const entidad = await this.reporteRepository.buscarEntidad(reporte.entidad.tipo, reporte.entidad.id);

        return { reporte, contenido: entidad ? textosDe(reporte.entidad.tipo, entidad) : null };
    }

    listar = async ({ pagina = 1, limite = 10, estado, tipoEntidad } = {}) => {
        const filtros = {};
        if (estado) filtros.estado = estado;
        if (tipoEntidad) filtros['entidad.tipo'] = tipoEntidad;

        return await this.reporteRepository.buscarConPaginacion(pagina, limite, filtros);
    }

    // Le avisa al usuario para que edite el contenido; si se vuelve a notificar se actualiza la fecha
    notificar = async (id) => {
        await this.obtenerPendiente(id);

        const reporte = await this.reporteRepository.marcarNotificado(id);
        if (!reporte) {
            throw new ConflictError("El reporte ya fue resuelto por otro admin");
        }

        return reporte;
    }

    // Se llama cuando el usuario edita la entidad; devuelve cuántos reportes se solucionaron
    solucionarPorEntidad = async (idEntidad) => {
        return await this.reporteRepository.solucionarNotificados(idEntidad);
    }

    // Validar = el contenido es inapropiado: se elimina la entidad reportada
    validar = async (id, idAdmin, comentario) => {
        const reporte = await this.obtenerPendiente(id);
        await this.reporteRepository.eliminarEntidad(reporte.entidad.tipo, reporte.entidad.id);

        return await this.cerrar(id, EstadoReporte.VALIDADO, idAdmin, comentario);
    }

    // Rechazar = falso positivo, el contenido es válido en su contexto
    rechazar = async (id, idAdmin, comentario) => {
        await this.obtenerPendiente(id);
        return await this.cerrar(id, EstadoReporte.RECHAZADO, idAdmin, comentario);
    }

    obtenerPendiente = async (id) => {
        const reporte = await this.obtenerPorId(id);

        if (!reporte.estaPendiente()) {
            throw new ConflictError(`El reporte ya fue resuelto como '${reporte.estado}'`);
        }

        return reporte;
    }

    cerrar = async (id, estado, idAdmin, comentario = null) => {
        const resuelto = await this.reporteRepository.resolver(id, estado, idAdmin, comentario);
        // Otro admin lo resolvió entre la lectura y la actualización
        if (!resuelto) {
            throw new ConflictError("El reporte ya fue resuelto por otro admin");
        }

        return resuelto;
    }
}

module.exports = new ReporteService();
