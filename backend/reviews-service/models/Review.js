const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    username: { type: String, required: true },
    gameId: { type: Number, required: true, index: true },
    type: { type: String, enum: ['artistic', 'technical'], required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, trim: true, maxlength: 1000 },
    
    // SNAPSHOT DE HARDWARE (Histórico)
    pcSpecs: {
        cpu: { type: String, default: 'N/A' },
        gpu: { type: String, default: 'N/A' },
        ram: { type: String, default: 0 },
        os: { type: String, default: 'N/A' }
    }
}, {
    timestamps: true
});

reviewSchema.index({ gameId: 1, userId: 1, type: 1 }, { unique: true });

module.exports = mongoose.model('Review', reviewSchema);