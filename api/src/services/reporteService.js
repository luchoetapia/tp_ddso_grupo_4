const mongoose = require('mongoose');
const reporteRepository = require('../repositories/reporteRepository.js');
const colectivoRepository = require('../repositories/colectivoRepository.js');
const colaboradorRepository = require('../repositories/colaboradorRepository.js');
const postulacionRepository = require('../repositories/postulacionRepository.js');
const palabraBaneadaService = require('./palabraBaneadaSevice.js');
const { EstadoReporte, TipoEntidadReportada } = require('../models/Reporte.js');
const { BadRequestError, ConflictError, NotFoundError } = require('../errors/AppError.js');

const { crearReglas, textosDe } = require('../models/moderacion/ReglasModeracion.js');
const { obtenerNotificador } = require('../models/Notificacion.js');
const { MedioDeContacto } = require('../models/Contacto.js');
const AuthRepository = require('../auth/authRepository.js');

const loguearError = (contexto, error) =>
    console.error(`\x1b[31m${new Date().toISOString()} | ${contexto} | ${error.name}: ${error.message}\n${error.stack}\x1b[0m`);

// Cómo se nombra cada tipo de entidad en los avisos al dueño
const NOMBRE_ENTIDAD = {
    [TipoEntidadReportada.PROYECTO]: 'tu proyecto',
    [TipoEntidadReportada.COLECTIVO]: 'los datos de tu organización',
    [TipoEntidadReportada.COLABORADOR]: 'tu perfil',
    [TipoEntidadReportada.POSTULACION]: 'tu postulación',
};

// "Proyecto 6b04…" para los avisos a administradores
const describir = (reporte) => `${reporte.entidad.tipo} ${reporte.entidad.id}`;

// Nombre legible de la entidad reportada (null si ya no existe)
const nombreDe = (tipoEntidad, entidad) => {
    if (!entidad) return null;
    if (tipoEntidad === TipoEntidadReportada.PROYECTO) return entidad.titulo;
    if (tipoEntidad === TipoEntidadReportada.COLECTIVO) return entidad.nombre;
    if (tipoEntidad === TipoEntidadReportada.COLABORADOR) return entidad.nombreFantasia || [entidad.nombre, entidad.apellido].filter(Boolean).join(' ') || entidad.cuentaGit;
    return 'Postulación';
};

class ReporteService {
    constructor() {
        this.reporteRepository = reporteRepository;
        this.colectivoRepository = colectivoRepository;
        this.colaboradorRepository = colaboradorRepository;
        this.postulacionRepository = postulacionRepository;
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

        // Cumple todas las reglas: si tenía reportes pendientes, el dueño lo corrigió
        if (incumplidas.length === 0) {
            if (sinVerificar) return null;
            const solucionados = await this.reporteRepository.solucionarPendientes(idEntidad);
            solucionados.forEach(reporte => this.avisarCorreccionEnSegundoPlano(reporte));
            return null;
        }

        const motivo = incumplidas.map(({ motivo }) => motivo).join(' | ');
        const reglasIncumplidas = incumplidas.map(({ regla }) => regla);

        // Ya había un reporte pendiente: no se genera otro, pero se actualiza con lo nuevo y se avisa del cambio
        if (await this.reporteRepository.existePendiente(idEntidad)) {
            const actualizado = await this.reporteRepository.actualizarPendiente(idEntidad, motivo, reglasIncumplidas);
            if (actualizado) {
                this.notificarAdministradoresEnSegundoPlano(actualizado,
                    `[Moderación] ${describir(actualizado)} fue editado pero sigue incumpliendo las reglas: ${motivo}. Revisalo en Moderación.`);
            }
            return actualizado;
        }

        const reporte = await this.registrar(tipoEntidad, idEntidad, motivo, reglasIncumplidas);
        this.notificarAdministradoresEnSegundoPlano(reporte,
            `[Moderación] Nuevo reporte automático sobre ${describir(reporte)}: ${motivo}. Revisalo en Moderación.`);
        return reporte;
    }

    // Nombre anterior, de cuando solo se revisaban las palabras baneadas
    revisarPalabrasBaneadas = (tipoEntidad, entidad) => this.moderar(tipoEntidad, entidad);

