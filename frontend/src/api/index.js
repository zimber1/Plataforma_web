/**
 * API - Barrel export
 * 
 * Exporta todos los servicios y el cliente base para uso en la app.
 */

// Cliente base
export { apiClient, API_BASE } from './apiClient';

// Servicios por dominio
export * as authService from './authService';
export * as gamesService from './gamesService';
export * as reviewsService from './reviewsService';
export * as hardwareService from './hardwareService';

// Re-exportar funciones más usadas directamente
export { login, register, logout, getProfile, updateSpecs, isAuthenticated } from './authService';
export { searchGames, getLatestGames, getTopRatedGames, getGameDetails, analyzeCompatibility, getIgdbImageUrl, getIgdbScreenshotUrl } from './gamesService';
export { getGameReviews, upsertReview, deleteReview } from './reviewsService';
export { searchHardware } from './hardwareService';

// Alias de compatibilidad con el código anterior
export { apiClient as apiFetch } from './apiClient';
