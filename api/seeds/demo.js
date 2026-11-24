// Datos de demostración para todos los esquemas: usuarios, colectivos (con administradores adicionales),
// colaboradores, proyectos (con perfiles, logros y estrategia de aceptación), colaboraciones, postulaciones,
// notificaciones, reportes de moderación y auditoría.
// También precarga las habilidades y las palabras prohibidas (seeds/habilidades.js y seeds/palabrasBaneadas.js).
// Uso: npm run seed:demo
// Se puede correr varias veces: antes de cargar borra lo que creó la corrida anterior
// (todo lo asociado a usuarios con email @semilla.local). No toca otros datos.
// Los usuarios se crean con la password de SEED_PASSWORD (.env); si está vacía no se puede ingresar con ellos.
//
// Moderación: algunos datos incumplen las reglas a propósito (marcados con infringe: true) para que haya
// reportes automáticos que revisar. Los reportes automáticos no se escriben a mano: se calculan con las
// mismas reglas que usa la API (palabras prohibidas y fin de lucro). La validación previa falla si un dato
// marcado no incumple ninguna regla, o si uno sin marcar incumple alguna.
const mongoClient = require('../src/database/mongoose.js');
const UsuarioModel = require('../src/auth/models/usuarioSchema.js');
const ColectivoModel = require('../src/database/schemas/colectivoSchema.js');
const ColaboradorModel = require('../src/database/schemas/colaboradorSchema.js');
const ProyectoModel = require('../src/database/schemas/proyectoSchema.js');
const ColaboracionModel = require('../src/database/schemas/colaboracionSchema.js');
const NotificacionModel = require('../src/database/schemas/notificacionSchema.js');
const PostulacionModel = require('../src/database/schemas/postulacionSchema.js');
const ReporteModel = require('../src/database/schemas/reporteSchema.js');
const AuditoriaModel = require('../src/database/schemas/auditoriaSchema.js');
const { crearUsuarioDeSemilla, aUsername } = require('../src/auth/usuarioSemilla.js');
const { roles } = require('../src/auth/models/usuario.js');
const { TipoColectivo } = require('../src/models/colectivo.js');
const { Periodo } = require('../src/models/proyecto.js');
const { MedioDeContacto } = require('../src/models/Contacto.js');
const EstadoPostulacion = require('../src/models/Proyecto/Postulaciones/EstadoPostulacion.js');
const { obtenerEstrategia } = require('../src/models/Proyecto/EsrtategiaAceptacion/index.js');
const { EstadoReporte, TipoEntidadReportada } = require('../src/models/Reporte.js');
const { AccionAuditada, TipoEntidadAuditada } = require('../src/models/Auditoria.js');
const { ReglaPalabrasProhibidas, ReglaFinDeLucro } = require('../src/models/moderacion/ReglasModeracion.js');
const palabraBaneadaService = require('../src/services/palabraBaneadaSevice.js');
const { HABILIDADES, cargarHabilidades } = require('./habilidades.js');
const { PALABRAS_BANEADAS, cargarPalabrasBaneadas } = require('./palabrasBaneadas.js');

const DOMINIO_SEMILLA = /@semilla\.local$/;

const haceDias = (dias) => new Date(Date.now() - dias * 24 * 60 * 60 * 1000);
const enDias = (dias) => haceDias(-dias);

const perfil = (titulo, descripcion, requeridas, opcionales, cantHoras, periodo, extra = {}) => ({
    titulo,
    descripcion,
    requeridas,
    opcionales,
    tipoCompromiso: { cantHoras, periodo },
    modalidadColaboracion: { incentivoEconomico: extra.incentivo ?? 0, posibleContratacion: extra.contratacion ?? false },
    busquedaAbierta: extra.abierta ?? true,
    limiteColaboraciones: extra.limite ?? null,
    fechaFinBusqueda: extra.finEnDias != null ? enDias(extra.finEnDias) : null,
});

