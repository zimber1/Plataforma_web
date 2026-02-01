import React from 'react'
import { Link } from 'react-router-dom'
import { Search, UserPlus, Hexagon } from 'lucide-react'

export default function Navbar() {
    return (
        <header className="header">
            <div className="logo">
                <Link to="/">
                    <img src="/juego-de-arcade.png" alt="Logo" style={{ height: '32px', width: 'auto' }} />
                </Link>
            </div>
            <div className="search-bar-container">
                <div className="search-input-wrapper">
                    <input
                        type="text"
                        className="search-bar"
                        placeholder="Escribe aquí para comenzar a buscar juegos..."
                    />
                    <Search className="search-icon" size={18} />
                </div>
            </div>
            <div className="user-actions">
                <Link to="/login" className="btn-login" style={{ textDecoration: 'none' }}>
                    Iniciar Sesión
                </Link>
                <Link to="/register" className="btn-signup" style={{ textDecoration: 'none' }}>
                    <UserPlus size={18} /> Registrarse
                </Link>
            </div>
        </header>
    )
}
