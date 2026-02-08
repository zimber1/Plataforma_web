import { createPortal } from 'react-dom';
import { useEffect, useState } from 'react';

// Renderiza los hijos en un nodo fuera de la raíz principal (evita problemas de CSS)
export default function ClientPortal({ children, selector = '#portal-root' }) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);

        // Crear el nodo del portal si no existe
        if (!document.querySelector(selector)) {
            const portalDiv = document.createElement('div');
            portalDiv.id = selector.replace('#', '');
            document.body.appendChild(portalDiv);
        }

        return () => setMounted(false);
    }, [selector]);

    return mounted ? createPortal(children, document.querySelector(selector)) : null;
}