// diasAtras define la fecha de creación del proyecto (los destacados del home usan los últimos 30 días).
// estrategia: estrategia de aceptación de postulaciones (sin estrategia = RevisionManual).
// revisionManual: motivo con el que el proyecto quedó marcado para revisión manual (como lo marca la tarea de proyectos sin actualizaciones).
// administradores: cuentas adicionales que administran el colectivo (además de la titular).
// Los perfiles con el cupo completo (colaboraciones activas = límite) van con abierta: false, como los deja la API al aceptar.
const COLECTIVOS = [
    {
        nombre: 'Fundación Manos Solidarias', tipo: TipoColectivo.FUNDACION, ubicacion: 'CABA',
        descripcion: 'Coordinamos la entrega de alimentos a comedores comunitarios.',
        administradores: ['Coordinación Manos Solidarias', 'Voluntariado Manos Solidarias'],
        proyectos: [
            {
                titulo: 'Web de reparto solidario', diasAtras: 12, porcentaje: 60,
                descripcion: 'Plataforma para coordinar entregas de alimentos entre comedores y voluntarios.',
                enlaceCodigoFuente: 'https://github.com/manos-solidarias/reparto',
                perfiles: [
                    perfil('Desarrollo frontend', 'Pantallas de pedidos y recorridos', ['React', 'JavaScript'], ['Testing automatizado'], 6, Periodo.SEMANAL, { limite: 2, finEnDias: 45 }),
                    perfil('Desarrollo backend', 'API de pedidos y stock', ['Node.js', 'Express', 'MongoDB'], ['Docker'], 8, Periodo.SEMANAL, { limite: 1, contratacion: true, abierta: false }),
                ],
                logros: [{ titulo: 'Mapa de comedores publicado', descripcion: 'Ya se pueden ver los 40 comedores de la red en el mapa.' }],
            },
            {
                titulo: 'Inventario de donaciones', diasAtras: 25, porcentaje: 80,
                descripcion: 'Registro de donaciones recibidas y entregadas, con stock por depósito.',
                enlaceSistema: 'https://inventario.manossolidarias.org',
                perfiles: [
                    perfil('Desarrollo full stack', 'Reportes de stock y vencimientos', ['Next.js', 'MongoDB'], ['TypeScript'], 20, Periodo.MENSUAL, { limite: 2 }),
                    perfil('Diseño de interfaces', 'Rediseño del panel de carga', ['Diseño UX/UI', 'Figma'], [], 15, Periodo.TOTAL, { abierta: false }),
                ],
                logros: [
                    { titulo: 'Primera versión en uso', descripcion: 'El depósito central registra todas las donaciones en el sistema.' },
                    { titulo: 'Alertas de vencimiento', descripcion: 'Avisos automáticos de alimentos próximos a vencer.' },
                ],
            },
            {
                titulo: 'Campaña de donaciones online', diasAtras: 260, porcentaje: 100, finalizado: true,
                descripcion: 'Sitio y difusión de la campaña anual para juntar donaciones de alimentos.',
                enlaceSistema: 'https://donar.manossolidarias.org',
                perfiles: [
                    perfil('Sitio de la campaña', 'Landing con formulario de donación', ['WordPress'], ['SEO'], 30, Periodo.TOTAL, { abierta: false }),
                    perfil('Difusión en redes', 'Plan de publicaciones de la campaña', ['Redes sociales', 'Marketing digital'], [], 20, Periodo.TOTAL, { abierta: false }),
                ],
                logros: [
                    { titulo: 'Meta superada', descripcion: 'Se juntaron 12 toneladas de alimentos, un 20% más que la meta.' },
                    { titulo: '5.000 visitas', descripcion: 'El sitio de la campaña superó las 5.000 visitas en un mes.' },
                ],
            },
        ],
    },
    {
        nombre: 'Asamblea Barrio Norte', tipo: TipoColectivo.ASAMBLEA, ubicacion: 'Córdoba',
        descripcion: 'Asamblea vecinal que organiza el comedor y actividades del barrio.',
        proyectos: [
            {
                titulo: 'Turnos para el comedor comunitario', diasAtras: 5, porcentaje: 35,
                descripcion: 'Sistema de turnos y cupos para organizar la atención diaria del comedor.',
                perfiles: [
                    perfil('Desarrollo backend', 'Reglas de cupos y turnos', ['Node.js', 'PostgreSQL'], ['APIs REST'], 5, Periodo.SEMANAL, { limite: 2 }),
                    perfil('Desarrollo frontend', 'Formulario de turnos accesible desde el celular', ['React', 'HTML y CSS'], ['Accesibilidad web'], 5, Periodo.SEMANAL, { limite: 1 }),
                ],
                logros: [],
            },
            {
                titulo: 'Censo barrial', diasAtras: 120, porcentaje: 100, finalizado: true,
                descripcion: 'Relevamiento de necesidades de las familias del barrio.',
                perfiles: [
                    perfil('Análisis de datos', 'Procesamiento de las encuestas', ['Python', 'SQL'], [], 30, Periodo.TOTAL, { abierta: false }),
                ],
                logros: [{ titulo: 'Censo completo', descripcion: 'Se relevaron 350 familias y se publicó el informe.' }],
            },
            {
                titulo: 'Huerta comunitaria conectada', diasAtras: 33, porcentaje: 25, estrategia: 'HastaLlenarVacantes',
                descripcion: 'Sensores de humedad y riego automático para la huerta del comedor, con un tablero de mediciones.',
                enlaceCodigoFuente: 'https://github.com/barrio-norte/huerta',
                perfiles: [
                    perfil('Sensores y riego', 'Placas ESP32 con sensores de humedad y control de bombas', ['IoT', 'Python'], ['Linux'], 6, Periodo.SEMANAL, { limite: 2 }),
                    perfil('Tablero de mediciones', 'Gráficos de humedad y riego por cantero', ['React', 'JavaScript'], ['Power BI'], 4, Periodo.SEMANAL, { limite: 2 }),
                ],
                logros: [{ titulo: 'Primer cantero automatizado', descripcion: 'El cantero de tomates se riega solo según la humedad.' }],
            },
        ],
    },
    {
        nombre: 'ONG Red Solidaria', tipo: TipoColectivo.ONG, ubicacion: 'Santa Fe',
        descripcion: 'Red de voluntariado para emergencias y acompañamiento social.',
        proyectos: [
            {
                titulo: 'Gestión de voluntariado', diasAtras: 40, porcentaje: 50,
                descripcion: 'Alta de voluntarios, asignación de tareas y seguimiento de horas.',
                enlaceCodigoFuente: 'https://github.com/red-solidaria/voluntariado',
                perfiles: [
                    perfil('Desarrollo backend', 'API de tareas y horas', ['Python', 'Django', 'PostgreSQL'], ['Testing automatizado'], 8, Periodo.SEMANAL, { limite: 2 }),
                    perfil('Infraestructura', 'Despliegue y monitoreo', ['Docker', 'Linux'], ['CI/CD', 'AWS'], 40, Periodo.TOTAL, { limite: 1, incentivo: 50000, abierta: false }),
                ],
                logros: [{ titulo: 'Registro de voluntarios', descripcion: 'Los voluntarios ya se inscriben desde la web.' }],
            },
            {
                titulo: 'App de alertas de emergencias', diasAtras: 2, porcentaje: 10,
                descripcion: 'Aplicación móvil para avisar a los voluntarios cercanos ante una emergencia.',
                perfiles: [
                    perfil('Desarrollo mobile', 'App para Android e iOS', ['React Native', 'JavaScript'], ['TypeScript'], 10, Periodo.SEMANAL, { limite: 2, finEnDias: 30 }),
                    perfil('Desarrollo backend', 'Notificaciones push y geolocalización', ['Node.js', 'MongoDB'], ['Docker'], 10, Periodo.SEMANAL, { limite: 1 }),
                    perfil('Diseño de interfaces', 'Flujo de alerta en pocos toques', ['Diseño UX/UI'], ['Figma', 'Accesibilidad web'], 20, Periodo.TOTAL, { limite: 1 }),
                ],
                logros: [],
            },
            {
                titulo: 'Sitio institucional de la red', diasAtras: 300, porcentaje: 100, finalizado: true,
                descripcion: 'Sitio web con la historia de la red, cómo sumarse y contacto.',
                enlaceSistema: 'https://redsolidaria.org',
                perfiles: [
                    perfil('Desarrollo web', 'Sitio en WordPress con formulario de contacto', ['WordPress', 'HTML y CSS'], ['SEO'], 25, Periodo.TOTAL, { abierta: false }),
                ],
                logros: [{ titulo: 'Sitio publicado', descripcion: 'La red tiene su sitio propio con formulario para sumarse.' }],
            },
        ],
    },
    {
        nombre: 'Asociación Vecinal Villa Crespo', tipo: TipoColectivo.ASOCIACION_BARRIAL, ubicacion: 'CABA',
        descripcion: 'Talleres, bolsa de trabajo y actividades para vecinos y vecinas.',
        proyectos: [
            {
                titulo: 'Agenda de talleres barriales', diasAtras: 18, porcentaje: 20,
                descripcion: 'Calendario de talleres con inscripción online.',
                perfiles: [
                    perfil('Desarrollo frontend', 'Calendario e inscripción', ['Vue.js', 'HTML y CSS'], ['Tailwind CSS'], 4, Periodo.SEMANAL, { limite: 2 }),
                    perfil('Testing', 'Pruebas de punta a punta', ['Testing automatizado'], ['JavaScript', 'Cypress'], 10, Periodo.MENSUAL, { limite: 1 }),
                ],
                logros: [],
            },
            {
                titulo: 'Bolsa de trabajo barrial', diasAtras: 70, porcentaje: 45, revisionManual: 'Sin actualizaciones recientes',
                descripcion: 'Publicación de ofertas de empleo de comercios del barrio.',
                perfiles: [
                    perfil('Desarrollo full stack', 'Publicación y búsqueda de ofertas', ['PHP', 'MySQL'], ['HTML y CSS'], 6, Periodo.SEMANAL, { limite: 1, abierta: false }),
                    perfil('Accesibilidad', 'Auditoría y mejoras de accesibilidad', ['Accesibilidad web', 'Diseño UX/UI'], [], 15, Periodo.TOTAL, { abierta: false }),
                ],
                logros: [{ titulo: '30 ofertas publicadas', descripcion: 'Comercios del barrio ya publican sus búsquedas.' }],
            },
            {
                titulo: 'Newsletter del barrio', diasAtras: 8, porcentaje: 15, estrategia: 'TodoSuma',
                descripcion: 'Boletín mensual con novedades, talleres y ofertas de trabajo del barrio.',
                perfiles: [
                    perfil('Redacción', 'Notas y agenda del mes', ['Redacción de contenidos'], ['SEO'], 3, Periodo.SEMANAL),
                    perfil('Difusión en redes', 'Publicar cada edición en redes', ['Redes sociales'], ['Diseño gráfico'], 3, Periodo.SEMANAL),
                ],
                logros: [],
            },
        ],
    },
    {
        nombre: 'Fundación Aprender Juntos', tipo: TipoColectivo.FUNDACION, ubicacion: 'Mendoza',
        descripcion: 'Apoyo escolar gratuito para chicos y chicas de primaria y secundaria.',
        proyectos: [
            {
                titulo: 'Seguimiento de apoyo escolar', diasAtras: 9, porcentaje: 70,
                descripcion: 'Registro de asistencia y avances de cada estudiante.',
                enlaceCodigoFuente: 'https://github.com/aprender-juntos/seguimiento',
                perfiles: [
                    perfil('Desarrollo frontend', 'Panel para tutores', ['Next.js', 'TypeScript'], ['Tailwind CSS'], 6, Periodo.SEMANAL, { limite: 2 }),
                    perfil('Desarrollo backend', 'API de asistencia y reportes', ['Node.js', 'MongoDB', 'APIs REST'], ['Testing automatizado'], 6, Periodo.SEMANAL, { limite: 1, contratacion: true }),
                ],
                logros: [{ titulo: 'Asistencia digital', descripcion: 'Los tutores toman asistencia desde el celular.' }],
            },
            {
                titulo: 'Biblioteca popular online', diasAtras: 200, porcentaje: 100, finalizado: true,
                descripcion: 'Catálogo y préstamos de la biblioteca de la fundación.',
                enlaceSistema: 'https://biblioteca.aprenderjuntos.org',
                perfiles: [
                    perfil('Desarrollo full stack', 'Catálogo y préstamos', ['React', 'MongoDB'], [], 20, Periodo.MENSUAL, { abierta: false }),
                ],
                logros: [{ titulo: 'Catálogo completo', descripcion: 'Se cargaron los 2.000 libros de la biblioteca.' }],
            },
            {
                titulo: 'Aula virtual para tutores', diasAtras: 4, porcentaje: 5, estrategia: 'HastaLlenarVacantes',
                descripcion: 'Clases en vivo, materiales y tareas para que los tutores acompañen a distancia.',
                perfiles: [
                    perfil('Desarrollo backend', 'API de clases, materiales y entregas', ['NestJS', 'PostgreSQL'], ['GraphQL', 'Redis'], 8, Periodo.SEMANAL, { limite: 2 }),
                    perfil('Desarrollo frontend', 'Aula y calendario de clases', ['React', 'TypeScript'], ['Jest'], 6, Periodo.SEMANAL, { limite: 3 }),
                    perfil('Capacitación', 'Guías y talleres para tutores', ['Capacitación de usuarios'], ['Redacción de contenidos'], 10, Periodo.TOTAL, { limite: 1, finEnDias: 25 }),
                ],
                logros: [],
            },
            {
                titulo: 'Encuesta de deserción escolar', diasAtras: 150, porcentaje: 100, finalizado: true,
                descripcion: 'Análisis de las causas de abandono escolar en los barrios donde trabaja la fundación.',
                perfiles: [
                    perfil('Análisis de datos', 'Limpieza de datos y tablero de resultados', ['Pandas', 'Power BI'], ['Python'], 25, Periodo.TOTAL, { abierta: false }),
                ],
                logros: [{ titulo: 'Informe presentado', descripcion: 'El informe se presentó ante la dirección de escuelas de la provincia.' }],
            },
        ],
    },
    {
        nombre: 'Cooperativa Tejiendo Redes', tipo: TipoColectivo.ONG, ubicacion: 'Buenos Aires',
        descripcion: 'Cooperativa textil de mujeres con venta en ferias y online.',
        proyectos: [
            {
                titulo: 'Registro de socias de la cooperativa', diasAtras: 28, porcentaje: 55,
                descripcion: 'Padrón de socias, aportes y asambleas.',
                perfiles: [
                    perfil('Desarrollo backend', 'Padrón y aportes', ['Java', 'Spring Boot', 'PostgreSQL'], ['Docker'], 8, Periodo.SEMANAL, { limite: 1, abierta: false }),
                    perfil('Desarrollo frontend', 'Pantallas de gestión', ['Angular', 'TypeScript'], [], 6, Periodo.SEMANAL, { limite: 1, abierta: false }),
                ],
                logros: [],
            },
            {
                titulo: 'Tienda online de la cooperativa', diasAtras: 14, porcentaje: 5,
                descripcion: 'Venta online de los productos textiles de la cooperativa.',
                perfiles: [
                    perfil('Desarrollo frontend', 'Catálogo y carrito', ['React', 'Tailwind CSS'], ['Next.js'], 6, Periodo.SEMANAL, { limite: 2 }),
                    perfil('Desarrollo backend', 'Pedidos y pagos', ['Node.js', 'Express', 'MongoDB'], ['Seguridad informática'], 8, Periodo.SEMANAL, { limite: 1, incentivo: 80000 }),
                    perfil('Coordinación', 'Organización del equipo y relevamiento', ['Scrum', 'Análisis funcional'], ['Documentación técnica'], 4, Periodo.SEMANAL, { limite: 1, abierta: false }),
                ],
                logros: [],
            },
            {
                titulo: 'Catálogo de la feria de productores', diasAtras: 90, porcentaje: 100, finalizado: true,
                descripcion: 'Catálogo web de los puestos de la feria mensual.',
                perfiles: [
                    perfil('Desarrollo frontend', 'Sitio estático del catálogo', ['HTML y CSS', 'JavaScript'], [], 20, Periodo.TOTAL, { abierta: false }),
                ],
                logros: [{ titulo: 'Catálogo publicado', descripcion: 'La feria difunde su catálogo online cada mes.' }],
            },
        ],
    },
    {
        nombre: 'Colectivo Ambiental Río Limpio', tipo: TipoColectivo.ONG, ubicacion: 'Buenos Aires',
        descripcion: 'Vecinos y vecinas que trabajan por la limpieza de la ribera y el reciclaje.',
        proyectos: [
            {
                titulo: 'Mapa de puntos de reciclaje', diasAtras: 6, porcentaje: 30,
                descripcion: 'App para encontrar puntos verdes y saber qué materiales recibe cada uno.',
                enlaceCodigoFuente: 'https://github.com/rio-limpio/mapa-reciclaje',
                perfiles: [
                    perfil('Desarrollo mobile', 'App en Flutter con mapa y filtros', ['Flutter', 'Firebase'], ['Kotlin'], 8, Periodo.SEMANAL, { limite: 2, finEnDias: 20 }),
                    perfil('Desarrollo backend', 'API de puntos y materiales', ['Node.js', 'Express'], ['MongoDB', 'Google Cloud'], 6, Periodo.SEMANAL, { limite: 1 }),
                    perfil('Diseño de interfaces', 'Flujo de búsqueda y ficha de cada punto', ['Figma', 'Prototipado'], ['Investigación de usuarios'], 15, Periodo.TOTAL, { limite: 1, abierta: false }),
                ],
                logros: [],
            },
            {
                titulo: 'Monitoreo de calidad del agua', diasAtras: 180, porcentaje: 100, finalizado: true,
                descripcion: 'Mediciones periódicas del agua del río y publicación de los resultados.',
                enlaceSistema: 'https://agua.riolimpio.org',
                perfiles: [
                    perfil('Análisis de datos', 'Procesamiento de las mediciones', ['Python', 'Pandas'], ['Machine Learning'], 20, Periodo.TOTAL, { abierta: false }),
                    perfil('Sensores', 'Boyas con sensores de turbidez y pH', ['IoT'], ['Python'], 30, Periodo.TOTAL, { abierta: false }),
                ],
                logros: [
                    { titulo: 'Un año de mediciones', descripcion: 'Se publicaron 12 informes mensuales de calidad del agua.' },
                    { titulo: 'Presentación en el Concejo', descripcion: 'Los datos se usaron en el pedido de saneamiento al municipio.' },
                ],
            },
            {
                titulo: 'Campaña de concientización ambiental', diasAtras: 20, porcentaje: 40, estrategia: 'TodoSuma',
                descripcion: 'Piezas gráficas y publicaciones para promover la separación de residuos.',
                perfiles: [
                    perfil('Diseño de piezas', 'Flyers, afiches y placas para redes', ['Diseño gráfico'], ['Figma'], 10, Periodo.MENSUAL),
                    perfil('Marketing', 'Plan de contenidos y métricas', ['Marketing digital', 'Redes sociales'], ['SEO'], 8, Periodo.MENSUAL),
                ],
                logros: [{ titulo: 'Primera campaña en redes', descripcion: 'La campaña de separación en origen llegó a 20.000 personas.' }],
            },
        ],
    },
    {
        nombre: 'Club Social y Deportivo Villa Luro', tipo: TipoColectivo.ASOCIACION_BARRIAL, ubicacion: 'CABA',
        descripcion: 'Club de barrio con fútbol infantil, básquet y colonia de vacaciones.',
        proyectos: [
            {
                titulo: 'Gestión de socios del club', diasAtras: 45, porcentaje: 65,
                descripcion: 'Padrón de socios, cuotas y carnet digital.',
                enlaceCodigoFuente: 'https://github.com/club-villa-luro/socios',
                perfiles: [
                    perfil('Desarrollo backend', 'Cuotas, padrón y carnet', ['Ruby on Rails', 'PostgreSQL'], ['Redis'], 8, Periodo.SEMANAL, { limite: 1, abierta: false }),
                    perfil('Desarrollo frontend', 'Pantallas de secretaría', ['HTML y CSS', 'JavaScript'], ['Tailwind CSS'], 5, Periodo.SEMANAL, { limite: 2 }),
                    perfil('Infraestructura', 'Despliegue en la nube y backups', ['Docker', 'Kubernetes'], ['Google Cloud', 'CI/CD'], 20, Periodo.TOTAL, { limite: 1, incentivo: 60000, abierta: false }),
                ],
                logros: [{ titulo: 'Carnet digital', descripcion: 'Los socios muestran el carnet desde el celular en la puerta.' }],
            },
            {
                titulo: 'Reserva de canchas', diasAtras: 240, porcentaje: 100, finalizado: true,
                descripcion: 'Reserva online de las canchas de fútbol 5 y básquet.',
                enlaceSistema: 'https://reservas.clubvillaluro.org',
                perfiles: [
                    perfil('Desarrollo full stack', 'Calendario de reservas y pagos', ['PHP', 'MySQL'], ['JavaScript'], 25, Periodo.TOTAL, { abierta: false }),
                ],
                logros: [{ titulo: 'Reservas online', descripcion: 'El 80% de las reservas ya se hace desde la web.' }],
            },
            {
                titulo: 'App de la colonia de vacaciones', diasAtras: 1, porcentaje: 0,
                descripcion: 'App para que las familias vean actividades, fotos y avisos de la colonia.',
                perfiles: [
                    perfil('App Android', 'Versión Android de la app', ['Kotlin'], ['Firebase'], 8, Periodo.SEMANAL, { limite: 1, finEnDias: 60 }),
                    perfil('App iOS', 'Versión iOS de la app', ['Swift'], ['Firebase'], 8, Periodo.SEMANAL, { limite: 1, finEnDias: 60 }),
                    perfil('Coordinación', 'Organizar el equipo y las prioridades con el club', ['Scrum'], ['Kanban', 'Gestión de producto'], 3, Periodo.SEMANAL, { limite: 1 }),
                ],
                logros: [],
            },
        ],
    },
    {
        // Incumple a propósito la regla de fin de lucro (colectivo y proyecto)
        nombre: 'Desarrollos Andinos S.R.L.', username: 'desarrollos-andinos', tipo: TipoColectivo.ONG, ubicacion: 'Mendoza', infringe: true,
        descripcion: 'Empresa privada de software que arma sistemas para clientes corporativos.',
        proyectos: [
            {
                titulo: 'Portal de autogestión para clientes', diasAtras: 3, porcentaje: 10, infringe: true,
                descripcion: 'Portal con fines comerciales para que nuestros clientes paguen y descarguen sus facturas.',
                perfiles: [
                    perfil('Desarrollo full stack', 'Portal de clientes y facturación', ['React', 'Node.js'], ['MongoDB'], 10, Periodo.SEMANAL, { limite: 2 }),
                ],
                logros: [],
            },
        ],
    },
];

