// Palabras prohibidas que usa la moderación automática (regla palabras_prohibidas).
// Uso: npm run seed:palabras
// Es idempotente: crea las que faltan y no modifica las que ya existen (no reactiva ni desactiva nada).
// Se guardan en minúscula, igual que las da de alta la API. La detección ya ignora tildes, mayúsculas,
// letras repetidas y leet (p3l0tud0), así que alcanza con una sola forma por palabra; sí hace falta cada
// variante de género o número porque se busca la palabra completa.
const mongoClient = require('../src/database/mongoose.js');
const PalabraBaneadaModel = require('../src/database/schemas/PalabraBaneadaSchema.js');

const PALABRAS_BANEADAS = [
    // Insultos
    'boludo', 'boluda', 'pelotudo', 'pelotuda', 'forro', 'forra', 'tarado', 'tarada',
    'idiota', 'imbécil', 'estúpido', 'estúpida', 'conchudo', 'conchuda', 'sorete', 'garca',
    'culiado', 'culiada', 'hijo de puta', 'hija de puta', 'la concha de tu madre',

    // Discriminatorias
    'mogólico', 'mogólica', 'retrasado', 'retrasada', 'trolo', 'puto', 'villero', 'villera',
    'negro de mierda', 'sudaca',

    // Vulgares
    'puta', 'mierda', 'pija', 'verga', 'choto',

    // En inglés
    'fuck', 'shit', 'bitch', 'asshole',

    // Spam
    'apuestas online', 'casino online', 'dinero fácil',
];

// Cargadas pero desactivadas, para mostrar el alta/baja desde el panel de moderación
const PALABRAS_DESACTIVADAS = ['carajo', 'chanta'];

const TODAS = [
    ...PALABRAS_BANEADAS.map((palabra) => ({ palabra, activa: true })),
    ...PALABRAS_DESACTIVADAS.map((palabra) => ({ palabra, activa: false })),
];

const cargarPalabrasBaneadas = async () => {
    const resultado = await PalabraBaneadaModel.bulkWrite(TODAS.map(({ palabra, activa }) => ({
        updateOne: {
            filter: { palabra },
            update: { $setOnInsert: { palabra, activa } },
            upsert: true,
        },
    })));
    return { total: TODAS.length, nuevas: resultado.upsertedCount };
};

const main = async () => {
    await mongoClient.connect();
    try {
        const { total, nuevas } = await cargarPalabrasBaneadas();
        console.log(`Palabras prohibidas precargadas: ${total} (${nuevas} nuevas, ${PALABRAS_DESACTIVADAS.length} desactivadas)`);
    } finally {
        await mongoClient.close();
    }
};

if (require.main === module) {
    main().catch((error) => {
        console.error('Error al precargar palabras prohibidas:', error);
        process.exitCode = 1;
    });
}

module.exports = { PALABRAS_BANEADAS, PALABRAS_DESACTIVADAS, cargarPalabrasBaneadas };
