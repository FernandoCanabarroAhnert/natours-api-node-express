const express = require('express');

const userController = require('../controllers/userController');
const { use } = require('./tourRoutes');

const userRouter = express.Router();
userRouter
    .get('/', userController.findAllUsers)
    .post('/', userController.createUser)
    .get('/:id', userController.findUserById)
    .put('/:id', userController.updateUser)
    .delete('/:id', userController.deleteUser);

module.exports = userRouter;