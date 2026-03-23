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

// Safe logging functions
const logInfo = (msg, obj = {}) => {
    if (logger && typeof logger.info === 'function') {
        logger.info(obj, msg);
    } else {
        console.log(msg, obj);
    }
};

const logError = (msg, obj = {}) => {
    if (logger && typeof logger.error === 'function') {
        logger.error(obj, msg);
    } else {
        console.error(msg, obj);
    }
};

const logWarn = (msg, obj = {}) => {
    if (logger && typeof logger.warn === 'function') {
        logger.warn(obj, msg);
    } else {
        console.warn(msg, obj);
    }
};

// Service URLs should come from environment in production
const USERS_SERVICE_URL = process.env.USERS_SERVICE_URL || 'http://localhost:3002';
const CATALOG_SERVICE_URL = process.env.CATALOG_SERVICE_URL || 'http://localhost:3001';
const REVIEWS_SERVICE_URL = process.env.REVIEWS_SERVICE_URL || 'http://localhost:3003';

const REQUEST_TIMEOUT = parseInt(process.env.REQUEST_TIMEOUT || '5000', 10);

app.use(cors());
app.use(express.json());

// Optional dev testing middleware: simulate latency and failures via env
const SIM_LATENCY = parseInt(process.env.SIMULATE_LATENCY_MS || '0', 10);
const SIM_FAIL_RATE = parseInt(process.env.SIMULATE_FAIL_RATE || '0', 10);
if (SIM_LATENCY > 0 || SIM_FAIL_RATE > 0) {
    app.use(async (req, res, next) => {
        if (SIM_LATENCY > 0) {
            await new Promise(r => setTimeout(r, SIM_LATENCY));
        }
        if (SIM_FAIL_RATE > 0) {
            const r = Math.random() * 100;
            if (r < SIM_FAIL_RATE) {
                logWarn('Simulated failure', { path: req.path, r });
                return res.status(503).json({ success: false, msg: 'Simulated service unavailable (for testing)' });
            }
        }
        next();
    });
}

// Rate limiting general
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  message: 'Demasiadas solicitudes desde esta IP, intenta más tarde.'
});

// Rate limiting para autenticación
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: 'Demasiados intentos de autenticación, intenta más tarde.'
});

// Rate limiting para búsquedas
const searchLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  message: 'Demasiadas búsquedas, intenta más tarde.'
});

app.use(generalLimiter);

// --- USERS SERVICE ---

// 1. REGISTRO
app.post('/api/auth/register', authLimiter, async (req, res) => {
    try {
        const response = await axios.post(`${USERS_SERVICE_URL}/api/auth/register`, req.body, { timeout: REQUEST_TIMEOUT });
        res.status(response.status).json(response.data);
    } catch (error) {
        if (error.response) {
            res.status(error.response.status).json(error.response.data);
        } else {
            logError('Error en /api/auth/register', { message: error.message });
            res.status(500).json({ msg: 'Error de conexión con Users Service' });
        }
    }
});

// 2. LOGIN
app.post('/api/auth/login', authLimiter, async (req, res) => {
    try {
        const response = await axios.post(`${USERS_SERVICE_URL}/api/auth/login`, req.body, { timeout: REQUEST_TIMEOUT });
        res.status(response.status).json(response.data);
    } catch (error) {
        if (error.response) {
            res.status(error.response.status).json(error.response.data);
        } else {
            logError('Error en /api/auth/login', { message: error.message });
            res.status(500).json({ msg: 'Error de conexión con Users Service' });
        }
    }
});

// 3. PERFIL (/me)
app.get('/api/auth/me', async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        logInfo('Token recibido en Gateway', { hasAuth: !!authHeader });

        const response = await axios.get(`${USERS_SERVICE_URL}/api/auth/me`, {
            headers: {
                'Authorization': authHeader 
            },
            timeout: REQUEST_TIMEOUT
        });
        res.status(response.status).json(response.data);
    } catch (error) {
        if (error.response) {
            res.status(error.response.status).json(error.response.data);
        } else {
            logError('Error Gateway -> Users en /api/auth/me', { err: error.message });
            res.status(500).json({ msg: 'Error de conexión con Users Service' });
        }
    }
});

// Búsqueda de hardware - CORREGIDO: Ahora apunta a CATALOG_SERVICE_URL
app.get('/api/hardware/search', searchLimiter, async (req, res) => {
    try {
        const url = `${CATALOG_SERVICE_URL}/api/hardware/search`;
        const response = await axios({
            method: 'get',
            url,
            params: req.query,
            headers: req.headers.authorization ? { 'Authorization': req.headers.authorization } : {},
            timeout: REQUEST_TIMEOUT
        });
        res.status(response.status).json(response.data);
    } catch (error) {
        if (error.response) {
            res.status(error.response.status).json(error.response.data);
        } else {
            logError('Error en /api/hardware/search', { message: error.message });
            res.status(500).json({ msg: 'Error de conexión con Catalog Service' });
        }
    }
});

