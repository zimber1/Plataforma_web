const express = require('express');
const router = express.Router();
const axios = require('axios');

let accessToken = null;

// Obtener token de Twitch
const getTwitchToken = async () => {
    const url = `https://id.twitch.tv/oauth2/token?client_id=${process.env.TWITCH_CLIENT_ID}&client_secret=${process.env.TWITCH_CLIENT_SECRET}&grant_type=client_credentials`;
    const response = await axios.post(url);
    accessToken = response.data.access_token;
};

// Middleware para asegurar token
const ensureToken = async (req, res, next) => {
    try {
        if (!accessToken) {
            await getTwitchToken();
        }
        next();
    } catch (err) {
        console.error('Error obteniendo token de Twitch:', err.response ? err.response.data : err);
        res.status(500).json({ success: false, msg: 'Error interno al obtener token de Twitch' });
    }
};

// 1. BUSCADOR (Sugerencias)
router.get('/search', ensureToken, async (req, res, next) => {
    const { q } = req.query;
    const searchTerm = Array.isArray(q) ? q[0] : q;
    if (!searchTerm || searchTerm.length < 2) {
        return res.json({ success: true, data: [] });
    }
    try {
        const response = await axios({
            url: "https://api.igdb.com/v4/games",
            method: 'POST',
            headers: {
                'Client-ID': process.env.TWITCH_CLIENT_ID,
                'Authorization': `Bearer ${accessToken}`,
            },
            data: `search "${searchTerm}"; fields name, cover.url, platforms.name; where platforms = 6 & cover != null; limit 8;`
        });
        res.json({ success: true, data: response.data });
    } catch (err) {
        console.error('IGDB error:', err.response ? err.response.data : err);
        if (err.response && err.response.status >= 400 && err.response.status < 500) {
            res.status(err.response.status).json({ success: false, msg: 'Error en la consulta a IGDB (4xx)', error: err.response.data });
        } else {
            res.status(500).json({ success: false, msg: 'Error interno al buscar juegos' });
        }
    }
});

// 2. RECIÉN SALIDOS
router.get('/latest', ensureToken, async (req, res) => {
    try {
        const now = Math.floor(Date.now() / 1000);
        const response = await axios({
            url: "https://api.igdb.com/v4/games",
            method: 'POST',
            headers: {
                'Client-ID': process.env.TWITCH_CLIENT_ID,
                'Authorization': `Bearer ${accessToken}`,
            },
            data: `fields name, cover.url, total_rating, first_release_date; 
                   where platforms = 6 & first_release_date < ${now} & cover != null; 
                   sort first_release_date desc; limit 12;`
        });
        res.json({ success: true, data: response.data });
    } catch (err) {
        console.error('IGDB error:', err.response ? err.response.data : err);
        if (err.response && err.response.status >= 400 && err.response.status < 500) {
            res.status(err.response.status).json({ success: false, msg: 'Error en la consulta a IGDB (4xx)', error: err.response.data });
        } else {
            res.status(500).json({ success: false, msg: 'Error interno al buscar juegos' });
        }
    }
});

// 3. MEJOR PUNTUADOS
router.get('/top-rated', ensureToken, async (req, res) => {
    try {
        const response = await axios({
            url: "https://api.igdb.com/v4/games",
            method: 'POST',
            headers: {
                'Client-ID': process.env.TWITCH_CLIENT_ID,
                'Authorization': `Bearer ${accessToken}`,
            },
            data: `fields name, cover.url, total_rating; 
                   where platforms = 6 & total_rating > 80 & cover != null; 
                   sort total_rating desc; limit 12;`
        });
        res.json({ success: true, data: response.data });
    } catch (err) {
        console.error('IGDB error:', err.response ? err.response.data : err);
        if (err.response && err.response.status >= 400 && err.response.status < 500) {
            res.status(err.response.status).json({ success: false, msg: 'Error en la consulta a IGDB (4xx)', error: err.response.data });
        } else {
            res.status(500).json({ success: false, msg: 'Error interno al buscar juegos' });
        }
    }
});

// 4. PRÓXIMAMENTE
router.get('/coming-soon', ensureToken, async (req, res) => {
    try {
        const now = Math.floor(Date.now() / 1000);
        const response = await axios({
            url: "https://api.igdb.com/v4/games",
            method: 'POST',
            headers: {
                'Client-ID': process.env.TWITCH_CLIENT_ID,
                'Authorization': `Bearer ${accessToken}`,
            },
            data: `fields name, cover.url, first_release_date; 
                   where platforms = 6 & first_release_date > ${now} & cover != null; 
                   sort first_release_date asc; limit 12;`
        });
        res.json({ success: true, data: response.data });
    } catch (err) {
        console.error('IGDB error:', err.response ? err.response.data : err);
        if (err.response && err.response.status >= 400 && err.response.status < 500) {
            res.status(err.response.status).json({ success: false, msg: 'Error en la consulta a IGDB (4xx)', error: err.response.data });
        } else {
            res.status(500).json({ success: false, msg: 'Error interno al buscar juegos' });
        }
    }
});

module.exports = router;