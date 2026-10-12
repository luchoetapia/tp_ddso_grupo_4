function obtenerStatusCode(err) {
    const esErrorDeMongoose = err.name === 'ValidationError' || err.name === 'CastError';
    return err.statusCode || (esErrorDeMongoose ? 400 : 500);
}

function errorHandler(err, req, res, next) {
    if (res.headersSent) {
        return next(err);
    }

    const statusCode = obtenerStatusCode(err);

    return res.status(statusCode).json({
        message: err.message || 'Error interno del servidor',
        details: err.details || [],
    });
}

module.exports = { errorHandler, obtenerStatusCode };
