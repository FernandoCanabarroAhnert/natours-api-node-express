const User = require("../models/userModel");
const { catchAsync } = require("../utils/catchAsync");
// -> npm i jsonwebtoken
const jwt = require("jsonwebtoken");
const ErrorResponse = require("../utils/errorResponse");
const { createEmail, sendEmail } = require("../utils/email");
const crypto = require("crypto");
//npm i multer
const multer = require('multer');
//npm i sharp
const sharp = require('sharp');

// const storage = multer.diskStorage({ 
//     destination: (req, file, callback) => {
//         callback(null, 'uploads/img/users');
//     },
//     filename: (req, file, callback) => {
//         const extension = file.mimetype.split('/')[1];
//         callback(null, `user-${req.user._id}-${Date.now()}.${extension}`)
//     }
// });
const storage = multer.memoryStorage(); // -> Armazena a imagem na memória
const fileFilter = (req, file, callback) => {
    if (!file.mimetype.startsWith('image')) {
        callback(new ErrorResponse(400, "Bad Request", "Invalid file type"), false);
    }
    else {
        callback(null, true);
    }
};
const upload = multer({
    storage: storage,
    fileFilter: fileFilter
});

exports.uploadUserPhoto = upload.single('photo');

exports.resizeImage = catchAsync(async (req, res, next) => {
    if (!req.file) return next();
    req.file.filename = `user-${req.user._id}-${Date.now()}.jpeg`;
    await sharp(req.file.buffer)
        .resize(500, 500)
        .toFormat('jpeg')
        .jpeg({ quality: 90 })
        .toFile(`uploads/img/users/${req.file.filename}`);
    next();
});

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
    // res.cookie("jwt", token, {
    //     expires: new Date(Date.now() + process.env.JWT_EXPIRES_IN * 1000),
    //     httpOnly: true,
    //     secure: true
    // });
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
    const email = createEmail(user.email, "Password Reset Token", `Your password reset token is: ${resetToken}\nIt is valid for 10 minutes.`);
    await sendEmail(email);
    return res.status(200).json({ status: "Success", message: "Token sent to email" });
});

exports.resetPassword = catchAsync(async (req, res, next) => {
    const hashedToken = crypto.createHash("sha256")
            .update(req.body.token)
            .digest("hex");
    const user = await User.findOne({ passwordResetToken: hashedToken, passwordResetExpires: { $gt: Date.now() } });
    if (!user) {
        return next(new ErrorResponse(404, "Not Found", "Invalid or expired token"));
    }
    user.password = req.body.password;
    user.passwordConfirmation = req.body.passwordConfirmation;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    // user.passwordLastChangedAt = Date.now(); -> há um middleware no model que faz isso para nós
    await user.save();
    return res.status(200).json({ status: "Success", message: "Password reset successfully" });
});

exports.updatePassword = catchAsync(async (req, res, next) => {
    const user = await User.findById(req.user._id).select("+password");
    if (!user) {
        return next(new ErrorResponse(404, "Not Found", "User not found"));
    }
    const isCurrentPasswordValid = await user.validatePasswords(req.body.currentPassword, user.password);
    if (!isCurrentPasswordValid) {
        return next(new ErrorResponse(409, "Conflict", "Invalid current password"));
    }
    user.password = req.body.newPassword;
    user.passwordConfirmation = req.body.passwordConfirmation;
    await user.save();
    const token = signToken(user);
    return res.status(200).json({ status: "Success", message: "Password updated successfully", token });
});

exports.updateSelfInfos = catchAsync(async (req, res, next) => {
    const user = await User.findById(req.user._id);
    if (!user) {
        return next(new ErrorResponse(404, "Not Found", "User not found"));
    }
    const data = { name: req.body.name, email: req.body.email };
    if (req.file) {
        data.photo = req.file.filename;
    }
    const updatedUser = await User.findByIdAndUpdate(req.user._id, data, { new: true, runValidators: true });
    const photoUrl = `${req.protocol}://${req.get('host')}/uploads/img/users/${updatedUser.photo}`;
    updatedUser.photo = photoUrl;
    return res.status(200).json({ status: "Success", data: updatedUser });
});

exports.deleteSelf = catchAsync(async (req, res, next) => {
    const user = await User.findById(req.user._id);
    if (!user) {
        return next(new ErrorResponse(404, "Not Found", "User not found"));
    }
    await User.findByIdAndUpdate(req.user._id, { active: false });
    return res.status(200).json({ status: "Success", message: "Account deleted successfully" });
});

exports.getMe = catchAsync(async (req, res, next) => {
    const user = await User.findById(req.user._id);
    if (!user) {
        return next(new ErrorResponse(404, "Not Found", "User not found"));
    }
    return res.status(200).json(user);
});