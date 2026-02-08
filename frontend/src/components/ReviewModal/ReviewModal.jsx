import React, { useState } from 'react'
import { Star } from 'lucide-react'
import Modal from '../Common/Modal'

export default function ReviewModal({ isOpen, onClose }) {
    const [reviewType, setReviewType] = useState('artistic')
    const [rating, setRating] = useState(0)

    const handlePublish = () => {
        // Simular lógica para guardar la reseña
        console.log({ reviewType, rating });
        onClose();
    }

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Crear nueva reseña"
        >
            <div className="modal-row" role="group" aria-labelledby="review-type-label">
                <span id="review-type-label">Tipo de reseña:</span>
                <div className="type-buttons">
                    <button
                        className={reviewType === 'artistic' ? 'type-btn active' : 'type-btn'}
                        onClick={() => setReviewType('artistic')}
                        aria-pressed={reviewType === 'artistic'}
                    >
                        Artística
                    </button>
                    <button
                        className={reviewType === 'technical' ? 'type-btn active' : 'type-btn'}
                        onClick={() => setReviewType('technical')}
                        aria-pressed={reviewType === 'technical'}
                    >
                        Técnica
                    </button>
                </div>
            </div>

            <div className="modal-row" role="group" aria-labelledby="rating-label">
                <span id="rating-label">Puntuación:</span>
                <div
                    className="star-rating"
                    role="radiogroup"
                    aria-label="Puntuación en estrellas"
                >
                    {[1, 2, 3, 4, 5].map((s) => (
                        <button
                            key={s}
                            type="button"
                            className="star-btn"
                            onClick={() => setRating(s)}
                            aria-label={`${s} estrellas`}
                            aria-checked={s === rating}
                            role="radio"
                            style={{
                                background: 'none',
                                border: 'none',
                                padding: 0,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center'
                            }}
                        >
                            <Star
                                size={24}
                                fill={s <= rating ? "var(--primary-purple)" : "transparent"}
                                stroke="var(--primary-purple)"
                                aria-hidden="true"
                            />
                        </button>
                    ))}
                </div>
            </div>

            <div className="modal-row">
                <label htmlFor="review-text" className="sr-only">Escribe aquí tu reseña</label>
                <textarea
                    id="review-text"
                    className="review-textarea"
                    placeholder="Escribe aquí tu reseña..."
                    aria-required="true"
                ></textarea>
            </div>

            <div className="modal-actions">
                <button className="cancel-btn" onClick={onClose}>Cancelar</button>
                <button
                    className="publish-btn"
                    onClick={handlePublish}
                    disabled={rating === 0}
                >
                    Publicar reseña
                </button>
            </div>
        </Modal>
    )
}

