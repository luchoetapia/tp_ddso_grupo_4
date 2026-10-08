const { NotFoundError } = require("../errors/AppError.js");

function notFoundHandler(req, res, next) {
    next(new NotFoundError(`Ruta ${req.originalUrl} no encontrada`));
}

module.exports = { notFoundHandler };