require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const csv = require('csv-parser');

// Importamos los modelos
const Cpu = require('./models/Cpu');
const Gpu = require('./models/Gpu');
const Ram = require('./models/Ram');

// Conexión a tu Atlas
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('✅ Conectado a Mongo... Preparando inyección de datos.'))
    .catch(err => {
        console.error('❌ Error de conexión:', err);
        process.exit(1);
    });

// Función auxiliar para leer CSV
const readCSV = (filePath) => {
    return new Promise((resolve, reject) => {
        const results = [];
        fs.createReadStream(filePath)
            .pipe(csv())
            .on('data', (data) => results.push(data))
            .on('end', () => resolve(results))
            .on('error', (err) => reject(err));
    });
};

const importData = async () => {
    try {
        console.log('⏳ Leyendo archivos CSV...');
        
        const cpus = await readCSV('./data/cpu.csv');
        const gpus = await readCSV('./data/video-card.csv');
        const rams = await readCSV('./data/memory.csv');

        console.log(`📦 Encontrados: ${cpus.length} CPUs, ${gpus.length} GPUs, ${rams.length} RAMs`);

        // Borrar datos viejos para no duplicar si lo corres dos veces
        console.log('🧹 Limpiando base de datos...');
        await Cpu.deleteMany();
        await Gpu.deleteMany();
        await Ram.deleteMany();

        // -- INSERTAR CPUS --
        console.log('🚀 Insertando CPUs...');
        const cpuDocs = cpus.map(c => ({
            name: c.name,
            price: parseFloat(c.price) || 0,
            core_count: parseInt(c.core_count) || 0,
            core_clock: parseFloat(c.core_clock) || 0,
            boost_clock: parseFloat(c.boost_clock) || 0,
            tdp: parseInt(c.tdp) || 0,
            graphics: c.graphics
        }));
        await Cpu.insertMany(cpuDocs);

        // -- INSERTAR GPUS --
        console.log('🚀 Insertando GPUs...');
        const gpuDocs = gpus.map(g => ({
            name: g.name,
            price: parseFloat(g.price) || 0,
            chipset: g.chipset,
            memory: parseFloat(g.memory) || 0,
            core_clock: parseFloat(g.core_clock) || 0,
            boost_clock: parseFloat(g.boost_clock) || 0,
            color: g.color
        }));
        await Gpu.insertMany(gpuDocs);

        // -- INSERTAR RAMS --
        console.log('🚀 Insertando RAMs (esto tarda un poquito más)...');
        const ramDocs = rams.map(r => ({
            name: r.name,
            price: parseFloat(r.price) || 0,
            speed: r.speed,
            modules: r.modules,
            price_per_gb: parseFloat(r.price_per_gb) || 0,
            color: r.color,
            latency: parseFloat(r.first_word_latency) || 0
        }));
        // Insertamos en bloques para que no explote la memoria si son muchas
        await Ram.insertMany(ramDocs);

        console.log('✨ ¡LISTO! Base de datos cargada al 100%.');
        process.exit();

    } catch (error) {
        console.error('❌ Error importando datos:', error);
        process.exit(1);
    }
};

importData();