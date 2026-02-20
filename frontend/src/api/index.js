export const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';

async function parseJsonSafe(res) {
  try {
    return await res.json();
  } catch (e) {
    return null;
  }
}

export async function apiFetch(path, options = {}) {
  const controller = new AbortController();
  const timeout = options.timeout || 15000;
  const timer = setTimeout(() => controller.abort(), timeout);

  try {
    const res = await fetch(`${API_BASE}${path}`, {
      headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
      method: options.method || 'GET',
      body: options.body ? JSON.stringify(options.body) : undefined,
      signal: controller.signal,
    });

    clearTimeout(timer);

    const data = await parseJsonSafe(res);
    if (!res.ok) {
      const err = new Error(data && data.msg ? data.msg : `HTTP ${res.status}`);
      err.status = res.status;
      err.payload = data;
      throw err;
    }

    return data || { success: true };
  } catch (err) {
    clearTimeout(timer);
    throw err;
  }
}

export default apiFetch;
