import { useEffect, useRef } from 'react';

// Hook para devolver el foco al elemento anterior cuando algo se cierra
export default function useFocusReturn(isActive) {
    const lastActiveElement = useRef(null);

    useEffect(() => {
        if (isActive) {
            // Guardar el elemento que tenía el foco
            lastActiveElement.current = document.activeElement;
        } else if (lastActiveElement.current) {
            // Devolver el foco al cerrar
            lastActiveElement.current.focus();
        }

        return () => {
            if (isActive && lastActiveElement.current) {
                lastActiveElement.current.focus();
            }
        };
    }, [isActive]);
}
