const express = require('express');
const bodyParser = require('body-parser');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const ErrorResponse = require('./utils/errorResponse');
const { handleError } = require('./controllers/globalExceptionHandler');
const authRouter = require('./routes/authRoutes');

const app = express();

app.use(bodyParser.json());

app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/auth', authRouter);

app.all('*', (req, res, next) => { // -> semelhante ao operador coringa do Angular, ou seja, ele vai pegar todas as rotas que não foram definidas
    // -> o método all é usado para pegar todas as requisições, independente do método (GET, POST, PUT, DELETE)
    next(new ErrorResponse(404, 'Not Found', 'Route not found'));
});

app.use(handleError);

module.exports = app;