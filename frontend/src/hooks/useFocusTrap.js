import { useEffect, useRef } from 'react';

// Hook para mantener el foco dentro de un contenedor (útil para modales)
export default function useFocusTrap(isActive) {
    const containerRef = useRef(null);

    useEffect(() => {
        if (!isActive) return;

        const container = containerRef.current;
        if (!container) return;

        // Elementos que pueden recibir foco
        const focusableElements = container.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );

        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        const handleKeyDown = (e) => {
            if (e.key !== 'Tab') return;

            if (e.shiftKey) {
                // Si es Shift + Tab y estamos en el primero, ir al último
                if (document.activeElement === firstElement) {
                    e.preventDefault();
                    lastElement.focus();
                }
            } else {
                // Si es Tab y estamos en el último, ir al primero
                if (document.activeElement === lastElement) {
                    e.preventDefault();
                    firstElement.focus();
                }
            }
        };

        container.addEventListener('keydown', handleKeyDown);

        // Foco inicial al abrir
        const initialFocusElement = container.querySelector('[data-autofocus]') || firstElement;
        initialFocusElement.focus();

        return () => {
            container.removeEventListener('keydown', handleKeyDown);
        };
    }, [isActive]);

    return containerRef;
}
