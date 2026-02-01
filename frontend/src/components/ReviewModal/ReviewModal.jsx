import React, { useState } from 'react'
import { X, Star } from 'lucide-react'

export default function ReviewModal({ isOpen, onClose }) {
    const [reviewType, setReviewType] = useState('artistic')
    const [rating, setRating] = useState(0)

    if (!isOpen) return null

    return (
        <div className="modal-overlay">
            <div className="modal-card">
                <div className="modal-header">
                    <h2>Crear nueva reseña</h2>
                    <button className="close-btn" onClick={onClose}>
                        <X size={24} />
                    </button>
                </div>

                <div className="modal-body">
                    <div className="modal-row">
                        <span>Tipo de reseña:</span>
                        <div className="type-buttons">
                            <button
                                className={reviewType === 'artistic' ? 'type-btn active' : 'type-btn'}
                                onClick={() => setReviewType('artistic')}
                            >
                                Artística
                            </button>
                            <button
                                className={reviewType === 'technical' ? 'type-btn active' : 'type-btn'}
                                onClick={() => setReviewType('technical')}
                            >
                                Técnica
                            </button>
                        </div>
                    </div>

                    <div className="modal-row">
                        <span>Puntuación:</span>
                        <div className="star-rating">
                            {[1, 2, 3, 4, 5].map((s) => (
                                <Star
                                    key={s}
                                    size={20}
                                    fill={s <= rating ? "gold" : "transparent"}
                                    stroke="gold"
                                    style={{ cursor: 'pointer' }}
                                    onClick={() => setRating(s)}
                                />
                            ))}
                        </div>
                    </div>

                    <textarea
                        className="review-textarea"
                        placeholder="Escribe aquí tu reseña..."
                    ></textarea>

                    <div className="modal-actions">
                        <button className="cancel-btn" onClick={onClose}>Cancelar</button>
                        <button className="publish-btn" onClick={onClose}>Publicar reseña</button>
                    </div>
                </div>
            </div>
        </div>
    )
}
