/**
 * API Client - Capa base de comunicación con el backend
 * 
 * Todas las peticiones al backend pasan por aquí.
 * Maneja automáticamente:
 *   - Token JWT (Authorization header)
 *   - Timeout con AbortController
 *   - Parsing seguro de JSON
 *   - Errores HTTP con payload del servidor
 */

export const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// ---------- helpers internos ----------

function getStoredToken() {
  try {
    return localStorage.getItem('auth_token') || null;
  } catch {
    return null;
  }
}

async function parseJsonSafe(res) {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

// ---------- función principal ----------

/**
 * Realiza una petición HTTP al API Gateway.
 *
 * @param {string}  path      - Ruta relativa, ej: '/api/auth/login'
 * @param {object}  options
 * @param {string}  options.method   - GET | POST | PUT | DELETE  (default: GET)
 * @param {object}  options.body     - Body JSON (se serializa automáticamente)
 * @param {object}  options.headers  - Headers extra
 * @param {object}  options.params   - Query params como objeto  {q:'mario', limit:10}
 * @param {number}  options.timeout  - Timeout en ms (default: 15000)
 * @param {boolean} options.auth     - Si true (default) agrega el JWT si existe
 *
 * @returns {Promise<any>}  JSON del servidor
 * @throws  {Error}         Con propiedades .status y .payload
 */
export async function apiClient(path, options = {}) {
  const {
    method = 'GET',
    body,
    headers = {},
    params,
    timeout = 15000,
    auth = true,
  } = options;

  // Construir URL con query params si existen
  let url = `${API_BASE}${path}`;
  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.append(key, value);
      }
    });
    const qs = searchParams.toString();
    if (qs) url += `?${qs}`;
  }

  // Timeout con AbortController
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  // Headers
  const finalHeaders = {
    'Content-Type': 'application/json',
    ...headers,
  };

  // Agregar token JWT si existe y auth=true
  if (auth) {
    const token = getStoredToken();
    if (token) {
      finalHeaders['Authorization'] = `Bearer ${token}`;
    }
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
      const errorMsg = (data && (data.msg || data.message))
        ? (data.msg || data.message)
        : `HTTP ${res.status}`;
      const err = new Error(errorMsg);
      err.status = res.status;
      err.payload = data;
      throw err;
    }

    return data || { success: true };
  } catch (err) {
    clearTimeout(timer);

    // Error de timeout
    if (err.name === 'AbortError') {
      const timeoutErr = new Error('La solicitud tardó demasiado. Intenta de nuevo.');
      timeoutErr.status = 0;
      timeoutErr.isTimeout = true;
      throw timeoutErr;
    }

    // Error de red (servidor no disponible)
    if (!err.status && err.message === 'Failed to fetch') {
      const netErr = new Error('No se pudo conectar con el servidor. Verifica tu conexión.');
      netErr.status = 0;
      netErr.isNetworkError = true;
      throw netErr;
    }

    throw err;
  }
}

export default apiClient;
