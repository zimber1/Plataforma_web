import React, { useEffect, useId } from 'react';
import { X } from 'lucide-react';
import ClientPortal from './ClientPortal';
import useFocusTrap from '../../hooks/useFocusTrap';
import useFocusReturn from '../../hooks/useFocusReturn';

// Componente de Modal accesible y reutilizable
export default function Modal({
    isOpen,
    onClose,
    title,
    children,
    ariaLabelledBy,
    className = ""
}) {
    // Gestionar el foco y el portal
    const containerRef = useFocusTrap(isOpen);
    useFocusReturn(isOpen);
    const id = useId();
    const labelId = ariaLabelledBy || `modal-title-${id}`;

    useEffect(() => {
        // Cerrar con la tecla Escape
        const handleEsc = (e) => {
            if (e.key === 'Escape') onClose();
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEsc);
            document.body.style.overflow = 'hidden'; // Bloquear scroll del fondo
        }

        return () => {
            document.removeEventListener('keydown', handleEsc);
            document.body.style.overflow = '';
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <ClientPortal>
            <div
                className="modal-overlay"
                onClick={onClose}
                role="presentation"
            >
                <div
                    ref={containerRef}
                    className={`modal-card ${className}`}
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby={labelId}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="modal-header">
                        <h2 id={labelId}>{title}</h2>
                        <button
                            className="close-btn"
                            onClick={onClose}
                            aria-label="Cerrar modal"
                        >
                            <X size={24} aria-hidden="true" />
                        </button>
                    </div>
                    <div className="modal-body">
                        {children}
                    </div>
                </div>
            </div>
        </ClientPortal>
    );
}
