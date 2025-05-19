const express = require("express");
const authController = require("../controllers/authController")

const authRouter = express.Router();

authRouter
    .post("/register", authController.register)
    .post("/login", authController.login)
    .post("/forgot-password", authController.forgotPassword)
    .post("/reset-password", authController.resetPassword)
    .put("/update-password", authController.authGuard, authController.updatePassword)
    .put("/update-infos", authController.authGuard, authController.updateSelfInfos)
    .delete("/delete-me", authController.authGuard, authController.deleteSelf)
    .get("/me", authController.authGuard, authController.getMe)

module.exports = authRouter;