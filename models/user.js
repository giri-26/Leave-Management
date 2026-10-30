// models/User.js
const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        trim: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
    },
    rollNumber: {
        type: String,
        required: true,
    },
    casualLeave: {
        type: Number,
        default: 0,
        min: 0,
        validate: Number.isSafeInteger,
    },
    medicalLeave: {
        type: Number,
        default: 0,
        min: 0,
        validate: Number.isSafeInteger,
    },
});

const User = mongoose.model("User", UserSchema);
module.exports = User;
