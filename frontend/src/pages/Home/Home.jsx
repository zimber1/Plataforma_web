import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Star, Clock, TrendingUp, Loader } from 'lucide-react'
import { getTopRatedGames, getLatestGames, getIgdbImageUrl } from '../../api'
import Navbar from '../../components/Navbar/Navbar'
import Footer from '../../components/Footer/Footer'

export default function Home() {
  const navigate = useNavigate()

  const [topRated, setTopRated] = useState([])
  const [latest, setLatest] = useState([])
  const [loadingTop, setLoadingTop] = useState(true)
  const [loadingLatest, setLoadingLatest] = useState(true)
  const [errorTop, setErrorTop] = useState(null)
  const [errorLatest, setErrorLatest] = useState(null)

  // Cargar juegos mejor puntuados
  useEffect(() => {
    let mounted = true
    async function fetchTopRated() {
      try {
        setLoadingTop(true)
        const res = await getTopRatedGames()
        if (mounted) setTopRated(res.data || [])
      } catch (err) {
        if (mounted) setErrorTop(err.message)
      } finally {
        if (mounted) setLoadingTop(false)
      }
    }
    fetchTopRated()
    return () => { mounted = false }
  }, [])

  // Cargar últimos lanzamientos
  useEffect(() => {
    let mounted = true
    async function fetchLatest() {
      try {
        setLoadingLatest(true)
        const res = await getLatestGames()
        if (mounted) setLatest(res.data || [])
      } catch (err) {
        if (mounted) setErrorLatest(err.message)
      } finally {
        if (mounted) setLoadingLatest(false)
      }
    }
    fetchLatest()
    return () => { mounted = false }
  }, [])

  const renderGameCard = (game) => {
    const coverUrl = game.cover?.url
      ? getIgdbImageUrl(game.cover.url, 'cover_big')
      : ''

    return (
      <Link
        key={game.id}
        to={`/game/${game.id}`}
        style={{ textDecoration: 'none', color: 'inherit' }}
        aria-label={`Ver detalles de ${game.name}`}
      >
        <div className="game-card">
          {coverUrl ? (
            <img src={coverUrl} alt="" className="game-image" aria-hidden="true" />
          ) : (
            <div className="game-image" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#2a2a2a' }}>
              <span style={{ fontSize: '12px', color: '#666' }}>Sin imagen</span>
            </div>
          )}
          <div className="game-info">
            <h3 className="game-name">{game.name}</h3>
            {game.total_rating && (
              <p className="game-genre" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Star size={12} aria-hidden="true" /> {Math.round(game.total_rating)}/100
              </p>
            )}
            {game.first_release_date && (
              <p className="game-author">
                {new Date(game.first_release_date * 1000).toLocaleDateString('es-MX', { year: 'numeric', month: 'short' })}
              </p>
            )}
          </div>
        </div>
      </Link>
    )
  }

  const renderSection = (title, icon, games, loading, error, retryFn) => (
    <section className="section" aria-labelledby={`${title.replace(/\s/g, '-')}-title`}>
      <div className="section-header">
        {icon}
        <h2 id={`${title.replace(/\s/g, '-')}-title`} className="section-title">{title}</h2>
      </div>

      {loading && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
          <Loader size={32} className="icon-purple" style={{ animation: 'spin 1s linear infinite' }} aria-label="Cargando" />
        </div>
      )}

      {error && !loading && (
        <div role="alert" style={{ textAlign: 'center', padding: '20px', color: 'var(--error, #ef4444)' }}>
          <p>Error: {error}</p>
          {retryFn && (
            <button onClick={retryFn} style={{ marginTop: '8px', padding: '8px 16px', background: 'var(--primary-purple)', border: 'none', borderRadius: '8px', color: '#121212', cursor: 'pointer', fontWeight: 'bold' }}>
              Reintentar
            </button>
          )}
        </div>
      )}

      {!loading && !error && games.length === 0 && (
        <p style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '20px' }}>
          No se encontraron juegos en esta categoría.
        </p>
      )}

      {!loading && !error && games.length > 0 && (
        <div className="games-grid">
          {games.map(game => renderGameCard(game))}
        </div>
      )}
    </section>
  )

  return (
    <div className="app-container">
      <Navbar />

      <main id="main-content" tabIndex="-1">
        {renderSection(
          'Mejor valorados',
          <Star className="icon-purple" size={28} aria-hidden="true" />,
          topRated,
          loadingTop,
          errorTop
        )}

        {renderSection(
          'Últimos lanzamientos',
          <Clock className="icon-purple" size={28} aria-hidden="true" />,
          latest,
          loadingLatest,
          errorLatest
        )}
      </main>
      <Footer />
    </div>
  )
}
