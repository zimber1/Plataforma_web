/**
 * Auth Service - Gestión de autenticación
 * 
 * Endpoints del backend:
 *   POST /api/auth/register  → Registrar usuario
 *   POST /api/auth/login     → Iniciar sesión  
 *   GET  /api/auth/me        → Perfil del usuario autenticado
 *   PUT  /api/auth/specs     → Actualizar specs de PC
 */

import { apiClient } from './apiClient';

// ─── Constantes de almacenamiento ───────────────────────
const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';

// ─── Helpers de token ────────────────────────────────────

export function saveAuthData(token, user) {
    try {
        localStorage.setItem(TOKEN_KEY, token);
        localStorage.setItem(USER_KEY, JSON.stringify(user));
    } catch (e) {
        console.warn('Error guardando datos de auth:', e);
    }
}

export function getStoredUser() {
    try {
        const raw = localStorage.getItem(USER_KEY);
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
}

export function getStoredToken() {
    try {
        return localStorage.getItem(TOKEN_KEY) || null;
    } catch {
        return null;
    }
}

export function clearAuthData() {
    try {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
    } catch (e) {
        console.warn('Error limpiando datos de auth:', e);
    }
}

export function isAuthenticated() {
    return !!getStoredToken();
}

// ─── Endpoints de autenticación ──────────────────────────

/**
 * Registrar un nuevo usuario.
 * 
 * @param {object} data
 * @param {string} data.username
 * @param {string} data.email
 * @param {string} data.password
 * @param {object} [data.pcSpecs]  - { cpu, gpu, ram, os }
 * 
 * @returns {Promise<{ success, token, user }>}
 */
export async function register(data) {
    const res = await apiClient('/api/auth/register', {
        method: 'POST',
        body: data,
        auth: false,
    });

    if (res.token && res.user) {
        saveAuthData(res.token, res.user);
    }

    return res;
}

/**
 * Iniciar sesión.
 * 
 * @param {string} email
 * @param {string} password
 * 
 * @returns {Promise<{ success, token, user }>}
 */
export async function login(email, password) {
    const res = await apiClient('/api/auth/login', {
        method: 'POST',
        body: { email, password },
        auth: false,
    });

    if (res.token && res.user) {
        saveAuthData(res.token, res.user);
    }

    return res;
}

/**
 * Obtener perfil del usuario autenticado.
 * Requiere token JWT válido.
 * 
 * @returns {Promise<{ success, user }>}
 */
export async function getProfile() {
    return apiClient('/api/auth/me');
}

/**
 * Actualizar las specs de PC del usuario.
 * 
 * @param {object} pcSpecs - { cpu, gpu, ram, os }
 * 
 * @returns {Promise<{ success, message, user }>}
 */
export async function updateSpecs(pcSpecs) {
    const res = await apiClient('/api/auth/specs', {
        method: 'PUT',
        body: { pcSpecs },
    });

    // Actualizar usuario en localStorage
    if (res.user) {
        const token = getStoredToken();
        if (token) {
            saveAuthData(token, res.user);
        }
    }

    return res;
}

/**
 * Cerrar sesión (solo limpia datos locales).
 */
export function logout() {
    clearAuthData();
}
