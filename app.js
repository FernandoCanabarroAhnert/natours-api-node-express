const express = require('express');
const bodyParser = require('body-parser');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const ErrorResponse = require('./utils/errorResponse');
const { handleError } = require('./controllers/globalExceptionHandler');
const authRouter = require('./routes/authRoutes');
// npm i express-rate-limit
const rateLimit = require('express-rate-limit');
// npm i helmet
const helmet = require('helmet');
// npm i express-mongo-sanitize
const mongoSanitize = require('express-mongo-sanitize');
// npm i xss-clean
const xss = require('xss-clean');
// npm i hpp
const hpp = require('hpp');

const app = express();

app.use(helmet());

const limiter = rateLimit({
    max: 100,
    windowMs: 60 * 60 * 1000, // 1 hour
    message: 'Too many requests from this IP, please try again in an hour' // -> erro com status 429
});
app.use('api', limiter);


app.use(bodyParser.json());

// Data Sanitization against NoSQL query injection
app.use(mongoSanitize())

// Data Sanitization against XSS
app.use(xss());

// Prevent parameter pollution
app.use(hpp({
    whitelist: [
        'duration',
        'ratingsAverage',
        'ratingsQuantity',
        'maxGroupSize',
        'difficulty',
        'price',
        'priceDiscount'
    ]
}));

app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/auth', authRouter);

app.all('*', (req, res, next) => { // -> semelhante ao operador coringa do Angular, ou seja, ele vai pegar todas as rotas que não foram definidas
    // -> o método all é usado para pegar todas as requisições, independente do método (GET, POST, PUT, DELETE)
    next(new ErrorResponse(404, 'Not Found', 'Route not found'));
});

app.use(handleError);

module.exports = app;