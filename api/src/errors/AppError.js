class AppError extends Error {
    constructor(message, statusCode, details) {
        super(message);
        this.name = this.constructor.name;
        this.statusCode = statusCode;
        this.details = details;
    }
}

class BadRequestError extends AppError {
    constructor(message, details) {
        super(message, 400, details);
    }
}

class UnauthorizedError extends AppError {
    constructor(message, details) {
        super(message, 401, details);
    }
}

class ForbiddenError extends AppError {
    constructor(message, details) {
        super(message, 403, details);
    }
}

class NotFoundError extends AppError {
    constructor(message, details) {
        super(message, 404, details);
    }
}

class ConflictError extends AppError {
    constructor(message, details) {
        super(message, 409, details);
    }
}

module.exports = { AppError, BadRequestError, UnauthorizedError, ForbiddenError, NotFoundError, ConflictError };
