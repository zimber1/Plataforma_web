import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Hexagon, ArrowLeft, User } from 'lucide-react'

export default function Login() {
    const navigate = useNavigate()

    return (
        <div className="auth-container">
            <header className="auth-header">
                <div className="logo">
                    <img src="/juego-de-arcade.png" alt="Logo" style={{ height: '32px', width: 'auto' }} />
                </div>
                <button className="back-button" onClick={() => navigate('/')}>
                    <ArrowLeft size={24} color="var(--primary-purple)" />
                </button>
            </header>

            <div className="auth-card">
                <div className="auth-user-icon">
                    <User size={64} strokeWidth={1} color="var(--primary-purple)" />
                </div>

                <form className="auth-form" onSubmit={(e) => e.preventDefault()}>
                    <div className="form-group">
                        <label>Email</label>
                        <input type="email" placeholder="Example@gmail.com" />
                    </div>

                    <div className="form-group">
                        <label>Contraseña</label>
                        <input type="password" placeholder="Password" />
                    </div>

                    <button type="submit" className="auth-submit-btn">
                        Inició Sesión
                    </button>
                </form>

                <p className="auth-footer">
                    ¿No tienes cuenta? <Link to="/register">Registrate</Link>
                </p>
            </div>
        </div>
    )
}
