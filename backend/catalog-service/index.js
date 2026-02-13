require('dotenv').config({ path: `${__dirname}/.env` });

const express = require('express');
const mongoose = require('mongoose');
const rateLimit = require('express-rate-limit');
const errorHandler = require('../shared/errors/errorHandler');

const app = express();

app.use(express.json());

// Conexión a MongoDB
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('MongoDB Conectado (Catalog Service)'))
    .catch(err => console.error('Error conectando a Mongo:', err));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: process.env.SERVICE_NAME || 'catalog-service'
  });
});

// Rate limiting para búsqueda de juegos (más permisivo)
const searchLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 50, // máximo 50 requests por minuto por IP
  message: 'Demasiadas solicitudes, intenta más tarde.'
});

// Aplica el limitador solo al endpoint de búsqueda
app.use('/api/games/search', searchLimiter);

// Rutas del catálogo de juegos
app.use('/api/games', require('./routes/games'));

// Middleware global de manejo de errores (¡siempre al final!)
app.use(errorHandler);

// Arranque del servicio
const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
  console.log(`${process.env.SERVICE_NAME || 'catalog-service'} listening on ${PORT}`);
});