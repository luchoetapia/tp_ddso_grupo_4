const mongoose = require('mongoose');
const { BadRequestError, ConflictError } = require("../errors/AppError");


function errorHandler(err, req, res, next) {
    if (err instanceof mongoose.Error.CastError) {
        err = new BadRequestError(`Valor inválido para '${err.path}'`)  

    } else if (err instanceof mongoose.Error.ValidationError) {
        const mensajes = Object.values(err.errors).map(e => e.message)
        err = new BadRequestError(mensajes.join(' | '))  
                                     
    } else if (err.code === 11000) {
        err = new ConflictError(`Valor duplicado: ${JSON.stringify(err.keyValue)}`) // 409
    }
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