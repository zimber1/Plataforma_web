/* eslint-disable no-undef */
/**
 * Tests para hardwareService.js
 * 
 * Verifica:
 *   - searchHardware con tipos válidos (cpu, gpu, ram)
 *   - Validación de query mínimo  
 *   - Validación de tipo
 *   - Manejo de diferentes formatos de respuesta
 */

const mockApiClient = jest.fn();
jest.mock('./apiClient', () => ({
    apiClient: (...args) => mockApiClient(...args),
}));

const { searchHardware } = require('./hardwareService');

describe('hardwareService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    // ─── Búsqueda de CPU ────────────────────────
    test('busca CPUs correctamente', async () => {
        const mockCpus = [
            { _id: '1', name: 'AMD Ryzen 7 5800X', core_count: 8, core_clock: 3.8 },
            { _id: '2', name: 'AMD Ryzen 5 5600X', core_count: 6, core_clock: 3.7 },
        ];
        mockApiClient.mockResolvedValueOnce(mockCpus);

        const result = await searchHardware('cpu', 'ryzen');

        expect(mockApiClient).toHaveBeenCalledWith('/api/hardware/search', {
            params: { type: 'cpu', q: 'ryzen' },
        });
        expect(result).toHaveLength(2);
        expect(result[0].name).toContain('Ryzen');
    });

    // ─── Búsqueda de GPU ────────────────────────
    test('busca GPUs correctamente', async () => {
        const mockGpus = [
            { _id: '1', name: 'GeForce RTX 3060', chipset: 'GA106', memory: 12 },
        ];
        mockApiClient.mockResolvedValueOnce(mockGpus);

        const result = await searchHardware('gpu', 'rtx');

        expect(mockApiClient).toHaveBeenCalledWith('/api/hardware/search', {
            params: { type: 'gpu', q: 'rtx' },
        });
        expect(result).toHaveLength(1);
    });

    // ─── Búsqueda de RAM ────────────────────────
    test('busca RAM correctamente', async () => {
        const mockRam = [
            { _id: '1', name: 'Kingston Fury Beast DDR4 16GB', speed: 3200, modules: '2x8GB' },
        ];
        mockApiClient.mockResolvedValueOnce(mockRam);

        const result = await searchHardware('ram', 'kingston');

        expect(mockApiClient).toHaveBeenCalledWith('/api/hardware/search', {
            params: { type: 'ram', q: 'kingston' },
        });
        expect(result).toHaveLength(1);
    });

    // ─── Validaciones ───────────────────────────
    test('retorna array vacío con query menor a 2 caracteres', async () => {
        const result = await searchHardware('cpu', 'r');

        expect(mockApiClient).not.toHaveBeenCalled();
        expect(result).toEqual([]);
    });

    test('retorna array vacío con query vacío', async () => {
        const result = await searchHardware('gpu', '');

        expect(mockApiClient).not.toHaveBeenCalled();
        expect(result).toEqual([]);
    });

    test('retorna array vacío con query null', async () => {
        const result = await searchHardware('ram', null);

        expect(mockApiClient).not.toHaveBeenCalled();
        expect(result).toEqual([]);
    });

    test('lanza error con tipo de hardware inválido', async () => {
        await expect(searchHardware('monitor', 'dell')).rejects.toThrow('Tipo de hardware inválido');
    });

    // ─── Formato de respuesta ───────────────────
    test('maneja respuesta con wrapper { data: [] }', async () => {
        mockApiClient.mockResolvedValueOnce({ data: [{ _id: '1', name: 'Test CPU' }] });

        const result = await searchHardware('cpu', 'test');

        expect(result).toHaveLength(1);
    });

    test('maneja respuesta directa como array', async () => {
        mockApiClient.mockResolvedValueOnce([{ _id: '1', name: 'Test GPU' }]);

        const result = await searchHardware('gpu', 'test');

        expect(result).toHaveLength(1);
    });

    test('retorna array vacío si respuesta no tiene data ni es array', async () => {
        mockApiClient.mockResolvedValueOnce({ success: true });

        const result = await searchHardware('cpu', 'test');

        expect(result).toEqual([]);
    });
});