    // El dueño corrigió el contenido: se avisa a los administradores y, si se le había pedido la corrección, al dueño
    avisarCorreccionEnSegundoPlano = (reporte) => {
        this.notificarAdministradoresEnSegundoPlano(reporte,
            `[Moderación] El dueño corrigió ${describir(reporte)} y ya cumple las reglas: el reporte se cerró como Solucionado.`);

        if (reporte.notificado && reporte.duenio?.email) {
            this.enviarEmail(reporte.duenio.email,
                `[Código a Voluntad] Gracias por corregir ${NOMBRE_ENTIDAD[reporte.entidad.tipo] ?? reporte.entidad.tipo}: ya cumple las reglas de la plataforma y el aviso de moderación quedó resuelto.`);
        }
    }

    // Aviso a todos los administradores activos por sus medios externos (en la app lo ven en Moderación)
    notificarAdministradoresEnSegundoPlano = (reporte, texto) => {
        this.notificarAdministradores(texto).catch(error => loguearError(`Aviso a administradores del reporte ${reporte?.id}`, error));
    }

    notificarAdministradores = async (texto) => {
        const administradores = await this.authRepository.obtenerAdministradoresActivos();
        administradores.forEach(admin => this.enviarEmail(admin.email, texto));
        return administradores.length;
    }

    enviarEmail = (email, texto) => {
        obtenerNotificador(MedioDeContacto.EMAIL).enviar({ medio: MedioDeContacto.EMAIL, valor: email }, { generarTexto: () => texto });
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

        // El dueño de un perfil de colaboradora o de una postulación es la cuenta de la colaboradora
        if (tipoEntidad === TipoEntidadReportada.COLABORADOR) {
            const colaborador = await this.colaboradorRepository.findById(idEntidad);
            return colaborador?.usuario ?? null;
        }

        if (tipoEntidad === TipoEntidadReportada.POSTULACION) {
            const postulacion = await this.postulacionRepository.findById(idEntidad);
            const idColaborador = postulacion?.colaborador?._id ?? postulacion?.colaborador;
            if (!idColaborador) return null;
            const colaborador = await this.colaboradorRepository.findById(idColaborador);
            return colaborador?.usuario ?? null;
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
    // Le pide al dueño que corrija el contenido: le llega un email y lo ve como aviso en la app.
    // Si vuelve a notificarse se actualiza la fecha y se reenvía el aviso.
    notificar = async (id) => {
        const pendiente = await this.obtenerPendiente(id);

        // Reportes viejos de colaboradoras o postulaciones no tenían dueño: se busca ahora
        const duenio = pendiente.duenio ? undefined : await this.buscarDuenio(pendiente.entidad.tipo, pendiente.entidad.id);

        const reporte = await this.reporteRepository.marcarNotificado(id, duenio);
        if (!reporte) {
            throw new ConflictError("El reporte ya fue resuelto por otro admin");
        }

        this.avisarDuenioEnSegundoPlano(reporte);
        return reporte;
    }

    avisarDuenioEnSegundoPlano = (reporte) => {
        this.avisarDuenio(reporte).catch(error => loguearError(`Aviso al dueño del reporte ${reporte?.id}`, error));
    }

    // Aviso externo (email) al dueño del contenido reportado; devuelve false si no tiene a quién avisar
    avisarDuenio = async (reporte) => {
        const email = reporte.duenio?.email;
        if (!email) return false;

        const entidad = NOMBRE_ENTIDAD[reporte.entidad.tipo] ?? reporte.entidad.tipo;
        this.enviarEmail(email, `[Código a Voluntad] El equipo de moderación te pide revisar ${entidad}: ${reporte.motivo}. ` +
            `Editalo para que cumpla las reglas de la plataforma; si no se corrige puede darse de baja.`);
        return true;
    }

    // Avisos de moderación del usuario de la sesión, con el nombre de lo que tiene que corregir
    obtenerAvisosDe = async (idDuenio) => {
        const reportes = await this.reporteRepository.buscarNotificadosPendientesDe(idDuenio);

        return await Promise.all(reportes.map(async (reporte) => {
            const entidad = await this.reporteRepository.buscarEntidad(reporte.entidad.tipo, reporte.entidad.id);
            return { reporte, nombreEntidad: nombreDe(reporte.entidad.tipo, entidad) };
        }));
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
