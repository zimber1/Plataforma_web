require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 3001; // Usamos 3001 para User Service

// Middlewares
app.use(express.json()); // Body parser
app.use(cors()); // Permitir peticiones cruzadas (útil para cuando conectes Angular)
app.use(helmet()); // Headers de seguridad básicos

// Conexión a MongoDB Atlas
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('MongoDB Conectado (Users Service)'))
    .catch(err => console.error('Error conectando a Mongo:', err));

// Rate limiting para autocompletado (más permisivo)
const searchLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 50, // máximo 50 requests por minuto por IP
  message: 'Demasiadas solicitudes, intenta más tarde.'
});

// Aplica el limitador solo al endpoint de búsqueda/autocompletado
app.use('/api/hardware/search', searchLimiter);

// Rutas
app.use('/api/auth', require('./routes/auth'));
app.use('/api/hardware', require('./routes/hardware'));

// Health Check (Para ver si el servicio vive)
app.get('/', (req, res) => res.send(`Users Service running on port ${PORT}`));

// Manejo global de errores
const errorHandler = require('../shared/errors/errorHandler');
app.use(errorHandler);

app.listen(PORT, () => {
    console.log(`Users Service corriendo en puerto ${PORT}`);
});