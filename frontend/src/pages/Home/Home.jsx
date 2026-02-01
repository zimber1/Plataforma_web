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

      {/* Top Rated Section */}
      <section className="section">
        <div className="section-header">
          <Star className="icon-purple" size={28} />
          <h2 className="section-title">Mejor valorados</h2>
        </div>
        <div className="games-grid">
          {topRated.map(game => (
            <Link key={game.id} to={game.id === 1 ? `/game/${game.id}` : '#'} style={{ textDecoration: 'none', color: 'inherit' }}>
              <div className="game-card">
                <img src={game.image} alt={game.name} className="game-image" />
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

      {/* Latest Releases Section */}
      <section className="section">
        <div className="section-header">
          <Clock className="icon-purple" size={28} />
          <h2 className="section-title">Últimos lanzamientos</h2>
        </div>
        <div className="games-grid">
          {latest.map(game => (
            <div key={game.id} className="game-card">
              <img src={game.image} alt={game.name} className="game-image" />
              <div className="game-info">
                <h3 className="game-name">{game.name}</h3>
                <p className="game-author">{game.author}</p>
                <p className="game-genre">{game.genre}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
      <Footer />
    </div>
  )
}
