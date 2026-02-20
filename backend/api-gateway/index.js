const express = require('express');
const cors = require('cors');
const axios = require('axios');
const rateLimit = require('express-rate-limit');
const errorHandler = require('../shared/errors/errorHandler');

const app = express();
const PORT = process.env.PORT || 3000;

// Structured logger (pino). If not installed, fall back to console.
let logger;
try {
    const pino = require('pino');
    logger = pino({ level: process.env.LOG_LEVEL || 'info', prettyPrint: process.env.NODE_ENV === 'development' });
} catch (e) {
    logger = console;
}

// Service URLs should come from environment in production
const USERS_SERVICE_URL = process.env.USERS_SERVICE_URL || 'http://localhost:3001';
const CATALOG_SERVICE_URL = process.env.CATALOG_SERVICE_URL || 'http://localhost:3002';
const REVIEWS_SERVICE_URL = process.env.REVIEWS_SERVICE_URL || 'http://localhost:3003';

app.use(cors());
app.use(express.json());

// Optional dev testing middleware: simulate latency and failures via env
const SIM_LATENCY = parseInt(process.env.SIMULATE_LATENCY_MS || '0', 10);
const SIM_FAIL_RATE = parseInt(process.env.SIMULATE_FAIL_RATE || '0', 10); // 0-100
if (SIM_LATENCY > 0 || SIM_FAIL_RATE > 0) {
    app.use(async (req, res, next) => {
        if (SIM_LATENCY > 0) {
            await new Promise(r => setTimeout(r, SIM_LATENCY));
        }
        if (SIM_FAIL_RATE > 0) {
            const r = Math.random() * 100;
            if (r < SIM_FAIL_RATE) {
                logger && logger.warn ? logger.warn({ path: req.path, r }, 'Simulated failure') : console.warn('Simulated failure', req.path);
                return res.status(503).json({ success: false, msg: 'Simulated service unavailable (for testing)' });
            }
        }
        next();
    });
}

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
        const response = await axios.post(`${USERS_SERVICE_URL}/api/auth/register`, req.body);
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
        const response = await axios.post(`${USERS_SERVICE_URL}/api/auth/login`, req.body);
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
        
        logger.info({ hasAuth: !!authHeader }, 'Token recibido en Gateway');

        const response = await axios.get(`${USERS_SERVICE_URL}/api/auth/me`, {
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
            logger.error({ err: error.message }, 'Error Gateway -> Users');
            res.status(500).json({ msg: 'Error de conexión con Users Service' });
        }
    }
});

// Búsqueda de hardware con rate limiting
app.get('/api/hardware/search', searchLimiter, async (req, res) => {
    try {
        const url = `${USERS_SERVICE_URL}/api/hardware/search`;
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
        const url = `${CATALOG_SERVICE_URL}${req.originalUrl}`;
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
        const url = `${REVIEWS_SERVICE_URL}${req.originalUrl}`;
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

// Middleware global de manejo de errores
app.use(errorHandler);

// Minimal health endpoint — returns gateway status and optional service checks
app.get('/health', async (req, res) => {
    const status = { status: 'ok', timestamp: new Date().toISOString(), services: {} };
    const checkService = async (name, url) => {
        try {
            const resp = await axios.get(`${url}/health`, { timeout: 1500 });
            status.services[name] = { up: resp.status >= 200 && resp.status < 300 };
        } catch (e) {
            status.services[name] = { up: false, error: e.message };
        }
    };

    // attempt checks but don't fail gateway if services missing
    await Promise.all([
        checkService('users', USERS_SERVICE_URL).catch(() => {}),
        checkService('catalog', CATALOG_SERVICE_URL).catch(() => {}),
        checkService('reviews', REVIEWS_SERVICE_URL).catch(() => {}),
    ]);

    res.json(status);
});

app.listen(PORT, () => {
    logger.info({ port: PORT }, 'API Gateway corriendo');
});