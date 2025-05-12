class ErrorResponse extends Error {
    constructor(status, error, message) {
        super(message);
        this.status = status;
        this.error = error;
        Error.captureStackTrace(this, this.constructor); // -> captura o stack trace do erro
    }
}

module.exports = ErrorResponse;