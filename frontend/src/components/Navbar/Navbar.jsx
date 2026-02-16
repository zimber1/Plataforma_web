import React from 'react'
import { Link } from 'react-router-dom'
import { Search, UserPlus, Hexagon } from 'lucide-react'

export default function Navbar() {
    return (
        <header className="header">
            <a href="#main-content" className="sr-only focus:not-sr-only" style={{ top: '10px', left: '10px', padding: '10px', background: 'var(--primary-purple)', color: 'black', zIndex: 1001, borderRadius: '4px' }}>
                Saltar al contenido principal
            </a>
            <div className="logo">
                <Link to="/" aria-label="Ir al inicio">
                    <img src="/juego-de-arcade.png" alt="Plataforma Web Logo" style={{ height: '32px', width: 'auto' }} />
                </Link>
            </div>
            <div className="search-bar-container" role="search">
                <div className="search-input-wrapper">
                    <label htmlFor="global-search" className="sr-only">Buscar juegos</label>
                    <input
                        id="global-search"
                        type="text"
                        className="search-bar"
                        placeholder="Escribe aquí para comenzar a buscar juegos..."
                        aria-label="Buscar juegos en la plataforma"
                    />
                    <Search className="search-icon" size={18} aria-hidden="true" />
                </div>
            </div>
            <div className="user-actions">
                <Link to="/login" className="btn-login" style={{ textDecoration: 'none' }}>
                    Iniciar Sesión
                </Link>
                <Link to="/register" className="btn-signup" style={{ textDecoration: 'none' }}>
                    <UserPlus size={18} aria-hidden="true" /> Registrarse
                </Link>
            </div>
        </header>
    )
}

