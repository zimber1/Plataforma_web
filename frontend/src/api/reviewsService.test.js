/* eslint-disable no-undef */
/**
 * Tests para reviewsService.js
 * 
 * Verifica:
 *   - getGameReviews con paginación
 *   - upsertReview crea/actualiza reseñas
 *   - deleteReview elimina reseñas
 *   - Manejo de errores (auth, validación)
 */

const mockApiClient = jest.fn();
jest.mock('./apiClient', () => ({
    apiClient: (...args) => mockApiClient(...args),
}));

const {
    getGameReviews,
    upsertReview,
    deleteReview,
} = require('./reviewsService');

describe('reviewsService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    // ─── getGameReviews ─────────────────────────
    describe('getGameReviews', () => {
        test('obtiene reseñas de un juego con paginación por defecto', async () => {
            const mockData = {
                success: true,
                data: {
                    stats: {
                        artistic: { average: 4.2, count: 10 },
                        technical: { average: 3.8, count: 5 },
                    },
                    reviews: [
                        { _id: 'r1', username: 'User1', type: 'artistic', rating: 5, comment: 'Genial' },
                    ],
                    pagination: { page: 1, limit: 10, hasMore: false },
                },
            };
            mockApiClient.mockResolvedValueOnce(mockData);

            const result = await getGameReviews(1020);

            expect(mockApiClient).toHaveBeenCalledWith('/api/reviews/1020', {
                params: { page: 1, limit: 10 },
            });
            expect(result.data.stats.artistic.average).toBe(4.2);
            expect(result.data.reviews).toHaveLength(1);
        });

        test('permite paginación personalizada', async () => {
            mockApiClient.mockResolvedValueOnce({
                success: true,
                data: { stats: {}, reviews: [], pagination: { page: 3, limit: 5, hasMore: true } },
            });

            await getGameReviews(42, { page: 3, limit: 5 });

            expect(mockApiClient).toHaveBeenCalledWith('/api/reviews/42', {
                params: { page: 3, limit: 5 },
            });
        });

        test('funciona con gameId como string', async () => {
            mockApiClient.mockResolvedValueOnce({ success: true, data: { stats: {}, reviews: [], pagination: {} } });

            await getGameReviews('99');

            expect(mockApiClient).toHaveBeenCalledWith('/api/reviews/99', {
                params: { page: 1, limit: 10 },
            });
        });
    });

    // ─── upsertReview ───────────────────────────
    describe('upsertReview', () => {
        test('crea una reseña artística', async () => {
            const reviewData = {
                gameId: 1020,
                type: 'artistic',
                rating: 5,
                comment: 'Una obra maestra visual',
            };
            mockApiClient.mockResolvedValueOnce({
                success: true,
                data: { _id: 'new-review-id', ...reviewData, username: 'user1' },
                msg: 'Reseña guardada correctamente',
            });

            const result = await upsertReview(reviewData);

            expect(mockApiClient).toHaveBeenCalledWith('/api/reviews', {
                method: 'POST',
                body: reviewData,
            });
            expect(result.success).toBe(true);
            expect(result.data.rating).toBe(5);
        });

        test('crea una reseña técnica', async () => {
            const reviewData = {
                gameId: 55,
                type: 'technical',
                rating: 3,
                comment: 'Rendimiento mejorable',
            };
            mockApiClient.mockResolvedValueOnce({
                success: true,
                data: reviewData,
                msg: 'Reseña guardada correctamente',
            });

            const result = await upsertReview(reviewData);

            expect(result.data.type).toBe('technical');
        });

        test('maneja error de token inválido', async () => {
            const err = new Error('Token antiguo, haz login de nuevo.');
            err.status = 401;
            mockApiClient.mockRejectedValueOnce(err);

            await expect(upsertReview({
                gameId: 1, type: 'artistic', rating: 5,
            })).rejects.toThrow('Token antiguo');
        });

        test('maneja error de puntuación inválida', async () => {
            const err = new Error('La puntuación debe ser entre 1 y 5');
            err.status = 400;
            mockApiClient.mockRejectedValueOnce(err);

            await expect(upsertReview({
                gameId: 1, type: 'artistic', rating: 10,
            })).rejects.toThrow('La puntuación debe ser entre 1 y 5');
        });
    });

    // ─── deleteReview ───────────────────────────
    describe('deleteReview', () => {
        test('elimina una reseña por su ID', async () => {
            mockApiClient.mockResolvedValueOnce({
                success: true,
                msg: 'Reseña eliminada correctamente',
            });

            const result = await deleteReview('65b2a123def456');

            expect(mockApiClient).toHaveBeenCalledWith('/api/reviews/65b2a123def456', {
                method: 'DELETE',
            });
            expect(result.success).toBe(true);
        });

        test('maneja error de permisos', async () => {
            const err = new Error('No tienes permisos para eliminar esta reseña');
            err.status = 403;
            mockApiClient.mockRejectedValueOnce(err);

            await expect(deleteReview('other-user-review')).rejects.toThrow('No tienes permisos');
        });

        test('maneja reseña no encontrada', async () => {
            const err = new Error('Reseña no encontrada');
            err.status = 404;
            mockApiClient.mockRejectedValueOnce(err);

            await expect(deleteReview('nonexistent')).rejects.toThrow('Reseña no encontrada');
        });
    });
});
