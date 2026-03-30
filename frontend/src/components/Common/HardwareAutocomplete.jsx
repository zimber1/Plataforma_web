import React, { useState, useEffect, useRef } from 'react';
import { searchHardware } from '../../api/hardwareService';

/**
 * HardwareAutocomplete - Campo de texto con autocompletado para buscar hardware.
 * Usa el servicio searchHardware con debounce para mostrar sugerencias.
 * 
 * @param {string}   type        - Tipo de hardware: 'cpu', 'gpu' o 'ram'
 * @param {string}   value       - Valor actual del campo
 * @param {function} onChange     - Callback cuando se selecciona o escribe un valor
 * @param {string}   placeholder - Texto placeholder del input
 * @param {string}   label       - Etiqueta visible del campo
 * @param {boolean}  disabled    - Si el campo esta deshabilitado
 */
export default function HardwareAutocomplete({
    type,
    value,
    onChange,
    placeholder = '',
    label = '',
    disabled = false,
}) {
    const [query, setQuery] = useState(value || '');
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [loading, setLoading] = useState(false);
    const containerRef = useRef(null);
    const debounceRef = useRef(null);

    // Sincronizar el valor externo con el query interno
    useEffect(() => {
        setQuery(value || '');
    }, [value]);

    // Buscar hardware con debounce
    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);

        if (query.length < 2) {
            setSuggestions([]);
            return;
        }

        debounceRef.current = setTimeout(async () => {
            try {
                setLoading(true);
                const resultados = await searchHardware(type, query);
                setSuggestions(resultados || []);
                setShowSuggestions(true);
            } catch (err) {
                console.warn('Error buscando hardware:', err.message);
                setSuggestions([]);
            } finally {
                setLoading(false);
            }
        }, 300);

        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
    }, [query, type]);

    // Cerrar sugerencias al hacer clic fuera
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Seleccionar una sugerencia
    const handleSelect = (item) => {
        const nombre = item.name || '';
        setQuery(nombre);
        setSuggestions([]);
        setShowSuggestions(false);
        if (onChange) onChange(nombre);
    };

    // Manejar cambios en el input
    const handleInputChange = (e) => {
        const val = e.target.value;
        setQuery(val);
        if (onChange) onChange(val);
    };

    // Formatear la informacion adicional segun el tipo
    const getExtraInfo = (item) => {
        if (type === 'cpu') {
            const partes = [];
            if (item.core_count) partes.push(`${item.core_count} nucleos`);
            if (item.core_clock) partes.push(`${item.core_clock} GHz`);
            return partes.join(' - ');
        }
        if (type === 'gpu') {
            const partes = [];
            if (item.chipset) partes.push(item.chipset);
            if (item.memory) partes.push(`${item.memory}MB`);
            return partes.join(' - ');
        }
        if (type === 'ram') {
            const partes = [];
            if (item.speed) partes.push(`${item.speed} MHz`);
            if (item.modules) partes.push(item.modules);
            return partes.join(' - ');
        }
        return '';
    };

    return (
        <div className="hardware-autocomplete" ref={containerRef}>
            {label && (
                <label className="hardware-label">{label}</label>
            )}
            <input
                type="text"
                className="hardware-input"
                placeholder={placeholder}
                value={query}
                onChange={handleInputChange}
                onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                disabled={disabled}
                autoComplete="off"
            />

            {showSuggestions && (
                <div className="hardware-suggestions">
                    {loading && (
                        <div className="hardware-suggestion-item hardware-loading">
                            Buscando...
                        </div>
                    )}
                    {!loading && suggestions.length === 0 && query.length >= 2 && (
                        <div className="hardware-suggestion-item hardware-empty">
                            No se encontraron resultados
                        </div>
                    )}
                    {suggestions.map((item) => (
                        <button
                            key={item._id || item.name}
                            className="hardware-suggestion-item"
                            onClick={() => handleSelect(item)}
                            type="button"
                        >
                            <span className="hardware-suggestion-name">{item.name}</span>
                            {getExtraInfo(item) && (
                                <span className="hardware-suggestion-extra">
                                    {getExtraInfo(item)}
                                </span>
                            )}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