const COLABORADORES = [
    { nombre: 'Lucía', apellido: 'Fernández', cuentaGit: 'luciafer', pronombres: 'ella', habilidades: ['React', 'JavaScript', 'TypeScript', 'Testing automatizado', 'HTML y CSS', 'Next.js', 'Git', 'Jest', 'Revisión de código'], presentacion: 'Frontend developer, me interesan los proyectos de impacto social.', deseaSerContactado: true, contactos: [{ medio: MedioDeContacto.EMAIL, valor: 'lucia.fernandez@example.com' }] },
    { nombre: 'Martín', apellido: 'Gómez', cuentaGit: 'mgomez-dev', pronombres: 'él', habilidades: ['Node.js', 'Express', 'MongoDB', 'Docker', 'APIs REST', 'Git', 'Redis', 'Seguridad informática', 'Linux'], presentacion: 'Backend con Node, disponible los fines de semana.', deseaSerContactado: true, contactos: [{ medio: MedioDeContacto.WHATSAPP, valor: '+5491155550001' }] },
    { nombre: 'Sofía', apellido: 'Ramírez', cuentaGit: 'sofiaram', nombreFantasia: 'Sofi Code', habilidades: ['Python', 'Django', 'PostgreSQL', 'SQL', 'Pandas', 'Power BI', 'APIs REST', 'Git'], presentacion: 'Me gustan los datos y las APIs.', deseaSerContactado: false, contactos: [] },
    { nombre: 'Tomás', apellido: 'López', cuentaGit: 'tlopez', pronombres: 'él', habilidades: ['Next.js', 'React', 'TypeScript', 'Tailwind CSS', 'JavaScript', 'MongoDB', 'Node.js', 'Git', 'Firebase'], presentacion: 'Fullstack JS.', deseaSerContactado: true, contactos: [{ medio: MedioDeContacto.EMAIL, valor: 'tomas.lopez@example.com' }] },
    { nombre: 'Valentina', apellido: 'Sosa', cuentaGit: 'valesosa', pronombres: 'ella', habilidades: ['Diseño UX/UI', 'Figma', 'Accesibilidad web', 'Investigación de usuarios', 'Prototipado', 'HTML y CSS'], presentacion: 'Diseñadora UX con foco en accesibilidad.', deseaSerContactado: true, contactos: [{ medio: MedioDeContacto.EMAIL, valor: 'vale.sosa@example.com' }] },
    { nombre: 'Joaquín', apellido: 'Pereyra', cuentaGit: 'jpereyra', habilidades: ['Java', 'Spring Boot', 'PostgreSQL', 'Docker', 'Kotlin', 'SQL', 'Git', 'Testing automatizado'], presentacion: 'Backend Java, quiero sumar experiencia en proyectos libres.', deseaSerContactado: false, contactos: [] },
    { nombre: 'Camila', apellido: 'Díaz', cuentaGit: 'camidiaz', pronombres: 'ella', habilidades: ['React Native', 'JavaScript', 'React', 'TypeScript', 'Firebase', 'Flutter'], presentacion: 'Desarrollo mobile.', deseaSerContactado: true, contactos: [{ medio: MedioDeContacto.SMS, valor: '+5493415550002' }] },
    { nombre: 'Nicolás', apellido: 'Herrera', cuentaGit: 'nherrera', habilidades: ['Docker', 'Linux', 'CI/CD', 'AWS', 'Kubernetes', 'Google Cloud', 'Seguridad informática'], presentacion: 'DevOps, me encargo de que todo llegue a producción.', deseaSerContactado: true, contactos: [{ medio: MedioDeContacto.EMAIL, valor: 'nico.herrera@example.com' }] },
    { nombre: 'Agustina', apellido: 'Molina', cuentaGit: 'agusmolina', nombreFantasia: 'Agus', pronombres: 'elle', habilidades: ['Vue.js', 'HTML y CSS', 'Tailwind CSS', 'JavaScript', 'Figma', 'Accesibilidad web'], presentacion: 'Front con Vue.', deseaSerContactado: true, contactos: [] },
    { nombre: 'Federico', apellido: 'Castro', cuentaGit: 'fedecastro', habilidades: ['PHP', 'MySQL', 'HTML y CSS', 'WordPress', 'JavaScript', 'SEO'], presentacion: 'Desarrollo web clásico.', deseaSerContactado: false, contactos: [] },
    { nombre: 'Julieta', apellido: 'Romero', cuentaGit: 'juliromero', pronombres: 'ella', habilidades: ['Scrum', 'Análisis funcional', 'Documentación técnica', 'Kanban', 'Gestión de producto', 'Capacitación de usuarios', 'Redacción de contenidos'], presentacion: 'Analista funcional y scrum master.', deseaSerContactado: true, contactos: [{ medio: MedioDeContacto.EMAIL, valor: 'juli.romero@example.com' }] },
    { nombre: 'Diego', apellido: 'Acosta', cuentaGit: 'dacosta', habilidades: ['Angular', 'TypeScript', 'Node.js', 'Express', 'MongoDB', 'APIs REST', 'Git', 'Mentoría'], presentacion: 'Fullstack Angular + Node.', deseaSerContactado: true, contactos: [] },
    { nombre: 'Bruno', apellido: 'Medina', cuentaGit: 'brunomedina', pronombres: 'él', habilidades: ['Kotlin', 'Swift', 'Flutter', 'Firebase', 'Git'], presentacion: 'Mobile nativo y Flutter, me gustan las apps que usa la gente del barrio.', deseaSerContactado: true, contactos: [{ medio: MedioDeContacto.WHATSAPP, valor: '+5491155550003' }] },
    { nombre: 'Florencia', apellido: 'Vega', cuentaGit: 'flor-vega', pronombres: 'ella', habilidades: ['Python', 'Pandas', 'Power BI', 'Machine Learning', 'SQL', 'IoT'], presentacion: 'Científica de datos, armo sensores en mis ratos libres.', deseaSerContactado: true, contactos: [{ medio: MedioDeContacto.EMAIL, valor: 'flor.vega@example.com' }] },
    { nombre: 'Ramiro', apellido: 'Ortiz', cuentaGit: 'rortiz', habilidades: ['NestJS', 'TypeScript', 'Node.js', 'GraphQL', 'Redis', 'PostgreSQL', 'Docker', 'Jest'], presentacion: 'Backend con NestJS y PostgreSQL.', deseaSerContactado: true, contactos: [{ medio: MedioDeContacto.EMAIL, valor: 'ramiro.ortiz@example.com' }] },
    { nombre: 'Micaela', apellido: 'Ruiz', cuentaGit: 'micaruiz', nombreFantasia: 'Mica', pronombres: 'ella', habilidades: ['Marketing digital', 'SEO', 'Redes sociales', 'Redacción de contenidos', 'WordPress', 'Diseño gráfico'], presentacion: 'Comunicación y marketing para organizaciones sociales.', deseaSerContactado: true, contactos: [{ medio: MedioDeContacto.EMAIL, valor: 'mica.ruiz@example.com' }] },
    { nombre: 'Gonzalo', apellido: 'Benítez', cuentaGit: 'gbenitez', pronombres: 'él', habilidades: ['Kubernetes', 'Docker', 'Google Cloud', 'Linux', 'CI/CD', 'AWS'], presentacion: 'SRE, ayudo a que los sistemas no se caigan.', deseaSerContactado: false, contactos: [] },
    { nombre: 'Paula', apellido: 'Navarro', cuentaGit: 'paunavarro', pronombres: 'ella', habilidades: ['Cypress', 'Jest', 'Testing automatizado', 'JavaScript', 'React', 'TypeScript'], presentacion: 'QA automation, también hago front con React.', deseaSerContactado: true, contactos: [{ medio: MedioDeContacto.SMS, valor: '+5491155550004' }] },
    { nombre: 'Ezequiel', apellido: 'Suárez', cuentaGit: 'ezesuarez', habilidades: ['Ruby on Rails', 'PostgreSQL', 'Redis', 'HTML y CSS', 'JavaScript', 'Docker'], presentacion: 'Rails developer hace 6 años.', deseaSerContactado: false, contactos: [] },
    // Incumple a propósito la regla de palabras prohibidas (spam en la presentación y un insulto en su postulación)
    { nombre: 'Kevin', apellido: 'Ibarra', cuentaGit: 'kevin-ibarra', nombreFantasia: 'KevoDev', habilidades: ['WordPress', 'HTML y CSS', 'JavaScript', 'PHP', 'MySQL'], presentacion: 'Hago páginas web en dos días. También te enseño a ganar dinero fácil con apuestas online.', deseaSerContactado: false, contactos: [], infringe: true },
    { nombre: 'Carla', apellido: 'Giménez', cuentaGit: 'carlagimenez', pronombres: 'ella', habilidades: ['Diseño gráfico', 'Figma', 'Prototipado', 'Investigación de usuarios', 'Diseño UX/UI'], presentacion: 'Diseñadora gráfica y UX.', deseaSerContactado: true, contactos: [{ medio: MedioDeContacto.EMAIL, valor: 'carla.gimenez@example.com' }] },
];

