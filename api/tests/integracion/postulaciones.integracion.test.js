// Tests de integración: se prueba la API entera (router -> middlewares -> controllers -> services -> repositories)
// contra un MongoDB real (en memoria o el de CI), sin mockear la base ni los services.
// Ver tests/helpers/baseDeDatos.js para cómo se elige la base.
const request = require('supertest');
const app = require('../../src/app.js');
const { roles } = require('../../src/auth/models/usuario.js');
const PostulacionModel = require('../../src/database/schemas/postulacionSchema.js');
const ColaboracionModel = require('../../src/database/schemas/colaboracionSchema.js');
const EstadoPostulacion = require('../../src/models/Proyecto/Postulaciones/EstadoPostulacion.js');
const { cookieDeSesion } = require('../helpers/sesion.js');
const bd = require('../helpers/baseDeDatos.js');

// La primera vez mongodb-memory-server descarga el binario de mongod
jest.setTimeout(120000);

beforeAll(async () => {
    await bd.conectar();
});

afterEach(async () => {
    await bd.vaciar();
});

afterAll(async () => {
    await bd.desconectar();
});

// ---------- Helpers del escenario (todo se crea a través de la API) ----------

// Registra un usuario y devuelve un agente de supertest que conserva sus cookies de sesión
const registrar = async (username, rol) => {
    const agente = request.agent(app);
    const respuesta = await agente.post('/auth/registro').send({
        username,
        password: 'clave-segura-123',
        email: `${username}@test.com`,
        rol,
    });
    expect(respuesta.status).toBe(201);
    return agente;
};

// Las habilidades las carga el equipo admin: alcanza con un token válido de rol admin
const crearHabilidad = async (titulo) => {
    const respuesta = await request(app)
        .post('/habilidades')
        .set('Cookie', cookieDeSesion(roles.ADMIN))
        .send({ titulo, tipoHabilidad: 'programacion', descripcion: `Sabe ${titulo}` });
    expect(respuesta.status).toBe(201);
    return respuesta.body.data.id;
};

// Colectivo con un proyecto de un único perfil que requiere la habilidad indicada
const crearColectivoConProyecto = async ({ idHabilidad, limiteColaboraciones = null, estrategiaAceptacion } = {}) => {
    const colectivo = await registrar('colectivo-huerta', roles.COLECTIVO);

    const respuestaColectivo = await colectivo.post('/colectivos').send({
        nombre: 'Huerta Comunitaria',
        tipo: 'asociacion_barrial',
        descripcion: 'Huerta del barrio',
    });
    expect(respuestaColectivo.status).toBe(201);

    const proyecto = {
        titulo: 'Sistema de turnos de la huerta',
        descripcion: 'Organizar los turnos de riego',
        perfiles: [{
            titulo: 'Backend',
            descripcion: 'Desarrollo de la API',
            habilidadesRequeridas: [idHabilidad],
            tipoCompromiso: { cantHoras: 10, periodo: 'semanal' },
            modalidadColaboracion: {},
            limiteColaboraciones,
        }],
    };
    if (estrategiaAceptacion) proyecto.estrategiaAceptacion = estrategiaAceptacion;

    const respuestaProyecto = await colectivo.post('/proyectos').send(proyecto);
    expect(respuestaProyecto.status).toBe(201);

    return {
        colectivo,
        idProyecto: respuestaProyecto.body.data.id,
        idPerfil: respuestaProyecto.body.data.perfiles[0].id,
    };
};

const crearColaboradora = async (cuentaGit, habilidades = []) => {
    const colaboradora = await registrar(cuentaGit, roles.COLABORADOR);
    const respuesta = await colaboradora.post('/colaboradores').send({
        nombre: 'Ana',
        apellido: 'García',
        cuentaGit,
        habilidades,
        deseaSerContactado: true,
        contactos: [{ medio: 'Email', valor: `${cuentaGit}@mail.com` }],
    });
    expect(respuesta.status).toBe(201);
    return colaboradora;
};

const postular = (colaboradora, idProyecto, idPerfil) =>
    colaboradora.post('/postulaciones').send({ idProyecto, idPerfil, mensaje: 'Me interesa colaborar' });

const obtenerPerfil = async (idProyecto) => {
    const respuesta = await request(app).get(`/proyectos/${idProyecto}`);
    expect(respuesta.status).toBe(200);
    return respuesta.body.perfiles[0];
};

// ---------- Tests ----------

