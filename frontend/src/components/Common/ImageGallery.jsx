import React, { useState, useEffect, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import ClientPortal from './ClientPortal';

/**
 * ImageGallery - Modal de pantalla completa para navegar capturas de pantalla.
 * Permite navegacion con flechas del teclado y botones.
 * 
 * @param {boolean}  isOpen       - Si la galeria esta abierta
 * @param {function} onClose      - Callback al cerrar
 * @param {Array}    images       - Lista de URLs de imagenes
 * @param {number}   initialIndex - Indice inicial de la imagen a mostrar
 */
export default function ImageGallery({ isOpen, onClose, images = [], initialIndex = 0 }) {
    const [currentIndex, setCurrentIndex] = useState(initialIndex);

    // Resetear indice cuando se abre la galeria
    useEffect(() => {
        if (isOpen) {
            setCurrentIndex(initialIndex);
        }
    }, [isOpen, initialIndex]);

    // Ir a la imagen anterior
    const goPrev = useCallback(() => {
        setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
    }, [images.length]);

    // Ir a la siguiente imagen
    const goNext = useCallback(() => {
        setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
    }, [images.length]);

    // Manejar teclas del teclado
    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e) => {
            if (e.key === 'Escape') onClose();
            if (e.key === 'ArrowLeft') goPrev();
            if (e.key === 'ArrowRight') goNext();
        };

        document.addEventListener('keydown', handleKeyDown);
        document.body.style.overflow = 'hidden';

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = '';
        };
    }, [isOpen, onClose, goPrev, goNext]);

    if (!isOpen || images.length === 0) return null;

    return (
        <ClientPortal>
            <div
                className="gallery-overlay"
                onClick={onClose}
                role="dialog"
                aria-modal="true"
                aria-label="Galeria de imagenes"
            >
                <div
                    className="gallery-content"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Boton cerrar */}
                    <button
                        className="gallery-close-btn"
                        onClick={onClose}
                        aria-label="Cerrar galeria"
                    >
                        <X size={28} />
                    </button>

                    {/* Boton anterior */}
                    {images.length > 1 && (
                        <button
                            className="gallery-nav-btn gallery-prev-btn"
                            onClick={goPrev}
                            aria-label="Imagen anterior"
                        >
                            <ChevronLeft size={36} />
                        </button>
                    )}

                    {/* Imagen principal */}
                    <img
                        src={images[currentIndex]}
                        alt={`Captura ${currentIndex + 1} de ${images.length}`}
                        className="gallery-image"
                    />

                    {/* Boton siguiente */}
                    {images.length > 1 && (
                        <button
                            className="gallery-nav-btn gallery-next-btn"
                            onClick={goNext}
                            aria-label="Imagen siguiente"
                        >
                            <ChevronRight size={36} />
                        </button>
                    )}

                    {/* Indicador de posicion */}
                    <div className="gallery-counter">
                        {currentIndex + 1} / {images.length}
                    </div>

                    {/* Miniaturas */}
                    {images.length > 1 && (
                        <div className="gallery-thumbnails">
                            {images.map((img, idx) => (
                                <button
                                    key={idx}
                                    className={`gallery-thumb ${idx === currentIndex ? 'gallery-thumb-active' : ''}`}
                                    onClick={() => setCurrentIndex(idx)}
                                    aria-label={`Ver imagen ${idx + 1}`}
                                >
                                    <img src={img} alt="" aria-hidden="true" />
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </ClientPortal>
    );
}
