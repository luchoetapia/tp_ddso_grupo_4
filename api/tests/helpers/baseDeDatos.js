const mongoose = require('mongoose');

// Base de datos real para los tests de integración (la cátedra pide no mockear la BD).
//  - Si está definida MONGO_URI_TEST se usa ese Mongo (en CI es el servicio mongo:7 del workflow).
//  - Si no, se levanta un Mongo en memoria con mongodb-memory-server (la primera vez descarga el binario de mongod).
// No se usa MONGO_URI a propósito: suele venir del .env y apuntar a la base de desarrollo.
// Cada archivo de test trabaja en una base propia que se borra al terminar.

let servidorEnMemoria = null;

const conectar = async () => {
    let uri = process.env.MONGO_URI_TEST;

    if (!uri) {
        const { MongoMemoryServer } = require('mongodb-memory-server');
        servidorEnMemoria = await MongoMemoryServer.create();
        uri = servidorEnMemoria.getUri();
    }

    await mongoose.connect(uri, { dbName: `test_integracion_${process.pid}_${Date.now()}` });

    // Crea los índices (únicos incluidos) antes de empezar, para que las reglas de la BD apliquen en los tests
    await Promise.all(Object.values(mongoose.models).map(modelo => modelo.init()));
};

// Las tareas en segundo plano (moderación, notificaciones automáticas) no se esperan en la request:
// se les da un margen para que terminen antes de vaciar o cerrar la base
const esperarTareasEnSegundoPlano = (ms = 300) => new Promise(resolve => setTimeout(resolve, ms));

const vaciar = async () => {
    await esperarTareasEnSegundoPlano();
    const colecciones = Object.values(mongoose.connection.collections);
    await Promise.all(colecciones.map(coleccion => coleccion.deleteMany({})));
};

const desconectar = async () => {
    // Si no se llegó a conectar (ej. falló la descarga de mongod) no hay nada que borrar
    if (mongoose.connection.readyState === 1) {
        await esperarTareasEnSegundoPlano();
        await mongoose.connection.dropDatabase();
    }
    await mongoose.disconnect();
    if (servidorEnMemoria) await servidorEnMemoria.stop();
};

module.exports = { conectar, vaciar, desconectar, esperarTareasEnSegundoPlano };
