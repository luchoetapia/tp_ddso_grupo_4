function errorHandler(err, req, res, next) {
    if (res.headersSent) {
        return next(err);
    }

    const statusCode = err.statusCode || 500;

    return res.status(statusCode).json({
        message: err.message || 'Error interno del servidor',
        details: err.details || [],
    });
}

module.exports = { errorHandler };