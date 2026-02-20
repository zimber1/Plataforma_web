import React, { useState } from 'react'
import { Star, Loader } from 'lucide-react'
import Modal from '../Common/Modal'
import { upsertReview } from '../../api/reviewsService'
import { useAuth } from '../../context/AuthContext'

export default function ReviewModal({ isOpen, onClose, gameId, onPublished }) {
    const { isLoggedIn } = useAuth()
    const [reviewType, setReviewType] = useState('artistic')
    const [rating, setRating] = useState(0)
    const [comment, setComment] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)

    const handlePublish = async () => {
        if (!isLoggedIn) {
            setError('Debes iniciar sesión para publicar una reseña')
            return
        }
        if (rating === 0) {
            setError('Selecciona una puntuación')
            return
        }

        setLoading(true)
        setError(null)

        try {
            await upsertReview({
                gameId,
                type: reviewType,
                rating,
                comment: comment.trim(),
            })

            // Resetear form
            setRating(0)
            setComment('')
            setReviewType('artistic')

            // Notificar al padre
            if (onPublished) onPublished()
            else onClose()
        } catch (err) {
            setError(err.message || 'Error al publicar la reseña')
        } finally {
            setLoading(false)
        }
    }

    const handleClose = () => {
        setError(null)
        setRating(0)
        setComment('')
        onClose()
    }

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            title="Crear nueva reseña"
        >
            {error && (
                <div role="alert" style={{ padding: '10px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', color: '#ef4444', fontSize: '13px', textAlign: 'center' }}>
                    {error}
                </div>
            )}

            <div className="modal-row" role="group" aria-labelledby="review-type-label">
                <span id="review-type-label">Tipo de reseña:</span>
                <div className="type-buttons">
                    <button
                        className={reviewType === 'artistic' ? 'type-btn active' : 'type-btn'}
                        onClick={() => setReviewType('artistic')}
                        aria-pressed={reviewType === 'artistic'}
                        disabled={loading}
                    >
                        Artística
                    </button>
                    <button
                        className={reviewType === 'technical' ? 'type-btn active' : 'type-btn'}
                        onClick={() => setReviewType('technical')}
                        aria-pressed={reviewType === 'technical'}
                        disabled={loading}
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
                            disabled={loading}
                            style={{
                                background: 'none',
                                border: 'none',
                                padding: 0,
                                cursor: loading ? 'not-allowed' : 'pointer',
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
                    placeholder="Escribe aquí tu reseña (opcional, máx. 1000 caracteres)..."
                    aria-required="false"
                    maxLength={1000}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    disabled={loading}
                ></textarea>
            </div>

            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', textAlign: 'right' }}>
                {comment.length}/1000
            </div>

            <div className="modal-actions">
                <button className="cancel-btn" onClick={handleClose} disabled={loading}>Cancelar</button>
                <button
                    className="publish-btn"
                    onClick={handlePublish}
                    disabled={rating === 0 || loading}
                    style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                    {loading && <Loader size={14} style={{ animation: 'spin 1s linear infinite' }} />}
                    {loading ? 'Publicando...' : 'Publicar reseña'}
                </button>
            </div>
        </Modal>
    )
}
