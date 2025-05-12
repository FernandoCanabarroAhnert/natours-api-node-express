const User = require("../models/userModel")
const { catchAsync } = require("../utils/catchAsync")

exports.findAllUsers = catchAsync(async (req, res, next) => {
    const users = await User.find();
    return res.status(200).json(users);
})

exports.findUserById = (req, res) => {
    const id = req.params.id
    return res.status(200).json({
        status: 'success',
        data: {
            users: id
        },
    })
}

exports.createUser = (req, res) => {
    const body = req.body;
    return res.status(201).json({
        status: 'success',
        data: {
            users: body,
        },
    })
}

exports.updateUser = (req, res) => {
    const id = req.params.id
    const body = req.body;
    return res.status(200).json({
        status: 'success',
        data: {
            users: { id, ...body },
        },
    })
}

exports.deleteUser = (req, res) => {
    const id = req.params.id
    return res.status(204).json({
        status: 'success',
        data: null,
    })
}