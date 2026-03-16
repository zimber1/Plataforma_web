import React, { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { Star, Clock, CalendarClock, Loader, RefreshCw } from 'lucide-react'
import { getTopRatedGames, getLatestGames, getComingSoonGames, getIgdbImageUrl } from '../../api'
import Navbar from '../../components/Navbar/Navbar'
import Footer from '../../components/Footer/Footer'

// ---------- helpers ----------

const getCoverUrl = (game) => {
    if (typeof game.cover === 'string') return game.cover || ''
    if (game.cover?.url) return getIgdbImageUrl(game.cover.url, 'cover_big')
    return ''
}

const getRating = (game) =>
    game.rating !== undefined
        ? game.rating
        : game.total_rating
        ? Math.round(game.total_rating)
        : null

const getDateDisplay = (game) => {
    if (game.year !== undefined) return game.year !== 'N/A' ? String(game.year) : ''
    if (game.first_release_date) {
        return new Date(game.first_release_date * 1000).toLocaleDateString('es-MX', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        })
    }
    return ''
}

// ---------- sub-componentes ----------

function GameCard({ game }) {
    const coverUrl   = getCoverUrl(game)
    const ratingVal  = getRating(game)
    const dateDisplay = getDateDisplay(game)

    return (
        <Link
            to={`/game/${game.id}`}
            className="game-card group"
            style={{ textDecoration: 'none', color: 'inherit' }}
            aria-label={`Ver detalles de ${game.name}${dateDisplay ? `, ${dateDisplay}` : ''}`}
        >
            <div className="game-image-wrapper">
                {coverUrl ? (
                    <img src={coverUrl} alt="" className="game-image" aria-hidden="true" loading="lazy" />
                ) : (
                    <div className="game-image-placeholder" aria-hidden="true">
                        <span className="placeholder-text">Sin imagen</span>
                    </div>
                )}
                {ratingVal && ratingVal !== 'N/A' && (
                    <div className="game-rating-badge">
                        <Star size={14} fill="currentColor" strokeWidth={0} />
                        <span>{ratingVal}</span>
                    </div>
                )}
            </div>
            <div className="game-info">
                <h3 className="game-name" title={game.name}>{game.name}</h3>
                {dateDisplay && <p className="game-author">{dateDisplay}</p>}
            </div>
        </Link>
    )
}

function SectionState({ loading, error, empty, onRetry }) {
    if (loading) {
        return (
            <div
                role="status"
                aria-label="Cargando juegos"
                style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}
            >
                <Loader
                    size={32}
                    className="icon-purple"
                    style={{ animation: 'spin 1s linear infinite' }}
                    aria-hidden="true"
                />
            </div>
        )
    }

    if (error) {
        return (
            <div role="alert" style={{ textAlign: 'center', padding: '20px', color: 'var(--error, #ef4444)' }}>
                <p>Error al cargar: {error}</p>
                {onRetry && (
                    <button
                        onClick={onRetry}
                        style={{
                            marginTop: '8px',
                            padding: '8px 16px',
                            background: 'var(--primary-purple)',
                            border: 'none',
                            borderRadius: '8px',
                            color: '#fff',
                            cursor: 'pointer',
                            fontWeight: 'bold',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                        }}
                    >
                        <RefreshCw size={14} aria-hidden="true" />
                        Reintentar
                    </button>
                )}
            </div>
        )
    }

    if (empty) {
        return (
            <p style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '20px' }}>
                No se encontraron juegos en esta categoría.
            </p>
        )
    }

    return null
}

function Section({ id, title, icon, games, loading, error, onRetry }) {
    const sectionId = `section-title-${id}`
    const showGrid  = !loading && !error && games.length > 0

    return (
        <section className="section" aria-labelledby={sectionId}>
            <div className="section-header">
                {icon}
                <h2 id={sectionId} className="section-title">{title}</h2>
            </div>

            <SectionState
                loading={loading}
                error={error}
                empty={!loading && !error && games.length === 0}
                onRetry={onRetry}
            />

            {showGrid && (
                <div className="games-grid" role="list" aria-label={`Juegos: ${title}`}>
                    {games.map((game) => (
                        <div key={game.id} role="listitem">
                            <GameCard game={game} />
                        </div>
                    ))}
                </div>
            )}
        </section>
    )
}

// ---------- hook de fetch reutilizable ----------

function useFetch(fetchFn) {
    const [data,    setData]    = useState([])
    const [loading, setLoading] = useState(true)
    const [error,   setError]   = useState(null)

    const load = useCallback(async () => {
        let mounted = true
        setLoading(true)
        setError(null)
        try {
            const res = await fetchFn()
            if (mounted) setData(res.data || [])
        } catch (err) {
            if (mounted) setError(err.message || 'Error desconocido')
        } finally {
            if (mounted) setLoading(false)
        }
        return () => { mounted = false }
    }, [fetchFn])

    useEffect(() => { load() }, [load])

    return { data, loading, error, retry: load }
}

// ---------- página ----------

export default function Home() {
    const topRated   = useFetch(getTopRatedGames)
    const latest     = useFetch(getLatestGames)
    const comingSoon = useFetch(getComingSoonGames)

    // Sacamos 8 juegos aleatorios o los 8 primeros para el fondo tipo collage del hero
    const heroGames = topRated.data.slice(0, 14)

    return (
        <div className="app-container">
            <Navbar />

            <main id="main-content" tabIndex="-1">
                <div className="home-hero">
                    {/* Fondo estilo Netflix/Apple */}
                    <div className="home-hero-bg">
                        {heroGames.length > 0 && (
                            <div className="hero-grid-bg">
                                {heroGames.map((game, i) => {
                                    const cUrl = getCoverUrl(game)
                                    return cUrl ? (
                                        <div key={`hero-bg-${game.id}-${i}`} className="hero-bg-item">
                                            <img src={cUrl} alt="" aria-hidden="true" />
                                        </div>
                                    ) : null
                                })}
                            </div>
                        )}
                        <div className="hero-gradient-overlay"></div>
                    </div>

                    <div className="home-hero-content">
                        <h1 className="hero-title">
                            Descubre y califica los <br/> <span className="text-gradient">mejores juegos</span>
                        </h1>
                        <p className="hero-subtitle">
                            Explora una base de datos interminable, comparte tus reseñas y encuentra tu próxima gran aventura.
                        </p>
                    </div>
                </div>

                <Section
                    id="top-rated"
                    title="Mejor valorados"
                    icon={<Star className="icon-purple" size={28} aria-hidden="true" />}
                    games={topRated.data}
                    loading={topRated.loading}
                    error={topRated.error}
                    onRetry={topRated.retry}
                />

                <Section
                    id="latest"
                    title="Últimos lanzamientos"
                    icon={<Clock className="icon-purple" size={28} aria-hidden="true" />}
                    games={latest.data}
                    loading={latest.loading}
                    error={latest.error}
                    onRetry={latest.retry}
                />

                <Section
                    id="coming-soon"
                    title="Próximamente"
                    icon={<CalendarClock className="icon-purple" size={28} aria-hidden="true" />}
                    games={comingSoon.data}
                    loading={comingSoon.loading}
                    error={comingSoon.error}
                    onRetry={comingSoon.retry}
                />
            </main>

            <Footer />
        </div>
    )
}