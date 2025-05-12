const express = require("express");
const authController = require("../controllers/authController")

const authRouter = express.Router();

authRouter
    .post("/register", authController.register)
    .post("/login", authController.login)
    .post("/forgot-password", authController.forgotPassword)
    .post("/reset-password", authController.resetPassword);

module.exports = authRouter;