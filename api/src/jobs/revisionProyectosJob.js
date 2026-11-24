const cron = require('node-cron');
const proyectoService = require('../services/proyectoService.js');

// Todos los días a las 00:00 se marcan para revisión manual los proyectos sin actualizaciones
const EXPRESION_CRON = '0 0 * * *';
const ZONA_HORARIA = 'America/Argentina/Buenos_Aires';

const marcarProyectosSinActualizaciones = async () => {
    try {
        const { modifiedCount } = await proyectoService.marcarProyectosSinActualizaciones();
        console.log(`[Cron] Proyectos marcados para revisión por falta de actualizaciones: ${modifiedCount}`);
        return modifiedCount;
    } catch (error) {
        // Un error en una ejecución no tira abajo el servidor
        console.error('[Cron] No se pudieron marcar los proyectos sin actualizaciones:', error);
        return 0;
    }
};

const iniciarRevisionProyectosJob = () =>
    cron.schedule(EXPRESION_CRON, marcarProyectosSinActualizaciones, {
        timezone: ZONA_HORARIA,
        name: 'revision-proyectos-sin-actualizaciones',
    });

module.exports = {
    iniciarRevisionProyectosJob,
    marcarProyectosSinActualizaciones,
    EXPRESION_CRON,
    ZONA_HORARIA,
};
