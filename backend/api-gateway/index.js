const express = require('express');
const cors = require('cors');
const axios = require('axios');
const errorHandler = require('../shared/errors/errorHandler');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// --- USERS SERVICE ---

// Helper para headers
const getAuthHeaders = (req) => {
    const headers = {};
    if (req.headers.authorization) {
        headers['Authorization'] = req.headers.authorization;
    }
    return headers;
};

// 1. REGISTRO
app.post('/api/auth/register', async (req, res) => {
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
app.post('/api/auth/login', async (req, res) => {
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

app.get('/', (req, res) => {
    res.send('API Gateway funcionando');
});

app.use(errorHandler);

app.listen(PORT, () => {
    console.log(`API Gateway corriendo en puerto ${PORT}`);
});