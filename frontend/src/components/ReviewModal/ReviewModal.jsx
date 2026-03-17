import React, { useState, useEffect } from 'react'
import { Star, Loader, Palette, Cpu, AlertCircle, Send } from 'lucide-react'
import Modal from '../Common/Modal'
import { upsertReview } from '../../api/reviewsService'
import { useAuth } from '../../context/AuthContext'

/**
 * ReviewModal - Modal para crear/editar una resena.
 * 
 * @param {boolean}  isOpen       - Si el modal esta abierto
 * @param {function} onClose      - Callback al cerrar
 * @param {number}   gameId       - ID del juego
 * @param {function} onPublished  - Callback tras publicar exitosamente
 * @param {string}   defaultType  - Tipo predefinido: 'artistic' o 'technical'
 */
export default function ReviewModal({ isOpen, onClose, gameId, onPublished, defaultType = 'artistic' }) {
    const { isLoggedIn } = useAuth()
    const [reviewType, setReviewType] = useState(defaultType)
    const [rating, setRating] = useState(0)
    const [hoverRating, setHoverRating] = useState(0)
    const [comment, setComment] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)

    // Sincronizar el tipo de resena cuando cambia el defaultType o se abre el modal
    useEffect(() => {
        if (isOpen) {
            setReviewType(defaultType)
            setRating(0)
            setHoverRating(0)
            setComment('')
            setError(null)
        }
    }, [isOpen, defaultType])

    const handlePublish = async () => {
        if (!isLoggedIn) {
            setError('Debes iniciar sesión para publicar una reseña')
            return
        }
        if (rating === 0) {
            setError('Selecciona una puntuación para continuar')
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
        onClose()
    }

    const charCount = comment.length
    const maxChars = 1000
    const charPercentage = (charCount / maxChars) * 100
    const isNearLimit = maxChars - charCount <= 50

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            title="Crear nueva reseña"
        >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {error && (
                    <div role="alert" style={{ 
                        padding: '12px 16px', 
                        background: 'rgba(239, 68, 68, 0.1)', 
                        border: '1px solid rgba(239, 68, 68, 0.3)', 
                        borderRadius: '12px', 
                        color: '#ef4444', 
                        fontSize: '14px', 
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px'
                    }}>
                        <AlertCircle size={18} strokeWidth={2.5} />
                        <span style={{ fontWeight: '500' }}>{error}</span>
                    </div>
                )}

                <div className="modal-row" role="group" aria-labelledby="review-type-label">
                    <span id="review-type-label" style={{ fontSize: '15px', fontWeight: '500', color: 'var(--text-primary)', marginBottom: '4px', display: 'block' }}>¿Qué aspecto del juego deseas evaluar?</span>
                    <div className="type-buttons">
                        <button
                            className={`type-btn ${reviewType === 'artistic' ? 'active' : ''}`}
                            onClick={() => setReviewType('artistic')}
                            aria-pressed={reviewType === 'artistic'}
                            disabled={loading}
                        >
                            <Palette size={18} />
                            Artística
                        </button>
                        <button
                            className={`type-btn ${reviewType === 'technical' ? 'active' : ''}`}
                            onClick={() => setReviewType('technical')}
                            aria-pressed={reviewType === 'technical'}
                            disabled={loading}
                        >
                            <Cpu size={18} />
                            Técnica
                        </button>
                    </div>
                </div>

                <div className="modal-row" role="group" aria-labelledby="rating-label">
                    <span id="rating-label" style={{ fontSize: '15px', fontWeight: '500', color: 'var(--text-primary)', marginBottom: '4px', display: 'block' }}>Tu puntuación</span>
                    <div
                        className="star-rating"
                        role="radiogroup"
                        aria-label="Puntuacion en estrellas"
                        onMouseLeave={() => setHoverRating(0)}
                    >
                        {[1, 2, 3, 4, 5].map((s) => (
                            <button
                                key={s}
                                type="button"
                                className="star-btn"
                                onClick={() => setRating(s)}
                                onMouseEnter={() => setHoverRating(s)}
                                aria-label={`${s} estrellas`}
                                aria-checked={s === rating}
                                role="radio"
                                disabled={loading}
                                style={{
                                    transform: hoverRating === s ? 'scale(1.15)' : 'scale(1)'
                                }}
                            >
                                <Star
                                    size={30}
                                    fill={s <= (hoverRating || rating) ? "var(--primary-purple)" : "transparent"}
                                    stroke={s <= (hoverRating || rating) ? "var(--primary-purple)" : "var(--text-secondary)"}
                                    strokeWidth={s <= (hoverRating || rating) ? 0 : 1.5}
                                    aria-hidden="true"
                                    style={{ transition: 'all 0.2s' }}
                                />
                            </button>
                        ))}
                    </div>
                </div>

                <div className="modal-row">
                    <label htmlFor="review-text" style={{ fontSize: '15px', fontWeight: '500', color: 'var(--text-primary)', marginBottom: '4px', display: 'block' }}>
                        Cuéntanos más sobre tu experiencia (Opcional)
                    </label>
                    <textarea
                        id="review-text"
                        className="review-textarea"
                        placeholder="Las reseñas detalladas ayudan mucho a otros jugadores. ¿Qué te gustó más? ¿Qué podría mejorar?"
                        aria-required="false"
                        maxLength={maxChars}
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        disabled={loading}
                    ></textarea>
                    
                    <div style={{ 
                        marginTop: '8px', 
                        display: 'flex', 
                        justifyContent: 'flex-end', 
                        alignItems: 'center',
                        gap: '12px'
                    }}>
                        <div style={{ 
                            width: '100px', 
                            height: '4px', 
                            background: 'rgba(255,255,255,0.1)', 
                            borderRadius: '2px',
                            overflow: 'hidden'
                        }}>
                            <div style={{
                                width: `${charPercentage}%`,
                                height: '100%',
                                background: isNearLimit ? '#ef4444' : 'var(--primary-purple)',
                                transition: 'width 0.3s'
                            }}></div>
                        </div>
                        <span style={{ 
                            fontSize: '12px', 
                            fontWeight: '600',
                            color: isNearLimit ? '#ef4444' : 'var(--text-secondary)',
                            fontVariantNumeric: 'tabular-nums'
                        }}>
                            {charCount} / {maxChars}
                        </span>
                    </div>
                </div>

                <div className="modal-actions">
                    <button 
                        className="cancel-btn" 
                        onClick={handleClose} 
                        disabled={loading}
                    >
                        Cancelar
                    </button>
                    <button
                        className="publish-btn"
                        onClick={handlePublish}
                        disabled={rating === 0 || loading}
                    >
                        {loading ? (
                            <>
                                <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} />
                                Publicando...
                            </>
                        ) : (
                            <>
                                <Send size={16} />
                                Publicar reseña
                            </>
                        )}
                    </button>
                </div>
            </div>
        </Modal>
    )
}
