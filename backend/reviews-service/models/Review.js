const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true
    },
    username: { // Guardamos el username para no tener que consultarlo al microservicio de usuarios cada vez
        type: String, 
        required: true
    },
    gameId: {
        type: Number, // ID de IGDB/Steam
        required: true,
        index: true
    },
    type: {
        type: String,
        enum: ['artistic', 'technical'],
        required: true
    },
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },
    comment: {
        type: String,
        trim: true,
        maxlength: 1000 // Evitar testamentos bíblicos
    }
}, {
    timestamps: true
});

// Índice único compuesto: Un usuario solo puede tener una reseña de un tipo para un juego
reviewSchema.index({ gameId: 1, userId: 1, type: 1 }, { unique: true });

module.exports = mongoose.model('Review', reviewSchema);