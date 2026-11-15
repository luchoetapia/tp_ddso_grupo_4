// Datos de demostración para todos los esquemas: usuarios, colectivos, colaboradores,
// proyectos (con perfiles y logros), colaboraciones y notificaciones.
// Uso: npm run seed:demo
// Se puede correr varias veces: antes de cargar borra lo que creó la corrida anterior
// (todo lo asociado a usuarios con email @semilla.local). No toca otros datos.
// Los usuarios se crean con la password de SEED_PASSWORD (.env); si está vacía no se puede ingresar con ellos.
const mongoClient = require('../src/database/mongoose.js');
const UsuarioModel = require('../src/auth/models/usuarioSchema.js');
const ColectivoModel = require('../src/database/schemas/colectivoSchema.js');
const ColaboradorModel = require('../src/database/schemas/colaboradorSchema.js');
const ProyectoModel = require('../src/database/schemas/proyectoSchema.js');
const ColaboracionModel = require('../src/database/schemas/colaboracionSchema.js');
const NotificacionModel = require('../src/database/schemas/notificacionSchema.js');
const { crearUsuarioDeSemilla } = require('../src/auth/usuarioSemilla.js');
const { roles } = require('../src/auth/models/usuario.js');
const { TipoColectivo } = require('../src/models/colectivo.js');
const { Periodo } = require('../src/models/proyecto.js');
const { MedioDeContacto } = require('../src/models/Contacto.js');
const { cargarHabilidades } = require('./habilidades.js');

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

