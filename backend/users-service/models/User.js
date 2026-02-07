const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        minlength: 3
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    password: {
        type: String,
        required: true
    },
    // Aquí guardaremos las specs de su PC más adelante
    pcSpecs: {
        cpu: { type: String, default: null }, // Ej: "Intel Core i5-12400F"
        gpu: { type: String, default: null }, // Ej: "Nvidia RTX 3060"
        ram: { type: String, default: null },
        os: { type: String, default: null }
    },
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('User', UserSchema);