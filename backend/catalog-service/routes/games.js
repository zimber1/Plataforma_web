const express = require('express');
const router = express.Router();
const axios = require('axios');
const OpenAI = require('openai');
const rateLimit = require('express-rate-limit');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

let accessToken = null;

// Inicializar OpenAI
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

// Modelo de Usuario (mismo esquema que users-service)
const UserSchema = new mongoose.Schema({
    username: String,
    email: String,
    password: String,
    pcSpecs: {
        cpu: { type: String, default: null },
        gpu: { type: String, default: null },
        ram: { type: String, default: null },
        os: { type: String, default: null }
    },
    role: String,
    createdAt: Date
});
const User = mongoose.model('User', UserSchema);

// Modelo de Caché de Análisis (expira en 30 días)
const AnalysisCacheSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    gameId: { type: Number, required: true },
    gameName: String,
    userSpecs: Object,
    analysis: Object,
    createdAt: { type: Date, default: Date.now, expires: 2592000 } // 30 días
});
AnalysisCacheSchema.index({ userId: 1, gameId: 1 }, { unique: true });
const AnalysisCache = mongoose.model('AnalysisCache', AnalysisCacheSchema);

// Rate limiting SUPER estricto para consultas de IA (proteger tu dinero)
const aiLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hora
    max: 20, // máximo 20 consultas de IA por hora por IP
    message: 'Demasiadas consultas de análisis, intenta más tarde.'
});

// Middleware opcional para extraer userId del JWT (sin bloquear si no hay token)
const extractUserIfAuthenticated = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.substring(7);
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.userId = decoded.id;
        }
    } catch (error) {
        console.log('Token inválido o no proporcionado');
    }
    next();
};

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

