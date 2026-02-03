require('dotenv').config({ path: `${__dirname}/.env` });

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors'); 
const errorHandler = require('../shared/errors/errorHandler');

const app = express();

app.use(express.json());
app.use(cors());

// Logger simple para debug
app.use((req, res, next) => {
    console.log(`[Reviews] ${req.method} ${req.url}`);
    next();
});

// Conexión a Mongo
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB Conectado (Reviews Service)'))
  .catch(err => {
      console.error('Error conectando a Mongo:', err);
      // No detener proceso para ver errores HTTP si falla BD (opcional)
  });

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'reviews-service' });
});

// Rutas
app.use('/api/reviews', require('./routes'));

// 404 Handler
app.use((req, res, next) => {
    res.status(404).json({ success: false, msg: 'Endpoint no encontrado en Reviews Service' });
});

app.use(errorHandler);

const PORT = process.env.PORT || 3003;
app.listen(PORT, () => {
  console.log(`Reviews Service listening on ${PORT}`);
});