// inicio y fin en días atrás; sin fin = colaboración activa. perfil = título del perfil en el proyecto.
const COLABORACIONES = [
    { cuentaGit: 'luciafer', proyecto: 'Web de reparto solidario', perfil: 'Desarrollo frontend', inicio: 10 },
    { cuentaGit: 'mgomez-dev', proyecto: 'Web de reparto solidario', perfil: 'Desarrollo backend', inicio: 9, esAnonima: true },
    { cuentaGit: 'tlopez', proyecto: 'Inventario de donaciones', perfil: 'Desarrollo full stack', inicio: 20 },
    { cuentaGit: 'valesosa', proyecto: 'Inventario de donaciones', perfil: 'Diseño de interfaces', inicio: 22, fin: 5 },
    { cuentaGit: 'fedecastro', proyecto: 'Campaña de donaciones online', perfil: 'Sitio de la campaña', inicio: 280, fin: 250 },
    { cuentaGit: 'micaruiz', proyecto: 'Campaña de donaciones online', perfil: 'Difusión en redes', inicio: 280, fin: 250 },
    { cuentaGit: 'sofiaram', proyecto: 'Censo barrial', perfil: 'Análisis de datos', inicio: 115, fin: 60 },
    { cuentaGit: 'flor-vega', proyecto: 'Huerta comunitaria conectada', perfil: 'Sensores y riego', inicio: 30 },
    { cuentaGit: 'sofiaram', proyecto: 'Gestión de voluntariado', perfil: 'Desarrollo backend', inicio: 35 },
    { cuentaGit: 'nherrera', proyecto: 'Gestión de voluntariado', perfil: 'Infraestructura', inicio: 30 },
    { cuentaGit: 'camidiaz', proyecto: 'App de alertas de emergencias', perfil: 'Desarrollo mobile', inicio: 1 },
    { cuentaGit: 'fedecastro', proyecto: 'Sitio institucional de la red', perfil: 'Desarrollo web', inicio: 320, fin: 290 },
    { cuentaGit: 'agusmolina', proyecto: 'Agenda de talleres barriales', perfil: 'Desarrollo frontend', inicio: 15 },
    { cuentaGit: 'fedecastro', proyecto: 'Bolsa de trabajo barrial', perfil: 'Desarrollo full stack', inicio: 60, esAnonima: true },
    { cuentaGit: 'micaruiz', proyecto: 'Newsletter del barrio', perfil: 'Redacción', inicio: 7 },
    { cuentaGit: 'tlopez', proyecto: 'Seguimiento de apoyo escolar', perfil: 'Desarrollo frontend', inicio: 7 },
    { cuentaGit: 'tlopez', proyecto: 'Biblioteca popular online', perfil: 'Desarrollo full stack', inicio: 190, fin: 100 },
    { cuentaGit: 'rortiz', proyecto: 'Aula virtual para tutores', perfil: 'Desarrollo backend', inicio: 3 },
    { cuentaGit: 'flor-vega', proyecto: 'Encuesta de deserción escolar', perfil: 'Análisis de datos', inicio: 170, fin: 150 },
    { cuentaGit: 'jpereyra', proyecto: 'Registro de socias de la cooperativa', perfil: 'Desarrollo backend', inicio: 25 },
    { cuentaGit: 'dacosta', proyecto: 'Registro de socias de la cooperativa', perfil: 'Desarrollo frontend', inicio: 18 },
    { cuentaGit: 'juliromero', proyecto: 'Tienda online de la cooperativa', perfil: 'Coordinación', inicio: 12 },
    { cuentaGit: 'luciafer', proyecto: 'Catálogo de la feria de productores', perfil: 'Desarrollo frontend', inicio: 110, fin: 90 },
    { cuentaGit: 'camidiaz', proyecto: 'Mapa de puntos de reciclaje', perfil: 'Desarrollo mobile', inicio: 5 },
    { cuentaGit: 'carlagimenez', proyecto: 'Mapa de puntos de reciclaje', perfil: 'Diseño de interfaces', inicio: 5 },
    { cuentaGit: 'flor-vega', proyecto: 'Monitoreo de calidad del agua', perfil: 'Análisis de datos', inicio: 210, fin: 180 },
    { cuentaGit: 'carlagimenez', proyecto: 'Campaña de concientización ambiental', perfil: 'Diseño de piezas', inicio: 18 },
    { cuentaGit: 'micaruiz', proyecto: 'Campaña de concientización ambiental', perfil: 'Marketing', inicio: 15 },
    { cuentaGit: 'ezesuarez', proyecto: 'Gestión de socios del club', perfil: 'Desarrollo backend', inicio: 40 },
    { cuentaGit: 'agusmolina', proyecto: 'Gestión de socios del club', perfil: 'Desarrollo frontend', inicio: 30 },
    { cuentaGit: 'gbenitez', proyecto: 'Gestión de socios del club', perfil: 'Infraestructura', inicio: 10 },
    { cuentaGit: 'fedecastro', proyecto: 'Reserva de canchas', perfil: 'Desarrollo full stack', inicio: 270, fin: 240 },
];

// Postulaciones de colaboradores a perfiles; diasAtras = fecha de la postulación.
// Las pendientes están en proyectos con revisión manual (o en HastaLlenarVacantes sin llegar al límite) para poder aceptarlas o rechazarlas.
// Las de un perfil con el cupo completo quedaron pendientes de antes de cerrarse: aceptarlas tiene que dar 409.
const { PENDIENTE, ACEPTADA, RECHAZADA } = EstadoPostulacion;
const POSTULACIONES = [
    // Pendientes
    { cuentaGit: 'paunavarro', proyecto: 'Web de reparto solidario', perfil: 'Desarrollo frontend', diasAtras: 3, estado: PENDIENTE, mensaje: 'Hola! Hago testing automatizado y front con React, me gustaría sumarme.' },
    { cuentaGit: 'tlopez', proyecto: 'Web de reparto solidario', perfil: 'Desarrollo frontend', diasAtras: 2, estado: PENDIENTE, mensaje: 'Tengo experiencia con React y puedo dedicarle las horas que piden.' },
    { cuentaGit: 'dacosta', proyecto: 'Web de reparto solidario', perfil: 'Desarrollo backend', diasAtras: 10, estado: PENDIENTE, mensaje: 'Trabajo con Node y Mongo hace años, me interesa la API de pedidos.' },
    { cuentaGit: 'rortiz', proyecto: 'Turnos para el comedor comunitario', perfil: 'Desarrollo backend', diasAtras: 4, estado: PENDIENTE, mensaje: 'Puedo armar las reglas de cupos con Node y PostgreSQL.' },
    { cuentaGit: 'luciafer', proyecto: 'Turnos para el comedor comunitario', perfil: 'Desarrollo frontend', diasAtras: 3, estado: PENDIENTE, mensaje: 'Me encanta que sea accesible desde el celular, cuenten conmigo.' },
    { cuentaGit: 'valesosa', proyecto: 'App de alertas de emergencias', perfil: 'Diseño de interfaces', diasAtras: 1, estado: PENDIENTE, mensaje: 'Vi el aviso, me interesa mucho el flujo de alerta.' },
    { cuentaGit: 'carlagimenez', proyecto: 'App de alertas de emergencias', perfil: 'Diseño de interfaces', diasAtras: 1, estado: PENDIENTE, mensaje: 'Puedo hacer el prototipo en Figma esta misma semana.' },
    { cuentaGit: 'mgomez-dev', proyecto: 'App de alertas de emergencias', perfil: 'Desarrollo backend', diasAtras: 2, estado: PENDIENTE, mensaje: 'Ya hice notificaciones push con Node, me sumo.' },
    { cuentaGit: 'paunavarro', proyecto: 'Agenda de talleres barriales', perfil: 'Testing', diasAtras: 5, estado: PENDIENTE, mensaje: 'Puedo armar los tests end to end con Cypress.' },
    { cuentaGit: 'luciafer', proyecto: 'Seguimiento de apoyo escolar', perfil: 'Desarrollo frontend', diasAtras: 5, estado: PENDIENTE, mensaje: 'Gracias por el aviso, me interesa el panel de tutores.' },
    { cuentaGit: 'dacosta', proyecto: 'Seguimiento de apoyo escolar', perfil: 'Desarrollo backend', diasAtras: 6, estado: PENDIENTE, mensaje: 'Puedo encargarme de la API de asistencia.' },
    { cuentaGit: 'tlopez', proyecto: 'Tienda online de la cooperativa', perfil: 'Desarrollo frontend', diasAtras: 9, estado: PENDIENTE, mensaje: 'Hice varios carritos con React y Tailwind.' },
    { cuentaGit: 'mgomez-dev', proyecto: 'Tienda online de la cooperativa', perfil: 'Desarrollo backend', diasAtras: 2, estado: PENDIENTE, mensaje: 'Me escribieron por el backend de la tienda, acá estoy.' },
    { cuentaGit: 'brunomedina', proyecto: 'Mapa de puntos de reciclaje', perfil: 'Desarrollo mobile', diasAtras: 4, estado: PENDIENTE, mensaje: 'Trabajo con Flutter y Firebase todos los días.' },
    { cuentaGit: 'dacosta', proyecto: 'Mapa de puntos de reciclaje', perfil: 'Desarrollo backend', diasAtras: 2, estado: PENDIENTE, mensaje: 'Puedo armar la API de puntos con Express.' },
    { cuentaGit: 'luciafer', proyecto: 'Gestión de socios del club', perfil: 'Desarrollo frontend', diasAtras: 8, estado: PENDIENTE, mensaje: 'Soy socia del club, me encantaría ayudar.' },
    { cuentaGit: 'brunomedina', proyecto: 'App de la colonia de vacaciones', perfil: 'App Android', diasAtras: 1, estado: PENDIENTE, mensaje: 'Puedo hacer la versión Android en Kotlin.' },
    { cuentaGit: 'jpereyra', proyecto: 'App de la colonia de vacaciones', perfil: 'App Android', diasAtras: 1, estado: PENDIENTE, mensaje: 'Vengo de Java y estoy usando Kotlin, me sirve para practicar.' },
    { cuentaGit: 'brunomedina', proyecto: 'App de la colonia de vacaciones', perfil: 'App iOS', diasAtras: 1, estado: PENDIENTE, mensaje: 'También puedo encargarme de iOS con Swift.' },
    { cuentaGit: 'juliromero', proyecto: 'App de la colonia de vacaciones', perfil: 'Coordinación', diasAtras: 0, estado: PENDIENTE, mensaje: 'Puedo coordinar el equipo con Scrum.' },
    { cuentaGit: 'paunavarro', proyecto: 'Aula virtual para tutores', perfil: 'Desarrollo frontend', diasAtras: 2, estado: PENDIENTE, mensaje: 'React con TypeScript y tests con Jest.' },
    { cuentaGit: 'tlopez', proyecto: 'Huerta comunitaria conectada', perfil: 'Tablero de mediciones', diasAtras: 6, estado: PENDIENTE, mensaje: 'Me copa el proyecto, puedo hacer los gráficos.' },
    { cuentaGit: 'kevin-ibarra', proyecto: 'Gestión de socios del club', perfil: 'Desarrollo frontend', diasAtras: 2, estado: PENDIENTE, mensaje: 'Che boludo, sumame que esto lo hago en una tarde.', infringe: true },

    // Aceptadas (cada una tiene su colaboración)
    { cuentaGit: 'camidiaz', proyecto: 'App de alertas de emergencias', perfil: 'Desarrollo mobile', diasAtras: 2, estado: ACEPTADA, mensaje: 'Hago apps con React Native, me sumo.' },
    { cuentaGit: 'flor-vega', proyecto: 'Huerta comunitaria conectada', perfil: 'Sensores y riego', diasAtras: 31, estado: ACEPTADA, mensaje: 'Tengo varias placas ESP32 para probar.' },
    { cuentaGit: 'rortiz', proyecto: 'Aula virtual para tutores', perfil: 'Desarrollo backend', diasAtras: 4, estado: ACEPTADA, mensaje: 'NestJS y PostgreSQL es mi stack.' },
    { cuentaGit: 'dacosta', proyecto: 'Registro de socias de la cooperativa', perfil: 'Desarrollo frontend', diasAtras: 19, estado: ACEPTADA, mensaje: 'Gracias por el aviso, me sumo a las pantallas en Angular.' },
    { cuentaGit: 'carlagimenez', proyecto: 'Mapa de puntos de reciclaje', perfil: 'Diseño de interfaces', diasAtras: 6, estado: ACEPTADA, mensaje: 'Puedo prototipar el flujo completo.' },
    { cuentaGit: 'micaruiz', proyecto: 'Newsletter del barrio', perfil: 'Redacción', diasAtras: 8, estado: ACEPTADA, mensaje: 'Escribo newsletters para otras organizaciones.' },

    // Rechazadas
    { cuentaGit: 'nherrera', proyecto: 'Gestión de socios del club', perfil: 'Infraestructura', diasAtras: 12, estado: RECHAZADA, mensaje: 'Puedo armar el despliegue en Kubernetes.' },
    { cuentaGit: 'valesosa', proyecto: 'Bolsa de trabajo barrial', perfil: 'Accesibilidad', diasAtras: 50, estado: RECHAZADA, mensaje: 'Hago auditorías de accesibilidad con WCAG.' },
];

