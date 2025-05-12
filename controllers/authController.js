const User = require("../models/userModel");
const { catchAsync } = require("../utils/catchAsync");
// -> npm i jsonwebtoken
const jwt = require("jsonwebtoken");
const ErrorResponse = require("../utils/errorResponse");

exports.register = catchAsync(async (req, res, next) => {
    const newUser = await User.create({
        name: req.body.name,
        email: req.body.email,
        password: req.body.password,
        passwordConfirmation: req.body.passwordConfirmation,
    });
    const token = signToken(newUser);
    return res.status(201).json({ user: newUser, token })
});

exports.login = catchAsync(async (req, res, next) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return next(new ErrorResponse(422, "Unprocessable Entity", "Please provide email and password"));
    }
    const user = await User.findOne({ email }).select("+password"); // -> o select("+password") é para trazer o password que está como select: false no model
    if (!user || !(await user.validatePasswords(password, user.password))) {
        return next(new ErrorResponse(401, "Unauthorized", "Invalid credentials"));
    }
    const token = signToken(user);
    return res.status(200).json({ token });
});

const signToken = (user) => {
    return jwt.sign({ id: user._id, username: user.email }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });
}

exports.authGuard = catchAsync(async (req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
        return next(new ErrorResponse(401, "Unauthorized", "No auth token provided"));
    }
    let decodedPayload
    jwt.verify(token, process.env.JWT_SECRET, (err, payload) => {
        if (err) {
            return next(new ErrorResponse(403, "Forbidden", "Invalid token"));
        }
        decodedPayload = payload;
    });
    const user = await User.findById(decodedPayload.id);
    if (!user) {
        return next(new ErrorResponse(401, "Unauthorized", "User not found"));
    }
    if (user.hasChangedPasswordAfterLogin(decodedPayload.iat)) {
        return next(new ErrorResponse(401, "Unauthorized", "User changed password after token was issued"));
    }
    req.user = user;
    next();
});

exports.preAuthorize = (...roles) => {
    return catchAsync(async (req, res, next) => {
        const user = req.user;
        if (!roles.includes(user.role)) {
            return next(new ErrorResponse(403, "Forbidden", "You do not have permission to perform this action"));
        }
        next();
    });
}

exports.forgotPassword = catchAsync(async (req, res, next) => {
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
        return next(new ErrorResponse(404, "Not Found", "User not found"));
    }
    const resetToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false })
});

exports.resetPassword = catchAsync(async (req, res, next) => {

});

