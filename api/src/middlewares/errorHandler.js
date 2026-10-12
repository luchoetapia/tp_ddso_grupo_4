function errorHandler(err, req, res, next) {
    if (res.headersSent) {
        return next(err);
    }

    const esErrorDeMongoose = err.name === 'ValidationError' || err.name === 'CastError';
    const statusCode = err.statusCode || (esErrorDeMongoose ? 400 : 500);

    return res.status(statusCode).json({
        message: err.message || 'Error interno del servidor',
        details: err.details || [],
    });
}

module.exports = { errorHandler };