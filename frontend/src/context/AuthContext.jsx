/**
 * AuthContext - Contexto global de autenticación
 * 
 * Provee a toda la app:
 *   - user:           objeto del usuario actual (o null)
 *   - token:          JWT string (o null)
 *   - isLoggedIn:     boolean
 *   - loading:        boolean (verificando sesión al inicio)
 *   - loginUser():    función para hacer login
 *   - registerUser(): función para registrar
 *   - logoutUser():   función para cerrar sesión
 *   - refreshUser():  función para refrescar perfil desde el servidor
 *   - updateUserSpecs(): función para actualizar las specs de PC
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
    login as apiLogin,
    register as apiRegister,
    getProfile,
    updateSpecs as apiUpdateSpecs,
    logout as apiLogout,
    getStoredUser,
    getStoredToken,
    saveAuthData,
    clearAuthData,
} from '../api/authService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(() => getStoredUser());
    const [token, setToken] = useState(() => getStoredToken());
    const [loading, setLoading] = useState(true);

    const isLoggedIn = !!user && !!token;

    // ── Verificar sesión al montar ──────────────────────
    useEffect(() => {
        let mounted = true;

        async function checkSession() {
            const storedToken = getStoredToken();
            if (!storedToken) {
                setLoading(false);
                return;
            }

            try {
                const res = await getProfile();
                if (mounted && res.user) {
                    setUser(res.user);
                    saveAuthData(storedToken, res.user);
                }
            } catch (err) {
                // Token expirado o inválido
                if (mounted) {
                    console.warn('Sesión inválida, cerrando sesión:', err.message);
                    clearAuthData();
                    setUser(null);
                    setToken(null);
                }
            } finally {
                if (mounted) setLoading(false);
            }
        }

        checkSession();
        return () => { mounted = false; };
    }, []);

    // ── Login ───────────────────────────────────────────
    const loginUser = useCallback(async (email, password) => {
        const res = await apiLogin(email, password);
        setUser(res.user);
        setToken(res.token);
        return res;
    }, []);

    // ── Register ────────────────────────────────────────
    const registerUser = useCallback(async (data) => {
        const res = await apiRegister(data);
        setUser(res.user);
        setToken(res.token);
        return res;
    }, []);

    // ── Logout ──────────────────────────────────────────
    const logoutUser = useCallback(() => {
        apiLogout();
        setUser(null);
        setToken(null);
    }, []);

    // ── Refrescar perfil ────────────────────────────────
    const refreshUser = useCallback(async () => {
        try {
            const res = await getProfile();
            if (res.user) {
                const currentToken = getStoredToken();
                setUser(res.user);
                if (currentToken) saveAuthData(currentToken, res.user);
            }
            return res;
        } catch (err) {
            // Si falla, no desloguear, simplemente reportar
            console.warn('Error refrescando perfil:', err.message);
            throw err;
        }
    }, []);

    // ── Actualizar specs de PC ──────────────────────────
    const updateUserSpecs = useCallback(async (pcSpecs) => {
        const res = await apiUpdateSpecs(pcSpecs);
        if (res.user) {
            setUser(res.user);
        }
        return res;
    }, []);

    const contextValue = {
        user,
        token,
        isLoggedIn,
        loading,
        loginUser,
        registerUser,
        logoutUser,
        refreshUser,
        updateUserSpecs,
    };

    return (
        <AuthContext.Provider value={contextValue}>
            {children}
        </AuthContext.Provider>
    );
}

/**
 * Hook para acceder al contexto de autenticación.
 * Debe ser usado dentro de un <AuthProvider>.
 */
export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) {
        throw new Error('useAuth debe ser usado dentro de un <AuthProvider>');
    }
    return ctx;
}

export default AuthContext;