// --- CATALOG SERVICE ---
app.use('/api/games', async (req, res) => {
    try {
        const url = `${CATALOG_SERVICE_URL}${req.originalUrl}`;
        const method = req.method.toLowerCase();
        
        const headers = {};
        if (req.headers.authorization) headers['Authorization'] = req.headers.authorization;

        const response = await axios({
            method,
            url,
            data: req.method !== 'GET' ? req.body : undefined,
            params: req.query,
            headers: headers,
            timeout: REQUEST_TIMEOUT
        });
        res.status(response.status).json(response.data);
    } catch (error) {
        if (error.response) {
            res.status(error.response.status).json(error.response.data);
        } else {
            logError('Error en /api/games', { message: error.message });
            res.status(500).json({ success: false, msg: 'Error en el gateway de catálogo' });
        }
    }
});

// --- REVIEWS SERVICE ---
app.use('/api/reviews', async (req, res) => {
    try {
        const url = `${REVIEWS_SERVICE_URL}${req.originalUrl}`;
        const method = req.method.toLowerCase();

        const headers = {};
        if (req.headers.authorization) headers['Authorization'] = req.headers.authorization;

        const response = await axios({
            method,
            url,
            data: req.method !== 'GET' ? req.body : undefined,
            params: req.query,
            headers: headers,
            timeout: REQUEST_TIMEOUT
        });
        res.status(response.status).json(response.data);
    } catch (error) {
        if (error.response) {
            res.status(error.response.status).json(error.response.data);
        } else {
            logError('Error en /api/reviews', { message: error.message });
            res.status(500).json({ success: false, msg: 'Error en el gateway de reviews' });
        }
    }
});

// ACTUALIZAR SPECS
app.put('/api/auth/specs', async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        
        const response = await axios.put(`${USERS_SERVICE_URL}/api/auth/specs`, req.body, {
            headers: {
                'Authorization': authHeader 
            },
            timeout: REQUEST_TIMEOUT
        });
        res.status(response.status).json(response.data);
    } catch (error) {
        if (error.response) {
            res.status(error.response.status).json(error.response.data);
        } else {
            logError('Error en /api/auth/specs', { message: error.message });
            res.status(500).json({ msg: 'Error de conexión con Users Service' });
        }
    }
});

// LOGOUT ACTUAL
app.post('/api/auth/logout', async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        const response = await axios.post(`${USERS_SERVICE_URL}/api/auth/logout`, {}, {
            headers: { 'Authorization': authHeader },
            timeout: REQUEST_TIMEOUT
        });
        res.status(response.status).json(response.data);
    } catch (error) {
        if (error.response) {
            res.status(error.response.status).json(error.response.data);
        } else {
            logError('Error en /api/auth/logout', { message: error.message });
            res.status(500).json({ msg: 'Error de conexión con Users Service' });
        }
    }
});

// LOGOUT TODOS
app.post('/api/auth/logout-all', async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        const response = await axios.post(`${USERS_SERVICE_URL}/api/auth/logout-all`, {}, {
            headers: { 'Authorization': authHeader },
            timeout: REQUEST_TIMEOUT
        });
        res.status(response.status).json(response.data);
    } catch (error) {
        if (error.response) {
            res.status(error.response.status).json(error.response.data);
        } else {
            logError('Error en /api/auth/logout-all', { message: error.message });
            res.status(500).json({ msg: 'Error de conexión con Users Service' });
        }
    }
});

// CAMBIAR CONTRASEÑA
app.put('/api/auth/change-password', async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        const response = await axios.put(`${USERS_SERVICE_URL}/api/auth/change-password`, req.body, {
            headers: { 'Authorization': authHeader },
            timeout: REQUEST_TIMEOUT
        });
        res.status(response.status).json(response.data);
    } catch (error) {
        if (error.response) {
            res.status(error.response.status).json(error.response.data);
        } else {
            logError('Error en /api/auth/change-password', { message: error.message });
            res.status(500).json({ msg: 'Error de conexión con Users Service' });
        }
    }
});

// Middleware global de manejo de errores
app.use(errorHandler);

// Health endpoint
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

    await Promise.all([
        checkService('users', USERS_SERVICE_URL).catch(() => {}),
        checkService('catalog', CATALOG_SERVICE_URL).catch(() => {}),
        checkService('reviews', REVIEWS_SERVICE_URL).catch(() => {}),
    ]);

    res.json(status);
});

app.listen(PORT, () => {
    logInfo('API Gateway corriendo', { port: PORT });
});
