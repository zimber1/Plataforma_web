/**
 * Hardware Service - Búsqueda de componentes de hardware
 * 
 * Endpoints del backend (a través del API Gateway):
 *   GET /api/hardware/search?type=cpu&q=ryzen  → Buscar hardware por tipo y nombre
 */

import { apiClient } from './apiClient';

/**
 * Buscar componentes de hardware por tipo y término de búsqueda.
 * Requiere al menos 2 caracteres en el query.
 * 
 * @param {'cpu'|'gpu'|'ram'} type - Tipo de hardware
 * @param {string}            query - Término de búsqueda (min 2 chars)
 * 
 * @returns {Promise<Array>}
 *   CPU: [{ _id, name, core_count, core_clock }]
 *   GPU: [{ _id, name, chipset, memory }]
 *   RAM: [{ _id, name, speed, modules }]
 */
export async function searchHardware(type, query) {
    if (!query || query.length < 2) {
        return [];
    }

    if (!['cpu', 'gpu', 'ram'].includes(type)) {
        throw new Error('Tipo de hardware inválido. Use: cpu, gpu, ram');
    }

    const res = await apiClient('/api/hardware/search', {
        params: { type, q: query },
    });

    // El endpoint devuelve directamente el array (sin wrapper { success, data })
    return Array.isArray(res) ? res : (res.data || []);
}
