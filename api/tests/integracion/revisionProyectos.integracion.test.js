// Integración del opcional "seguimiento de proyectos sin actualizaciones": lo que hace el cron diario
// (proyectoService.marcarProyectosSinActualizaciones) contra un MongoDB real, sin mocks.
const mongoose = require('mongoose');
const request = require('supertest');
const app = require('../../src/app.js');
const ProyectoModel = require('../../src/database/schemas/proyectoSchema.js');
const ColaboracionModel = require('../../src/database/schemas/colaboracionSchema.js');
const proyectoService = require('../../src/services/proyectoService.js');
const logroService = require('../../src/services/logroService.js');
const bd = require('../helpers/baseDeDatos.js');

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

const DIAS_SIN_ACTUALIZACION = 30;
const UN_DIA = 24 * 60 * 60 * 1000;
const haceDias = (dias) => new Date(Date.now() - dias * UN_DIA);

// Crea el proyecto directo en la base para poder fechar el proyecto y sus logros en el pasado
const crearProyecto = async (titulo, {
    creadoHaceDias = 60,
    logroHaceDias = null,
    conColaboracionActiva = true,
    finalizado = false,
} = {}) => {
    const logros = logroHaceDias === null ? [] : [{ titulo: 'Hito', descripcion: 'Avance' }];
    const proyecto = await ProyectoModel.create({ titulo, descripcion: 'desc', finalizado, logros });

    // Los timestamps de Mongoose ponen la fecha actual al crear: se corrigen con el driver
    const fechas = { createdAt: haceDias(creadoHaceDias) };
    if (logroHaceDias !== null) fechas['logros.0.createdAt'] = haceDias(logroHaceDias);
    await ProyectoModel.collection.updateOne({ _id: proyecto._id }, { $set: fechas });

    if (conColaboracionActiva) {
        await ColaboracionModel.create({
            colaborador: { id: new mongoose.Types.ObjectId() },
            proyecto: { id: proyecto._id, titulo, descripcion: 'desc' },
            perfil: new mongoose.Types.ObjectId(),
            inicio: haceDias(creadoHaceDias),
        });
    }
    return proyecto.id;
};

const estaMarcado = async (id) => (await ProyectoModel.findById(id)).requiereRevisionManual;

describe('Integración: proyectos sin actualizaciones (cron diario)', () => {
    test('marca solo los proyectos en curso, con colaboraciones activas y sin logros recientes', async () => {
        const sinNovedades = await crearProyecto('Sin novedades');
        const conLogroViejo = await crearProyecto('Con logro viejo', { logroHaceDias: 45 });
        const conLogroReciente = await crearProyecto('Con logro reciente', { logroHaceDias: 5 });
        const sinColaboraciones = await crearProyecto('Sin colaboraciones', { conColaboracionActiva: false });
        const nuevo = await crearProyecto('Nuevo', { creadoHaceDias: 10 });
        const finalizado = await crearProyecto('Finalizado', { finalizado: true });

        const { modifiedCount } = await proyectoService.marcarProyectosSinActualizaciones(DIAS_SIN_ACTUALIZACION);

        expect(modifiedCount).toBe(2);
        expect(await estaMarcado(sinNovedades)).toBe(true);
        expect(await estaMarcado(conLogroViejo)).toBe(true);
        expect(await estaMarcado(conLogroReciente)).toBe(false);
        expect(await estaMarcado(sinColaboraciones)).toBe(false);
        expect(await estaMarcado(nuevo)).toBe(false);
        expect(await estaMarcado(finalizado)).toBe(false);

        const marcado = await ProyectoModel.findById(sinNovedades);
        expect(marcado.revisionManualMotivo).toBe('Sin actualizaciones recientes');
        expect(marcado.revisionManualFecha).toBeInstanceOf(Date);
    });

    test('una colaboración dada de baja no cuenta como proyecto iniciado', async () => {
        const id = await crearProyecto('Con baja', { conColaboracionActiva: false });
        await ColaboracionModel.create({
            colaborador: { id: new mongoose.Types.ObjectId() },
            proyecto: { id, titulo: 'Con baja', descripcion: 'desc' },
            perfil: new mongoose.Types.ObjectId(),
            inicio: haceDias(60),
            fin: haceDias(40),
        });

        await proyectoService.marcarProyectosSinActualizaciones(DIAS_SIN_ACTUALIZACION);

        expect(await estaMarcado(id)).toBe(false);
    });

    test('un proyecto ya marcado no se vuelve a marcar', async () => {
        await crearProyecto('Sin novedades');

        expect((await proyectoService.marcarProyectosSinActualizaciones(DIAS_SIN_ACTUALIZACION)).modifiedCount).toBe(1);
        expect((await proyectoService.marcarProyectosSinActualizaciones(DIAS_SIN_ACTUALIZACION)).modifiedCount).toBe(0);
    });

    test('la marca llega al front en el listado y en la ficha del proyecto', async () => {
        const id = await crearProyecto('Sin novedades');
        await proyectoService.marcarProyectosSinActualizaciones(DIAS_SIN_ACTUALIZACION);

        const ficha = await request(app).get(`/proyectos/${id}`);
        expect(ficha.status).toBe(200);
        expect(ficha.body).toMatchObject({
            requiereRevisionManual: true,
            revisionManualMotivo: 'Sin actualizaciones recientes',
        });

        const listado = await request(app).get('/proyectos');
        expect(listado.status).toBe(200);
        expect(listado.body.data.find(p => p.id === id).requiereRevisionManual).toBe(true);
    });

    test('cargar un logro le saca la marca al proyecto', async () => {
        const id = await crearProyecto('Sin novedades');
        await proyectoService.marcarProyectosSinActualizaciones(DIAS_SIN_ACTUALIZACION);
        expect(await estaMarcado(id)).toBe(true);

        await logroService.crear(id, { titulo: 'Nueva versión', descripcion: 'Se publicó la v2' });

        const proyecto = await ProyectoModel.findById(id);
        expect(proyecto.requiereRevisionManual).toBe(false);
        expect(proyecto.revisionManualMotivo).toBeNull();

        // Y con el logro nuevo, la próxima corrida del cron ya no lo marca
        await proyectoService.marcarProyectosSinActualizaciones(DIAS_SIN_ACTUALIZACION);
        expect(await estaMarcado(id)).toBe(false);
    });
});
