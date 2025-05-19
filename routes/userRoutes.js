const express = require('express');

const userController = require('../controllers/userController');
const authController = require('../controllers/authController');

const userRouter = express.Router();
userRouter
    .get('/', authController.authGuard, authController.preAuthorize('admin'), userController.findAllUsers)
    .post('/', authController.authGuard, authController.preAuthorize('admin'), userController.createUser)
    .get('/:id', authController.authGuard, authController.preAuthorize('admin'), userController.findUserById)
    .put('/:id', authController.authGuard, authController.preAuthorize('admin'), userController.updateUser)
    .delete('/:id', authController.authGuard, authController.preAuthorize('admin'), userController.deleteUser);

module.exports = userRouter;