// Función ULTRA OPTIMIZADA para analizar compatibilidad (SUPER BARATA)
async function analyzeGameCompatibility(userSpecs, requirements) {
    try {
        // Acortar requisitos a 400 caracteres para ahorrar tokens
        const shortReq = requirements.substring(0, 400);
        
        const prompt = `PC: CPU ${userSpecs.cpu}, GPU ${userSpecs.gpu}, RAM ${userSpecs.ram}
Requisitos: ${shortReq}
JSON: {"canRun":bool,"performance":"bajo/medio/alto/ultra","bottleneck":"CPU/GPU/RAM/ninguno","recommendation":"texto breve"}`;

        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini", // Modelo más barato
            response_format: { type: "json_object" }, // JSON directo, sin markdown
            messages: [
                { role: "system", content: "Experto hardware PC. Solo JSON." },
                { role: "user", content: prompt }
            ],
            temperature: 0.2, // Baja para consistencia
            max_tokens: 100, // Reducido a 100 tokens
        });

        return JSON.parse(completion.choices[0].message.content);
    } catch (error) {
        console.error('Error con OpenAI:', error);
        throw error;
    }
}

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
// 3. MEJOR PUNTUADOS
router.get('/top-rated', ensureToken, async (req, res) => {
    try {
        // 1. Obtenemos los 12 juegos con más jugadores en Steam (PopScore ID 5)
        // Esto nos da los IDs de los juegos que REALMENTE se están jugando.
        const popResponse = await axios({
            url: "https://api.igdb.com/v4/popularity_primitives",
            method: 'POST',
            headers: {
                'Client-ID': process.env.TWITCH_CLIENT_ID,
                'Authorization': `Bearer ${accessToken}`,
            },
            data: `fields game_id, value; where popularity_type = 5; sort value desc; limit 12;`
        });

        const gameIds = popResponse.data.map(p => p.game_id);

        if (gameIds.length === 0) {
            return res.json({ success: true, data: [] });
        }

        // 2. Traemos los detalles de esos IDs. 
        const gamesDetails = await axios({
            url: "https://api.igdb.com/v4/games",
            method: 'POST',
            headers: {
                'Client-ID': process.env.TWITCH_CLIENT_ID,
                'Authorization': `Bearer ${accessToken}`,
            },
            data: `fields name, cover.url, total_rating, summary, first_release_date; 
                   where id = (${gameIds.join(',')});`
        });

        // Formateamos las imágenes a 720p (el tamaño "sweet spot" según tu doc)
        const games = gamesDetails.data.map(game => ({
            id: game.id,
            name: game.name,
            rating: game.total_rating ? Math.round(game.total_rating) : 'N/A',
            cover: game.cover ? game.cover.url.replace('t_thumb', 't_720p') : null,
            summary: game.summary,
            year: game.first_release_date ? new Date(game.first_release_date * 1000).getFullYear() : 'N/A'
        }));

        res.json({ success: true, data: games });

    } catch (err) {
        console.error('Error detallado:', err.response?.data || err.message);
        res.status(500).json({ success: false, msg: 'Error al conectar con IGDB PopScore' });
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

// 5. DETALLE DEL JUEGO (Con requisitos de Steam, SIN análisis automático de IA)
router.get('/:id', ensureToken, extractUserIfAuthenticated, async (req, res) => {
    const { id } = req.params;
    
    if (!id) {
        return res.status(400).json({ success: false, msg: 'Se requiere un ID de juego' });
    }

    try {
        // 1. Obtener detalles del juego desde IGDB
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
        let compatibilityStatus = null;

        // 2. Buscar ID de Steam en external_games
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

                    // 3. SOLO verificar si existe caché (NO ejecutar IA)
                    if (req.userId && steamRequirements.pc_requirements?.minimum) {
                        const cached = await AnalysisCache.findOne({ 
                            userId: req.userId, 
                            gameId: parseInt(id)
                        });

                        if (cached) {
                            // Verificar si las specs cambiaron desde el análisis
                            const user = await User.findById(req.userId).select('pcSpecs');
                            const specsChanged = user && (
                                cached.userSpecs?.cpu !== user.pcSpecs?.cpu ||
                                cached.userSpecs?.gpu !== user.pcSpecs?.gpu ||
                                cached.userSpecs?.ram !== user.pcSpecs?.ram
                            );

                            compatibilityStatus = {
                                hasCache: true,
                                specsChanged: specsChanged,
                                analysis: specsChanged ? null : cached.analysis,
                                message: specsChanged 
                                    ? 'Tus specs cambiaron. Haz clic para analizar con tu nuevo hardware.'
                                    : null
                            };
                        } else {
                            // No hay caché, usuario puede solicitar análisis
                            compatibilityStatus = {
                                hasCache: false,
                                canAnalyze: true,
                                message: 'Haz clic para ver si tu PC puede correr este juego'
                            };
                        }
                    }
                }
            } catch (steamErr) {
                console.warn(`Error obteniendo datos de Steam para appid ${steamExternal.uid}:`, steamErr.message);
            }
        }

        // 4. Combinar y responder (SIN ejecutar IA automáticamente)
        const result = {
            ...gameData,
            requirements: steamRequirements,
            compatibility: compatibilityStatus
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

// 6. ANALIZAR COMPATIBILIDAD (NUEVO - Solo cuando el usuario hace clic)
router.post('/:id/analyze', ensureToken, extractUserIfAuthenticated, aiLimiter, async (req, res) => {
    const { id } = req.params;
    
    if (!req.userId) {
        return res.status(401).json({ 
            success: false, 
            msg: 'Debes iniciar sesión para analizar compatibilidad' 
        });
    }

    try {
        // Obtener usuario
        const user = await User.findById(req.userId).select('pcSpecs');
        
        if (!user || !user.pcSpecs || (!user.pcSpecs.cpu && !user.pcSpecs.gpu)) {
            return res.status(400).json({ 
                success: false, 
                msg: 'Completa tu perfil de PC antes de analizar' 
            });
        }

        // Obtener info del juego de IGDB
        const igdbResponse = await axios({
            url: "https://api.igdb.com/v4/games",
            method: 'POST',
            headers: {
                'Client-ID': process.env.TWITCH_CLIENT_ID,
                'Authorization': `Bearer ${accessToken}`,
            },
            data: `fields name, external_games.category, external_games.uid, external_games.url; where id = ${id};`
        });

        if (!igdbResponse.data || igdbResponse.data.length === 0) {
            return res.status(404).json({ success: false, msg: 'Juego no encontrado' });
        }

        const gameData = igdbResponse.data[0];
        
        // Buscar Steam ID
        const steamExternal = gameData.external_games 
            ? gameData.external_games.find(ext => 
                ext.category === 1 || 
                (ext.url && ext.url.includes('store.steampowered.com'))
            ) 
            : null;

        if (!steamExternal || !steamExternal.uid) {
            return res.status(404).json({ 
                success: false, 
                msg: 'Este juego no tiene requisitos en Steam' 
            });
        }

        // Obtener requisitos de Steam
        const steamResponse = await axios.get(`https://store.steampowered.com/api/appdetails?appids=${steamExternal.uid}`);
        const appId = steamExternal.uid.toString();
        const steamData = steamResponse.data[appId];

        if (!steamData?.success || !steamData.data?.pc_requirements?.minimum) {
            return res.status(404).json({ 
                success: false, 
                msg: 'No hay requisitos disponibles para este juego' 
            });
        }

        // Verificar caché válido (con specs actuales)
        const cached = await AnalysisCache.findOne({ 
            userId: req.userId, 
            gameId: parseInt(id)
        });

        const specsChanged = cached && (
            cached.userSpecs?.cpu !== user.pcSpecs.cpu ||
            cached.userSpecs?.gpu !== user.pcSpecs.gpu ||
            cached.userSpecs?.ram !== user.pcSpecs.ram
        );

        let analysis;

        if (cached && !specsChanged) {
            console.log('💰 CACHÉ HIT - $0.00 - Usuario:', req.userId, 'Juego:', gameData.name);
            analysis = cached.analysis;
        } else {
            // Ejecutar análisis de IA
            console.log('🤖 LLAMANDO IA - ~$0.00001 - Usuario:', req.userId, 'Juego:', gameData.name);
            
            if (specsChanged) {
                // Eliminar caché antiguo
                await AnalysisCache.deleteOne({ userId: req.userId, gameId: parseInt(id) });
            }

            analysis = await analyzeGameCompatibility(
                user.pcSpecs,
                steamData.data.pc_requirements.minimum
            );

            // Guardar en caché
            try {
                await AnalysisCache.create({
                    userId: req.userId,
                    gameId: parseInt(id),
                    gameName: gameData.name,
                    userSpecs: user.pcSpecs,
                    analysis: analysis
                });
                console.log('✅ Análisis guardado en caché para', gameData.name);
            } catch (cacheError) {
                if (cacheError.code !== 11000) {
                    console.error('Error guardando caché:', cacheError);
                }
            }
        }

        res.json({ 
            success: true, 
            analysis,
            cached: cached && !specsChanged
        });

    } catch (error) {
        console.error('Error en análisis:', error);
        res.status(500).json({ 
            success: false, 
            msg: 'Error al analizar compatibilidad' 
        });
    }
});

module.exports = router;