// Notificaciones a colaboradores (el esquema solo guarda destinatario, mensaje, automatica y fecha).
// Manuales: un colectivo contacta a un colaborador por un perfil (mensaje = lo que escribió el colectivo).
// Automáticas: la plataforma avisa que las habilidades cubren un perfil abierto (mismo texto que notificacionAutomaticaService).
// Los avisos de moderación al dueño de un reporte notificado se generan desde REPORTES.
const NOTIFICACIONES = [
    // Manuales
    { destinatario: 'mgomez-dev', proyecto: 'Tienda online de la cooperativa', perfil: 'Desarrollo backend', diasAtras: 3, mensaje: 'Hola Martín, vimos tu perfil y nos encantaría que te sumes al backend de la tienda.' },
    { destinatario: 'valesosa', proyecto: 'App de alertas de emergencias', perfil: 'Diseño de interfaces', diasAtras: 1, mensaje: 'Hola Valentina, buscamos a alguien con experiencia en accesibilidad para el diseño de la app.' },
    { destinatario: 'luciafer', proyecto: 'Seguimiento de apoyo escolar', perfil: 'Desarrollo frontend', diasAtras: 6, mensaje: 'Hola Lucía, ¿te interesaría colaborar con el panel de tutores?' },
    { destinatario: 'dacosta', proyecto: 'Registro de socias de la cooperativa', perfil: 'Desarrollo frontend', diasAtras: 20, mensaje: 'Hola Diego, necesitamos ayuda con las pantallas en Angular.' },
    { destinatario: 'brunomedina', proyecto: 'App de la colonia de vacaciones', perfil: 'App iOS', diasAtras: 1, mensaje: 'Hola Bruno, vimos que sabés Swift, ¿te sumás a la app de la colonia?' },
    { destinatario: 'paunavarro', proyecto: 'Agenda de talleres barriales', perfil: 'Testing', diasAtras: 6, mensaje: 'Hola Paula, buscamos a alguien que arme las pruebas de punta a punta.' },

    // Automáticas
    { destinatario: 'tlopez', proyecto: 'Tienda online de la cooperativa', perfil: 'Desarrollo frontend', diasAtras: 14, automatica: true },
    { destinatario: 'rortiz', proyecto: 'Turnos para el comedor comunitario', perfil: 'Desarrollo backend', diasAtras: 5, automatica: true },
    { destinatario: 'juliromero', proyecto: 'App de la colonia de vacaciones', perfil: 'Coordinación', diasAtras: 1, automatica: true },
    { destinatario: 'flor-vega', proyecto: 'Huerta comunitaria conectada', perfil: 'Sensores y riego', diasAtras: 33, automatica: true },
    { destinatario: 'camidiaz', proyecto: 'App de alertas de emergencias', perfil: 'Desarrollo mobile', diasAtras: 2, automatica: true },
];

const textoNotificacion = (n) => n.automatica
    ? `Encontramos un proyecto para vos: "${n.proyecto}", perfil "${n.perfil}."`
    : `El proyecto "${n.proyecto}" te contactó por el perfil "${n.perfil}": ${n.mensaje}`;

// Reportes cargados a mano por usuarios (los automáticos se calculan con las reglas de moderación).
// entidad: { colectivo: nombre } | { proyecto: título } | { colaborador: cuentaGit } | { postulacion: { cuentaGit, proyecto, perfil } }.
// Fechas en días atrás: diasAtras (alta), notificado (se le avisó al dueño), solucionado (el dueño lo editó), revisado (lo resolvió un admin).
const REPORTES = [
    {
        entidad: { proyecto: 'Tienda online de la cooperativa' }, diasAtras: 1, estado: EstadoReporte.PENDIENTE,
        motivo: 'El perfil de backend ofrece un pago, ¿no es un trabajo encubierto?',
    },
    {
        entidad: { proyecto: 'Bolsa de trabajo barrial' }, diasAtras: 6, notificado: 4, estado: EstadoReporte.PENDIENTE,
        motivo: 'Algunas ofertas publicadas piden trabajar a prueba sin cobrar',
    },
    {
        entidad: { proyecto: 'Newsletter del barrio' }, diasAtras: 7, notificado: 6, solucionado: 5, estado: EstadoReporte.SOLUCIONADO,
        motivo: 'La descripción tenía el teléfono personal de una vecina',
    },
    {
        entidad: { colaborador: 'fedecastro' }, diasAtras: 15, revisado: 14, estado: EstadoReporte.RECHAZADO,
        motivo: 'Me parece una cuenta falsa, la cuenta de Git no tiene actividad',
        comentario: 'Revisamos la cuenta de Git y tiene proyectos propios: es real.',
    },
    {
        entidad: { postulacion: { cuentaGit: 'mgomez-dev', proyecto: 'App de alertas de emergencias', perfil: 'Desarrollo backend' } }, diasAtras: 1, revisado: 0, estado: EstadoReporte.RECHAZADO,
        motivo: 'Mensaje copiado y pegado en varias postulaciones',
        comentario: 'El mensaje es breve pero no incumple ninguna regla.',
    },
];

// Mismo nombre con el que reporteService se refiere a la entidad al avisarle al dueño
const NOMBRE_ENTIDAD = {
    [TipoEntidadReportada.PROYECTO]: 'tu proyecto',
    [TipoEntidadReportada.COLECTIVO]: 'los datos de tu organización',
    [TipoEntidadReportada.COLABORADOR]: 'tu perfil',
    [TipoEntidadReportada.POSTULACION]: 'tu postulación',
};

const idsDe = (docs) => docs.map((d) => d._id);
const idDe = (ref) => (ref?._id ?? ref)?.toString();

// Borra lo que haya cargado una corrida anterior (todo lo asociado a usuarios @semilla.local)
const limpiarDatosSemilla = async () => {
    const idsUsuarios = idsDe(await UsuarioModel.find({ email: DOMINIO_SEMILLA }, '_id'));
    const colectivos = await ColectivoModel.find({ usuario: { $in: idsUsuarios } }, 'proyectos');
    const idsColectivos = idsDe(colectivos);
    const idsColaboradores = idsDe(await ColaboradorModel.find({ usuario: { $in: idsUsuarios } }, '_id'));
    const idsProyectos = colectivos.flatMap((c) => c.proyectos);

    const filtroColaboraciones = { $or: [{ 'colaborador.id': { $in: idsColaboradores } }, { 'proyecto.id': { $in: idsProyectos } }] };
    const filtroPostulaciones = { $or: [{ colaborador: { $in: idsColaboradores } }, { proyecto: { $in: idsProyectos } }] };
    const idsColaboraciones = idsDe(await ColaboracionModel.find(filtroColaboraciones, '_id'));
    const idsPostulaciones = idsDe(await PostulacionModel.find(filtroPostulaciones, '_id'));

    const filtroReportes = {
        $or: [
            { 'entidad.id': { $in: [...idsColectivos, ...idsProyectos, ...idsColaboradores, ...idsPostulaciones] } },
            { duenio: { $in: idsUsuarios } },
            { revisadoPor: { $in: idsUsuarios } },
        ],
    };
    const idsReportes = idsDe(await ReporteModel.find(filtroReportes, '_id'));

    await AuditoriaModel.deleteMany({
        $or: [
            { 'autor.id': { $in: idsUsuarios } },
            { colectivo: { $in: idsColectivos } },
            { 'entidad.id': { $in: [...idsColectivos, ...idsProyectos, ...idsPostulaciones, ...idsColaboraciones, ...idsReportes] } },
        ],
    });
    await ReporteModel.deleteMany({ _id: { $in: idsReportes } });
    await ColaboracionModel.deleteMany({ _id: { $in: idsColaboraciones } });
    await PostulacionModel.deleteMany({ _id: { $in: idsPostulaciones } });
    await NotificacionModel.deleteMany({ destinatario: { $in: idsUsuarios } });
    await ProyectoModel.deleteMany({ _id: { $in: idsProyectos } });
    await ColectivoModel.deleteMany({ _id: { $in: idsColectivos } });
    await ColaboradorModel.deleteMany({ _id: { $in: idsColaboradores } });
    await UsuarioModel.deleteMany({ _id: { $in: idsUsuarios } });
};

// Los timestamps de Mongoose ponen createdAt = ahora; se pisa para simular datos de distintas fechas
const fijarFechaCreacion = (Model, id, fecha) =>
    Model.collection.updateOne({ _id: id }, { $set: { createdAt: fecha, updatedAt: fecha } });

