import React, { useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, User } from 'lucide-react'
import { apiFetch } from '../../api'

const validateEmail = (email) => {
    if (!email) return 'El email es requerido.'
    // simple email regex
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!re.test(email)) return 'Formato de email inválido.'
    return ''
}

const validatePassword = (password) => {
    if (!password) return 'La contraseña es requerida.'
    return ''
}

export default function Login() {
    const navigate = useNavigate()
    const emailRef = useRef(null)
    const passwordRef = useRef(null)

    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [errors, setErrors] = useState({})
    const [submitted, setSubmitted] = useState(false)
    const [loading, setLoading] = useState(false)
    const [apiError, setApiError] = useState(null)

    const runValidation = () => {
        const e = {}
        const emailError = validateEmail(email.trim())
        if (emailError) e.email = emailError
        const pwError = validatePassword(password)
        if (pwError) e.password = pwError
        return e
    }

    const handleSubmit = (e) => {
        e.preventDefault()
        setSubmitted(true)
        const eErrors = runValidation()
        setErrors(eErrors)

        if (Object.keys(eErrors).length > 0) {
            // focus first invalid field
            if (eErrors.email) {
                emailRef.current?.focus()
            } else if (eErrors.password) {
                passwordRef.current?.focus()
            }
            return
        }

        // Try real API login; if network unreachable, fall back to simulated login for local dev
        setLoading(true)
        setApiError(null)
        apiFetch('/api/auth/login', { method: 'POST', body: { email: email.trim(), password } })
            .then((res) => {
                setLoading(false)
                // If API returns token/session, you should store it here (omitted)
                navigate('/')
            })
            .catch((err) => {
                setLoading(false)
                setApiError(err.message || 'Error de autenticación')
                // Fallback: if network error (no status) allow simulated login to continue for dev
                if (!err.status) {
                    console.warn('API no disponible, simulando login localmente')
                    navigate('/')
                }
            })
    }

    const formInvalid = () => {
        const eErrors = runValidation()
        return Object.keys(eErrors).length > 0
    }

    return (
        <div className="auth-container">
            <header className="auth-header">
                <div className="logo">
                    <img src="/juego-de-arcade.png" alt="Logo" style={{ height: '32px', width: 'auto' }} />
                </div>
                <button className="back-button" onClick={() => navigate('/') } aria-label="Volver al inicio">
                    <ArrowLeft size={24} color="var(--primary-purple)" />
                </button>
            </header>

            <div className="auth-card">
                <div className="auth-user-icon">
                    <User size={64} strokeWidth={1} color="var(--primary-purple)" />
                </div>

                <form className="auth-form" onSubmit={handleSubmit} noValidate role="form">
                    <div className="form-group">
                        <label htmlFor="email">Email</label>
                        <input
                            id="email"
                            ref={emailRef}
                            type="email"
                            placeholder="Example@gmail.com"
                            value={email}
                            onChange={(ev) => setEmail(ev.target.value)}
                            aria-invalid={errors.email ? 'true' : 'false'}
                            aria-describedby={errors.email ? 'email-error' : undefined}
                        />
                        {errors.email && (
                            <div id="email-error" role="alert" style={{ color: 'var(--error)', marginTop: '4px' }}>
                                {errors.email}
                            </div>
                        )}
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">Contraseña</label>
                        <input
                            id="password"
                            ref={passwordRef}
                            type="password"
                            placeholder="Password"
                            value={password}
                            onChange={(ev) => setPassword(ev.target.value)}
                            aria-invalid={errors.password ? 'true' : 'false'}
                            aria-describedby={errors.password ? 'password-error' : undefined}
                        />
                        {errors.password && (
                            <div id="password-error" role="alert" style={{ color: 'var(--error)', marginTop: '4px' }}>
                                {errors.password}
                            </div>
                        )}
                    </div>

                    <button type="submit" className="auth-submit-btn" disabled={formInvalid()} aria-disabled={formInvalid()}>
                        Inició Sesión
                    </button>
                    {submitted && Object.keys(errors).length > 0 && (
                        <div role="alert" style={{ marginTop: '8px', color: 'var(--error)' }}>
                            Por favor corrige los errores en el formulario.
                        </div>
                    )}
                </form>

                <p className="auth-footer">
                    ¿No tienes cuenta? <Link to="/register">Registrate</Link>
                </p>
            </div>
        </div>
    )
}
