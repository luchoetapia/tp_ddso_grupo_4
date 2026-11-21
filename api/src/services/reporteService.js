const mongoose = require('mongoose');
const reporteRepository = require('../repositories/reporteRepository.js');
const colectivoRepository = require('../repositories/colectivoRepository.js');
const palabraBaneadaService = require('./palabraBaneadaSevice.js');
const { EstadoReporte, TipoEntidadReportada } = require('../models/Reporte.js');
const { BadRequestError, ConflictError, NotFoundError } = require('../errors/AppError.js');

const textosDeLista = (nombre, items = [], campos) =>
    Object.fromEntries(items.flatMap((item, i) => campos.map(campo => [`${nombre}[${i}].${campo}`, item[campo]])));

// Campos de texto libre que se revisan de cada entidad
const TEXTOS_POR_TIPO = {
    [TipoEntidadReportada.PROYECTO]: (p) => ({
        titulo: p.titulo,
        descripcion: p.descripcion,
        ...textosDeLista('perfiles', p.perfiles, ['titulo', 'descripcion']),
        ...textosDeLista('logros', p.logros, ['titulo', 'descripcion'])
    }),
    [TipoEntidadReportada.COLECTIVO]: (c) => ({ nombre: c.nombre, descripcion: c.descripcion, ubicacion: c.ubicacion }),
    [TipoEntidadReportada.COLABORADOR]: (c) => ({
        nombre: c.nombre,
        apellido: c.apellido,
        nombreFantasia: c.nombreFantasia,
        pronombres: c.pronombres,
        presentacion: c.presentacion
    }),
    [TipoEntidadReportada.POSTULACION]: (p) => ({ mensaje: p.mensaje })
};

class ReporteService {
    constructor() {
        this.reporteRepository = reporteRepository;
        this.colectivoRepository = colectivoRepository;
        this.palabraBaneadaService = palabraBaneadaService;
    }

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

    registrar = async (tipoEntidad, idEntidad, motivo) => {
        return await this.reporteRepository.save({
            entidad: { tipo: tipoEntidad, id: idEntidad },
            motivo,
            duenio: await this.buscarDuenio(tipoEntidad, idEntidad)
        });
    }

    // No se espera: el request responde sin esperar la revisión y un error solo se loguea
    revisarEnSegundoPlano = (tipoEntidad, entidad) => {
        this.revisarPalabrasBaneadas(tipoEntidad, entidad).catch(error => {
            const id = entidad?.id ?? entidad?._id;
            console.error(`\x1b[31m${new Date().toISOString()} | Revisión de palabras baneadas de ${tipoEntidad} ${id} | ${error.name}: ${error.message}\n${error.stack}\x1b[0m`);
        });
    }

    // Se llama después de guardar la entidad, con el documento completo:
    // si quedó limpia soluciona los reportes notificados, si no genera un reporte
    revisarPalabrasBaneadas = async (tipoEntidad, entidad) => {
        const idEntidad = entidad.id ?? entidad._id;
        const encontradas = await this.palabraBaneadaService.detectarEnCampos(TEXTOS_POR_TIPO[tipoEntidad](entidad));

        if (Object.keys(encontradas).length === 0) {
            await this.solucionarPorEntidad(idEntidad);
            return null;
        }

        // Mientras haya un reporte pendiente de la entidad no se genera otro
        if (await this.reporteRepository.existePendiente(idEntidad)) return null;

        const detalle = Object.entries(encontradas).map(([campo, palabras]) => `${campo} (${palabras.join(', ')})`).join('; ');
        return await this.registrar(tipoEntidad, idEntidad, `Palabras prohibidas detectadas en: ${detalle}`);
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

        // entidad.id viene populado; si es null la entidad ya no existe
        const entidad = reporte.entidad.id;
        if (entidad) {
            await this.reporteRepository.eliminarEntidad(reporte.entidad.tipo, entidad._id ?? entidad);
        }

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
