/**
 * Reviews Service - Gestión de reseñas de juegos
 * 
 * Endpoints del backend (a través del API Gateway):
 *   GET    /api/reviews/:gameId         → Obtener reseñas de un juego (paginadas)
 *   POST   /api/reviews                 → Crear o actualizar reseña (requiere auth)
 *   DELETE /api/reviews/:reviewId       → Eliminar reseña (requiere auth, solo dueño/admin)
 */

import { apiClient } from './apiClient';

/**
 * Obtener reseñas de un juego con estadísticas y paginación.
 * 
 * @param {number|string} gameId  - ID del juego (IGDB)
 * @param {object}        options
 * @param {number}        options.page  - Número de página (default: 1)
 * @param {number}        options.limit - Reseñas por página (default: 10)
 * 
 * @returns {Promise<{ success, data: { stats, reviews, pagination } }>}
 *   stats: { artistic: { average, count }, technical: { average, count } }
 *   reviews: Array<{ _id, username, type, rating, comment, createdAt, userId }>
 *   pagination: { page, limit, hasMore }
 */
export async function getGameReviews(gameId, { page = 1, limit = 10 } = {}) {
    return apiClient(`/api/reviews/${gameId}`, {
        params: { page, limit },
    });
}

/**
 * Crear o actualizar (upsert) una reseña.
 * Si ya existe una reseña del mismo usuario para el mismo juego y tipo, se actualiza.
 * Requiere estar autenticado.
 * 
 * @param {object} reviewData
 * @param {number} reviewData.gameId   - ID del juego
 * @param {string} reviewData.type     - 'artistic' | 'technical'
 * @param {number} reviewData.rating   - 1 a 5
 * @param {string} reviewData.comment  - Texto de la reseña (max 1000 chars)
 * 
 * @returns {Promise<{ success, data: Review, msg }>}
 */
export async function upsertReview(reviewData) {
    return apiClient('/api/reviews', {
        method: 'POST',
        body: reviewData,
    });
}

/**
 * Eliminar una reseña por su _id.
 * Requiere estar autenticado. Solo el dueño o un admin pueden eliminar.
 * 
 * @param {string} reviewId - MongoDB _id de la reseña
 * 
 * @returns {Promise<{ success, msg }>}
 */
export async function deleteReview(reviewId) {
    return apiClient(`/api/reviews/${reviewId}`, {
        method: 'DELETE',
    });
}
