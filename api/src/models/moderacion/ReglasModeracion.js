const { TipoEntidadReportada } = require('../Reporte.js');

// Reglas de moderación automática. Cada una revisa una entidad recién guardada y devuelve:
//   - un texto con el motivo si la entidad incumple la regla (se genera un reporte para revisión manual),
//   - null si la cumple,
//   - o lanza un error si no pudo verificarse (p. ej. sin red): en ese caso no se marca ni se da por cumplida.
// Para agregar una regla nueva alcanza con crear la clase y sumarla a crearReglas().
const NombreRegla = {
    PALABRAS_PROHIBIDAS: 'palabras_prohibidas',
    FIN_DE_LUCRO: 'fin_de_lucro',
    CODIGO_CERRADO: 'codigo_cerrado',
};

class ReglaModeracion {
    constructor(nombre, tiposAplicables) {
        this.nombre = nombre;
        this.tiposAplicables = tiposAplicables;
    }

    aplicaA(tipoEntidad, entidad) {
        return this.tiposAplicables.includes(tipoEntidad);
    }

    // eslint-disable-next-line no-unused-vars
    async evaluar(tipoEntidad, entidad) {
        throw new Error('evaluar() debe implementarse en cada regla');
    }
}

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

const textosDe = (tipoEntidad, entidad) => TEXTOS_POR_TIPO[tipoEntidad](entidad);

// Incitación al odio u otro contenido inapropiado: palabras de la lista de palabras baneadas
class ReglaPalabrasProhibidas extends ReglaModeracion {
    constructor(palabraBaneadaService) {
        super(NombreRegla.PALABRAS_PROHIBIDAS, Object.values(TipoEntidadReportada));
        this.palabraBaneadaService = palabraBaneadaService;
    }

    async evaluar(tipoEntidad, entidad) {
        const encontradas = await this.palabraBaneadaService.detectarEnCampos(textosDe(tipoEntidad, entidad));
        if (Object.keys(encontradas).length === 0) return null;

        const detalle = Object.entries(encontradas).map(([campo, palabras]) => `${campo} (${palabras.join(', ')})`).join('; ');
        return `Palabras prohibidas detectadas en: ${detalle}`;
    }
}

// Una organización con fin de lucro no puede ofrecer proyectos. No hay un dato declarado para saberlo,
// así que se buscan indicios en los textos (forma societaria comercial o fines de lucro explícitos).
// Es una heurística: por eso termina en revisión manual y no en una baja automática.
const INDICIOS_FIN_DE_LUCRO = [
    // Formas societarias comerciales (se exigen los puntos o las mayúsculas para no confundir con palabras comunes)
    /(?:^|[\s,(])(?:S\.\s?A\.(?:\s?S\.)?|S\.\s?R\.\s?L\.|S\.\s?A\.\s?U\.|SRL|SAS|SAU)(?=$|[\s,.;)])/,
    /sociedad an[oó]nima/i,
    /sociedad de responsabilidad limitada/i,
    /sociedad por acciones simplificada/i,
    /(?<!sin\s)\bcon (?:fines?|[aá]nimo) de lucro\b/i,
    /\bfines? comerciales?\b/i,
    /\bempresa privada\b/i,
];

class ReglaFinDeLucro extends ReglaModeracion {
    constructor() {
        super(NombreRegla.FIN_DE_LUCRO, [TipoEntidadReportada.COLECTIVO, TipoEntidadReportada.PROYECTO]);
    }

    async evaluar(tipoEntidad, entidad) {
        const campos = Object.entries(textosDe(tipoEntidad, entidad)).filter(([, texto]) => typeof texto === 'string' && texto);
        const conIndicios = campos
            .map(([campo, texto]) => [campo, INDICIOS_FIN_DE_LUCRO.map(regex => texto.match(regex)?.[0]?.trim()).filter(Boolean)])
            .filter(([, coincidencias]) => coincidencias.length > 0);

        if (conIndicios.length === 0) return null;

        const detalle = conIndicios.map(([campo, coincidencias]) => `${campo} ("${coincidencias.join('", "')}")`).join('; ');
        return `Posible organización con fin de lucro: ${detalle}`;
    }
}

// El código fuente de los proyectos tiene que ser público: si el enlace no se puede ver sin iniciar sesión
// (un repositorio privado de GitHub/GitLab responde 404, otros 401/403) el proyecto se marca para revisión.
const ESTADOS_NO_PUBLICO = [401, 403, 404];
const TIMEOUT_VERIFICACION_MS = 8000;

class ReglaCodigoCerrado extends ReglaModeracion {
    constructor(consultar = (url) => fetch(url, { redirect: 'follow', signal: AbortSignal.timeout(TIMEOUT_VERIFICACION_MS) })) {
        super(NombreRegla.CODIGO_CERRADO, [TipoEntidadReportada.PROYECTO]);
        this.consultar = consultar;
    }

    // Solo se revisa si el proyecto cargó el enlace
    aplicaA(tipoEntidad, entidad) {
        return super.aplicaA(tipoEntidad, entidad) && Boolean(entidad.enlaceCodigoFuente);
    }

    async evaluar(tipoEntidad, entidad) {
        const url = entidad.enlaceCodigoFuente;
        // Si no responde (red caída, timeout) lanza: no se puede afirmar que sea cerrado
        const respuesta = await this.consultar(url);

        if (ESTADOS_NO_PUBLICO.includes(respuesta.status)) {
            return `El código fuente no es público: ${url} respondió ${respuesta.status} (repositorio privado o inexistente)`;
        }
        if (!respuesta.ok) {
            throw new Error(`No se pudo verificar ${url}: respondió ${respuesta.status}`);
        }
        return null;
    }
}

const crearReglas = ({ palabraBaneadaService }) => [
    new ReglaPalabrasProhibidas(palabraBaneadaService),
    new ReglaFinDeLucro(),
    new ReglaCodigoCerrado(),
];

module.exports = {
    NombreRegla,
    ReglaModeracion,
    ReglaPalabrasProhibidas,
    ReglaFinDeLucro,
    ReglaCodigoCerrado,
    crearReglas,
    textosDe,
};