const fijarFechasCreacion = (Model, docs, fechas) =>
    Promise.all(docs.map((doc, i) => fijarFechaCreacion(Model, doc._id, fechas[i])));

const idHabilidad = (habilidades, titulo) => {
    const id = habilidades.get(titulo);
    if (!id) throw new Error(`La habilidad "${titulo}" no está en seeds/habilidades.js`);
    return id;
};

// ---------- Fechas derivadas de los datos ----------

const todosLosProyectos = () => COLECTIVOS.flatMap((c) => c.proyectos);

// El colectivo se da de alta unos días antes de su primer proyecto
const diasAltaColectivo = (colectivo) => Math.max(...colectivo.proyectos.map((p) => p.diasAtras)) + 5;

// El colaborador se da de alta unos días antes de su primera actividad (colaboración, postulación o notificación)
const diasAltaColaborador = (cuentaGit) => Math.max(
    1,
    ...COLABORACIONES.filter((c) => c.cuentaGit === cuentaGit).map((c) => c.inicio),
    ...POSTULACIONES.filter((p) => p.cuentaGit === cuentaGit).map((p) => p.diasAtras),
    ...NOTIFICACIONES.filter((n) => n.destinatario === cuentaGit).map((n) => n.diasAtras),
) + 2;

// Un proyecto finalizado se cierra el día después de que termina su última colaboración
const diasFinalizacion = (proyecto) => {
    const fines = COLABORACIONES.filter((c) => c.proyecto === proyecto.titulo && c.fin != null).map((c) => c.fin);
    return fines.length ? Math.max(Math.min(...fines) - 1, 0) : Math.floor(proyecto.diasAtras / 2);
};

// Una postulación aceptada se resuelve el día que empieza su colaboración; una rechazada, al día siguiente
const diasResolucion = (p) => {
    if (p.estado === ACEPTADA) {
        return COLABORACIONES.find((c) => c.cuentaGit === p.cuentaGit && c.proyecto === p.proyecto && c.perfil === p.perfil)?.inicio ?? p.diasAtras;
    }
    return Math.max(p.diasAtras - 1, 0);
};

// ---------- Moderación ----------

const clavePostulacion = ({ cuentaGit, proyecto, perfil }) => `${cuentaGit}|${proyecto}|${perfil}`;

// Mismas reglas que corre la API al crear o editar (sin la de código cerrado, que consulta la red).
// Las palabras salen de seeds/palabrasBaneadas.js, así el resultado no depende de lo que haya en la base.
const reglasModeracion = [
    new ReglaPalabrasProhibidas({
        detectarEnCampos: async (campos) => Object.fromEntries(Object.entries(campos)
            .filter(([, texto]) => typeof texto === 'string' && texto)
            .map(([campo, texto]) => [campo, palabraBaneadaService._buscar(texto, PALABRAS_BANEADAS)])
            .filter(([, encontradas]) => encontradas.length > 0)),
    }),
    new ReglaFinDeLucro(),
];

const evaluarReglas = async (tipo, entidad) => {
    const reglas = reglasModeracion.filter((regla) => regla.aplicaA(tipo, entidad));
    const incumplidas = [];
    for (const regla of reglas) {
        const motivo = await regla.evaluar(tipo, entidad);
        if (motivo) incumplidas.push({ regla: regla.nombre, motivo });
    }
    return incumplidas;
};

// Revisa todos los textos de la semilla. Devuelve, por cada dato que incumple alguna regla,
// lo necesario para cargar su reporte automático: { tipo, ref, infringe, motivo, reglas, diasAtras }.
// infringe indica si el dato estaba marcado como incumplidor (para la validación).
const moderarSemilla = async () => {
    const candidatos = [
        ...COLECTIVOS.map((c) => ({ tipo: TipoEntidadReportada.COLECTIVO, ref: { colectivo: c.nombre }, datos: c, diasAtras: diasAltaColectivo(c) })),
        ...todosLosProyectos().map((p) => ({ tipo: TipoEntidadReportada.PROYECTO, ref: { proyecto: p.titulo }, datos: p, diasAtras: p.diasAtras })),
        ...COLABORADORES.map((c) => ({ tipo: TipoEntidadReportada.COLABORADOR, ref: { colaborador: c.cuentaGit }, datos: c, diasAtras: diasAltaColaborador(c.cuentaGit) })),
        ...POSTULACIONES.map((p) => ({ tipo: TipoEntidadReportada.POSTULACION, ref: { postulacion: p }, datos: p, diasAtras: p.diasAtras })),
    ];

    const resultados = [];
    for (const { tipo, ref, datos, diasAtras } of candidatos) {
        const incumplidas = await evaluarReglas(tipo, datos);
        resultados.push({
            tipo, ref, diasAtras,
            infringe: datos.infringe ?? false,
            reglas: incumplidas.map(({ regla }) => regla),
            motivo: incumplidas.map(({ motivo }) => motivo).join(' | '),
        });
    }
    return resultados;
};

// ---------- Carga ----------

const cargarColectivosYProyectos = async (habilidades) => {
    const proyectos = new Map();
    const colectivos = new Map();
    const colectivoDeProyecto = new Map();

    for (const { proyectos: datosProyectos, administradores = [], infringe, username, ...datosColectivo } of COLECTIVOS) {
        const usuario = await crearUsuarioDeSemilla(username ?? datosColectivo.nombre, roles.COLECTIVO);
        const cuentasAdministradoras = [];
        for (const nombreCuenta of administradores) {
            cuentasAdministradoras.push(await crearUsuarioDeSemilla(nombreCuenta, roles.COLECTIVO));
        }
        const idsProyectos = [];

        for (const p of datosProyectos) {
            const proyecto = await ProyectoModel.create({
                titulo: p.titulo,
                descripcion: p.descripcion,
                finalizado: p.finalizado ?? false,
                porcentajeFinalizado: p.porcentaje,
                enlaceSistema: p.enlaceSistema ?? null,
                enlaceCodigoFuente: p.enlaceCodigoFuente ?? null,
                logros: p.logros,
                estrategiaAceptacion: p.estrategia ?? 'RevisionManual',
                requiereRevisionManual: Boolean(p.revisionManual),
                revisionManualMotivo: p.revisionManual ?? null,
                revisionManualFecha: p.revisionManual ? haceDias(1) : null,
                perfiles: p.perfiles.map(({ requeridas, opcionales, ...resto }) => ({
                    ...resto,
                    habilidadesRequeridas: requeridas.map((t) => idHabilidad(habilidades, t)),
                    habilidadesOpcionales: opcionales.map((t) => idHabilidad(habilidades, t)),
                })),
            });
            await fijarFechaCreacion(ProyectoModel, proyecto._id, haceDias(p.diasAtras));
            proyectos.set(p.titulo, proyecto);
            colectivoDeProyecto.set(p.titulo, datosColectivo.nombre);
            idsProyectos.push(proyecto._id);
        }

        const colectivo = await ColectivoModel.create({
            ...datosColectivo,
            usuario: usuario.id,
            administradores: cuentasAdministradoras.map((cuenta) => cuenta.id),
            proyectos: idsProyectos,
        });
        const diasAlta = diasAltaColectivo({ proyectos: datosProyectos });
        await fijarFechaCreacion(ColectivoModel, colectivo._id, haceDias(diasAlta));
        colectivos.set(datosColectivo.nombre, { doc: colectivo, titular: usuario, administradores: cuentasAdministradoras, diasAlta });
    }

    return { proyectos, colectivos, colectivoDeProyecto };
};

const cargarColaboradores = async (habilidades) => {
    const colaboradores = new Map();

    for (const { habilidades: titulos, infringe, ...datos } of COLABORADORES) {
        const usuario = await crearUsuarioDeSemilla(datos.cuentaGit, roles.COLABORADOR);
        const colaborador = await ColaboradorModel.create({
            ...datos,
            usuario: usuario.id,
            habilidades: titulos.map((t) => idHabilidad(habilidades, t)),
        });
        await fijarFechaCreacion(ColaboradorModel, colaborador._id, haceDias(diasAltaColaborador(datos.cuentaGit)));
        colaboradores.set(datos.cuentaGit, { doc: colaborador, usuario });
    }

    return colaboradores;
};

const idPerfil = (proyecto, titulo) => {
    const perfilProyecto = proyecto.perfiles.find((p) => p.titulo === titulo);
    if (!perfilProyecto) throw new Error(`El proyecto "${proyecto.titulo}" no tiene el perfil "${titulo}"`);
    return perfilProyecto._id;
};

// Misma desnormalización que colaboracionService: las anónimas solo guardan el id del colaborador
const cargarColaboraciones = async ({ colaboradores, proyectos }) => {
    const colaboraciones = await ColaboracionModel.insertMany(COLABORACIONES.map((c) => {
        const { doc: colab } = colaboradores.get(c.cuentaGit);
        const proyecto = proyectos.get(c.proyecto);
        const esAnonima = c.esAnonima ?? false;

        return {
            colaborador: esAnonima
                ? { id: colab._id }
                : {
                    id: colab._id,
                    nombre: colab.nombre,
                    apellido: colab.apellido,
                    nombreFantasia: colab.nombreFantasia,
                    cuentaGit: colab.cuentaGit,
                    usuario: colab.usuario,
                },
            proyecto: {
                id: proyecto._id,
                titulo: proyecto.titulo,
                descripcion: proyecto.descripcion,
            },
            perfil: idPerfil(proyecto, c.perfil),
            inicio: haceDias(c.inicio),
            fin: c.fin != null ? haceDias(c.fin) : null,
            esAnonima,
        };
    }));
    await fijarFechasCreacion(ColaboracionModel, colaboraciones, COLABORACIONES.map((c) => haceDias(c.inicio)));
    return colaboraciones;
};

const cargarPostulaciones = async ({ colaboradores, proyectos }) => {
    const postulaciones = await PostulacionModel.insertMany(POSTULACIONES.map((p) => ({
        colaborador: colaboradores.get(p.cuentaGit).doc._id,
        proyecto: proyectos.get(p.proyecto)._id,
        perfil: idPerfil(proyectos.get(p.proyecto), p.perfil),
        mensaje: p.mensaje,
        estado: p.estado,
        fecha: haceDias(p.diasAtras),
    })));
    await fijarFechasCreacion(PostulacionModel, postulaciones, postulaciones.map((p) => p.fecha));
    return new Map(postulaciones.map((p, i) => [clavePostulacion(POSTULACIONES[i]), p]));
};

const cargarNotificaciones = ({ colaboradores }) =>
    NotificacionModel.insertMany(NOTIFICACIONES.map((n) => ({
        destinatario: colaboradores.get(n.destinatario).doc.usuario,
        mensaje: textoNotificacion(n),
        automatica: n.automatica ?? false,
        fecha: haceDias(n.diasAtras),
    })));

