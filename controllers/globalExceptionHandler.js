exports.handleError = (err, req, res, next) => {
    console.log(err.stack); // -> stack trace do erro
    if (err.name === 'ValidationError') {
        return sendValidationError(err, req, res);
    }
    if (err.name === 'CastError') {
        return sendCastError(err, req, res);
    }
    if (err.name === 'MongoServerError' && err.code === 11000) {
        return sendDuplicatePropertyError(err, req, res);
    }
    return sendDefaultError(err, req, res);
}

const sendValidationError = (err, req, res) => {
    return res.status(422).json({
        timestamp: new Date().toISOString(),
        status: 422,
        error: 'Unprocessable Entity',
        message: "Invalid Data",
        path: req.originalUrl,
        errors: Object.keys(err.errors).map(key => ({
            field: key,
            message: err.errors[key].message
        }))
    });
}

const sendCastError = (err, req, res) => {
    return res.status(400).json({
        timestamp: new Date().toISOString(),
        status: 400,
        error: 'Bad Request',
        message: `Invalid ${err.path}: ${err.value}`,
        path: req.originalUrl
    });
}

const sendDuplicatePropertyError = (err, req, res) => {
    const field = err.errmsg.match(/(["'])(\\?.)*?\1/)[0];
    return res.status(409).json({
        timestamp: new Date().toISOString(),
        status: 409,
        error: 'Conflict',
        message: `Duplicate field value: ${field}. Please use another value`,
        path: req.originalUrl
    })
}

const sendDefaultError = (err, req, res) => {
    const status = err.status || 500;
    const error = err.error || 'Internal Server Error';
    const message = err.message || 'Something went wrong!';
    return res.status(status).json({
        timestamp: new Date().toISOString(),
        status,
        error,
        message,
        path: req.originalUrl
    });
}