describe('Integración: postulaciones y colaboraciones (API + MongoDB, sin mocks)', () => {
    test('una colaboradora se postula, el colectivo la acepta y la colaboración queda guardada', async () => {
        const idHabilidad = await crearHabilidad('Node.js');
        const { colectivo, idProyecto, idPerfil } = await crearColectivoConProyecto({ idHabilidad });
        const ana = await crearColaboradora('ana-dev', [idHabilidad]);

        const postulacion = await postular(ana, idProyecto, idPerfil);
        expect(postulacion.status).toBe(201);
        expect(postulacion.body.data.estado).toBe(EstadoPostulacion.PENDIENTE);
        const idPostulacion = postulacion.body.data.id;

        const aceptacion = await colectivo
            .patch(`/postulaciones/${idPostulacion}/estado`)
            .send({ estado: EstadoPostulacion.ACEPTADA });
        expect(aceptacion.status).toBe(200);
        expect(aceptacion.body.data.estado).toBe(EstadoPostulacion.ACEPTADA);

        // Quedó persistido en Mongo
        const guardada = await PostulacionModel.findById(idPostulacion);
        expect(guardada.estado).toBe(EstadoPostulacion.ACEPTADA);

        const colaboraciones = await request(app).get(`/colaboraciones/proyecto/${idProyecto}`);
        expect(colaboraciones.status).toBe(200);
        expect(colaboraciones.body).toHaveLength(1);
        expect(colaboraciones.body[0]).toMatchObject({
            activa: true,
            idPerfil,
            colaborador: { cuentaGit: 'ana-dev' },
        });
    });

    test('no se puede postular sin las habilidades requeridas y no se guarda nada', async () => {
        const idHabilidad = await crearHabilidad('Node.js');
        const { idProyecto, idPerfil } = await crearColectivoConProyecto({ idHabilidad });
        const sinHabilidades = await crearColaboradora('beto-dev');

        const respuesta = await postular(sinHabilidades, idProyecto, idPerfil);

        expect(respuesta.status).toBe(409);
        expect(await PostulacionModel.countDocuments()).toBe(0);
    });

    test('solo el colectivo dueño del proyecto puede aceptar la postulación', async () => {
        const idHabilidad = await crearHabilidad('Node.js');
        const { idProyecto, idPerfil } = await crearColectivoConProyecto({ idHabilidad });
        const ana = await crearColaboradora('ana-dev', [idHabilidad]);
        const { body } = await postular(ana, idProyecto, idPerfil);

        // Una colaboradora no puede cambiar el estado (ruta solo para colectivos)
        const comoColaboradora = await ana
            .patch(`/postulaciones/${body.data.id}/estado`)
            .send({ estado: EstadoPostulacion.ACEPTADA });
        expect(comoColaboradora.status).toBe(403);

        // Sin sesión, tampoco
        const sinSesion = await request(app)
            .patch(`/postulaciones/${body.data.id}/estado`)
            .send({ estado: EstadoPostulacion.ACEPTADA });
        expect(sinSesion.status).toBe(401);

        expect((await PostulacionModel.findById(body.data.id)).estado).toBe(EstadoPostulacion.PENDIENTE);
    });

    test('al completar el límite de colaboraciones se cierra la búsqueda del perfil', async () => {
        const idHabilidad = await crearHabilidad('Node.js');
        const { colectivo, idProyecto, idPerfil } = await crearColectivoConProyecto({ idHabilidad, limiteColaboraciones: 1 });
        const ana = await crearColaboradora('ana-dev', [idHabilidad]);
        const carla = await crearColaboradora('carla-dev', [idHabilidad]);

        const { body } = await postular(ana, idProyecto, idPerfil);
        await colectivo.patch(`/postulaciones/${body.data.id}/estado`).send({ estado: EstadoPostulacion.ACEPTADA });

        expect((await obtenerPerfil(idProyecto)).busquedaAbierta).toBe(false);

        const segunda = await postular(carla, idProyecto, idPerfil);
        expect(segunda.status).toBe(409);
    });

    test('con HastaLlenarVacantes la postulación que completa el cupo se acepta automáticamente', async () => {
        const idHabilidad = await crearHabilidad('Node.js');
        const { idProyecto, idPerfil } = await crearColectivoConProyecto({
            idHabilidad,
            limiteColaboraciones: 1,
            estrategiaAceptacion: 'HastaLlenarVacantes',
        });
        const ana = await crearColaboradora('ana-dev', [idHabilidad]);

        const respuesta = await postular(ana, idProyecto, idPerfil);

        expect(respuesta.status).toBe(201);
        expect(respuesta.body.data.estado).toBe(EstadoPostulacion.ACEPTADA);
        expect(await ColaboracionModel.countDocuments({ fin: null })).toBe(1);
        expect((await obtenerPerfil(idProyecto)).busquedaAbierta).toBe(false);
    });

    test('los datos de contacto dan 403 al colectivo hasta que acepta una postulación de esa persona', async () => {
        const idHabilidad = await crearHabilidad('Node.js');
        const { colectivo, idProyecto, idPerfil } = await crearColectivoConProyecto({ idHabilidad });
        const ana = await crearColaboradora('ana-dev', [idHabilidad]);

        const antes = await colectivo.get('/colaboradores/ana-dev/contactos');
        expect(antes.status).toBe(403);

        const { body } = await postular(ana, idProyecto, idPerfil);
        await colectivo.patch(`/postulaciones/${body.data.id}/estado`).send({ estado: EstadoPostulacion.ACEPTADA });

        const despues = await colectivo.get('/colaboradores/ana-dev/contactos');
        expect(despues.status).toBe(200);
        expect(despues.body).toEqual([{ medio: 'Email', valor: 'ana-dev@mail.com' }]);
    });

    test('el colectivo da de baja (desanota) una colaboración y no se puede repetir', async () => {
        const idHabilidad = await crearHabilidad('Node.js');
        const { colectivo, idProyecto, idPerfil } = await crearColectivoConProyecto({ idHabilidad });
        const ana = await crearColaboradora('ana-dev', [idHabilidad]);
        const { body } = await postular(ana, idProyecto, idPerfil);
        await colectivo.patch(`/postulaciones/${body.data.id}/estado`).send({ estado: EstadoPostulacion.ACEPTADA });

        const [colaboracion] = (await request(app).get(`/colaboraciones/proyecto/${idProyecto}`)).body;

        const baja = await colectivo.post(`/colaboraciones/${colaboracion.id}/desanotar`);
        expect(baja.status).toBe(200);
        expect(baja.body.data.activa).toBe(false);
        expect((await ColaboracionModel.findById(colaboracion.id)).fin).not.toBeNull();

        const otraVez = await colectivo.post(`/colaboraciones/${colaboracion.id}/desanotar`);
        expect(otraVez.status).toBe(409);
    });
});
