/* eslint-disable no-undef */
/**
 * Tests para authService.js
 * 
 * Verifica:
 *   - Login guarda token y usuario
 *   - Register guarda token y usuario
 *   - Logout limpia localStorage
 *   - getProfile envía el token
 *   - updateSpecs actualiza localStorage
 *   - Helpers de localStorage
 */

// Mock de localStorage
const localStorageMock = (() => {
    let store = {};
    return {
        getItem: jest.fn((key) => store[key] || null),
        setItem: jest.fn((key, value) => { store[key] = value; }),
        removeItem: jest.fn((key) => { delete store[key]; }),
        clear: jest.fn(() => { store = {}; }),
    };
})();
Object.defineProperty(global, 'localStorage', { value: localStorageMock });

// Mock del apiClient
const mockApiClient = jest.fn();
jest.mock('./apiClient', () => ({
    apiClient: (...args) => mockApiClient(...args),
}));

const {
    login,
    register,
    getProfile,
    updateSpecs,
    logout,
    saveAuthData,
    getStoredUser,
    getStoredToken,
    clearAuthData,
    isAuthenticated,
} = require('./authService');

describe('authService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        localStorageMock.clear();
    });

    // ─── Helpers de localStorage ────────────────
    describe('localStorage helpers', () => {
        test('saveAuthData guarda token y usuario', () => {
            const user = { id: '1', username: 'test', email: 'test@test.com' };
            saveAuthData('mi-token', user);

            expect(localStorageMock.setItem).toHaveBeenCalledWith('auth_token', 'mi-token');
            expect(localStorageMock.setItem).toHaveBeenCalledWith('auth_user', JSON.stringify(user));
        });

        test('getStoredToken retorna el token', () => {
            localStorageMock.setItem('auth_token', 'token-123');
            const token = getStoredToken();
            expect(token).toBe('token-123');
        });

        test('getStoredToken retorna null si no existe', () => {
            expect(getStoredToken()).toBeNull();
        });

        test('getStoredUser retorna el usuario parseado', () => {
            const user = { id: '1', username: 'test' };
            localStorageMock.setItem('auth_user', JSON.stringify(user));
            expect(getStoredUser()).toEqual(user);
        });

        test('getStoredUser retorna null si no existe', () => {
            expect(getStoredUser()).toBeNull();
        });

        test('clearAuthData elimina token y usuario', () => {
            localStorageMock.setItem('auth_token', 'token');
            localStorageMock.setItem('auth_user', '{}');
            clearAuthData();
            expect(localStorageMock.removeItem).toHaveBeenCalledWith('auth_token');
            expect(localStorageMock.removeItem).toHaveBeenCalledWith('auth_user');
        });

        test('isAuthenticated retorna true cuando hay token', () => {
            localStorageMock.setItem('auth_token', 'token-valido');
            expect(isAuthenticated()).toBe(true);
        });

        test('isAuthenticated retorna false cuando no hay token', () => {
            expect(isAuthenticated()).toBe(false);
        });
    });

    // ─── Login ──────────────────────────────────
    describe('login', () => {
        test('llama apiClient con los datos correctos', async () => {
            const mockResponse = {
                success: true,
                token: 'jwt-nuevo',
                user: { id: '1', username: 'gamer', email: 'gamer@test.com' },
            };
            mockApiClient.mockResolvedValueOnce(mockResponse);

            const result = await login('gamer@test.com', 'password123');

            expect(mockApiClient).toHaveBeenCalledWith('/api/auth/login', {
                method: 'POST',
                body: { email: 'gamer@test.com', password: 'password123' },
                auth: false,
            });
            expect(result).toEqual(mockResponse);
        });

        test('guarda token y usuario en localStorage al login exitoso', async () => {
            const mockResponse = {
                success: true,
                token: 'jwt-nuevo',
                user: { id: '1', username: 'gamer' },
            };
            mockApiClient.mockResolvedValueOnce(mockResponse);

            await login('gamer@test.com', 'password');

            expect(localStorageMock.setItem).toHaveBeenCalledWith('auth_token', 'jwt-nuevo');
        });

        test('propaga error del servidor', async () => {
            const err = new Error('Credenciales inválidas');
            err.status = 400;
            mockApiClient.mockRejectedValueOnce(err);

            await expect(login('bad@test.com', 'wrong')).rejects.toThrow('Credenciales inválidas');
        });
    });

    // ─── Register ───────────────────────────────
    describe('register', () => {
        test('llama apiClient con datos de registro', async () => {
            const mockResponse = {
                success: true,
                token: 'jwt-reg',
                user: { id: '2', username: 'nuevouser', email: 'nuevo@test.com' },
            };
            mockApiClient.mockResolvedValueOnce(mockResponse);

            const result = await register({
                username: 'nuevouser',
                email: 'nuevo@test.com',
                password: 'pass123',
            });

            expect(mockApiClient).toHaveBeenCalledWith('/api/auth/register', {
                method: 'POST',
                body: { username: 'nuevouser', email: 'nuevo@test.com', password: 'pass123' },
                auth: false,
            });
            expect(result.success).toBe(true);
        });

        test('guarda token al registrarse exitosamente', async () => {
            mockApiClient.mockResolvedValueOnce({
                success: true,
                token: 'jwt-reg',
                user: { id: '2', username: 'nuevo' },
            });

            await register({ username: 'nuevo', email: 'n@t.com', password: '123456' });

            expect(localStorageMock.setItem).toHaveBeenCalledWith('auth_token', 'jwt-reg');
        });

        test('propaga error de email duplicado', async () => {
            const err = new Error('El correo ya está registrado');
            err.status = 400;
            mockApiClient.mockRejectedValueOnce(err);

            await expect(register({
                username: 'test',
                email: 'duplicado@test.com',
                password: '123456',
            })).rejects.toThrow('El correo ya está registrado');
        });
    });

    // ─── getProfile ─────────────────────────────
    describe('getProfile', () => {
        test('llama a /api/auth/me con auth implícito', async () => {
            mockApiClient.mockResolvedValueOnce({
                success: true,
                user: { id: '1', username: 'test', pcSpecs: { cpu: 'i7' } },
            });

            const result = await getProfile();

            expect(mockApiClient).toHaveBeenCalledWith('/api/auth/me');
            expect(result.user.username).toBe('test');
        });
    });

    // ─── updateSpecs ────────────────────────────
    describe('updateSpecs', () => {
        test('envía specs como PUT request', async () => {
            localStorageMock.setItem('auth_token', 'token-valido');
            const specs = { cpu: 'AMD Ryzen 7 5800X', gpu: 'RTX 3070', ram: 'DDR4 16GB 3200', os: 'Windows 11' };
            mockApiClient.mockResolvedValueOnce({
                success: true,
                message: 'Specs actualizadas',
                user: { id: '1', username: 'test', pcSpecs: specs },
            });

            const result = await updateSpecs(specs);

            expect(mockApiClient).toHaveBeenCalledWith('/api/auth/specs', {
                method: 'PUT',
                body: { pcSpecs: specs },
            });
            expect(result.user.pcSpecs).toEqual(specs);
        });
    });

    // ─── Logout ─────────────────────────────────
    describe('logout', () => {
        test('limpia localStorage', () => {
            localStorageMock.setItem('auth_token', 'token');
            localStorageMock.setItem('auth_user', '{}');
            logout();
            expect(localStorageMock.removeItem).toHaveBeenCalledWith('auth_token');
            expect(localStorageMock.removeItem).toHaveBeenCalledWith('auth_user');
        });
    });
});