// diasAtras define la fecha de creación del proyecto (los destacados del home usan los últimos 30 días)
const COLECTIVOS = [
    {
        nombre: 'Fundación Manos Solidarias', tipo: TipoColectivo.FUNDACION, ubicacion: 'CABA',
        descripcion: 'Coordinamos la entrega de alimentos a comedores comunitarios.',
        proyectos: [
            {
                titulo: 'Web de reparto solidario', diasAtras: 12, porcentaje: 60,
                descripcion: 'Plataforma para coordinar entregas de alimentos entre comedores y voluntarios.',
                enlaceCodigoFuente: 'https://github.com/manos-solidarias/reparto',
                perfiles: [
                    perfil('Desarrollo frontend', 'Pantallas de pedidos y recorridos', ['React', 'JavaScript'], ['Testing automatizado'], 6, Periodo.SEMANAL, { limite: 2, finEnDias: 45 }),
                    perfil('Desarrollo backend', 'API de pedidos y stock', ['Node.js', 'Express', 'MongoDB'], ['Docker'], 8, Periodo.SEMANAL, { limite: 1, contratacion: true }),
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
        ],
    },
    {
        nombre: 'ONG Red Solidaria', tipo: TipoColectivo.ONG, ubicacion: 'Rosario',
        descripcion: 'Red de voluntariado para emergencias y acompañamiento social.',
        proyectos: [
            {
                titulo: 'Gestión de voluntariado', diasAtras: 40, porcentaje: 50,
                descripcion: 'Alta de voluntarios, asignación de tareas y seguimiento de horas.',
                enlaceCodigoFuente: 'https://github.com/red-solidaria/voluntariado',
                perfiles: [
                    perfil('Desarrollo backend', 'API de tareas y horas', ['Python', 'Django', 'PostgreSQL'], ['Testing automatizado'], 8, Periodo.SEMANAL, { limite: 2 }),
                    perfil('Infraestructura', 'Despliegue y monitoreo', ['Docker', 'Linux'], ['CI/CD', 'AWS'], 40, Periodo.TOTAL, { limite: 1, incentivo: 50000 }),
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
                    perfil('Testing', 'Pruebas de punta a punta', ['Testing automatizado'], ['JavaScript'], 10, Periodo.MENSUAL, { limite: 1 }),
                ],
                logros: [],
            },
            {
                titulo: 'Bolsa de trabajo barrial', diasAtras: 70, porcentaje: 45,
                descripcion: 'Publicación de ofertas de empleo de comercios del barrio.',
                perfiles: [
                    perfil('Desarrollo full stack', 'Publicación y búsqueda de ofertas', ['PHP', 'MySQL'], ['HTML y CSS'], 6, Periodo.SEMANAL, { limite: 1 }),
                    perfil('Accesibilidad', 'Auditoría y mejoras de accesibilidad', ['Accesibilidad web', 'Diseño UX/UI'], [], 15, Periodo.TOTAL, { abierta: false }),
                ],
                logros: [{ titulo: '30 ofertas publicadas', descripcion: 'Comercios del barrio ya publican sus búsquedas.' }],
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
        ],
    },
    {
        nombre: 'Cooperativa Tejiendo Redes', tipo: TipoColectivo.ONG, ubicacion: 'La Plata',
        descripcion: 'Cooperativa textil de mujeres con venta en ferias y online.',
        proyectos: [
            {
                titulo: 'Registro de socias de la cooperativa', diasAtras: 28, porcentaje: 55,
                descripcion: 'Padrón de socias, aportes y asambleas.',
                perfiles: [
                    perfil('Desarrollo backend', 'Padrón y aportes', ['Java', 'Spring Boot', 'PostgreSQL'], ['Docker'], 8, Periodo.SEMANAL, { limite: 1 }),
                    perfil('Desarrollo frontend', 'Pantallas de gestión', ['Angular', 'TypeScript'], [], 6, Periodo.SEMANAL, { limite: 1 }),
                ],
                logros: [],
            },
            {
                titulo: 'Tienda online de la cooperativa', diasAtras: 14, porcentaje: 5,
                descripcion: 'Venta online de los productos textiles de la cooperativa.',
                perfiles: [
                    perfil('Desarrollo frontend', 'Catálogo y carrito', ['React', 'Tailwind CSS'], ['Next.js'], 6, Periodo.SEMANAL, { limite: 2 }),
                    perfil('Desarrollo backend', 'Pedidos y pagos', ['Node.js', 'Express', 'MongoDB'], ['Seguridad informática'], 8, Periodo.SEMANAL, { limite: 1, incentivo: 80000 }),
                    perfil('Coordinación', 'Organización del equipo y relevamiento', ['Scrum', 'Análisis funcional'], ['Documentación técnica'], 4, Periodo.SEMANAL, { limite: 1 }),
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
];

const COLABORADORES = [
    { nombre: 'Lucía', apellido: 'Fernández', cuentaGit: 'luciafer', pronombres: 'ella', habilidades: ['React', 'JavaScript', 'TypeScript', 'Testing automatizado'], presentacion: 'Frontend developer, me interesan los proyectos de impacto social.', deseaSerContactado: true, contactos: [{ medio: MedioDeContacto.EMAIL, valor: 'lucia.fernandez@example.com' }] },
    { nombre: 'Martín', apellido: 'Gómez', cuentaGit: 'mgomez-dev', pronombres: 'él', habilidades: ['Node.js', 'Express', 'MongoDB', 'Docker'], presentacion: 'Backend con Node, disponible los fines de semana.', deseaSerContactado: true, contactos: [{ medio: MedioDeContacto.WHATSAPP, valor: '+5491155550001' }] },
    { nombre: 'Sofía', apellido: 'Ramírez', cuentaGit: 'sofiaram', nombreFantasia: 'Sofi Code', habilidades: ['Python', 'Django', 'PostgreSQL', 'SQL'], presentacion: 'Me gustan los datos y las APIs.', deseaSerContactado: false, contactos: [] },
    { nombre: 'Tomás', apellido: 'López', cuentaGit: 'tlopez', pronombres: 'él', habilidades: ['Next.js', 'React', 'TypeScript', 'Tailwind CSS'], presentacion: 'Fullstack JS.', deseaSerContactado: true, contactos: [{ medio: MedioDeContacto.EMAIL, valor: 'tomas.lopez@example.com' }] },
    { nombre: 'Valentina', apellido: 'Sosa', cuentaGit: 'valesosa', pronombres: 'ella', habilidades: ['Diseño UX/UI', 'Figma', 'Accesibilidad web'], presentacion: 'Diseñadora UX con foco en accesibilidad.', deseaSerContactado: true, contactos: [{ medio: MedioDeContacto.EMAIL, valor: 'vale.sosa@example.com' }] },
    { nombre: 'Joaquín', apellido: 'Pereyra', cuentaGit: 'jpereyra', habilidades: ['Java', 'Spring Boot', 'PostgreSQL', 'Docker'], presentacion: 'Backend Java, quiero sumar experiencia en proyectos libres.', deseaSerContactado: false, contactos: [] },
    { nombre: 'Camila', apellido: 'Díaz', cuentaGit: 'camidiaz', pronombres: 'ella', habilidades: ['React Native', 'JavaScript', 'React'], presentacion: 'Desarrollo mobile.', deseaSerContactado: true, contactos: [{ medio: MedioDeContacto.SMS, valor: '+5493415550002' }] },
    { nombre: 'Nicolás', apellido: 'Herrera', cuentaGit: 'nherrera', habilidades: ['Docker', 'Linux', 'CI/CD', 'AWS'], presentacion: 'DevOps, me encargo de que todo llegue a producción.', deseaSerContactado: true, contactos: [{ medio: MedioDeContacto.EMAIL, valor: 'nico.herrera@example.com' }] },
    { nombre: 'Agustina', apellido: 'Molina', cuentaGit: 'agusmolina', nombreFantasia: 'Agus', pronombres: 'elle', habilidades: ['Vue.js', 'HTML y CSS', 'Tailwind CSS', 'JavaScript'], presentacion: 'Front con Vue.', deseaSerContactado: true, contactos: [] },
    { nombre: 'Federico', apellido: 'Castro', cuentaGit: 'fedecastro', habilidades: ['PHP', 'MySQL', 'HTML y CSS'], presentacion: 'Desarrollo web clásico.', deseaSerContactado: false, contactos: [] },
    { nombre: 'Julieta', apellido: 'Romero', cuentaGit: 'juliromero', pronombres: 'ella', habilidades: ['Scrum', 'Análisis funcional', 'Documentación técnica'], presentacion: 'Analista funcional y scrum master.', deseaSerContactado: true, contactos: [{ medio: MedioDeContacto.EMAIL, valor: 'juli.romero@example.com' }] },
    { nombre: 'Diego', apellido: 'Acosta', cuentaGit: 'dacosta', habilidades: ['Angular', 'TypeScript', 'Node.js'], presentacion: 'Fullstack Angular + Node.', deseaSerContactado: true, contactos: [] },
];

// inicio y fin en días atrás; sin fin = colaboración activa
const COLABORACIONES = [
    { cuentaGit: 'luciafer', proyecto: 'Web de reparto solidario', inicio: 10 },
    { cuentaGit: 'mgomez-dev', proyecto: 'Web de reparto solidario', inicio: 9, esAnonima: true },
    { cuentaGit: 'tlopez', proyecto: 'Inventario de donaciones', inicio: 20 },
    { cuentaGit: 'valesosa', proyecto: 'Inventario de donaciones', inicio: 22, fin: 5 },
    { cuentaGit: 'sofiaram', proyecto: 'Censo barrial', inicio: 115, fin: 60 },
    { cuentaGit: 'sofiaram', proyecto: 'Gestión de voluntariado', inicio: 35 },
    { cuentaGit: 'nherrera', proyecto: 'Gestión de voluntariado', inicio: 30 },
    { cuentaGit: 'camidiaz', proyecto: 'App de alertas de emergencias', inicio: 1 },
    { cuentaGit: 'agusmolina', proyecto: 'Agenda de talleres barriales', inicio: 15 },
    { cuentaGit: 'fedecastro', proyecto: 'Bolsa de trabajo barrial', inicio: 60, esAnonima: true },
    { cuentaGit: 'tlopez', proyecto: 'Seguimiento de apoyo escolar', inicio: 7 },
    { cuentaGit: 'luciafer', proyecto: 'Biblioteca popular online', inicio: 190, fin: 100 },
    { cuentaGit: 'jpereyra', proyecto: 'Registro de socias de la cooperativa', inicio: 25 },
    { cuentaGit: 'juliromero', proyecto: 'Tienda online de la cooperativa', inicio: 12 },
];

// Avisos de colectivos que contactan a un colaborador para un perfil
const NOTIFICACIONES = [
    { destinatario: 'mgomez-dev', proyecto: 'Tienda online de la cooperativa', perfil: 'Desarrollo backend', diasAtras: 3, mensaje: 'Hola Martín, vimos tu perfil y nos encantaría que te sumes al backend de la tienda.' },
    { destinatario: 'valesosa', proyecto: 'App de alertas de emergencias', perfil: 'Diseño de interfaces', diasAtras: 1, mensaje: 'Hola Valentina, buscamos a alguien con experiencia en accesibilidad para el diseño de la app.' },
    { destinatario: 'luciafer', proyecto: 'Seguimiento de apoyo escolar', perfil: 'Desarrollo frontend', diasAtras: 6, mensaje: 'Hola Lucía, ¿te interesaría colaborar con el panel de tutores?' },
    { destinatario: 'dacosta', proyecto: 'Registro de socias de la cooperativa', perfil: 'Desarrollo frontend', diasAtras: 4, mensaje: 'Hola Diego, necesitamos ayuda con las pantallas en Angular.' },
];

const idsDe = (docs) => docs.map((d) => d._id);

// Borra lo que haya cargado una corrida anterior (todo lo asociado a usuarios @semilla.local)
const limpiarDatosSemilla = async () => {
    const idsUsuarios = idsDe(await UsuarioModel.find({ email: DOMINIO_SEMILLA }, '_id'));
    const colectivos = await ColectivoModel.find({ usuario: { $in: idsUsuarios } }, 'proyectos');
    const idsColaboradores = idsDe(await ColaboradorModel.find({ usuario: { $in: idsUsuarios } }, '_id'));
    const idsProyectos = colectivos.flatMap((c) => c.proyectos);

    await ColaboracionModel.deleteMany({ $or: [{ colaborador: { $in: idsColaboradores } }, { proyecto: { $in: idsProyectos } }] });
    await NotificacionModel.deleteMany({ $or: [{ destinatario: { $in: idsColaboradores } }, { 'proyecto.id': { $in: idsProyectos } }] });
    await ProyectoModel.deleteMany({ _id: { $in: idsProyectos } });
    await ColectivoModel.deleteMany({ _id: { $in: idsDe(colectivos) } });
    await ColaboradorModel.deleteMany({ _id: { $in: idsColaboradores } });
    await UsuarioModel.deleteMany({ _id: { $in: idsUsuarios } });
};

// Los timestamps de Mongoose ponen createdAt = ahora; se pisa para simular proyectos de distintas fechas
const fijarFechaCreacion = (Model, id, fecha) =>
    Model.collection.updateOne({ _id: id }, { $set: { createdAt: fecha, updatedAt: fecha } });

const idHabilidad = (habilidades, titulo) => {
    const id = habilidades.get(titulo);
    if (!id) throw new Error(`La habilidad "${titulo}" no está en seeds/habilidades.js`);
    return id;
};

const cargarColectivosYProyectos = async (habilidades) => {
    const proyectos = new Map();

    for (const { proyectos: datosProyectos, ...datosColectivo } of COLECTIVOS) {
        const usuario = await crearUsuarioDeSemilla(datosColectivo.nombre, roles.COLECTIVO);
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
                perfiles: p.perfiles.map(({ requeridas, opcionales, ...resto }) => ({
                    ...resto,
                    habilidadesRequeridas: requeridas.map((t) => idHabilidad(habilidades, t)),
                    habilidadesOpcionales: opcionales.map((t) => idHabilidad(habilidades, t)),
                })),
            });
            await fijarFechaCreacion(ProyectoModel, proyecto._id, haceDias(p.diasAtras));
            proyectos.set(p.titulo, proyecto);
            idsProyectos.push(proyecto._id);
        }

        await ColectivoModel.create({ ...datosColectivo, usuario: usuario.id, proyectos: idsProyectos });
    }

    return proyectos;
};

const cargarColaboradores = async (habilidades) => {
    const colaboradores = new Map();

    for (const { habilidades: titulos, ...datos } of COLABORADORES) {
        const usuario = await crearUsuarioDeSemilla(datos.cuentaGit, roles.COLABORADOR);
        const colaborador = await ColaboradorModel.create({
            ...datos,
            usuario: usuario.id,
            habilidades: titulos.map((t) => idHabilidad(habilidades, t)),
        });
        colaboradores.set(datos.cuentaGit, colaborador);
    }

    return colaboradores;
};

const cargarColaboraciones = (colaboradores, proyectos) =>
    ColaboracionModel.insertMany(COLABORACIONES.map((c) => ({
        colaborador: colaboradores.get(c.cuentaGit)._id,
        proyecto: proyectos.get(c.proyecto)._id,
        inicio: haceDias(c.inicio),
        fin: c.fin != null ? haceDias(c.fin) : null,
        esAnonima: c.esAnonima ?? false,
    })));

const cargarNotificaciones = (colaboradores, proyectos) =>
    NotificacionModel.insertMany(NOTIFICACIONES.map((n) => {
        const proyecto = proyectos.get(n.proyecto);
        const perfilProyecto = proyecto.perfiles.find((p) => p.titulo === n.perfil);
        return {
            destinatario: colaboradores.get(n.destinatario)._id,
            proyecto: { id: proyecto._id, titulo: proyecto.titulo },
            perfil: { id: perfilProyecto._id, descripcion: perfilProyecto.descripcion },
            mensaje: n.mensaje,
            fecha: haceDias(n.diasAtras),
        };
    }));

const cargar = async () => {
    if (!process.env.SEED_PASSWORD) {
        console.warn('SEED_PASSWORD vacía: los usuarios se crean con password aleatoria y no se va a poder ingresar con ellos.');
    }

    const habilidades = await cargarHabilidades();
    await limpiarDatosSemilla();

    await crearUsuarioDeSemilla('admin', roles.ADMIN);
    const proyectos = await cargarColectivosYProyectos(habilidades);
    const colaboradores = await cargarColaboradores(habilidades);
    await cargarColaboraciones(colaboradores, proyectos);
    await cargarNotificaciones(colaboradores, proyectos);

    console.log('Datos de demostración cargados:');
    console.log(`  habilidades: ${habilidades.size}`);
    console.log(`  usuarios: ${COLECTIVOS.length + COLABORADORES.length + 1} (incluye admin@semilla.local)`);
    console.log(`  colectivos: ${COLECTIVOS.length}`);
    console.log(`  proyectos: ${proyectos.size}`);
    console.log(`  colaboradores: ${colaboradores.size}`);
    console.log(`  colaboraciones: ${COLABORACIONES.length}`);
    console.log(`  notificaciones: ${NOTIFICACIONES.length}`);
};

const main = async () => {
    await mongoClient.connect();
    try {
        await cargar();
    } finally {
        await mongoClient.close();
    }
};

main().catch((error) => {
    console.error('Error al cargar los datos de demostración:', error);
    process.exitCode = 1;
});
