import React, { useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { User, EyeOff, Eye, Loader, Cpu, Monitor, HardDrive } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import HardwareAutocomplete from '../../components/Common/HardwareAutocomplete'

// -- Validaciones del formulario --

const validateUsername = (val) => {
    if (!val) return 'El nombre de usuario es requerido.'
    if (val.length < 3) return 'Minimo 3 caracteres.'
    return ''
}

const validateEmail = (val) => {
    if (!val) return 'El email es requerido.'
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!re.test(val)) return 'Formato de email invalido.'
    return ''
}

const validatePassword = (val) => {
    if (!val) return 'La contrasena es requerida.'
    if (val.length < 6) return 'Minimo 6 caracteres.'
    return ''
}

export default function Register() {
    const navigate = useNavigate()
    const { registerUser, isLoggedIn } = useAuth()

    const usernameRef = useRef(null)
    const emailRef = useRef(null)
    const passwordRef = useRef(null)

    const [username, setUsername] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [showPw, setShowPw] = useState(false)
    const [errors, setErrors] = useState({})
    const [submitted, setSubmitted] = useState(false)
    const [loading, setLoading] = useState(false)
    const [apiError, setApiError] = useState(null)

    // Specs de PC (opcionales)
    const [cpu, setCpu] = useState('')
    const [gpu, setGpu] = useState('')
    const [ram, setRam] = useState('')

    // Redirigir si ya esta logueado
    React.useEffect(() => {
        if (isLoggedIn) navigate('/')
    }, [isLoggedIn, navigate])

    const runValidation = () => {
        const e = {}
        const uErr = validateUsername(username.trim())
        if (uErr) e.username = uErr
        const eErr = validateEmail(email.trim())
        if (eErr) e.email = eErr
        const pErr = validatePassword(password)
        if (pErr) e.password = pErr
        return e
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setSubmitted(true)
        const eErrors = runValidation()
        setErrors(eErrors)

        if (Object.keys(eErrors).length > 0) {
            if (eErrors.username) usernameRef.current?.focus()
            else if (eErrors.email) emailRef.current?.focus()
            else if (eErrors.password) passwordRef.current?.focus()
            return
        }

        setLoading(true)
        setApiError(null)

        try {
            // Armar payload con specs opcionales
            const payload = {
                username: username.trim(),
                email: email.trim(),
                password,
            }

            // Solo incluir pcSpecs si al menos un campo tiene valor
            if (cpu || gpu || ram) {
                payload.pcSpecs = { cpu, gpu, ram }
            }

            await registerUser(payload)
            navigate('/')
        } catch (err) {
            setApiError(err.message || 'Error al registrar')
        } finally {
            setLoading(false)
        }
    }

    const formInvalid = () => Object.keys(runValidation()).length > 0

    return (
        <div className="auth-container">
            <header className="auth-header">
                <div className="logo">
                    <img src="/juego-de-arcade.png" alt="Logo" style={{ height: '32px', width: 'auto' }} />
                </div>
                <Link to="/login" className="btn-login" style={{ textDecoration: 'none' }}>
                    Iniciar Sesion
                </Link>
            </header>

            <div className="auth-card auth-card-wide">
                <div className="auth-user-icon">
                    <User size={64} strokeWidth={1} color="var(--primary-purple)" />
                </div>

                <form className="auth-form" onSubmit={handleSubmit} noValidate role="form">
                    {apiError && (
                        <div role="alert" style={{ padding: '12px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', color: '#ef4444', fontSize: '14px', textAlign: 'center' }}>
                            {apiError}
                        </div>
                    )}

                    {/* Seccion: Datos de cuenta */}
                    <div className="register-section">
                        <h3 className="register-section-title">Datos de cuenta</h3>
                        <div className="register-fields">
                            <div className="form-group">
                                <label htmlFor="username">NickName</label>
                                <input
                                    id="username"
                                    ref={usernameRef}
                                    type="text"
                                    placeholder="Nombre de usuario"
                                    value={username}
                                    onChange={(ev) => setUsername(ev.target.value)}
                                    aria-invalid={errors.username ? 'true' : 'false'}
                                    aria-describedby={errors.username ? 'username-error' : undefined}
                                    disabled={loading}
                                />
                                {errors.username && (
                                    <div id="username-error" role="alert" style={{ color: '#ef4444', marginTop: '4px', fontSize: '13px' }}>
                                        {errors.username}
                                    </div>
                                )}
                            </div>

                            <div className="form-group">
                                <label htmlFor="reg-email">Email</label>
                                <input
                                    id="reg-email"
                                    ref={emailRef}
                                    type="email"
                                    placeholder="Example@gmail.com"
                                    value={email}
                                    onChange={(ev) => setEmail(ev.target.value)}
                                    aria-invalid={errors.email ? 'true' : 'false'}
                                    aria-describedby={errors.email ? 'reg-email-error' : undefined}
                                    disabled={loading}
                                />
                                {errors.email && (
                                    <div id="reg-email-error" role="alert" style={{ color: '#ef4444', marginTop: '4px', fontSize: '13px' }}>
                                        {errors.email}
                                    </div>
                                )}
                            </div>

                            <div className="form-group">
                                <label htmlFor="reg-password">Password</label>
                                <div className="password-input-wrapper">
                                    <input
                                        id="reg-password"
                                        ref={passwordRef}
                                        type={showPw ? 'text' : 'password'}
                                        placeholder="Minimo 6 caracteres"
                                        value={password}
                                        onChange={(ev) => setPassword(ev.target.value)}
                                        aria-invalid={errors.password ? 'true' : 'false'}
                                        aria-describedby={errors.password ? 'reg-pw-error' : undefined}
                                        disabled={loading}
                                    />
                                    <button
                                        type="button"
                                        className="password-toggle"
                                        onClick={() => setShowPw(!showPw)}
                                        aria-label={showPw ? 'Ocultar contrasena' : 'Mostrar contrasena'}
                                        style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                                    >
                                        {showPw
                                            ? <Eye size={18} color="var(--primary-purple)" />
                                            : <EyeOff size={18} color="var(--primary-purple)" />
                                        }
                                    </button>
                                </div>
                                {errors.password && (
                                    <div id="reg-pw-error" role="alert" style={{ color: '#ef4444', marginTop: '4px', fontSize: '13px' }}>
                                        {errors.password}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Seccion: Specs de PC (opcional) */}
                    <div className="register-section">
                        <h3 className="register-section-title">
                            <Cpu size={18} color="var(--primary-purple)" aria-hidden="true" />
                            Specs de PC
                            <span className="register-optional">(opcional)</span>
                        </h3>
                        <p className="register-specs-hint">
                            Ingresa tus specs para obtener analisis de compatibilidad personalizados.
                        </p>
                        <div className="register-fields">
                            <HardwareAutocomplete
                                type="cpu"
                                value={cpu}
                                onChange={setCpu}
                                label="Procesador (CPU)"
                                placeholder="Ej: Ryzen 5 5600X..."
                                disabled={loading}
                            />
                            <HardwareAutocomplete
                                type="gpu"
                                value={gpu}
                                onChange={setGpu}
                                label="Tarjeta grafica (GPU)"
                                placeholder="Ej: RTX 3060..."
                                disabled={loading}
                            />
                            <HardwareAutocomplete
                                type="ram"
                                value={ram}
                                onChange={setRam}
                                label="Memoria RAM"
                                placeholder="Ej: 16GB DDR4..."
                                disabled={loading}
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="auth-submit-btn"
                        disabled={formInvalid() || loading}
                        aria-disabled={formInvalid() || loading}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                    >
                        {loading && <Loader size={18} style={{ animation: 'spin 1s linear infinite' }} aria-hidden="true" />}
                        {loading ? 'Registrando...' : 'Registrarse'}
                    </button>

                    {submitted && Object.keys(errors).length > 0 && (
                        <div role="alert" style={{ marginTop: '8px', color: '#ef4444', fontSize: '13px', textAlign: 'center' }}>
                            Por favor corrige los errores en el formulario.
                        </div>
                    )}
                </form>

                <p className="auth-footer">
                    Ya tienes cuenta? <Link to="/login">Iniciar Sesion</Link>
                </p>
            </div>
        </div>
    )
}
