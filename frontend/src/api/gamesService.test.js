/* eslint-disable no-undef */
/**
 * Tests para gamesService.js
 * 
 * Verifica:
 *   - searchGames con query y validaciones
 *   - getLatestGames
 *   - getTopRatedGames
 *   - getComingSoonGames
 *   - getGameDetails
 *   - analyzeCompatibility
 *   - getIgdbImageUrl helpers
 */

const mockApiClient = jest.fn();
jest.mock('./apiClient', () => ({
    apiClient: (...args) => mockApiClient(...args),
}));

const {
    searchGames,
    getLatestGames,
    getTopRatedGames,
    getComingSoonGames,
    getGameDetails,
    analyzeCompatibility,
    getIgdbImageUrl,
    getIgdbScreenshotUrl,
} = require('./gamesService');

describe('gamesService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    // ─── searchGames ────────────────────────────
    describe('searchGames', () => {
        test('busca juegos con query válido', async () => {
            const mockData = { success: true, data: [{ id: 1, name: 'Mario' }] };
            mockApiClient.mockResolvedValueOnce(mockData);

            const result = await searchGames('mario');

            expect(mockApiClient).toHaveBeenCalledWith('/api/games/search', {
                params: { q: 'mario' },
            });
            expect(result.data).toHaveLength(1);
        });

        test('retorna vacío con query menor a 2 caracteres', async () => {
            const result = await searchGames('m');

            expect(mockApiClient).not.toHaveBeenCalled();
            expect(result).toEqual({ success: true, data: [] });
        });

        test('retorna vacío con query vacío', async () => {
            const result = await searchGames('');

            expect(mockApiClient).not.toHaveBeenCalled();
            expect(result).toEqual({ success: true, data: [] });
        });

        test('retorna vacío con query null', async () => {
            const result = await searchGames(null);

            expect(mockApiClient).not.toHaveBeenCalled();
            expect(result).toEqual({ success: true, data: [] });
        });
    });

    // ─── getLatestGames ─────────────────────────
    describe('getLatestGames', () => {
        test('llama al endpoint correcto', async () => {
            mockApiClient.mockResolvedValueOnce({ success: true, data: [] });

            await getLatestGames();

            expect(mockApiClient).toHaveBeenCalledWith('/api/games/latest');
        });

        test('retorna la lista de juegos', async () => {
            const games = [
                { id: 1, name: 'Game 1', cover: { url: '//img.test/t_thumb/1.jpg' } },
                { id: 2, name: 'Game 2', cover: { url: '//img.test/t_thumb/2.jpg' } },
            ];
            mockApiClient.mockResolvedValueOnce({ success: true, data: games });

            const result = await getLatestGames();
            expect(result.data).toHaveLength(2);
        });
    });

    // ─── getTopRatedGames ───────────────────────
    describe('getTopRatedGames', () => {
        test('llama al endpoint correcto', async () => {
            mockApiClient.mockResolvedValueOnce({ success: true, data: [] });

            await getTopRatedGames();

            expect(mockApiClient).toHaveBeenCalledWith('/api/games/top-rated');
        });
    });

    // ─── getComingSoonGames ─────────────────────
    describe('getComingSoonGames', () => {
        test('llama al endpoint correcto', async () => {
            mockApiClient.mockResolvedValueOnce({ success: true, data: [] });

            await getComingSoonGames();

            expect(mockApiClient).toHaveBeenCalledWith('/api/games/coming-soon');
        });
    });

    // ─── getGameDetails ─────────────────────────
    describe('getGameDetails', () => {
        test('obtiene detalles de un juego por ID', async () => {
            const mockGame = {
                success: true,
                data: {
                    id: 1020,
                    name: 'Cyberpunk 2077',
                    summary: 'Un RPG de acción...',
                    cover: { url: '//images.igdb.com/t_thumb/co1020.jpg' },
                    requirements: { pc_requirements: { minimum: 'CPU i7...' } },
                },
            };
            mockApiClient.mockResolvedValueOnce(mockGame);

            const result = await getGameDetails(1020);

            expect(mockApiClient).toHaveBeenCalledWith('/api/games/1020');
            expect(result.data.name).toBe('Cyberpunk 2077');
        });

        test('funciona con ID como string', async () => {
            mockApiClient.mockResolvedValueOnce({ success: true, data: { name: 'Test' } });

            await getGameDetails('42');

            expect(mockApiClient).toHaveBeenCalledWith('/api/games/42');
        });
    });

    // ─── analyzeCompatibility ───────────────────
    describe('analyzeCompatibility', () => {
        test('envía POST al endpoint de análisis', async () => {
            mockApiClient.mockResolvedValueOnce({
                success: true,
                analysis: { canRun: true, performance: 'alto', bottleneck: 'ninguno', recommendation: 'Tu PC puede ejecutar este juego sin problemas' },
                cached: false,
            });

            const result = await analyzeCompatibility(1020);

            expect(mockApiClient).toHaveBeenCalledWith('/api/games/1020/analyze', {
                method: 'POST',
            });
            expect(result.analysis.canRun).toBe(true);
            expect(result.analysis.performance).toBe('alto');
        });

        test('maneja error de no autenticado', async () => {
            const err = new Error('Debes iniciar sesión para analizar compatibilidad');
            err.status = 401;
            mockApiClient.mockRejectedValueOnce(err);

            await expect(analyzeCompatibility(1020)).rejects.toThrow('Debes iniciar sesión');
        });

        test('maneja error de specs incompletas', async () => {
            const err = new Error('Completa tu perfil de PC antes de analizar');
            err.status = 400;
            mockApiClient.mockRejectedValueOnce(err);

            await expect(analyzeCompatibility(1020)).rejects.toThrow('Completa tu perfil');
        });
    });

    // ─── getIgdbImageUrl ────────────────────────
    describe('getIgdbImageUrl', () => {
        test('transforma URL de cover con HTTPS y tamaño', () => {
            const input = '//images.igdb.com/igdb/image/upload/t_thumb/co1234.jpg';
            const result = getIgdbImageUrl(input, 'cover_big');
            expect(result).toBe('https://images.igdb.com/igdb/image/upload/t_cover_big/co1234.jpg');
        });

        test('mantiene HTTPS si ya existe', () => {
            const input = 'https://images.igdb.com/igdb/image/upload/t_thumb/co5678.jpg';
            const result = getIgdbImageUrl(input, '720p');
            expect(result).toBe('https://images.igdb.com/igdb/image/upload/t_720p/co5678.jpg');
        });

        test('usa cover_big por defecto', () => {
            const input = '//images.igdb.com/igdb/image/upload/t_thumb/co9999.jpg';
            const result = getIgdbImageUrl(input);
            expect(result).toBe('https://images.igdb.com/igdb/image/upload/t_cover_big/co9999.jpg');
        });

        test('retorna string vacío para input vacío', () => {
            expect(getIgdbImageUrl('')).toBe('');
            expect(getIgdbImageUrl(null)).toBe('');
            expect(getIgdbImageUrl(undefined)).toBe('');
        });
    });

    // ─── getIgdbScreenshotUrl ───────────────────
    describe('getIgdbScreenshotUrl', () => {
        test('transforma URL de screenshot', () => {
            const input = '//images.igdb.com/igdb/image/upload/t_thumb/sc1234.jpg';
            const result = getIgdbScreenshotUrl(input, 'screenshot_big');
            expect(result).toBe('https://images.igdb.com/igdb/image/upload/t_screenshot_big/sc1234.jpg');
        });

        test('retorna string vacío para input vacío', () => {
            expect(getIgdbScreenshotUrl('')).toBe('');
        });
    });
});
