import React, { useState, useEffect, useCallback } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Star, Settings, CheckCircle, XCircle, AlertCircle, ChevronDown, User, MessageSquare, Loader, Cpu, Monitor, HardDrive } from 'lucide-react'
import { getGameDetails, analyzeCompatibility, getIgdbImageUrl, getIgdbScreenshotUrl } from '../../api'
import { getGameReviews } from '../../api/reviewsService'
import { useAuth } from '../../context/AuthContext'
import Navbar from '../../components/Navbar/Navbar'
import ReviewModal from '../../components/ReviewModal/ReviewModal'
import Footer from '../../components/Footer/Footer'

export default function GameDetails() {
    const { id } = useParams()
    const { isLoggedIn, user } = useAuth()

    const [activeTab, setActiveTab] = useState('artistic')
    const [isModalOpen, setIsModalOpen] = useState(false)

    // Estado del juego
    const [game, setGame] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    // Estado de reseñas
    const [reviews, setReviews] = useState([])
    const [reviewStats, setReviewStats] = useState({ artistic: { average: 0, count: 0 }, technical: { average: 0, count: 0 } })
    const [reviewPage, setReviewPage] = useState(1)
    const [hasMoreReviews, setHasMoreReviews] = useState(false)
    const [loadingReviews, setLoadingReviews] = useState(false)

    // Estado de análisis de IA
    const [analyzing, setAnalyzing] = useState(false)
    const [analysisResult, setAnalysisResult] = useState(null)

    // ── Cargar juego ──────────────────────────────
    useEffect(() => {
        let mounted = true
        if (!id) return

        async function fetchGame() {
            setLoading(true)
            setError(null)
            try {
                const res = await getGameDetails(id)
                if (mounted && res.data) {
                    setGame(res.data)
                    // Si hay análisis cacheado, mostrarlo
                    if (res.data.compatibility?.hasCache && res.data.compatibility?.analysis) {
                        setAnalysisResult(res.data.compatibility.analysis)
                    }
                }
            } catch (err) {
                if (mounted) setError(err.message || 'Error al cargar el juego')
            } finally {
                if (mounted) setLoading(false)
            }
        }

        fetchGame()
        return () => { mounted = false }
    }, [id])

    // ── Cargar reseñas ────────────────────────────
    const fetchReviews = useCallback(async (page = 1, append = false) => {
        if (!id) return
        setLoadingReviews(true)
        try {
            const res = await getGameReviews(id, { page, limit: 10 })
            if (res.data) {
                setReviewStats(res.data.stats)
                setReviews(prev => append ? [...prev, ...res.data.reviews] : res.data.reviews)
                setHasMoreReviews(res.data.pagination?.hasMore || false)
                setReviewPage(page)
            }
        } catch (err) {
            console.warn('Error cargando reseñas:', err.message)
        } finally {
            setLoadingReviews(false)
        }
    }, [id])

    useEffect(() => {
        fetchReviews(1)
    }, [fetchReviews])

    // ── Analizar compatibilidad ───────────────────
    const handleAnalyze = async () => {
        if (!isLoggedIn || !id) return
        setAnalyzing(true)
        try {
            const res = await analyzeCompatibility(id)
            setAnalysisResult(res.analysis)
        } catch (err) {
            alert(err.message || 'Error al analizar compatibilidad')
        } finally {
            setAnalyzing(false)
        }
    }

    // ── Callback cuando se publica una reseña ─────
    const handleReviewPublished = () => {
        setIsModalOpen(false)
        fetchReviews(1, false) // Recargar reseñas
    }

    // ── Cargar más reseñas ────────────────────────
    const handleLoadMore = () => {
        fetchReviews(reviewPage + 1, true)
    }

    // ── Loading / Error ───────────────────────────
    if (loading) {
        return (
            <div className="game-page">
                <Navbar />
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
                    <Loader size={48} className="icon-purple" style={{ animation: 'spin 1s linear infinite' }} />
                </div>
            </div>
        )
    }

    if (error || !game) {
        return (
            <div className="game-page">
                <Navbar />
                <div role="alert" style={{ textAlign: 'center', padding: '60px 20px' }}>
                    <AlertCircle size={64} color="#ef4444" style={{ marginBottom: '16px' }} />
                    <h2>{error || 'Juego no encontrado'}</h2>
                    <Link to="/" style={{ color: 'var(--primary-purple)', marginTop: '16px', display: 'inline-block' }}>
                        Volver al inicio
                    </Link>
                </div>
                <Footer />
            </div>
        )
    }

    // ── Extraer datos del juego ───────────────────
    const coverUrl = game.cover?.url ? getIgdbImageUrl(game.cover.url, '720p') : game.image || ''
    const gameName = game.name || 'Sin nombre'
    const summary = game.summary || game.synopsis || ''
    const genres = game.genres?.map(g => g.name) || game.tags || []
    const companies = game.involved_companies?.map(c => c.company?.name).filter(Boolean) || []
    const releaseDate = game.first_release_date
        ? new Date(game.first_release_date * 1000).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })
        : game.releaseDate || 'N/A'
    const rating = game.total_rating ? Math.round(game.total_rating) : null
    const screenshots = game.screenshots || []

    // Requisitos de Steam
    const steamReqs = game.requirements?.pc_requirements
    const compatibility = game.compatibility

    // Filtrar reseñas por tab activo
    const filteredReviews = reviews.filter(r => r.type === activeTab)

    return (
        <div className="game-page">
            <Navbar />

            <div className="game-content-container" id="main-content" tabIndex="-1">
                {/* Lateral Izquierdo */}
                <aside className="sidebar-left" aria-label="Información lateral">
                    <h1 className="game-title-main">{gameName}</h1>
                    <img
                        src={coverUrl}
                        alt={`Portada de ${gameName}`}
                        className="game-poster-large"
                    />

                    <div className="score-section" aria-label="Puntuaciones">
                        <div className="score-block">
                            <span className="score-label">Puntuación artística</span>
                            <div className="score-value">
                                <Star size={24} fill="var(--primary-purple)" stroke="var(--primary-purple)" aria-hidden="true" />
                                <span>{reviewStats.artistic.count > 0 ? `${reviewStats.artistic.average}/5` : (rating ? `${rating}/100` : 'N/A')}</span>
                            </div>
                        </div>
                        <div className="score-block">
                            <span className="score-label">Puntuación técnica</span>
                            <div className="score-value">
                                <Settings size={24} color="var(--primary-purple)" aria-hidden="true" />
                                <span>{reviewStats.technical.count > 0 ? `${reviewStats.technical.average}/5` : 'N/A'}</span>
                            </div>
                        </div>
                    </div>

                    <section className="info-box" aria-labelledby="game-info-title">
                        <h3 id="game-info-title">Información del juego</h3>
                        {companies.length > 0 && <p>Desarrollador: {companies.join(', ')}</p>}
                        <p>Lanzamiento: {releaseDate}</p>
                        {rating && <p>Rating IGDB: {rating}/100</p>}
                        <div className="tag-cloud" aria-label="Etiquetas">
                            {genres.map(tag => (
                                <span key={tag} className="tag">{tag}</span>
                            ))}
                        </div>
                    </section>

                    {/* Requisitos del sistema (Steam) */}
                    {steamReqs && (
                        <section className="requirements-box" aria-labelledby="req-title">
                            <h3 id="req-title">Requisitos del sistema</h3>
                            {steamReqs.minimum && (
                                <div
                                    className="req-list"
                                    dangerouslySetInnerHTML={{ __html: steamReqs.minimum }}
                                    style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.6' }}
                                />
                            )}
                        </section>
                    )}
                </aside>

                {/* Centro Principal */}
                <main className="main-center">
                    <nav className="breadcrumb" aria-label="Ruta de navegación">
                        <Link to="/">Inicio</Link> &gt; Juego &gt; {gameName}
                    </nav>

                    <div className="media-section">
                        <div className="video-placeholder" role="img" aria-label="Galería de imágenes">
                            <img
                                src={screenshots.length > 0 ? getIgdbScreenshotUrl(screenshots[0].url, '720p') : coverUrl}
                                alt=""
                                aria-hidden="true"
                                style={{ opacity: 0.7, width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                            {screenshots.length > 1 && (
                                <div className="video-overlay">
                                    <div className="plus-images">+{screenshots.length} imágenes</div>
                                </div>
                            )}
                        </div>

                        {/* Tarjeta de compatibilidad */}
                        <section className="compatibility-card" aria-labelledby="compat-title">
                            <h3 id="compat-title">¿Puedo jugarlo?</h3>

                            {analysisResult ? (
                                <>
                                    <div className="status-circle">
                                        {analysisResult.canRun
                                            ? <CheckCircle size={64} color="#4ade80" aria-hidden="true" />
                                            : <XCircle size={64} color="#ef4444" aria-hidden="true" />
                                        }
                                    </div>
                                    <div className="status-text">
                                        Rendimiento:
                                        <span className={analysisResult.canRun ? 'status-optimo' : ''} style={{ color: analysisResult.canRun ? '#4ade80' : '#ef4444', fontWeight: 'bold', marginLeft: '4px' }}>
                                            {analysisResult.performance || (analysisResult.canRun ? 'Compatible' : 'No compatible')}
                                        </span>
                                    </div>
                                    {analysisResult.bottleneck && analysisResult.bottleneck !== 'ninguno' && (
                                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '8px' }}>
                                            Cuello de botella: <strong>{analysisResult.bottleneck}</strong>
                                        </div>
                                    )}
                                    {analysisResult.recommendation && (
                                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '8px', fontStyle: 'italic' }}>
                                            {analysisResult.recommendation}
                                        </div>
                                    )}
                                </>
                            ) : (
                                <>
                                    {!isLoggedIn ? (
                                        <div style={{ padding: '20px 0' }}>
                                            <AlertCircle size={48} color="var(--text-secondary)" />
                                            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '12px' }}>
                                                <Link to="/login" style={{ color: 'var(--primary-purple)' }}>Inicia sesión</Link> para analizar la compatibilidad con tu PC
                                            </p>
                                        </div>
                                    ) : (
                                        <div style={{ padding: '20px 0' }}>
                                            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                                                {compatibility?.message || 'Analiza si tu PC puede correr este juego'}
                                            </p>
                                            <button
                                                onClick={handleAnalyze}
                                                disabled={analyzing}
                                                style={{
                                                    background: 'var(--primary-purple)',
                                                    color: '#121212',
                                                    border: 'none',
                                                    borderRadius: '8px',
                                                    padding: '10px 20px',
                                                    fontWeight: 'bold',
                                                    cursor: analyzing ? 'not-allowed' : 'pointer',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '8px',
                                                    margin: '0 auto'
                                                }}
                                            >
                                                {analyzing && <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} />}
                                                {analyzing ? 'Analizando...' : 'Analizar compatibilidad'}
                                            </button>
                                        </div>
                                    )}
                                </>
                            )}
                        </section>
                    </div>

                    {/* Sinopsis */}
                    {summary && (
                        <div className="synopsis-box">
                            <p>
                                <small>SINOPSIS:</small> {summary}
                            </p>
                        </div>
                    )}

                    {/* Sección de reseñas */}
                    <section className="reviews-section" aria-labelledby="reviews-title">
                        <div className="reviews-header">
                            <h2 id="reviews-title">Reseñas de la comunidad</h2>
                            <div className="reviews-controls">
                                {isLoggedIn && (
                                    <button
                                        className="new-review-btn"
                                        onClick={() => setIsModalOpen(true)}
                                        aria-haspopup="dialog"
                                    >
                                        <MessageSquare size={16} aria-hidden="true" /> Nueva reseña
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="tabs" role="tablist" aria-label="Categorías de reseñas">
                            <button
                                role="tab"
                                aria-selected={activeTab === 'artistic'}
                                aria-controls="artistic-panel"
                                id="tab-artistic"
                                className={activeTab === 'artistic' ? 'tab active' : 'tab'}
                                onClick={() => setActiveTab('artistic')}
                            >
                                Artísticas ({reviewStats.artistic.count})
                            </button>
                            <button
                                role="tab"
                                aria-selected={activeTab === 'technical'}
                                aria-controls="technical-panel"
                                id="tab-technical"
                                className={activeTab === 'technical' ? 'tab active' : 'tab'}
                                onClick={() => setActiveTab('technical')}
                            >
                                Técnicas ({reviewStats.technical.count})
                            </button>
                        </div>

                        <div
                            id={`${activeTab}-panel`}
                            role="tabpanel"
                            aria-labelledby={`tab-${activeTab}`}
                        >
                            {loadingReviews && reviews.length === 0 && (
                                <div style={{ textAlign: 'center', padding: '30px' }}>
                                    <Loader size={28} style={{ animation: 'spin 1s linear infinite' }} className="icon-purple" />
                                </div>
                            )}

                            {!loadingReviews && filteredReviews.length === 0 && (
                                <p style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '30px' }}>
                                    No hay reseñas {activeTab === 'artistic' ? 'artísticas' : 'técnicas'} aún.
                                    {isLoggedIn && ' ¡Sé el primero en dejar una!'}
                                </p>
                            )}

                            <div className="reviews-grid">
                                {filteredReviews.map((review) => (
                                    <div key={review._id} className="review-card">
                                        <div className="review-user">
                                            <User size={24} aria-hidden="true" />
                                            <div>
                                                <strong>{review.username}</strong>
                                                {review.pcSpecs && (
                                                    <div className="user-pc">
                                                        {[review.pcSpecs.cpu, review.pcSpecs.gpu, review.pcSpecs.ram ? `${review.pcSpecs.ram}GB RAM` : null]
                                                            .filter(Boolean)
                                                            .join(' | ') || 'Sin specs'}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="review-stars">
                                            {[...Array(5)].map((_, j) => (
                                                <Star
                                                    key={j}
                                                    size={14}
                                                    fill={j < review.rating ? "var(--primary-purple)" : 'transparent'}
                                                    stroke="var(--primary-purple)"
                                                    aria-hidden="true"
                                                />
                                            ))}
                                            <span className="review-date">
                                                {new Date(review.createdAt).toLocaleDateString('es-MX')}
                                            </span>
                                        </div>
                                        <p className="review-text">{review.comment || 'Sin comentario'}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>

                    {hasMoreReviews && (
                        <div style={{ textAlign: 'center', margin: '20px 0' }}>
                            <button
                                className="load-more-btn"
                                onClick={handleLoadMore}
                                disabled={loadingReviews}
                                style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                            >
                                {loadingReviews && <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} />}
                                Cargar más reseñas
                            </button>
                        </div>
                    )}
                </main>
            </div>

            <ReviewModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                gameId={parseInt(id)}
                onPublished={handleReviewPublished}
            />
            <Footer />
        </div>
    )
}
