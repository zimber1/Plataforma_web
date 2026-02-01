import React from 'react'
import { Link } from 'react-router-dom'
import { Hexagon, User, EyeOff } from 'lucide-react'

export default function Register() {
    return (
        <div className="auth-container">
            <header className="auth-header">
                <div className="logo">
                    <img src="/juego-de-arcade.png" alt="Logo" style={{ height: '32px', width: 'auto' }} />
                </div>
                <Link to="/login" className="btn-login" style={{ textDecoration: 'none' }}>
                    Iniciar Sesión
                </Link>
            </header>

            <div className="auth-card">
                <div className="auth-user-icon">
                    <User size={64} strokeWidth={1} color="var(--primary-purple)" />
                </div>

                <form className="auth-form" onSubmit={(e) => e.preventDefault()}>
                    <div className="form-group">
                        <label>NickName</label>
                        <input type="text" placeholder="Name" />
                    </div>

                    <div className="form-group">
                        <label>Email</label>
                        <input type="email" placeholder="Example@gmail.com" />
                    </div>

                    <div className="form-group">
                        <label>Password</label>
                        <div className="password-input-wrapper">
                            <input type="password" placeholder="Password" />
                            <EyeOff className="password-toggle" size={18} color="var(--primary-purple)" />
                        </div>
                    </div>

                    <button type="submit" className="auth-submit-btn">
                        Sign Up
                    </button>
                </form>
            </div>
        </div>
    )
}
