const express = require('express');
const router = express.Router();
const Cpu = require('../models/Cpu');
const Gpu = require('../models/Gpu');
const Ram = require('../models/Ram');

// GET /api/hardware/search?type=cpu&q=ryzen
router.get('/search', async (req, res) => {
    try {
        const { type, q } = req.query;

        // Si no escriben al menos 2 letras, no buscamos nada (para no saturar)
        if (!q || q.length < 2) {
            return res.json([]);
        }

        const regex = { $regex: q, $options: 'i' }; // Búsqueda flexible (mayúsculas/minúsculas)
        let results = [];

        if (type === 'cpu') {
            results = await Cpu.find({ name: regex })
                .select('name core_count core_clock') // Solo devolvemos lo necesario
                .limit(10);
        } else if (type === 'gpu') {
            results = await Gpu.find({ name: regex })
                .select('name chipset memory')
                .limit(10);
        } else if (type === 'ram') {
            results = await Ram.find({ name: regex })
                .select('name speed modules')
                .limit(10);
        } else {
            return res.status(400).json({ error: 'Tipo de hardware inválido (use cpu, gpu, o ram)' });
        }

        res.json(results);

    } catch (error) {
        console.error('Error buscando hardware:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

module.exports = router;