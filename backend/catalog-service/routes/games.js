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

// 5. DETALLE DEL JUEGO (Con requisitos de Steam)
router.get('/:id', ensureToken, async (req, res) => {
    const { id } = req.params;
    
    // Validación simple
    if (!id) {
        return res.status(400).json({ success: false, msg: 'Se requiere un ID de juego' });
    }

    try {
        // 1. Obtener detalles del juego desde IGDB
        // Agregamos external_games.url como fallback por si category falla
        const fields = [
            'name',
            'summary',
            'cover.url',
            'screenshots.url',
            'platforms.name',
            'genres.name',
            'first_release_date',
            'total_rating',
            'involved_companies.company.name',
            'external_games.category',
            'external_games.uid',
            'external_games.url' 
        ].join(',');

        const igdbResponse = await axios({
            url: "https://api.igdb.com/v4/games",
            method: 'POST',
            headers: {
                'Client-ID': process.env.TWITCH_CLIENT_ID,
                'Authorization': `Bearer ${accessToken}`,
            },
            data: `fields ${fields}; where id = ${id};`
        });

        if (!igdbResponse.data || igdbResponse.data.length === 0) {
            return res.status(404).json({ success: false, msg: 'Juego no encontrado en IGDB' });
        }

        const gameData = igdbResponse.data[0];
        let steamRequirements = null;

        // 2. Buscar ID de Steam en external_games
        // La categoría 1 en IGDB corresponde a Steam
        // Añadimos fallback comprobando la URL si la categoría no funciona o no viene
        const steamExternal = gameData.external_games 
            ? gameData.external_games.find(ext => 
                ext.category === 1 || 
                (ext.url && ext.url.includes('store.steampowered.com'))
            ) 
            : null;

        if (steamExternal && steamExternal.uid) {
            try {
                // Consultar API de Steam
                const steamResponse = await axios.get(`https://store.steampowered.com/api/appdetails?appids=${steamExternal.uid}`);
                const appId = steamExternal.uid.toString();
                const steamData = steamResponse.data[appId];

                if (steamData && steamData.success && steamData.data) {
                    steamRequirements = {
                        pc_requirements: steamData.data.pc_requirements,
                        mac_requirements: steamData.data.mac_requirements,
                        linux_requirements: steamData.data.linux_requirements,
                        check_steam_store: `https://store.steampowered.com/app/${appId}/`
                    };
                }
            } catch (steamErr) {
                console.warn(`Error obteniendo datos de Steam para appid ${steamExternal.uid}:`, steamErr.message);
            }
        }

        // 3. Combinar y responder
        const result = {
            ...gameData,
            requirements: steamRequirements
        };

        res.json({ success: true, data: result });

    } catch (err) {
        console.error('Error detallado:', err.response ? err.response.data : err);
        if (err.response && err.response.status >= 400 && err.response.status < 500) {
             res.status(err.response.status).json({ success: false, msg: 'Error de comunicación con IGDB', error: err.response.data });
        } else {
            res.status(500).json({ success: false, msg: 'Error interno al obtener los detalles del juego' });
        }
    }
});

module.exports = router;