// Resuelve la referencia de un reporte a la entidad cargada: { tipo, id, duenio, idColectivo, idProyecto }
// (duenio: a quién se avisa, igual que reporteService.buscarDuenio)
const resolverEntidad = (ref, ctx) => {
    if (ref.colectivo) {
        const colectivo = ctx.colectivos.get(ref.colectivo);
        return { tipo: TipoEntidadReportada.COLECTIVO, id: colectivo.doc._id, duenio: colectivo.titular.id, idColectivo: colectivo.doc._id };
    }
    if (ref.proyecto) {
        const colectivo = ctx.colectivos.get(ctx.colectivoDeProyecto.get(ref.proyecto));
        const proyecto = ctx.proyectos.get(ref.proyecto);
        return { tipo: TipoEntidadReportada.PROYECTO, id: proyecto._id, duenio: colectivo.titular.id, idColectivo: colectivo.doc._id, idProyecto: proyecto._id };
    }
    if (ref.colaborador) {
        const { doc } = ctx.colaboradores.get(ref.colaborador);
        return { tipo: TipoEntidadReportada.COLABORADOR, id: doc._id, duenio: doc.usuario };
    }
    const postulacion = ctx.postulaciones.get(clavePostulacion(ref.postulacion));
    const colectivo = ctx.colectivos.get(ctx.colectivoDeProyecto.get(ref.postulacion.proyecto));
    return {
        tipo: TipoEntidadReportada.POSTULACION,
        id: postulacion._id,
        duenio: ctx.colaboradores.get(ref.postulacion.cuentaGit).doc.usuario,
        idColectivo: colectivo.doc._id,
    };
};

// Automáticos: uno pendiente por cada dato que incumple reglas, con la fecha del dato (se detectan al crearlo).
// Manuales: los de REPORTES, con sus avisos al dueño si se notificaron.
const cargarReportes = async (ctx, moderacion, admin) => {
    const automaticos = moderacion.filter((m) => m.reglas.length > 0).map((m) => ({
        ref: m.ref, diasAtras: m.diasAtras, estado: EstadoReporte.PENDIENTE, motivo: m.motivo, reglas: m.reglas,
    }));
    const datos = [...automaticos, ...REPORTES];

    const fechaSiHay = (dias) => (dias != null ? haceDias(dias) : null);
    const entidades = datos.map((r) => resolverEntidad(r.entidad ?? r.ref, ctx));
    const reportes = await ReporteModel.insertMany(datos.map((r, i) => ({
        entidad: { tipo: entidades[i].tipo, id: entidades[i].id },
        motivo: r.motivo,
        reglas: r.reglas ?? [],
        duenio: entidades[i].duenio,
        estado: r.estado,
        notificado: r.notificado != null,
        fechaNotificacion: fechaSiHay(r.notificado),
        fechaSolucion: fechaSiHay(r.solucionado),
        fechaUltimoCambio: fechaSiHay(r.solucionado),
        revisadoPor: r.revisado != null ? admin.id : null,
        fechaRevision: fechaSiHay(r.revisado),
        comentarioRevision: r.comentario ?? null,
    })));
    await fijarFechasCreacion(ReporteModel, reportes, datos.map((r) => haceDias(r.diasAtras)));

    // Aviso al dueño del contenido notificado (mismo texto que reporteService.notificar)
    const notificados = datos.map((r, i) => ({ r, entidad: entidades[i] })).filter(({ r }) => r.notificado != null);
    await NotificacionModel.insertMany(notificados.map(({ r, entidad }) => ({
        destinatario: entidad.duenio,
        mensaje: `El equipo de moderación te pide revisar ${NOMBRE_ENTIDAD[entidad.tipo]}: ${r.motivo}. \n\n Editalo para que cumpla las reglas de la plataforma; si no se corrige puede darse de baja.`,
        automatica: true,
        fecha: haceDias(r.notificado),
    })));

    return {
        reportes: reportes.map((doc, i) => ({ doc, datos: datos[i], entidad: entidades[i] })),
        automaticos: automaticos.length,
        avisos: notificados.length,
    };
};

// Historial de auditoría equivalente al que habría dejado la API al cargar estos datos a mano
// (mismas acciones y mismo formato de detalle que los routers).
const cargarAuditoria = async (ctx, colaboraciones, reportes, admin) => {
    const autor = (usuario) => ({ id: usuario.id, username: usuario.username, rol: usuario.rol });
    const registros = [];
    const registrar = (accion, tipo, id, usuario, idColectivo, detalle, dias) => registros.push({
        accion,
        entidad: { tipo, id },
        autor: usuario ? autor(usuario) : null,
        colectivo: idColectivo ?? null,
        detalle: detalle ?? null,
        fecha: haceDias(dias),
    });
    const colectivoDe = (tituloProyecto) => ctx.colectivos.get(ctx.colectivoDeProyecto.get(tituloProyecto));

    for (const { doc, titular, administradores, diasAlta } of ctx.colectivos.values()) {
        registrar(AccionAuditada.COLECTIVO_CREADO, TipoEntidadAuditada.COLECTIVO, doc._id, titular, doc._id, `Nombre: ${doc.nombre}`, diasAlta);
        for (const cuenta of administradores) {
            registrar(AccionAuditada.ADMINISTRADOR_AGREGADO, TipoEntidadAuditada.COLECTIVO, doc._id, titular, doc._id, `Cuenta: ${cuenta.username}`, diasAlta - 1);
        }
    }

    for (const p of todosLosProyectos()) {
        const proyecto = ctx.proyectos.get(p.titulo);
        const { doc: colectivo, titular } = colectivoDe(p.titulo);
        registrar(AccionAuditada.PROYECTO_CREADO, TipoEntidadAuditada.PROYECTO, proyecto._id, titular, colectivo._id, `Título: ${p.titulo}`, p.diasAtras);
        if (p.finalizado) {
            registrar(AccionAuditada.PROYECTO_FINALIZADO, TipoEntidadAuditada.PROYECTO, proyecto._id, titular, colectivo._id, null, diasFinalizacion(p));
        }
    }

    for (const p of POSTULACIONES) {
        const postulacion = ctx.postulaciones.get(clavePostulacion(p));
        const { doc: colectivo, titular } = colectivoDe(p.proyecto);
        const detalle = `Colaborador: ${p.cuentaGit}. Perfil: ${postulacion.perfil}`;
        registrar(AccionAuditada.POSTULACION_CREADA, TipoEntidadAuditada.POSTULACION, postulacion._id, ctx.colaboradores.get(p.cuentaGit).usuario, colectivo._id, detalle, p.diasAtras);
        if (p.estado === ACEPTADA || p.estado === RECHAZADA) {
            const accion = p.estado === ACEPTADA ? AccionAuditada.POSTULACION_ACEPTADA : AccionAuditada.POSTULACION_RECHAZADA;
            registrar(accion, TipoEntidadAuditada.POSTULACION, postulacion._id, titular, colectivo._id, detalle, diasResolucion(p));
        }
    }

    COLABORACIONES.forEach((c, i) => {
        const { doc: colectivo, titular } = colectivoDe(c.proyecto);
        registrar(AccionAuditada.COLABORACION_CREADA, TipoEntidadAuditada.COLABORACION, colaboraciones[i]._id, titular, colectivo._id, null, c.inicio);
        if (c.fin != null) {
            registrar(AccionAuditada.COLABORACION_DADA_DE_BAJA, TipoEntidadAuditada.COLABORACION, colaboraciones[i]._id, titular, colectivo._id, 'Dada de baja por: el colectivo', c.fin);
        }
    });

    for (const { doc, datos, entidad } of reportes) {
        const detalle = (comentario) => [`${entidad.tipo} ${entidad.id}`, comentario && `Comentario: ${comentario}`].filter(Boolean).join('. ');
        if (datos.notificado != null) {
            registrar(AccionAuditada.REPORTE_NOTIFICADO, TipoEntidadAuditada.REPORTE, doc._id, admin, entidad.idColectivo, detalle(), datos.notificado);
        }
        if (datos.revisado != null) {
            const accion = datos.estado === EstadoReporte.RECHAZADO ? AccionAuditada.REPORTE_RECHAZADO : AccionAuditada.REPORTE_VALIDADO;
            registrar(accion, TipoEntidadAuditada.REPORTE, doc._id, admin, entidad.idColectivo, detalle(datos.comentario), datos.revisado);
        }
    }

    await AuditoriaModel.insertMany(registros);
    return registros.length;
};

// ---------- Validación ----------

const describirRef = (ref) => {
    if (ref.colectivo) return `colectivo "${ref.colectivo}"`;
    if (ref.proyecto) return `proyecto "${ref.proyecto}"`;
    if (ref.colaborador) return `colaborador "${ref.colaborador}"`;
    return `postulación de ${ref.postulacion.cuentaGit} a "${ref.postulacion.proyecto}" / "${ref.postulacion.perfil}"`;
};

const claveRef = (ref) => describirRef(ref);

