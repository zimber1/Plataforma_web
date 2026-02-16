const mongoose = require('mongoose');

const GpuSchema = new mongoose.Schema({
    name: { type: String, required: true, index: true },
    price: { type: Number },
    chipset: { type: String }, // Ej: "GeForce RTX 3060"
    memory: { type: Number }, // VRAM en GB
    core_clock: { type: Number },
    boost_clock: { type: Number },
    color: { type: String }
});

module.exports = mongoose.model('Gpu', GpuSchema);