import React, { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Search, UserPlus, LogOut, User } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { searchGames, getIgdbImageUrl } from '../../api'

export default function Navbar() {
    const { isLoggedIn, user, logoutUser } = useAuth()
    const navigate = useNavigate()

    const [query, setQuery] = useState('')
    const [suggestions, setSuggestions] = useState([])
    const [showSuggestions, setShowSuggestions] = useState(false)
    const [searchLoading, setSearchLoading] = useState(false)
    const searchRef = useRef(null)
    const debounceRef = useRef(null)

    // Buscar juegos con debounce
    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current)

        if (query.length < 2) {
            setSuggestions([])
            return
        }

        debounceRef.current = setTimeout(async () => {
            try {
                setSearchLoading(true)
                const res = await searchGames(query)
                setSuggestions(res.data || [])
                setShowSuggestions(true)
            } catch (err) {
                console.warn('Error buscando juegos:', err.message)
                setSuggestions([])
            } finally {
                setSearchLoading(false)
            }
        }, 300)

        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current)
        }
    }, [query])

    // Cerrar sugerencias al hacer clic fuera
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (searchRef.current && !searchRef.current.contains(e.target)) {
                setShowSuggestions(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const handleSelectGame = (game) => {
        setQuery('')
        setSuggestions([])
        setShowSuggestions(false)
        navigate(`/game/${game.id}`)
    }

    const handleLogout = () => {
        logoutUser()
        navigate('/')
    }

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

            {/* Barra de búsqueda con autocompletado real */}
            <div className="search-bar-container" role="search" ref={searchRef}>
                <div className="search-input-wrapper">
                    <label htmlFor="global-search" className="sr-only">Buscar juegos</label>
                    <input
                        id="global-search"
                        type="text"
                        className="search-bar"
                        placeholder="Escribe aquí para comenzar a buscar juegos..."
                        aria-label="Buscar juegos en la plataforma"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                        autoComplete="off"
                    />
                    <Search className="search-icon" size={18} aria-hidden="true" />
                </div>

                {/* Dropdown de sugerencias */}
                {showSuggestions && (
                    <div className="search-suggestions" role="listbox" aria-label="Sugerencias de búsqueda">
                        {searchLoading && (
                            <div className="suggestion-item loading">Buscando...</div>
                        )}
                        {!searchLoading && suggestions.length === 0 && query.length >= 2 && (
                            <div className="suggestion-item empty">No se encontraron juegos</div>
                        )}
                        {suggestions.map((game) => (
                            <button
                                key={game.id}
                                className="suggestion-item"
                                role="option"
                                onClick={() => handleSelectGame(game)}
                            >
                                {game.cover?.url && (
                                    <img
                                        src={getIgdbImageUrl(game.cover.url, 'cover_small')}
                                        alt=""
                                        className="suggestion-cover"
                                        aria-hidden="true"
                                    />
                                )}
                                <span className="suggestion-name">{game.name}</span>
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Acciones del usuario */}
            <div className="user-actions">
                {isLoggedIn ? (
                    <>
                        <Link to="/profile" className="btn-user-logged" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <User size={18} aria-hidden="true" />
                            {user?.username || 'Perfil'}
                        </Link>
                        <button
                            className="btn-logout-small"
                            onClick={handleLogout}
                            aria-label="Cerrar sesión"
                        >
                            <LogOut size={16} aria-hidden="true" /> Salir
                        </button>
                    </>
                ) : (
                    <>
                        <Link to="/login" className="btn-login" style={{ textDecoration: 'none' }}>
                            Iniciar Sesión
                        </Link>
                        <Link to="/register" className="btn-signup" style={{ textDecoration: 'none' }}>
                            <UserPlus size={18} aria-hidden="true" /> Registrarse
                        </Link>
                    </>
                )}
            </div>
        </header>
    )
}
