import React, { useState, useEffect, useCallback, useRef } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
    Star, Settings, CheckCircle, XCircle, AlertCircle,
    User, MessageSquare, Loader, Cpu, Monitor, HardDrive, ChevronDown,
} from 'lucide-react'
import { getGameDetails, analyzeCompatibility, getIgdbImageUrl, getIgdbScreenshotUrl, getGameReviews } from '../../api'
import { useAuth } from '../../context/AuthContext'
import Navbar from '../../components/Navbar/Navbar'
import ReviewModal from '../../components/ReviewModal/ReviewModal'
import ImageGallery from '../../components/Common/ImageGallery'
import Footer from '../../components/Footer/Footer'

// ─── StarRating ───────────────────────────────────────────────────────────────

function StarRating({ value, label }) {
    return (
        <span aria-label={`${value} de 5 estrellas`} style={{ display: 'inline-flex', gap: '2px' }}>
            {[1, 2, 3, 4, 5].map((i) => (
                <Star
                    key={i}
                    size={14}
                    fill={i <= value ? 'var(--primary-purple)' : 'transparent'}
                    stroke="var(--primary-purple)"
                    aria-hidden="true"
                />
            ))}
            {label && <span className="sr-only">{label}</span>}
        </span>
    )
}

// ─── ReviewSpecs ──────────────────────────────────────────────────────────────

function ReviewSpecs({ pcSpecs }) {
    const specs = [
        { key: 'cpu', icon: <Cpu     size={10} aria-hidden="true" />, label: 'CPU' },
        { key: 'gpu', icon: <Monitor size={10} aria-hidden="true" />, label: 'GPU' },
        { key: 'ram', icon: <HardDrive size={10} aria-hidden="true" />, label: 'RAM' },
    ]
    const visible = specs.filter(({ key }) => {
        const v = pcSpecs?.[key]
        return v && v !== 'N/A' && v !== '0' && v !== 0
    })
    if (!visible.length) return null

    return (
        <dl className="review-specs-container" aria-label="PC del autor al escribir la reseña">
            {visible.map(({ key, icon, label }) => (
                <div key={key} className="review-spec-item">
                    <dt className="sr-only">{label}</dt>
                    <dd style={{ display: 'flex', alignItems: 'center', gap: '4px', margin: 0 }}>
                        {icon}
                        <span>{pcSpecs[key]}</span>
                    </dd>
                </div>
            ))}
        </dl>
    )
}

// ─── ReviewCard ───────────────────────────────────────────────────────────────

function ReviewCard({ review, currentUserId }) {
    const isOwn = currentUserId && review.userId === currentUserId
    const date = new Date(review.createdAt).toLocaleDateString('es-MX', {
        day: 'numeric', month: 'short', year: 'numeric',
    })

    return (
        <article
            className="review-card"
            aria-label={`Reseña de ${review.username}, ${review.rating} de 5 estrellas`}
        >
            <div className="review-user">
                <div
                    aria-hidden="true"
                    style={{
                        width: '36px', height: '36px', borderRadius: '50%', flexShrink: 0,
                        background: 'rgba(var(--primary-purple-rgb, 99,60,180), 0.1)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                >
                    <User size={18} color="var(--primary-purple)" />
                </div>
                <div style={{ minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                        <strong style={{ fontSize: '14px' }}>{review.username}</strong>
                        {isOwn && (
                            <span style={{
                                fontSize: '11px', padding: '1px 7px', borderRadius: '20px',
                                background: 'rgba(var(--primary-purple-rgb, 99,60,180), 0.12)',
                                color: 'var(--primary-purple)', fontWeight: '500',
                            }}>
                                Tú
                            </span>
                        )}
                    </div>
                    <ReviewSpecs pcSpecs={review.pcSpecs} />
                </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '10px 0 8px', flexWrap: 'wrap' }}>
                <StarRating value={review.rating} />
                <time
                    dateTime={review.createdAt}
                    className="review-date"
                    style={{ fontSize: '12px', color: 'var(--text-secondary, #6b7280)' }}
                >
                    {date}
                </time>
            </div>

            {review.comment
                ? <p className="review-text" style={{ margin: 0, fontSize: '14px', lineHeight: '1.6' }}>{review.comment}</p>
                : <p className="review-text" style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)', fontStyle: 'italic' }}>Sin comentario</p>
            }
        </article>
    )
}

// ─── ScoreSummary ─────────────────────────────────────────────────────────────

function ScoreSummary({ stats, tab }) {
    const s = stats[tab]
    if (!s || s.count === 0) return null
    return (
        <div
            aria-label={`Promedio ${s.average} de 5, basado en ${s.count} reseñas`}
            style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '10px 14px', borderRadius: '10px', marginBottom: '20px',
                background: 'rgba(var(--primary-purple-rgb, 99,60,180), 0.06)',
            }}
        >
            <span style={{ fontSize: '28px', fontWeight: '700', color: 'var(--primary-purple)', lineHeight: 1 }} aria-hidden="true">
                {s.average}
            </span>
            <div>
                <StarRating value={Math.round(s.average)} />
                <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--text-secondary, #6b7280)' }}>
                    Basado en {s.count} {s.count === 1 ? 'reseña' : 'reseñas'}
                </p>
            </div>
        </div>
    )
}

