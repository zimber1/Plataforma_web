const mongoose = require('mongoose');

const RamSchema = new mongoose.Schema({
    name: { type: String, required: true, index: true },
    price: { type: Number },
    speed: { type: String }, // Ej: "DDR5-6000"
    modules: { type: String }, // Ej: "2 x 16GB"
    price_per_gb: { type: Number },
    color: { type: String },
    latency: { type: Number }
});

module.exports = mongoose.model('Ram', RamSchema);