// Revisa que los datos respeten las reglas de la API (las mismas que valida postulacionService),
// así la demo no arranca con estados imposibles. Corre antes de tocar la base y devuelve el resultado
// de la moderación, que después se usa para cargar los reportes automáticos.
const validarDatos = async () => {
    const errores = [];
    const habilidadesExistentes = new Set(HABILIDADES.map((h) => h.titulo));
    const proyectos = new Map(todosLosProyectos().map((p) => [p.titulo, p]));
    const colaboradores = new Map(COLABORADORES.map((c) => [c.cuentaGit, c]));

    const buscar = ({ cuentaGit, proyecto, perfil }, origen) => {
        const colaborador = colaboradores.get(cuentaGit);
        const datosProyecto = proyectos.get(proyecto);
        const datosPerfil = datosProyecto?.perfiles.find((p) => p.titulo === perfil);
        if (!colaborador) errores.push(`${origen}: no existe el colaborador "${cuentaGit}"`);
        if (!datosProyecto) errores.push(`${origen}: no existe el proyecto "${proyecto}"`);
        else if (!datosPerfil) errores.push(`${origen}: "${proyecto}" no tiene el perfil "${perfil}"`);
        if (colaborador && datosPerfil && !datosPerfil.requeridas.every((h) => colaborador.habilidades.includes(h))) {
            errores.push(`${origen}: ${cuentaGit} no cumple las habilidades requeridas de "${proyecto}" / "${perfil}"`);
        }
        return { colaborador, proyecto: datosProyecto, perfil: datosPerfil };
    };

    for (const titulo of [
        ...COLABORADORES.flatMap((c) => c.habilidades),
        ...[...proyectos.values()].flatMap((p) => p.perfiles.flatMap((pf) => [...pf.requeridas, ...pf.opcionales])),
    ]) {
        if (!habilidadesExistentes.has(titulo)) errores.push(`La habilidad "${titulo}" no está en seeds/habilidades.js`);
    }

    if (proyectos.size !== todosLosProyectos().length) errores.push('Hay proyectos con el título repetido');
    if (colaboradores.size !== COLABORADORES.length) errores.push('Hay colaboradores con la cuenta de Git repetida');
    const cuentas = COLECTIVOS.flatMap((c) => [c.username ?? c.nombre, ...(c.administradores ?? [])]).map(aUsername);
    if (new Set([...cuentas, ...COLABORADORES.map((c) => aUsername(c.cuentaGit)), 'admin']).size !== cuentas.length + COLABORADORES.length + 1) {
        errores.push('Hay usuarios con el username repetido (colectivos, administradores y colaboradores)');
    }

    for (const p of proyectos.values()) {
        const estrategia = obtenerEstrategia(p.estrategia);
        const perfilesConLimite = p.perfiles.map((pf) => ({ limiteColaboraciones: pf.limiteColaboraciones }));
        if (!estrategia.aplicableAProyecto({ perfiles: perfilesConLimite })) {
            errores.push(`"${p.titulo}": la estrategia ${estrategia.nombre} no es aplicable a sus perfiles`);
        }
        if (p.finalizado && p.perfiles.some((pf) => pf.busquedaAbierta)) {
            errores.push(`"${p.titulo}" está finalizado pero tiene perfiles con búsqueda abierta`);
        }
        if (p.finalizado && p.revisionManual) {
            errores.push(`"${p.titulo}" está finalizado: no puede estar marcado para revisión manual`);
        }
    }

    // Colaboraciones: una activa por colaborador y proyecto, y nunca más activas que el límite del perfil
    const activasPorPerfil = new Map();
    const activasPorColaborador = new Set();
    for (const c of COLABORACIONES) {
        buscar(c, `Colaboración de ${c.cuentaGit}`);
        if (c.fin != null) continue;
        const clave = `${c.cuentaGit}|${c.proyecto}`;
        if (activasPorColaborador.has(clave)) errores.push(`${c.cuentaGit} tiene más de una colaboración activa en "${c.proyecto}"`);
        activasPorColaborador.add(clave);
        const clavePerfil = `${c.proyecto}|${c.perfil}`;
        activasPorPerfil.set(clavePerfil, (activasPorPerfil.get(clavePerfil) ?? 0) + 1);
    }
    for (const p of proyectos.values()) {
        for (const pf of p.perfiles) {
            const activas = activasPorPerfil.get(`${p.titulo}|${pf.titulo}`) ?? 0;
            if (pf.limiteColaboraciones == null) continue;
            if (activas > pf.limiteColaboraciones) errores.push(`"${p.titulo}" / "${pf.titulo}": ${activas} colaboraciones activas con límite ${pf.limiteColaboraciones}`);
            if (activas >= pf.limiteColaboraciones && pf.busquedaAbierta) errores.push(`"${p.titulo}" / "${pf.titulo}": cupo completo pero la búsqueda sigue abierta`);
        }
    }

    // Postulaciones
    const vigentes = new Set();
    const porPerfil = new Map();
    for (const p of POSTULACIONES) {
        const origen = `Postulación de ${p.cuentaGit} a "${p.proyecto}" / "${p.perfil}"`;
        const { proyecto, perfil: datosPerfil } = buscar(p, origen);
        if (!proyecto || !datosPerfil) continue;
        const clavePerfil = `${p.proyecto}|${p.perfil}`;
        porPerfil.set(clavePerfil, (porPerfil.get(clavePerfil) ?? 0) + 1);

        if (p.estado !== RECHAZADA) {
            const clave = `${p.cuentaGit}|${clavePerfil}`;
            if (vigentes.has(clave)) errores.push(`${origen}: ya tiene otra pendiente o aceptada para ese perfil`);
            vigentes.add(clave);
        }
        if (p.estado === ACEPTADA && !COLABORACIONES.some((c) => c.cuentaGit === p.cuentaGit && c.proyecto === p.proyecto && c.perfil === p.perfil)) {
            errores.push(`${origen}: está aceptada pero no tiene colaboración`);
        }
        if (p.estado !== PENDIENTE) continue;

        const estrategia = proyecto.estrategia ?? 'RevisionManual';
        const activas = activasPorPerfil.get(clavePerfil) ?? 0;
        const cupoCompleto = datosPerfil.limiteColaboraciones != null && activas >= datosPerfil.limiteColaboraciones;
        if (proyecto.finalizado) errores.push(`${origen}: el proyecto está finalizado`);
        if (estrategia === 'TodoSuma') errores.push(`${origen}: con TodoSuma se acepta sola, no puede quedar pendiente`);
        if (!datosPerfil.busquedaAbierta && !cupoCompleto) errores.push(`${origen}: la búsqueda del perfil está cerrada`);
        if (datosPerfil.fechaFinBusqueda && datosPerfil.fechaFinBusqueda < haceDias(p.diasAtras)) errores.push(`${origen}: es posterior al fin de la búsqueda`);
        if (activasPorColaborador.has(`${p.cuentaGit}|${p.proyecto}`) && COLABORACIONES.some((c) => c.cuentaGit === p.cuentaGit && c.proyecto === p.proyecto && c.perfil === p.perfil && c.fin == null)) {
            errores.push(`${origen}: ya colabora en ese perfil`);
        }
    }
    // HastaLlenarVacantes acepta todas al llegar al límite: las pendientes solo pueden existir por debajo
    for (const p of proyectos.values()) {
        if (p.estrategia !== 'HastaLlenarVacantes') continue;
        for (const pf of p.perfiles) {
            const total = porPerfil.get(`${p.titulo}|${pf.titulo}`) ?? 0;
            if (pf.limiteColaboraciones != null && total >= pf.limiteColaboraciones && POSTULACIONES.some((x) => x.proyecto === p.titulo && x.perfil === pf.titulo && x.estado === PENDIENTE)) {
                errores.push(`"${p.titulo}" / "${pf.titulo}": con HastaLlenarVacantes no puede haber pendientes con ${total} postulaciones y límite ${pf.limiteColaboraciones}`);
            }
        }
    }

    // Notificaciones: mismas condiciones que notificacionService y notificacionAutomaticaService
    for (const n of NOTIFICACIONES) {
        const origen = `Notificación a ${n.destinatario} por "${n.proyecto}" / "${n.perfil}"`;
        const { colaborador, proyecto, perfil: datosPerfil } = n.automatica
            ? buscar({ cuentaGit: n.destinatario, proyecto: n.proyecto, perfil: n.perfil }, origen)
            : { colaborador: colaboradores.get(n.destinatario), proyecto: proyectos.get(n.proyecto), perfil: proyectos.get(n.proyecto)?.perfiles.find((pf) => pf.titulo === n.perfil) };
        if (!colaborador || !proyecto || !datosPerfil) {
            errores.push(`${origen}: no existe el colaborador, el proyecto o el perfil`);
            continue;
        }
        if (!colaborador.deseaSerContactado) errores.push(`${origen}: el colaborador no acepta ser contactado`);
        if (proyecto.finalizado) errores.push(`${origen}: el proyecto está finalizado`);
        if (n.automatica && !datosPerfil.busquedaAbierta) errores.push(`${origen}: las automáticas solo avisan de perfiles abiertos`);
        if (!n.automatica && !n.mensaje) errores.push(`${origen}: las manuales necesitan el mensaje del colectivo`);
    }

    // Moderación: lo marcado con infringe tiene que incumplir alguna regla, y nada más
    const moderacion = await moderarSemilla();
    for (const m of moderacion) {
        if (m.infringe && m.reglas.length === 0) errores.push(`El ${describirRef(m.ref)} está marcado con infringe pero no incumple ninguna regla`);
        if (!m.infringe && m.reglas.length > 0) errores.push(`El ${describirRef(m.ref)} incumple reglas sin estar marcado con infringe: ${m.motivo}`);
    }

    // Reportes manuales
    const existeRef = (ref) => (ref.colectivo && COLECTIVOS.some((c) => c.nombre === ref.colectivo))
        || (ref.proyecto && proyectos.has(ref.proyecto))
        || (ref.colaborador && colaboradores.has(ref.colaborador))
        || (ref.postulacion && POSTULACIONES.some((p) => clavePostulacion(p) === clavePostulacion(ref.postulacion)));
    const pendientesPorEntidad = new Set(moderacion.filter((m) => m.reglas.length > 0).map((m) => claveRef(m.ref)));
    for (const r of REPORTES) {
        const origen = `Reporte sobre ${describirRef(r.entidad)}`;
        if (!existeRef(r.entidad)) {
            errores.push(`${origen}: la entidad no existe`);
            continue;
        }
        if (r.estado === EstadoReporte.PENDIENTE) {
            // reporteRepository.existePendiente: un solo reporte pendiente por entidad
            if (pendientesPorEntidad.has(claveRef(r.entidad))) errores.push(`${origen}: la entidad ya tiene otro reporte pendiente`);
            pendientesPorEntidad.add(claveRef(r.entidad));
            if (r.revisado != null) errores.push(`${origen}: está pendiente pero tiene fecha de revisión`);
        }
        if (r.estado === EstadoReporte.SOLUCIONADO && (r.notificado == null || r.solucionado == null)) errores.push(`${origen}: solucionado sin fecha de notificación o de solución`);
        if ((r.estado === EstadoReporte.RECHAZADO || r.estado === EstadoReporte.VALIDADO) && (r.revisado == null || !r.comentario)) errores.push(`${origen}: resuelto por un admin sin fecha de revisión o comentario`);
        if (r.estado === EstadoReporte.VALIDADO) errores.push(`${origen}: un reporte validado elimina la entidad, no tiene sentido en la semilla`);
        const fechas = [r.diasAtras, r.notificado, r.solucionado, r.revisado].filter((d) => d != null);
        if (fechas.some((d, i) => i > 0 && d > fechas[i - 1])) errores.push(`${origen}: las fechas no están en orden (alta, notificación, solución, revisión)`);
    }

    if (errores.length) {
        throw new Error(`Los datos de la semilla no son consistentes:\n  - ${errores.join('\n  - ')}`);
    }
    return moderacion;
};

const cargar = async () => {
    if (!process.env.SEED_PASSWORD) {
        console.warn('SEED_PASSWORD vacía: los usuarios se crean con password aleatoria y no se va a poder ingresar con ellos.');
    }

    const moderacion = await validarDatos();
    const habilidades = await cargarHabilidades();
    const palabras = await cargarPalabrasBaneadas();
    await limpiarDatosSemilla();

    const admin = await crearUsuarioDeSemilla('admin', roles.ADMIN);
    const ctx = await cargarColectivosYProyectos(habilidades);
    ctx.colaboradores = await cargarColaboradores(habilidades);
    const colaboraciones = await cargarColaboraciones(ctx);
    ctx.postulaciones = await cargarPostulaciones(ctx);
    await cargarNotificaciones(ctx);
    const { reportes, automaticos, avisos } = await cargarReportes(ctx, moderacion, admin);
    const registrosAuditoria = await cargarAuditoria(ctx, colaboraciones, reportes, admin);

    const administradores = COLECTIVOS.reduce((total, c) => total + (c.administradores?.length ?? 0), 0);
    console.log('Datos de demostración cargados:');
    console.log(`  habilidades: ${habilidades.size}`);
    console.log(`  palabras prohibidas: ${palabras.total} (${palabras.nuevas} nuevas)`);
    console.log(`  usuarios: ${COLECTIVOS.length + administradores + COLABORADORES.length + 1} (incluye admin@semilla.local y ${administradores} administradores adicionales de colectivos)`);
    console.log(`  colectivos: ${COLECTIVOS.length}`);
    const finalizados = [...ctx.proyectos.values()].filter((p) => p.finalizado).length;
    const enRevision = todosLosProyectos().filter((p) => p.revisionManual).length;
    console.log(`  proyectos: ${ctx.proyectos.size} (${ctx.proyectos.size - finalizados} activos, ${finalizados} finalizados, ${enRevision} en revisión manual)`);
    console.log(`  colaboradores: ${ctx.colaboradores.size}`);
    console.log(`  colaboraciones: ${COLABORACIONES.length}`);
    const pendientes = POSTULACIONES.filter((p) => p.estado === PENDIENTE).length;
    console.log(`  postulaciones: ${POSTULACIONES.length} (${pendientes} pendientes)`);
    const automaticas = NOTIFICACIONES.filter((n) => n.automatica).length;
    console.log(`  notificaciones: ${NOTIFICACIONES.length + avisos} (${automaticas} automáticas por habilidades, ${avisos} avisos de moderación)`);
    console.log(`  reportes: ${reportes.length} (${automaticos} automáticos, ${REPORTES.length} manuales)`);
    console.log(`  registros de auditoría: ${registrosAuditoria}`);
};

const main = async () => {
    await mongoClient.connect();
    try {
        await cargar();
    } finally {
        await mongoClient.close();
    }
};

if (require.main === module) {
    main().catch((error) => {
        console.error('Error al cargar los datos de demostración:', error);
        process.exitCode = 1;
    });
}

module.exports = { cargar, validarDatos, moderarSemilla };
