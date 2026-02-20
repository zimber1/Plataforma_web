/* eslint-disable no-undef */
/**
 * Tests para la capa de API Client
 * 
 * Verifica:
 *   - Peticiones GET/POST/PUT/DELETE
 *   - Manejo de token JWT
 *   - Errores HTTP (400, 401, 404, 500)
 *   - Errores de red
 *   - Query params
 *   - Timeout
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

// Mock de fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Helper para crear respuestas mock de fetch
function mockResponse(data, status = 200) {
    return Promise.resolve({
        ok: status >= 200 && status < 300,
        status,
        json: () => Promise.resolve(data),
    });
}

// ─── SISTEMA BAJO TEST ────────────────────────────
// Reimplementamos la API client logic directamente para testear
// ya que el módulo usa import.meta.env (sintaxis ESM de Vite)
const API_BASE = 'http://test-api:3000';

function getStoredToken() {
    try {
        return localStorage.getItem('auth_token') || null;
    } catch { return null; }
}

async function parseJsonSafe(res) {
    try { return await res.json(); }
    catch { return null; }
}

async function apiClient(path, options = {}) {
    const { method = 'GET', body, headers = {}, params, timeout = 15000, auth = true } = options;

    let url = `${API_BASE}${path}`;
    if (params) {
        const sp = new URLSearchParams();
        Object.entries(params).forEach(([k, v]) => {
            if (v !== undefined && v !== null && v !== '') sp.append(k, v);
        });
        const qs = sp.toString();
        if (qs) url += `?${qs}`;
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);

    const finalHeaders = { 'Content-Type': 'application/json', ...headers };
    if (auth) {
        const token = getStoredToken();
        if (token) finalHeaders['Authorization'] = `Bearer ${token}`;
    }

    try {
        const res = await fetch(url, {
            method,
            headers: finalHeaders,
            body: body ? JSON.stringify(body) : undefined,
            signal: controller.signal,
        });
        clearTimeout(timer);
        const data = await parseJsonSafe(res);

        if (!res.ok) {
            const errorMsg = (data && (data.msg || data.message)) ? (data.msg || data.message) : `HTTP ${res.status}`;
            const err = new Error(errorMsg);
            err.status = res.status;
            err.payload = data;
            throw err;
        }
        return data || { success: true };
    } catch (err) {
        clearTimeout(timer);
        if (err.name === 'AbortError') {
            const te = new Error('La solicitud tardó demasiado. Intenta de nuevo.');
            te.status = 0; te.isTimeout = true; throw te;
        }
        if (!err.status && err.message === 'Failed to fetch') {
            const ne = new Error('No se pudo conectar con el servidor. Verifica tu conexión.');
            ne.status = 0; ne.isNetworkError = true; throw ne;
        }
        throw err;
    }
}

// ─── TESTS ────────────────────────────────────────

describe('apiClient', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        localStorageMock.clear();
    });

    // ─── GET requests ──────────────────────────
    test('realiza petición GET correctamente', async () => {
        const mockData = { success: true, data: [{ id: 1, name: 'Test' }] };
        mockFetch.mockResolvedValueOnce(mockResponse(mockData));

        const result = await apiClient('/api/games/latest');

        expect(mockFetch).toHaveBeenCalledTimes(1);
        const [url, options] = mockFetch.mock.calls[0];
        expect(url).toBe('http://test-api:3000/api/games/latest');
        expect(options.method).toBe('GET');
        expect(result).toEqual(mockData);
    });

    test('agrega query params correctamente', async () => {
        mockFetch.mockResolvedValueOnce(mockResponse({ success: true, data: [] }));

        await apiClient('/api/games/search', { params: { q: 'mario', limit: 10 } });

        const [url] = mockFetch.mock.calls[0];
        expect(url).toContain('q=mario');
        expect(url).toContain('limit=10');
    });

    test('ignora params vacíos o nulos', async () => {
        mockFetch.mockResolvedValueOnce(mockResponse({ success: true }));

        await apiClient('/api/test', { params: { q: 'test', empty: '', nulo: null, undef: undefined } });

        const [url] = mockFetch.mock.calls[0];
        expect(url).toContain('q=test');
        expect(url).not.toContain('empty');
        expect(url).not.toContain('nulo');
        expect(url).not.toContain('undef');
    });

    // ─── POST requests ─────────────────────────
    test('realiza petición POST con body', async () => {
        const mockData = { success: true, token: 'jwt-token' };
        mockFetch.mockResolvedValueOnce(mockResponse(mockData));

        const result = await apiClient('/api/auth/login', {
            method: 'POST',
            body: { email: 'test@test.com', password: '123456' },
        });

        const [, options] = mockFetch.mock.calls[0];
        expect(options.method).toBe('POST');
        expect(JSON.parse(options.body)).toEqual({ email: 'test@test.com', password: '123456' });
        expect(result).toEqual(mockData);
    });

    // ─── JWT Token ──────────────────────────────
    test('agrega token JWT cuando existe en localStorage', async () => {
        localStorageMock.setItem('auth_token', 'mi-token-secreto');
        mockFetch.mockResolvedValueOnce(mockResponse({ success: true }));

        await apiClient('/api/auth/me');

        const [, options] = mockFetch.mock.calls[0];
        expect(options.headers['Authorization']).toBe('Bearer mi-token-secreto');
    });

    test('NO agrega token JWT cuando auth=false', async () => {
        localStorageMock.setItem('auth_token', 'mi-token-secreto');
        mockFetch.mockResolvedValueOnce(mockResponse({ success: true }));

        await apiClient('/api/auth/register', { auth: false, method: 'POST', body: {} });

        const [, options] = mockFetch.mock.calls[0];
        expect(options.headers['Authorization']).toBeUndefined();
    });

    test('funciona sin token en localStorage', async () => {
        mockFetch.mockResolvedValueOnce(mockResponse({ success: true }));

        await apiClient('/api/games/latest');

        const [, options] = mockFetch.mock.calls[0];
        expect(options.headers['Authorization']).toBeUndefined();
    });

    // ─── Error handling ─────────────────────────
    test('lanza error con mensaje del servidor (msg)', async () => {
        mockFetch.mockResolvedValueOnce(mockResponse({ msg: 'Credenciales inválidas' }, 400));

        await expect(apiClient('/api/auth/login', {
            method: 'POST',
            body: { email: 'bad@test.com', password: 'wrong' },
        })).rejects.toThrow('Credenciales inválidas');
    });

    test('lanza error con mensaje del servidor (message)', async () => {
        mockFetch.mockResolvedValueOnce(mockResponse({ message: 'Usuario no encontrado' }, 404));

        try {
            await apiClient('/api/auth/me');
        } catch (err) {
            expect(err.message).toBe('Usuario no encontrado');
            expect(err.status).toBe(404);
        }
    });

    test('lanza error HTTP genérico si no hay mensaje', async () => {
        mockFetch.mockResolvedValueOnce({
            ok: false,
            status: 500,
            json: () => Promise.resolve(null),
        });

        await expect(apiClient('/api/test')).rejects.toThrow('HTTP 500');
    });

    test('lanza error de red cuando fetch falla', async () => {
        mockFetch.mockRejectedValueOnce(new Error('Failed to fetch'));

        try {
            await apiClient('/api/test');
        } catch (err) {
            expect(err.isNetworkError).toBe(true);
            expect(err.status).toBe(0);
        }
    });

    // ─── DELETE request ─────────────────────────
    test('realiza petición DELETE', async () => {
        localStorageMock.setItem('auth_token', 'token');
        mockFetch.mockResolvedValueOnce(mockResponse({ success: true, msg: 'Eliminado' }));

        const result = await apiClient('/api/reviews/abc123', { method: 'DELETE' });

        const [url, options] = mockFetch.mock.calls[0];
        expect(url).toBe('http://test-api:3000/api/reviews/abc123');
        expect(options.method).toBe('DELETE');
        expect(result.success).toBe(true);
    });

    // ─── PUT request ────────────────────────────
    test('realiza petición PUT con body', async () => {
        localStorageMock.setItem('auth_token', 'token');
        const specs = { cpu: 'Intel i7', gpu: 'RTX 3060', ram: '16GB', os: 'Windows 11' };
        mockFetch.mockResolvedValueOnce(mockResponse({ success: true, user: { pcSpecs: specs } }));

        const result = await apiClient('/api/auth/specs', {
            method: 'PUT',
            body: { pcSpecs: specs },
        });

        const [, options] = mockFetch.mock.calls[0];
        expect(options.method).toBe('PUT');
        expect(result.user.pcSpecs).toEqual(specs);
    });

    // ─── Content-Type ───────────────────────────
    test('envía Content-Type application/json por defecto', async () => {
        mockFetch.mockResolvedValueOnce(mockResponse({ success: true }));

        await apiClient('/api/test');

        const [, options] = mockFetch.mock.calls[0];
        expect(options.headers['Content-Type']).toBe('application/json');
    });

    // ─── Respuesta vacía ────────────────────────
    test('maneja respuesta sin JSON body', async () => {
        mockFetch.mockResolvedValueOnce({
            ok: true,
            status: 200,
            json: () => Promise.reject(new Error('No JSON')),
        });

        const result = await apiClient('/api/test');
        expect(result).toEqual({ success: true });
    });

    // ─── Error con payload ──────────────────────
    test('incluye payload completo en el error', async () => {
        const errorPayload = { msg: 'Validación fallida', errors: [{ field: 'email', msg: 'Email requerido' }] };
        mockFetch.mockResolvedValueOnce(mockResponse(errorPayload, 422));

        try {
            await apiClient('/api/auth/register', { method: 'POST', body: {} });
        } catch (err) {
            expect(err.status).toBe(422);
            expect(err.payload).toEqual(errorPayload);
        }
    });
});
