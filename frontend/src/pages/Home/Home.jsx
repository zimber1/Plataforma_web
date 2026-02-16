import React from 'react'
import { Link } from 'react-router-dom'
import { Star, Clock } from 'lucide-react'
import gamesData from '../../data/games.json'
import Navbar from '../../components/Navbar/Navbar'
import Footer from '../../components/Footer/Footer'

export default function Home() {
  const topRated = gamesData.filter(game => game.category === 'top_rated')
  const latest = gamesData.filter(game => game.category === 'latest')

  return (
    <div className="app-container">
      <Navbar />

      <main id="main-content" tabIndex="-1">
        {/* Sección: Mejor valorados */}
        <section className="section" aria-labelledby="top-rated-title">
          <div className="section-header">
            <Star className="icon-purple" size={28} aria-hidden="true" />
            <h2 id="top-rated-title" className="section-title">Mejor valorados</h2>
          </div>
          <div className="games-grid">
            {topRated.map(game => (
              <Link
                key={game.id}
                to={game.id === 1 ? `/game/${game.id}` : '#'}
                style={{ textDecoration: 'none', color: 'inherit' }}
                aria-label={`Ver detalles de ${game.name}`}
              >
                <div className="game-card">
                  <img src={game.image} alt="" className="game-image" aria-hidden="true" />
                  <div className="game-info">
                    <h3 className="game-name">{game.name}</h3>
                    <p className="game-author">{game.author}</p>
                    <p className="game-genre">{game.genre}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Sección: Últimos lanzamientos */}
        <section className="section" aria-labelledby="latest-releases-title">
          <div className="section-header">
            <Clock className="icon-purple" size={28} aria-hidden="true" />
            <h2 id="latest-releases-title" className="section-title">Últimos lanzamientos</h2>
          </div>
          <div className="games-grid">
            {latest.map(game => (
              <div key={game.id} className="game-card" tabIndex="0" role="button" aria-label={`Ver detalles de ${game.name}`}>
                <img src={game.image} alt="" className="game-image" aria-hidden="true" />
                <div className="game-info">
                  <h3 className="game-name">{game.name}</h3>
                  <p className="game-author">{game.author}</p>
                  <p className="game-genre">{game.genre}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}