// ─── GameDetails ──────────────────────────────────────────────────────────────

export default function GameDetails() {
    const { id } = useParams()
    const { isLoggedIn, user } = useAuth()

    const [activeTab,     setActiveTab]     = useState('artistic')
    const [isModalOpen,   setIsModalOpen]   = useState(false)
    const [isGalleryOpen, setIsGalleryOpen] = useState(false)
    const [galleryIndex,  setGalleryIndex]  = useState(0)

    // Juego
    const [game,    setGame]    = useState(null)
    const [loading, setLoading] = useState(true)
    const [error,   setError]   = useState(null)

    // Reseñas
    const [reviews,       setReviews]       = useState([])
    const [reviewStats,   setReviewStats]   = useState({ artistic: { average: 0, count: 0 }, technical: { average: 0, count: 0 } })
    const [reviewPage,    setReviewPage]    = useState(1)
    const [hasMore,       setHasMore]       = useState(false)
    const [loadingReviews,  setLoadingReviews]  = useState(false)
    const [loadingMore,     setLoadingMore]     = useState(false)
    const [reviewsError,    setReviewsError]    = useState(null)

    // Análisis IA
    const [analyzing,      setAnalyzing]      = useState(false)
    const [analysisResult, setAnalysisResult] = useState(null)
    const [analysisError,  setAnalysisError]  = useState(null)

    const panelRef = useRef(null)

    // ── cargar juego ──────────────────────────────────────────────────────────

    useEffect(() => {
        let mounted = true
        if (!id) return
        setLoading(true)
        setError(null)

        getGameDetails(id)
            .then(res => {
                if (!mounted) return
                if (res.data) {
                    setGame(res.data)
                    if (res.data.compatibility?.hasCache && res.data.compatibility?.analysis) {
                        setAnalysisResult(res.data.compatibility.analysis)
                    }
                }
            })
            .catch(err => { if (mounted) setError(err.message || 'Error al cargar el juego') })
            .finally(() => { if (mounted) setLoading(false) })

        return () => { mounted = false }
    }, [id])

    // ── cargar reseñas ────────────────────────────────────────────────────────

    const fetchReviews = useCallback(async (page = 1, append = false) => {
        if (!id) return
        append ? setLoadingMore(true) : setLoadingReviews(true)
        setReviewsError(null)
        try {
            const res = await getGameReviews(id, { page, limit: 10 })
            if (res.data) {
                setReviewStats(res.data.stats)
                setReviews(prev => append ? [...prev, ...res.data.reviews] : res.data.reviews)
                setHasMore(res.data.pagination?.hasMore || false)
                setReviewPage(page)
            }
        } catch (err) {
            setReviewsError(err.message || 'No se pudieron cargar las reseñas.')
        } finally {
            setLoadingReviews(false)
            setLoadingMore(false)
        }
    }, [id])

    useEffect(() => { fetchReviews(1) }, [fetchReviews])

    // ── análisis IA ───────────────────────────────────────────────────────────

    const handleAnalyze = async () => {
        if (!isLoggedIn || !id) return
        setAnalyzing(true)
        setAnalysisError(null)
        try {
            const res = await analyzeCompatibility(id)
            setAnalysisResult(res.analysis)
        } catch (err) {
            setAnalysisError(err.message || 'Error al analizar compatibilidad')
        } finally {
            setAnalyzing(false)
        }
    }

    // ── publicar reseña ───────────────────────────────────────────────────────

    const handleReviewPublished = useCallback(() => {
        setIsModalOpen(false)
        fetchReviews(1, false)
    }, [fetchReviews])

    // ── tabs con teclado (flecha ←→) ──────────────────────────────────────────

    const handleTabKeyDown = (e, tab) => {
        if (e.key === 'ArrowRight') { e.preventDefault(); setActiveTab(tab === 'artistic' ? 'technical' : 'artistic') }
        if (e.key === 'ArrowLeft')  { e.preventDefault(); setActiveTab(tab === 'technical' ? 'artistic'  : 'technical') }
    }

    const openGallery = (index = 0) => { setGalleryIndex(index); setIsGalleryOpen(true) }

    // ── estados de carga / error de página ────────────────────────────────────

    if (loading) {
        return (
            <div className="game-page">
                <Navbar />
                <div role="status" aria-label="Cargando juego" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
                    <Loader size={48} className="icon-purple" style={{ animation: 'spin 1s linear infinite' }} aria-hidden="true" />
                </div>
            </div>
        )
    }

    if (error || !game) {
        return (
            <div className="game-page">
                <Navbar />
                <div role="alert" style={{ textAlign: 'center', padding: '60px 20px' }}>
                    <AlertCircle size={64} color="#ef4444" style={{ marginBottom: '16px' }} aria-hidden="true" />
                    <h2>{error || 'Juego no encontrado'}</h2>
                    <Link to="/" style={{ color: 'var(--primary-purple)', marginTop: '16px', display: 'inline-block' }}>
                        Volver al inicio
                    </Link>
                </div>
                <Footer />
            </div>
        )
    }

    // ── datos derivados ────────────────────────────────────────────────────────

    const coverUrl       = game.cover?.url ? getIgdbImageUrl(game.cover.url, '720p') : game.image || ''
    const gameName       = game.name || 'Sin nombre'
    const summary        = game.summary || game.synopsis || ''
    const genres         = game.genres?.map(g => g.name) || game.tags || []
    const companies      = game.involved_companies?.map(c => c.company?.name).filter(Boolean) || []
    const releaseDate    = game.first_release_date
        ? new Date(game.first_release_date * 1000).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })
        : game.releaseDate || 'N/A'
    const rating         = game.total_rating ? Math.round(game.total_rating) : null
    const screenshots    = game.screenshots || []
    const screenshotUrls = screenshots.map(s => getIgdbScreenshotUrl(s.url, '720p'))
    const steamReqs      = game.requirements?.pc_requirements
    const compatibility  = game.compatibility
    const currentUserId  = user?.id || user?._id
    const filteredReviews = reviews.filter(r => r.type === activeTab)

    // ── render ─────────────────────────────────────────────────────────────────

    return (
        <div className="game-page">
            <Navbar />

            <div className="game-content-container" id="main-content" tabIndex="-1">

                {/* ── Sidebar ── */}
                <aside className="sidebar-left" aria-label="Información del juego">
                    <h1 className="game-title-main">{gameName}</h1>
                    <img src={coverUrl} alt={`Portada de ${gameName}`} className="game-poster-large" />

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
                        {companies.length > 0 && <p><strong>Desarrollador:</strong> {companies.join(', ')}</p>}
                        <p><strong>Lanzamiento:</strong> {releaseDate}</p>
                        {rating && <p><strong>Rating IGDB:</strong> {rating}/100</p>}
                        {genres.length > 0 && (
                            <div className="tag-cloud" aria-label="Géneros">
                                {genres.map(tag => <span key={tag} className="tag">{tag}</span>)}
                            </div>
                        )}
                    </section>

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

                {/* ── Centro ── */}
                <main className="main-center">
                    <nav className="breadcrumb" aria-label="Ruta de navegación">
                        <Link to="/">Inicio</Link>
                        <span aria-hidden="true"> › </span>
                        <span aria-current="page">{gameName}</span>
                    </nav>

                    <div className="media-section">
                        {/* Hero screenshot */}
                        <div
                            className="video-placeholder"
                            role="button"
                            tabIndex="0"
                            aria-label={`Ver galería de ${gameName} (${screenshots.length} imágenes)`}
                            onClick={() => openGallery(0)}
                            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openGallery(0) } }}
                            style={{ cursor: 'pointer' }}
                        >
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

                        {/* Compatibilidad */}
                        <section className="compatibility-card" aria-labelledby="compat-title">
                            <h3 id="compat-title">¿Puedo jugarlo?</h3>

                            {analysisResult ? (
                                <>
                                    <div className="status-circle">
                                        {analysisResult.canRun
                                            ? <CheckCircle size={64} color="#4ade80" aria-label="Compatible" />
                                            : <XCircle    size={64} color="#ef4444" aria-label="No compatible" />
                                        }
                                    </div>
                                    <div className="status-text">
                                        Rendimiento:
                                        <span style={{ color: analysisResult.canRun ? '#4ade80' : '#ef4444', fontWeight: 'bold', marginLeft: '4px' }}>
                                            {analysisResult.performance || (analysisResult.canRun ? 'Compatible' : 'No compatible')}
                                        </span>
                                    </div>
                                    {analysisResult.bottleneck && analysisResult.bottleneck !== 'ninguno' && (
                                        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '8px' }}>
                                            Cuello de botella: <strong>{analysisResult.bottleneck}</strong>
                                        </p>
                                    )}
                                    {analysisResult.recommendation && (
                                        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '8px', fontStyle: 'italic' }}>
                                            {analysisResult.recommendation}
                                        </p>
                                    )}
                                </>
                            ) : !isLoggedIn ? (
                                <div style={{ padding: '20px 0', textAlign: 'center' }}>
                                    <AlertCircle size={48} color="var(--text-secondary)" aria-hidden="true" />
                                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '12px' }}>
                                        <Link to="/login" style={{ color: 'var(--primary-purple)' }}>Inicia sesión</Link> para analizar la compatibilidad con tu PC
                                    </p>
                                </div>
                            ) : (
                                <div style={{ padding: '20px 0', textAlign: 'center' }}>
                                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                                        {compatibility?.message || 'Analiza si tu PC puede correr este juego'}
                                    </p>
                                    {analysisError && (
                                        <p role="alert" style={{ fontSize: '13px', color: '#ef4444', marginBottom: '10px' }}>
                                            {analysisError}
                                        </p>
                                    )}
                                    <button
                                        onClick={handleAnalyze}
                                        disabled={analyzing}
                                        aria-busy={analyzing}
                                        style={{
                                            background: 'var(--primary-purple)', color: '#fff',
                                            border: 'none', borderRadius: '8px', padding: '10px 20px',
                                            fontWeight: 'bold', cursor: analyzing ? 'not-allowed' : 'pointer',
                                            display: 'inline-flex', alignItems: 'center', gap: '8px',
                                            opacity: analyzing ? 0.7 : 1, margin: '0 auto',
                                        }}
                                    >
                                        {analyzing && <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} aria-hidden="true" />}
                                        {analyzing ? 'Analizando...' : 'Analizar compatibilidad'}
                                    </button>
                                </div>
                            )}
                        </section>
                    </div>

                    {/* Sinopsis */}
                    {summary && (
                        <div className="synopsis-box">
                            <p><small>SINOPSIS:</small> {summary}</p>
                        </div>
                    )}

                    {/* ── Reseñas ── */}
                    <section className="reviews-section" aria-labelledby="reviews-title">

                        {/* Cabecera */}
                        <div className="reviews-header">
                            <h2 id="reviews-title" style={{ margin: 0 }}>Reseñas de la comunidad</h2>
                            {isLoggedIn ? (
                                <button
                                    className="new-review-btn"
                                    onClick={() => setIsModalOpen(true)}
                                    aria-haspopup="dialog"
                                    aria-label="Escribir una nueva reseña"
                                >
                                    <MessageSquare size={16} aria-hidden="true" /> Nueva reseña
                                </button>
                            ) : (
                                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0 }}>
                                    <Link to="/login" style={{ color: 'var(--primary-purple)' }}>Inicia sesión</Link> para dejar tu reseña
                                </p>
                            )}
                        </div>

                        {/* Tabs */}
                        <div role="tablist" aria-label="Categorías de reseñas" className="tabs">
                            {['artistic', 'technical'].map((tab) => {
                                const label    = tab === 'artistic' ? 'Artísticas' : 'Técnicas'
                                const count    = reviewStats[tab].count
                                const isActive = activeTab === tab
                                return (
                                    <button
                                        key={tab}
                                        role="tab"
                                        id={`tab-${tab}`}
                                        aria-selected={isActive}
                                        aria-controls={`panel-${tab}`}
                                        className={`tab${isActive ? ' active' : ''}`}
                                        tabIndex={isActive ? 0 : -1}
                                        onClick={() => setActiveTab(tab)}
                                        onKeyDown={(e) => handleTabKeyDown(e, tab)}
                                    >
                                        {label}
                                        <span
                                            aria-label={`${count} reseñas`}
                                            style={{
                                                marginLeft: '6px', fontSize: '12px',
                                                padding: '1px 7px', borderRadius: '20px',
                                                background: isActive ? 'rgba(var(--primary-purple-rgb,99,60,180),0.18)' : 'rgba(0,0,0,0.07)',
                                                color: isActive ? 'var(--primary-purple)' : 'var(--text-secondary,#6b7280)',
                                                fontWeight: '500', transition: 'background 0.15s',
                                            }}
                                        >
                                            {count}
                                        </span>
                                    </button>
                                )
                            })}
                        </div>

                        {/* Panel */}
                        <div
                            id={`panel-${activeTab}`}
                            role="tabpanel"
                            aria-labelledby={`tab-${activeTab}`}
                            ref={panelRef}
                            tabIndex={-1}
                            style={{ outline: 'none' }}
                        >
                            {/* Promedio */}
                            <ScoreSummary stats={reviewStats} tab={activeTab} />

                            {/* Cargando */}
                            {loadingReviews && (
                                <div role="status" aria-label="Cargando reseñas" style={{ textAlign: 'center', padding: '30px' }}>
                                    <Loader size={28} style={{ animation: 'spin 1s linear infinite' }} className="icon-purple" aria-hidden="true" />
                                </div>
                            )}

                            {/* Error */}
                            {reviewsError && !loadingReviews && (
                                <div role="alert" style={{
                                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px',
                                    padding: '28px', borderRadius: '10px', textAlign: 'center',
                                    background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.18)',
                                }}>
                                    <AlertCircle size={28} color="#ef4444" aria-hidden="true" />
                                    <p style={{ margin: 0, fontSize: '14px', color: '#ef4444' }}>{reviewsError}</p>
                                    <button
                                        onClick={() => fetchReviews(1)}
                                        style={{ padding: '7px 18px', borderRadius: '8px', border: 'none', background: 'var(--primary-purple)', color: '#fff', cursor: 'pointer', fontSize: '13px', fontWeight: '500' }}
                                    >
                                        Reintentar
                                    </button>
                                </div>
                            )}

                            {/* Vacío */}
                            {!loadingReviews && !reviewsError && filteredReviews.length === 0 && (
                                <div style={{ textAlign: 'center', padding: '36px 20px', color: 'var(--text-secondary)' }}>
                                    <MessageSquare size={36} style={{ opacity: 0.3, marginBottom: '12px' }} aria-hidden="true" />
                                    <p style={{ margin: '0 0 4px', fontSize: '15px' }}>
                                        No hay reseñas {activeTab === 'artistic' ? 'artísticas' : 'técnicas'} aún
                                    </p>
                                    {isLoggedIn && (
                                        <button
                                            onClick={() => setIsModalOpen(true)}
                                            style={{ background: 'none', border: 'none', color: 'var(--primary-purple)', cursor: 'pointer', padding: 0, fontSize: '13px', textDecoration: 'underline' }}
                                        >
                                            ¡Sé el primero en dejar una!
                                        </button>
                                    )}
                                </div>
                            )}

                            {/* Grid */}
                            {!loadingReviews && !reviewsError && filteredReviews.length > 0 && (
                                <div className="reviews-grid" role="list" aria-label={`Reseñas ${activeTab === 'artistic' ? 'artísticas' : 'técnicas'}`}>
                                    {filteredReviews.map((review) => (
                                        <div key={review._id} role="listitem">
                                            <ReviewCard review={review} currentUserId={currentUserId} />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Cargar más */}
                        {hasMore && !loadingReviews && !reviewsError && (
                            <div style={{ textAlign: 'center', margin: '24px 0 8px' }}>
                                <button
                                    className="load-more-btn"
                                    onClick={() => fetchReviews(reviewPage + 1, true)}
                                    disabled={loadingMore}
                                    aria-busy={loadingMore}
                                    style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                                >
                                    {loadingMore
                                        ? <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} aria-hidden="true" />
                                        : <ChevronDown size={16} aria-hidden="true" />
                                    }
                                    {loadingMore ? 'Cargando...' : 'Cargar más reseñas'}
                                </button>
                            </div>
                        )}
                    </section>
                </main>
            </div>

            <ReviewModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                gameId={parseInt(id)}
                onPublished={handleReviewPublished}
                defaultType={activeTab}
            />

            <ImageGallery
                isOpen={isGalleryOpen}
                onClose={() => setIsGalleryOpen(false)}
                images={screenshotUrls}
                initialIndex={galleryIndex}
            />

            <Footer />
        </div>
    )
}