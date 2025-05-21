const mongoose = require("mongoose");
const crypto = require("crypto");
// -> npm i bcryptjs
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Required field"],
        trim: true
    },
    email: {
        type: String,
        required: [true, "Required field"],
        trim: true,
        unique: true,
        lowercase: true,
        validate: {
            validator: function (value) {
                return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(value);
            },
            message: "Invalid email format"
        }
    },
    password: {
        type: String,
        required: [true, "Required field"],
        min: [8, "Password must be at least 8 characters"],
        select: false
    },
    passwordConfirmation: {
        type: String,
        required: [true, "Required field"],
        validate: {
            // Só funciona com as funções .save() e .create()
            validator: function(value) {
                return value === this.password;
            },
            message: "Passwords must match"
        }
    },
    role: {
        type: String,
        enum: ["user", "guide", "lead", "admin"],
        default: "user"
    },
    passwordLastChangedAt: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
    active: {
        type: Boolean,
        default: true,
        select: false
    },
    photo: {
        type: String,
        default: "default.jpg"
    }
});

userSchema.pre("save", async function(next) {
    if (!this.isModified("password")) return next();
    this.password = await bcrypt.hash(this.password, 12);
    this.passwordConfirmation = undefined;
    next();
})

userSchema.pre('save', function(next) {
    if (!this.isModified("password") || this.isNew) return next();
    this.passwordLastChangedAt = Date.now() - 1000; // -> para garantir que o timestamp seja menor do que o do token
    next();
})

userSchema.pre(/^find/, function(next) {
    this.find({ active: { $ne: false } });
    next();
})

userSchema.methods.validatePasswords = async function(rawPassword, encodedPassword) {
    return await bcrypt.compare(rawPassword, encodedPassword);
}

userSchema.methods.hasChangedPasswordAfterLogin = function(jwtTimestamp) {
    if (this.passwordLastChangedAt) {
        const passwordLastChangedAtTimestamp = parseInt(this.passwordLastChangedAt.getTime() / 1000, 10);
        return passwordLastChangedAtTimestamp > jwtTimestamp;
    }
    return false;
}

userSchema.methods.hasRole = function(role) {
    return this.role === role;
}

userSchema.methods.createPasswordResetToken = function() {
    const tenMinutesInMilliseconds = 10 * 60 * 1000;
    const resetToken = crypto.randomBytes(32).toString("hex");
    this.passwordResetToken = crypto.createHash("sha256")
        .update(resetToken)
        .digest("hex");
    this.passwordResetExpires = Date.now() + tenMinutesInMilliseconds;
    return resetToken;
}

const User = mongoose.model("User", userSchema);

module.exports = User;