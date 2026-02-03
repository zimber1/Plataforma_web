require('dotenv').config({ path: `${__dirname}/.env` });

const express = require('express');
const errorHandler = require('../shared/errors/errorHandler');

const app = express();

app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: process.env.SERVICE_NAME || 'catalog-service'
  });
});

// Rutas del catálogo de juegos
app.use('/api/games', require('./routes/games'));

// Middleware global de manejo de errores (¡siempre al final!)
app.use(errorHandler);

// Arranque del servicio
const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
  console.log(`${process.env.SERVICE_NAME || 'catalog-service'} listening on ${PORT}`);
});