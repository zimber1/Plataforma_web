const express = require('express');
const cors = require('cors');
const axios = require('axios');
const rateLimit = require('express-rate-limit');
const errorHandler = require('../shared/errors/errorHandler');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Rate limiting general - bastante permisivo
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 500, // máximo 500 requests por IP cada 15 minutos
  message: 'Demasiadas solicitudes desde esta IP, intenta más tarde.'
});

// Rate limiting para autenticación - evita fuerza bruta pero permite varios intentos legítimos
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 20, // máximo 20 intentos cada 15 minutos
  message: 'Demasiados intentos de autenticación, intenta más tarde.'
});

// Rate limiting para búsquedas/autocompletado - permisivo para uso normal
const searchLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 60, // máximo 60 búsquedas por minuto
  message: 'Demasiadas búsquedas, intenta más tarde.'
});

// Aplicar limitador general a todas las rutas
app.use(generalLimiter);

// --- USERS SERVICE ---

// 1. REGISTRO
app.post('/api/auth/register', authLimiter, async (req, res) => {
    try {
        const response = await axios.post('http://localhost:3001/api/auth/register', req.body);
        res.status(response.status).json(response.data);
    } catch (error) {
        if (error.response) {
            res.status(error.response.status).json(error.response.data);
        } else {
            res.status(500).json({ msg: 'Error de conexión con Users Service' });
        }
    }
});

// 2. LOGIN
app.post('/api/auth/login', authLimiter, async (req, res) => {
    try {
        const response = await axios.post('http://localhost:3001/api/auth/login', req.body);
        res.status(response.status).json(response.data);
    } catch (error) {
        if (error.response) {
            res.status(error.response.status).json(error.response.data);
        } else {
            res.status(500).json({ msg: 'Error de conexión con Users Service' });
        }
    }
});

// 3. PERFIL (/me) - Aquí está la clave
app.get('/api/auth/me', async (req, res) => {
    try {
        // Extraemos explícitamente el token del request original
        const authHeader = req.headers['authorization'];
        
        console.log("Token recibido en Gateway:", authHeader ? "Sí" : "No");

        const response = await axios.get('http://localhost:3001/api/auth/me', {
            headers: {
                // Lo pasamos manualmente al microservicio
                'Authorization': authHeader 
            }
        });
        res.status(response.status).json(response.data);
    } catch (error) {
        if (error.response) {
            // El microservicio respondió (ej: 401, 404, 500)
            res.status(error.response.status).json(error.response.data);
        } else {
            // Error de red o timeout
            console.error("Error Gateway -> Users:", error.message);
            res.status(500).json({ msg: 'Error de conexión con Users Service' });
        }
    }
});

// Búsqueda de hardware con rate limiting
app.get('/api/hardware/search', searchLimiter, async (req, res) => {
    try {
        const url = `http://localhost:3001/api/hardware/search`;
        const response = await axios({
            method: 'get',
            url,
            params: req.query,
            headers: req.headers.authorization ? { 'Authorization': req.headers.authorization } : {}
        });
        res.status(response.status).json(response.data);
    } catch (error) {
        if (error.response) {
            res.status(error.response.status).json(error.response.data);
        } else {
            res.status(500).json({ msg: 'Error de conexión con Users Service' });
        }
    }
});

// --- CATALOG SERVICE ---
app.use('/api/games', async (req, res) => {
    try {
        const url = `http://localhost:3002${req.originalUrl}`;
        const method = req.method.toLowerCase();
        
        // Pasamos Authorization si existe
        const headers = {};
        if (req.headers.authorization) headers['Authorization'] = req.headers.authorization;

        const response = await axios({
            method,
            url,
            data: req.method !== 'GET' ? req.body : undefined,
            params: req.query,
            headers: headers
        });
        res.status(response.status).json(response.data);
    } catch (error) {
        if (error.response) {
            res.status(error.response.status).json(error.response.data);
        } else {
            res.status(500).json({ success: false, msg: 'Error en el gateway de catálogo' });
        }
    }
});

// --- REVIEWS SERVICE ---
app.use('/api/reviews', async (req, res) => {
    try {
        // Redirigir a localhost:3003
        const url = `http://localhost:3003${req.originalUrl}`;
        const method = req.method.toLowerCase();

        const headers = {};
        if (req.headers.authorization) headers['Authorization'] = req.headers.authorization;

        const response = await axios({
            method,
            url,
            data: req.method !== 'GET' ? req.body : undefined,
            params: req.query,
            headers: headers
        });
        res.status(response.status).json(response.data);
    } catch (error) {
        if (error.response) {
            res.status(error.response.status).json(error.response.data);
        } else {
            res.status(500).json({ success: false, msg: 'Error en el gateway de reviews' });
        }
    }
});

// ACTUALIZAR SPECS
app.put('/api/auth/specs', async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        
        const response = await axios.put('http://localhost:3001/api/auth/specs', req.body, {
            headers: {
                'Authorization': authHeader 
            }
        });
        res.status(response.status).json(response.data);
    } catch (error) {
        if (error.response) {
            res.status(error.response.status).json(error.response.data);
        } else {
            res.status(500).json({ msg: 'Error de conexión con Users Service' });
        }
    }
});

// Middleware global de manejo de errores
app.use(errorHandler);

app.listen(PORT, () => {
    console.log(`API Gateway corriendo en puerto ${PORT}`);
});