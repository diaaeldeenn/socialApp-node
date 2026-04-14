export class AppError extends Error {
    message;
    statusCode;
    constructor(message, statusCode) {
        super(message);
        this.message = message;
        this.statusCode = statusCode;
        this.message = message;
        this.statusCode = statusCode;
    }
}
export const globalErrorHandler = (err, req, res, next) => {
    const status = err.statusCode || 500;
    res.status(status).json({ message: err.message, status, stack: err.stack });
};
