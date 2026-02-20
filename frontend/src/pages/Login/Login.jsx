import React, { useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, User, Loader } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

const validateEmail = (email) => {
    if (!email) return 'El email es requerido.'
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
    const { loginUser, isLoggedIn } = useAuth()
    const emailRef = useRef(null)
    const passwordRef = useRef(null)

    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [errors, setErrors] = useState({})
    const [submitted, setSubmitted] = useState(false)
    const [loading, setLoading] = useState(false)
    const [apiError, setApiError] = useState(null)

    // Redirigir si ya está logueado
    React.useEffect(() => {
        if (isLoggedIn) navigate('/')
    }, [isLoggedIn, navigate])

    const runValidation = () => {
        const e = {}
        const emailError = validateEmail(email.trim())
        if (emailError) e.email = emailError
        const pwError = validatePassword(password)
        if (pwError) e.password = pwError
        return e
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setSubmitted(true)
        const eErrors = runValidation()
        setErrors(eErrors)

        if (Object.keys(eErrors).length > 0) {
            if (eErrors.email) emailRef.current?.focus()
            else if (eErrors.password) passwordRef.current?.focus()
            return
        }

        setLoading(true)
        setApiError(null)

        try {
            await loginUser(email.trim(), password)
            navigate('/')
        } catch (err) {
            setApiError(err.message || 'Error de autenticación')
        } finally {
            setLoading(false)
        }
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
                <button className="back-button" onClick={() => navigate('/')} aria-label="Volver al inicio">
                    <ArrowLeft size={24} color="var(--primary-purple)" />
                </button>
            </header>

            <div className="auth-card">
                <div className="auth-user-icon">
                    <User size={64} strokeWidth={1} color="var(--primary-purple)" />
                </div>

                <form className="auth-form" onSubmit={handleSubmit} noValidate role="form">
                    {apiError && (
                        <div role="alert" style={{ padding: '12px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', color: '#ef4444', fontSize: '14px', textAlign: 'center' }}>
                            {apiError}
                        </div>
                    )}

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
                            disabled={loading}
                        />
                        {errors.email && (
                            <div id="email-error" role="alert" style={{ color: 'var(--error, #ef4444)', marginTop: '4px', fontSize: '13px' }}>
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
                            disabled={loading}
                        />
                        {errors.password && (
                            <div id="password-error" role="alert" style={{ color: 'var(--error, #ef4444)', marginTop: '4px', fontSize: '13px' }}>
                                {errors.password}
                            </div>
                        )}
                    </div>

                    <button
                        type="submit"
                        className="auth-submit-btn"
                        disabled={formInvalid() || loading}
                        aria-disabled={formInvalid() || loading}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                    >
                        {loading && <Loader size={18} style={{ animation: 'spin 1s linear infinite' }} aria-hidden="true" />}
                        {loading ? 'Iniciando...' : 'Iniciar Sesión'}
                    </button>

                    {submitted && Object.keys(errors).length > 0 && (
                        <div role="alert" style={{ marginTop: '8px', color: 'var(--error, #ef4444)', fontSize: '13px', textAlign: 'center' }}>
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
