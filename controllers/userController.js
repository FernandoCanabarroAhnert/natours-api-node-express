const User = require("../models/userModel")
const { catchAsync } = require("../utils/catchAsync")
const handlerFactory = require("./handlerFactory");

exports.findAllUsers = handlerFactory.findAll(User);
exports.findUserById = handlerFactory.findById(User);
exports.createUser = handlerFactory.createOne(User);
exports.updateUser = handlerFactory.updateOne(User);
exports.deleteUser = handlerFactory.deleteOne(User);