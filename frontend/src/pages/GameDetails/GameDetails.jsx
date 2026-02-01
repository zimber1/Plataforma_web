import React, { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Star, Settings, CheckCircle, ChevronDown, User, MessageSquare } from 'lucide-react'
import gameDetails from '../../data/game_details.json'
import Navbar from '../../components/Navbar/Navbar'
import ReviewModal from '../../components/ReviewModal/ReviewModal'
import Footer from '../../components/Footer/Footer'

export default function GameDetails() {
    const { id } = useParams()
    const [activeTab, setActiveTab] = useState('artistic')
    const [isModalOpen, setIsModalOpen] = useState(false)

    // Para este maquetado solo funciona cyberpunk (id 1)
    const game = gameDetails

    return (
        <div className="game-page">
            <Navbar />

            <div className="game-content-container">
                {/* Sidebar Left */}
                <div className="sidebar-left">
                    <h1 className="game-title-main">{game.name}</h1>
                    <img src={game.image} alt={game.name} className="game-poster-large" />

                    <div className="score-section">
                        <div className="score-block">
                            <span className="score-label">Puntuación artística</span>
                            <div className="score-value">
                                <Star size={24} fill="gold" stroke="gold" />
                                <span>{game.artScore}</span>
                            </div>
                        </div>
                        <div className="score-block">
                            <span className="score-label">Puntuación técnica</span>
                            <div className="score-value">
                                <Settings size={24} color="var(--primary-purple)" />
                                <span>{game.techScore}</span>
                            </div>
                        </div>
                    </div>

                    <div className="info-box">
                        <h3>Información del juego</h3>
                        <p>Desarrollador: {game.developer}</p>
                        <p>Editor: {game.editor}</p>
                        <p>Motor: {game.engine}</p>
                        <p>Lanzamiento: {game.releaseDate}</p>
                        <div className="tag-cloud">
                            {game.tags.map(tag => <span key={tag} className="tag">{tag}</span>)}
                        </div>
                    </div>

                    <div className="requirements-box">
                        <h3>Requisitos mínimos</h3>
                        <ul className="req-list">
                            <li>Processor: {game.minRequirements.processor}</li>
                            <li>Memory: {game.minRequirements.memory}</li>
                            <li>Graphics: {game.minRequirements.graphics}</li>
                            <li>DirectX: {game.minRequirements.directX}</li>
                            <li>Storage: {game.minRequirements.storage}</li>
                        </ul>
                    </div>
                </div>

                {/* Main Center */}
                <div className="main-center">
                    <nav className="breadcrumb">
                        Inicio &gt; Juego &gt; {game.name}
                    </nav>

                    <div className="media-section">
                        <div className="video-placeholder">
                            <img src={game.image} alt="trailer" style={{ opacity: 0.3, width: '100%', height: '100%', objectFit: 'cover' }} />
                            <div className="video-overlay">
                                <div className="plus-images">+10 imágenes</div>
                                <h2>TRÁILER</h2>
                                <p>DE LANZAMIENTO</p>
                            </div>
                        </div>

                        <div className="compatibility-card">
                            <h3>¿Puedo jugarlo?</h3>
                            <div className="status-circle">
                                <CheckCircle size={64} color="#4ade80" />
                            </div>
                            <div className="status-text">
                                Estado: <span className="status-optimo">{game.compatibility.status}</span>
                            </div>
                            <div className="spec-lines">
                                <div className="spec-line"><small>CPU</small> <span>{game.compatibility.cpu}</span><div className="bar green"></div></div>
                                <div className="spec-line"><small>GPU</small> <span>{game.compatibility.gpu}</span><div className="bar green"></div></div>
                                <div className="spec-line"><small>RAM</small> <span>{game.compatibility.ram}</span><div className="bar green"></div></div>
                            </div>
                        </div>
                    </div>

                    <div className="synopsis-box">
                        <p><small>SINOPSIS:</small> {game.synopsis}</p>
                    </div>

                    <div className="reviews-section">
                        <div className="reviews-header">
                            <h2>Reseñas de la comunidad</h2>
                            <div className="reviews-controls">
                                <span>Todas <ChevronDown size={14} /></span>
                                <span>Más recientes <ChevronDown size={14} /></span>
                                <button className="new-review-btn" onClick={() => setIsModalOpen(true)}>
                                    <MessageSquare size={16} /> Nueva reseña
                                </button>
                            </div>
                        </div>

                        <div className="tabs">
                            <button className={activeTab === 'artistic' ? 'tab active' : 'tab'} onClick={() => setActiveTab('artistic')}>Reseñas artísticas</button>
                            <button className={activeTab === 'technical' ? 'tab active' : 'tab'} onClick={() => setActiveTab('technical')}>Reseñas técnicas</button>
                        </div>

                        <div className="reviews-grid">
                            {game.reviews.map((review, i) => (
                                <div key={i} className="review-card">
                                    <div className="review-user">
                                        <User size={24} />
                                        <div>
                                            <strong>{review.user}</strong>
                                            <div className="user-pc">{review.specs}</div>
                                        </div>
                                    </div>
                                    <div className="review-stars">
                                        {[...Array(5)].map((_, j) => <Star key={j} size={14} fill={j < review.rating ? "gold" : "transparent"} stroke="gold" />)}
                                        <span className="review-date">{review.date}</span>
                                    </div>
                                    <p className="review-text">{review.content}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div style={{ textAlign: 'center', margin: '20px 0' }}>
                        <button className="load-more-btn">Cargar mas reseñas</button>
                    </div>
                </div>
            </div>

            <ReviewModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
            <Footer />
        </div>
    )
}
