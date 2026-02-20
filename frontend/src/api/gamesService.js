/**
 * Games Service - Catálogo de videojuegos
 * 
 * Endpoints del backend (a través del API Gateway):
 *   GET  /api/games/search?q=...   → Buscar juegos (min 2 chars)
 *   GET  /api/games/latest         → Juegos recién salidos
 *   GET  /api/games/top-rated      → Juegos mejor puntuados
 *   GET  /api/games/coming-soon    → Juegos próximamente
 *   GET  /api/games/:id            → Detalle del juego (incluye requisitos Steam)
 *   POST /api/games/:id/analyze    → Analizar compatibilidad con IA  
 */

import { apiClient } from './apiClient';

/**
 * Buscar juegos por nombre (sugerencias de autocompletado).
 * El backend requiere al menos 2 caracteres.
 * 
 * @param {string} query - Término de búsqueda
 * @returns {Promise<{ success, data: Array }>}
 */
export async function searchGames(query) {
    if (!query || query.length < 2) {
        return { success: true, data: [] };
    }

    return apiClient('/api/games/search', {
        params: { q: query },
    });
}

/**
 * Obtener juegos recién lanzados.
 * 
 * @returns {Promise<{ success, data: Array }>}
 */
export async function getLatestGames() {
    return apiClient('/api/games/latest');
}

/**
 * Obtener juegos mejor puntuados.
 * 
 * @returns {Promise<{ success, data: Array }>}
 */
export async function getTopRatedGames() {
    return apiClient('/api/games/top-rated');
}

/**
 * Obtener juegos próximamente.
 * 
 * @returns {Promise<{ success, data: Array }>}
 */
export async function getComingSoonGames() {
    return apiClient('/api/games/coming-soon');
}

/**
 * Obtener detalle completo de un juego por su ID de IGDB.
 * Incluye: info general, screenshots, requisitos Steam, estado de compatibilidad.
 * 
 * @param {number|string} gameId - ID del juego (IGDB)
 * @returns {Promise<{ success, data: object }>}
 */
export async function getGameDetails(gameId) {
    return apiClient(`/api/games/${gameId}`);
}

/**
 * Solicitar análisis de compatibilidad con IA.
 * Requiere estar autenticado y tener un perfil de PC configurado.
 * 
 * @param {number|string} gameId - ID del juego (IGDB)
 * @returns {Promise<{ success, analysis, cached }>}
 */
export async function analyzeCompatibility(gameId) {
    return apiClient(`/api/games/${gameId}/analyze`, {
        method: 'POST',
    });
}

/**
 * Transformar URL de cover de IGDB para obtener tamaño adecuado.
 * IGDB devuelve URLs con //images.igdb.com/... y tamaño t_thumb
 * Los reemplazamos para obtener una imagen más grande.
 * 
 * @param {string} coverUrl - URL original del cover
 * @param {string} size     - Tamaño: 'cover_big', 'cover_small', '720p', '1080p'
 * @returns {string}
 */
export function getIgdbImageUrl(coverUrl, size = 'cover_big') {
    if (!coverUrl) return '';
    // Asegurar protocolo https
    let url = coverUrl.startsWith('//') ? `https:${coverUrl}` : coverUrl;
    // Reemplazar tamaño del thumbnail
    url = url.replace(/t_thumb/, `t_${size}`);
    return url;
}

/**
 * Transformar URL de screenshot de IGDB.
 * 
 * @param {string} screenshotUrl
 * @param {string} size - 'screenshot_big', 'screenshot_med', '720p', '1080p'
 * @returns {string}
 */
export function getIgdbScreenshotUrl(screenshotUrl, size = 'screenshot_big') {
    if (!screenshotUrl) return '';
    let url = screenshotUrl.startsWith('//') ? `https:${screenshotUrl}` : screenshotUrl;
    url = url.replace(/t_thumb/, `t_${size}`);
    return url;
}
