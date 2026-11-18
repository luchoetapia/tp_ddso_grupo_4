// Habilidades de desarrollo que la plataforma necesita precargadas.
// Uso: npm run seed:habilidades
// Es idempotente: crea las que faltan (por título) y no modifica las que ya existen.
const mongoClient = require('../src/database/mongoose.js');
const HabilidadModel = require('../src/database/schemas/habilidadSchema.js');
const { TipoHabilidad } = require('../src/models/habilidad.js');

const { PROGRAMACION, DISEÑO, MARKETING, GESTION_PROYECTOS, COMUNICACION, COLABORACION } = TipoHabilidad;

const HABILIDADES = [
    // Lenguajes
    { titulo: 'JavaScript', tipoHabilidad: PROGRAMACION, descripcion: 'Lenguaje para desarrollo web en el navegador y en el servidor' },
    { titulo: 'TypeScript', tipoHabilidad: PROGRAMACION, descripcion: 'Superset de JavaScript con tipado estático' },
    { titulo: 'Python', tipoHabilidad: PROGRAMACION, descripcion: 'Lenguaje de propósito general, usado en backend, scripts y datos' },
    { titulo: 'Java', tipoHabilidad: PROGRAMACION, descripcion: 'Lenguaje orientado a objetos para aplicaciones empresariales' },
    { titulo: 'C#', tipoHabilidad: PROGRAMACION, descripcion: 'Lenguaje de la plataforma .NET' },
    { titulo: 'PHP', tipoHabilidad: PROGRAMACION, descripcion: 'Lenguaje de backend para sitios y aplicaciones web' },
    { titulo: 'Go', tipoHabilidad: PROGRAMACION, descripcion: 'Lenguaje compilado orientado a servicios concurrentes' },
    { titulo: 'SQL', tipoHabilidad: PROGRAMACION, descripcion: 'Consultas y modelado de bases de datos relacionales' },
    { titulo: 'Kotlin', tipoHabilidad: PROGRAMACION, descripcion: 'Lenguaje moderno para Android y la JVM' },
    { titulo: 'Swift', tipoHabilidad: PROGRAMACION, descripcion: 'Lenguaje de Apple para apps de iOS' },

    // Frontend
    { titulo: 'HTML y CSS', tipoHabilidad: PROGRAMACION, descripcion: 'Maquetado y estilos de páginas web' },
    { titulo: 'React', tipoHabilidad: PROGRAMACION, descripcion: 'Biblioteca para construir interfaces de usuario' },
    { titulo: 'Next.js', tipoHabilidad: PROGRAMACION, descripcion: 'Framework de React para aplicaciones web' },
    { titulo: 'Vue.js', tipoHabilidad: PROGRAMACION, descripcion: 'Framework progresivo para interfaces de usuario' },
    { titulo: 'Angular', tipoHabilidad: PROGRAMACION, descripcion: 'Framework de TypeScript para aplicaciones web' },
    { titulo: 'Tailwind CSS', tipoHabilidad: PROGRAMACION, descripcion: 'Framework de CSS basado en clases utilitarias' },

    // Mobile
    { titulo: 'React Native', tipoHabilidad: PROGRAMACION, descripcion: 'Desarrollo de apps móviles con React' },
    { titulo: 'Flutter', tipoHabilidad: PROGRAMACION, descripcion: 'Framework de Dart para apps móviles multiplataforma' },
    { titulo: 'Firebase', tipoHabilidad: PROGRAMACION, descripcion: 'Backend como servicio de Google: auth, base de datos y push' },

    // Backend
    { titulo: 'Node.js', tipoHabilidad: PROGRAMACION, descripcion: 'Entorno de ejecución de JavaScript del lado del servidor' },
    { titulo: 'Express', tipoHabilidad: PROGRAMACION, descripcion: 'Framework minimalista para APIs en Node.js' },
    { titulo: 'Django', tipoHabilidad: PROGRAMACION, descripcion: 'Framework web de Python' },
    { titulo: 'Spring Boot', tipoHabilidad: PROGRAMACION, descripcion: 'Framework de Java para servicios web' },
    { titulo: 'APIs REST', tipoHabilidad: PROGRAMACION, descripcion: 'Diseño e implementación de APIs HTTP' },
    { titulo: 'NestJS', tipoHabilidad: PROGRAMACION, descripcion: 'Framework de Node.js con TypeScript para APIs' },
    { titulo: 'Ruby on Rails', tipoHabilidad: PROGRAMACION, descripcion: 'Framework web de Ruby' },
    { titulo: 'GraphQL', tipoHabilidad: PROGRAMACION, descripcion: 'Lenguaje de consultas para APIs' },
    { titulo: 'WordPress', tipoHabilidad: PROGRAMACION, descripcion: 'Gestor de contenidos para sitios web' },

    // Bases de datos
    { titulo: 'MongoDB', tipoHabilidad: PROGRAMACION, descripcion: 'Base de datos documental' },
    { titulo: 'PostgreSQL', tipoHabilidad: PROGRAMACION, descripcion: 'Base de datos relacional' },
    { titulo: 'MySQL', tipoHabilidad: PROGRAMACION, descripcion: 'Base de datos relacional' },
    { titulo: 'Redis', tipoHabilidad: PROGRAMACION, descripcion: 'Base de datos en memoria para caché y colas' },

    // Datos
    { titulo: 'Pandas', tipoHabilidad: PROGRAMACION, descripcion: 'Análisis y limpieza de datos con Python' },
    { titulo: 'Power BI', tipoHabilidad: PROGRAMACION, descripcion: 'Tableros e informes de datos' },
    { titulo: 'Machine Learning', tipoHabilidad: PROGRAMACION, descripcion: 'Modelos predictivos a partir de datos' },

    // Infraestructura y calidad
    { titulo: 'Git', tipoHabilidad: PROGRAMACION, descripcion: 'Control de versiones' },
    { titulo: 'Docker', tipoHabilidad: PROGRAMACION, descripcion: 'Contenedores para empaquetar y desplegar aplicaciones' },
    { titulo: 'Linux', tipoHabilidad: PROGRAMACION, descripcion: 'Administración de servidores Linux' },
    { titulo: 'AWS', tipoHabilidad: PROGRAMACION, descripcion: 'Servicios de infraestructura en la nube de Amazon' },
    { titulo: 'Google Cloud', tipoHabilidad: PROGRAMACION, descripcion: 'Servicios de infraestructura en la nube de Google' },
    { titulo: 'Kubernetes', tipoHabilidad: PROGRAMACION, descripcion: 'Orquestación de contenedores' },
    { titulo: 'CI/CD', tipoHabilidad: PROGRAMACION, descripcion: 'Integración y despliegue continuos' },
    { titulo: 'Testing automatizado', tipoHabilidad: PROGRAMACION, descripcion: 'Tests unitarios, de integración y end to end' },
    { titulo: 'Jest', tipoHabilidad: PROGRAMACION, descripcion: 'Framework de tests para JavaScript' },
    { titulo: 'Cypress', tipoHabilidad: PROGRAMACION, descripcion: 'Tests end to end en el navegador' },
    { titulo: 'IoT', tipoHabilidad: PROGRAMACION, descripcion: 'Sensores y dispositivos conectados (Arduino, ESP32)' },
    { titulo: 'Seguridad informática', tipoHabilidad: PROGRAMACION, descripcion: 'Buenas prácticas de seguridad en aplicaciones' },

    // Diseño
    { titulo: 'Diseño UX/UI', tipoHabilidad: DISEÑO, descripcion: 'Diseño de experiencia e interfaces de usuario' },
    { titulo: 'Figma', tipoHabilidad: DISEÑO, descripcion: 'Herramienta de diseño y prototipado' },
    { titulo: 'Accesibilidad web', tipoHabilidad: DISEÑO, descripcion: 'Interfaces usables para todas las personas (WCAG)' },
    { titulo: 'Diseño gráfico', tipoHabilidad: DISEÑO, descripcion: 'Piezas visuales, identidad y materiales de difusión' },
    { titulo: 'Prototipado', tipoHabilidad: DISEÑO, descripcion: 'Prototipos navegables para validar ideas' },
    { titulo: 'Investigación de usuarios', tipoHabilidad: DISEÑO, descripcion: 'Entrevistas y pruebas de usabilidad' },

    // Marketing
    { titulo: 'Marketing digital', tipoHabilidad: MARKETING, descripcion: 'Campañas y estrategia en canales digitales' },
    { titulo: 'SEO', tipoHabilidad: MARKETING, descripcion: 'Posicionamiento en buscadores' },
    { titulo: 'Redes sociales', tipoHabilidad: MARKETING, descripcion: 'Gestión de comunidades y contenidos en redes' },

    // Gestión, comunicación y colaboración
    { titulo: 'Scrum', tipoHabilidad: GESTION_PROYECTOS, descripcion: 'Marco de trabajo ágil para equipos' },
    { titulo: 'Análisis funcional', tipoHabilidad: GESTION_PROYECTOS, descripcion: 'Relevamiento de requerimientos y casos de uso' },
    { titulo: 'Kanban', tipoHabilidad: GESTION_PROYECTOS, descripcion: 'Gestión visual del flujo de trabajo' },
    { titulo: 'Gestión de producto', tipoHabilidad: GESTION_PROYECTOS, descripcion: 'Priorización y definición del producto' },
    { titulo: 'Documentación técnica', tipoHabilidad: COMUNICACION, descripcion: 'Redacción de documentación para equipos y usuarios' },
    { titulo: 'Redacción de contenidos', tipoHabilidad: COMUNICACION, descripcion: 'Textos para web, newsletters y campañas' },
    { titulo: 'Capacitación de usuarios', tipoHabilidad: COMUNICACION, descripcion: 'Guías y talleres para quienes usan el sistema' },
    { titulo: 'Revisión de código', tipoHabilidad: COLABORACION, descripcion: 'Code review y trabajo con pull requests' },
    { titulo: 'Mentoría', tipoHabilidad: COLABORACION, descripcion: 'Acompañar a personas que recién empiezan' },
    { titulo: 'Pair programming', tipoHabilidad: COLABORACION, descripcion: 'Programar de a dos compartiendo pantalla' },
];

// Crea las habilidades que falten y devuelve un Map titulo -> id con todas las de la lista
const cargarHabilidades = async () => {
    await HabilidadModel.bulkWrite(HABILIDADES.map((habilidad) => ({
        updateOne: {
            filter: { titulo: habilidad.titulo },
            update: { $setOnInsert: habilidad },
            upsert: true,
        },
    })));

    const guardadas = await HabilidadModel.find({ titulo: { $in: HABILIDADES.map((h) => h.titulo) } });
    return new Map(guardadas.map((h) => [h.titulo, h._id]));
};

const main = async () => {
    await mongoClient.connect();
    try {
        const habilidades = await cargarHabilidades();
        console.log(`Habilidades precargadas: ${habilidades.size}`);
    } finally {
        await mongoClient.close();
    }
};

if (require.main === module) {
    main().catch((error) => {
        console.error('Error al precargar habilidades:', error);
        process.exitCode = 1;
    });
}

module.exports = { HABILIDADES, cargarHabilidades };
