import React, { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Star, Settings, CheckCircle, ChevronDown, User, MessageSquare } from 'lucide-react'
import fallbackGameDetails from '../../data/game_details.json'
import { apiFetch } from '../../api'
import Navbar from '../../components/Navbar/Navbar'
import ReviewModal from '../../components/ReviewModal/ReviewModal'
import Footer from '../../components/Footer/Footer'

export default function GameDetails() {
    const { id } = useParams()
    const [activeTab, setActiveTab] = useState('artistic')
    const [isModalOpen, setIsModalOpen] = useState(false)

    const [game, setGame] = useState(fallbackGameDetails)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const [attempt, setAttempt] = useState(0)

    console.log('Game ID:', id)

    React.useEffect(() => {
        let mounted = true
        if (!id) return

        const fetchGame = async () => {
            setLoading(true)
            setError(null)
            try {
                const res = await apiFetch(`/api/games/${id}`)
                if (mounted && res && res.data) setGame(res.data)
                else if (mounted && res) setGame(res)
            } catch (err) {
                if (mounted) setError(err.message || 'Error al cargar datos')
            } finally {
                if (mounted) setLoading(false)
            }
        }

        fetchGame()
        return () => { mounted = false }
    }, [id, attempt])

    return (
        <div className="game-page">
            <Navbar />

            <div className="game-content-container" id="main-content" tabIndex="-1">
                {/* Lateral Izquierdo */}
                <aside className="sidebar-left" aria-label="Información lateral">
                    <h1 className="game-title-main">{game.name}</h1>
                    <img
                        src={game.image}
                        alt={`Portada de ${game.name}`}
                        className="game-poster-large"
                    />

                    <div className="score-section" aria-label="Puntuaciones">
                        <div className="score-block">
                            <span className="score-label">Puntuación artística</span>
                            <div className="score-value">
                                <Star size={24} fill="var(--primary-purple)" stroke="var(--primary-purple)" aria-hidden="true" />
                                <span>{game.artScore}</span>
                            </div>
                        </div>
                        <div className="score-block">
                            <span className="score-label">Puntuación técnica</span>
                            <div className="score-value">
                                <Settings size={24} color="var(--primary-purple)" aria-hidden="true" />
                                <span>{game.techScore}</span>
                            </div>
                        </div>
                    </div>

                    <section className="info-box" aria-labelledby="game-info-title">
                        <h3 id="game-info-title">Información del juego</h3>
                        <p>Desarrollador: {game.developer}</p>
                        <p>Editor: {game.editor}</p>
                        <p>Motor: {game.engine}</p>
                        <p>Lanzamiento: {game.releaseDate}</p>
                        <div className="tag-cloud" aria-label="Etiquetas">
                            {game.tags.map(tag => (
                                <span key={tag} className="tag">{tag}</span>
                            ))}
                        </div>
                    </section>

                    <section className="requirements-box" aria-labelledby="req-title">
                        <h3 id="req-title">Requisitos mínimos</h3>
                        <ul className="req-list">
                            <li>Processor: {game.minRequirements.processor}</li>
                            <li>Memory: {game.minRequirements.memory}</li>
                            <li>Graphics: {game.minRequirements.graphics}</li>
                            <li>DirectX: {game.minRequirements.directX}</li>
                            <li>Storage: {game.minRequirements.storage}</li>
                        </ul>
                    </section>
                </aside>

                {/* Centro Principal */}
                <main className="main-center">
                    {loading && (
                        <div role="status" aria-live="polite" style={{ padding: '12px', textAlign: 'center' }}>
                            <strong>Cargando información del juego...</strong>
                        </div>
                    )}

                    {error && (
                        <div role="alert" style={{ padding: '12px', textAlign: 'center', color: 'var(--error)' }}>
                            <div>Ocurrió un error: {error}</div>
                            <button onClick={() => setAttempt(a => a + 1)} style={{ marginTop: 8 }}>Reintentar</button>
                        </div>
                    )}
                    <nav className="breadcrumb" aria-label="Ruta de navegación">
                        <Link to="/">Inicio</Link> &gt; Juego &gt; {game.name}
                    </nav>

                    <div className="media-section">
                        <div className="video-placeholder" role="img" aria-label="Tráiler y galería de imágenes">
                            <img
                                src={game.image}
                                alt=""
                                aria-hidden="true"
                                style={{
                                    opacity: 0.3,
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover'
                                }}
                            />
                            <div className="video-overlay">
                                <div className="plus-images">+10 imágenes</div>
                                <h2>TRÁILER</h2>
                                <p>DE LANZAMIENTO</p>
                            </div>
                        </div>

                        <section className="compatibility-card" aria-labelledby="compat-title">
                            <h3 id="compat-title">¿Puedo jugarlo?</h3>
                            <div className="status-circle">
                                <CheckCircle size={64} color="#4ade80" aria-hidden="true" />
                            </div>
                            <div className="status-text">
                                Estado:
                                <span className="status-optimo">
                                    {game.compatibility.status}
                                </span>
                            </div>
                            <div className="spec-lines" aria-label="Estado de componentes">
                                <div className="spec-line">
                                    <small>CPU</small>
                                    <span>{game.compatibility.cpu}</span>
                                    <div className="bar green" role="progressbar" aria-valuenow="100" aria-valuemin="0" aria-valuemax="100"></div>
                                </div>
                                <div className="spec-line">
                                    <small>GPU</small>
                                    <span>{game.compatibility.gpu}</span>
                                    <div className="bar green" role="progressbar" aria-valuenow="100" aria-valuemin="0" aria-valuemax="100"></div>
                                </div>
                                <div className="spec-line">
                                    <small>RAM</small>
                                    <span>{game.compatibility.ram}</span>
                                    <div className="bar green" role="progressbar" aria-valuenow="100" aria-valuemin="0" aria-valuemax="100"></div>
                                </div>
                            </div>
                        </section>
                    </div>

                    <div className="synopsis-box">
                        <p>
                            <small>SINOPSIS:</small> {game.synopsis}
                        </p>
                    </div>

                    <section className="reviews-section" aria-labelledby="reviews-title">
                        <div className="reviews-header">
                            <h2 id="reviews-title">Reseñas de la comunidad</h2>
                            <div className="reviews-controls">
                                <button aria-label="Filtrar reseñas">Todas <ChevronDown size={14} aria-hidden="true" /></button>
                                <button aria-label="Ordenar reseñas">Más recientes <ChevronDown size={14} aria-hidden="true" /></button>
                                <button
                                    className="new-review-btn"
                                    onClick={() => setIsModalOpen(true)}
                                    aria-haspopup="dialog"
                                >
                                    <MessageSquare size={16} aria-hidden="true" /> Nueva reseña
                                </button>
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
                                Reseñas artísticas
                            </button>
                            <button
                                role="tab"
                                aria-selected={activeTab === 'technical'}
                                aria-controls="technical-panel"
                                id="tab-technical"
                                className={activeTab === 'technical' ? 'tab active' : 'tab'}
                                onClick={() => setActiveTab('technical')}
                            >
                                Reseñas técnicas
                            </button>
                        </div>

                        <div
                            id={`${activeTab}-panel`}
                            role="tabpanel"
                            aria-labelledby={`tab-${activeTab}`}
                        >

                            <div className="reviews-grid">
                                {game.reviews.map((review, i) => (
                                    <div key={i} className="review-card">
                                        <div className="review-user">
                                            <User size={24} aria-hidden="true" />
                                            <div>
                                                <strong>{review.user}</strong>
                                                <div className="user-pc">{review.specs}</div>
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
                                            <span className="review-date">{review.date}</span>
                                        </div>
                                        <p className="review-text">{review.content}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>

                    <div style={{ textAlign: 'center', margin: '20px 0' }}>
                        <button className="load-more-btn">Cargar más reseñas</button>
                    </div>
                </main>
            </div>

            <ReviewModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
            />
            <Footer />
        </div>
    )
}
