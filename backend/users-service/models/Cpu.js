const mongoose = require('mongoose');

const CpuSchema = new mongoose.Schema({
    name: { type: String, required: true, index: true }, // Index para buscar rápido
    price: { type: Number },
    core_count: { type: Number },
    core_clock: { type: Number },
    boost_clock: { type: Number },
    tdp: { type: Number },
    graphics: { type: String }, // Gráficos integrados
    image: { type: String } // Por si luego quieres ponerle foto
});

module.exports = mongoose.model('Cpu', CpuSchema);