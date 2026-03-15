import React, { useRef, useState, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { User, EyeOff, Eye, Loader, Cpu } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import HardwareAutocomplete from '../../components/Common/HardwareAutocomplete'

// -- Validaciones --

const validateUsername = (val) => {
    if (!val) return 'El nombre de usuario es requerido.'
    if (val.length < 3) return 'Mínimo 3 caracteres.'
    return ''
}

const validateEmail = (val) => {
    if (!val) return 'El email es requerido.'
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!re.test(val)) return 'Formato de email inválido.'
    return ''
}

// Requisitos individuales de contraseña
const PW_RULES = [
    { id: 'length', label: 'Mínimo 8 caracteres',  test: (v) => v.length >= 8 },
    { id: 'upper',  label: 'Al menos 1 mayúscula',  test: (v) => /[A-Z]/.test(v) },
    { id: 'lower',  label: 'Al menos 1 minúscula',  test: (v) => /[a-z]/.test(v) },
    { id: 'number', label: 'Al menos 1 número',     test: (v) => /[0-9]/.test(v) },
]

const validatePassword = (val) => {
    if (!val) return 'La contraseña es requerida.'
    const failing = PW_RULES.filter((r) => !r.test(val))
    if (failing.length > 0) return 'La contraseña no cumple los requisitos.'
    return ''
}

const validateConfirm = (val, pw) => {
    if (!val) return 'Por favor confirma tu contraseña.'
    if (val !== pw) return 'Las contraseñas no coinciden.'
    return ''
}

export default function Register() {
    const navigate = useNavigate()
    const { registerUser, isLoggedIn } = useAuth()

    const usernameRef = useRef(null)
    const emailRef    = useRef(null)
    const passwordRef = useRef(null)
    const confirmRef  = useRef(null)

    const [username,    setUsername]    = useState('')
    const [email,       setEmail]       = useState('')
    const [password,    setPassword]    = useState('')
    const [confirm,     setConfirm]     = useState('')
    const [showPw,      setShowPw]      = useState(false)
    const [showConfirm, setShowConfirm] = useState(false)
    const [errors,      setErrors]      = useState({})
    const [touched,     setTouched]     = useState({})
    const [submitted,   setSubmitted]   = useState(false)
    const [loading,     setLoading]     = useState(false)
    const [apiError,    setApiError]    = useState(null)
    const [capsLock,    setCapsLock]    = useState(false)

    // Specs de PC (opcionales)
    const [cpu, setCpu] = useState('')
    const [gpu, setGpu] = useState('')
    const [ram, setRam] = useState('')

    // Redirigir si ya está logueado
    React.useEffect(() => {
        if (isLoggedIn) navigate('/')
    }, [isLoggedIn, navigate])

    const runValidation = useCallback(() => {
        const e = {}
        const uErr = validateUsername(username.trim())
        if (uErr) e.username = uErr
        const eErr = validateEmail(email.trim())
        if (eErr) e.email = eErr
        const pErr = validatePassword(password)
        if (pErr) e.password = pErr
        const cErr = validateConfirm(confirm, password)
        if (cErr) e.confirm = cErr
        return e
    }, [username, email, password, confirm])

    const handleBlur = (field) => {
        setTouched((prev) => ({ ...prev, [field]: true }))
        const eErrors = runValidation()
        setErrors((prev) => ({ ...prev, [field]: eErrors[field] || '' }))
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setSubmitted(true)
        setTouched({ username: true, email: true, password: true, confirm: true })
        const eErrors = runValidation()
        setErrors(eErrors)

        if (Object.keys(eErrors).length > 0) {
            if (eErrors.username)      usernameRef.current?.focus()
            else if (eErrors.email)    emailRef.current?.focus()
            else if (eErrors.password) passwordRef.current?.focus()
            else if (eErrors.confirm)  confirmRef.current?.focus()
            return
        }

        setLoading(true)
        setApiError(null)

        try {
            const payload = {
                username: username.trim(),
                email: email.trim(),
                password,
            }
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

    const handleCapsLock = (e) => setCapsLock(e.getModifierState('CapsLock'))

    const toggleShowPw = () => {
        setShowPw((prev) => !prev)
        setTimeout(() => passwordRef.current?.focus(), 0)
    }

    const toggleShowConfirm = () => {
        setShowConfirm((prev) => !prev)
        setTimeout(() => confirmRef.current?.focus(), 0)
    }

    const pwChecks = PW_RULES.map((r) => ({ ...r, passed: r.test(password) }))

    const eyeBtnStyle = (disabled) => ({
        background: 'none',
        border: 'none',
        cursor: disabled ? 'not-allowed' : 'pointer',
        display: 'flex',
        alignItems: 'center',
        opacity: disabled ? 0.4 : 0.7,
        transition: 'opacity 0.15s',
        borderRadius: '4px',
        outline: 'none',
    })

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

            <div className="auth-card auth-card-wide">

                {/* Ícono + título */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', marginBottom: '28px' }}>
                    <div
                        aria-hidden="true"
                        style={{
                            background: 'rgba(var(--primary-purple-rgb, 99, 60, 180), 0.08)',
                            borderRadius: '50%',
                            padding: '16px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        <User size={48} strokeWidth={1.25} color="var(--primary-purple)" />
                    </div>
                    <div style={{ textAlign: 'center' }}>
                        <h1 style={{ margin: '0 0 6px', fontSize: '22px', fontWeight: '600', color: 'var(--text-primary, #b47dfc)', letterSpacing: '-0.3px' }}>
                            Crea tu cuenta
                        </h1>
                        <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-secondary, #6b7280)', lineHeight: '1.5' }}>
                            Regístrate gratis y empieza a jugar
                        </p>
                    </div>
                </div>

                {/* Error de API */}
                <div role="status" aria-live="polite" aria-atomic="true">
                    {apiError && (
                        <div style={{
                            padding: '12px',
                            background: 'rgba(239,68,68,0.08)',
                            border: '1px solid rgba(239,68,68,0.25)',
                            borderRadius: '8px',
                            color: '#ef4444',
                            fontSize: '14px',
                            textAlign: 'center',
                            marginBottom: '16px',
                        }}>
                            {apiError}
                        </div>
                    )}
                </div>

                <form
                    className="auth-form"
                    onSubmit={handleSubmit}
                    noValidate
                    role="form"
                    aria-label="Formulario de registro"
                >
                    {/* ── Sección: Datos de cuenta ── */}
                    <div className="register-section">
                        <h2 className="register-section-title">Datos de cuenta</h2>
                        <div className="register-fields">

                            {/* Username */}
                            <div className="form-group">
                                <label htmlFor="username">Nombre de usuario</label>
                                <input
                                    id="username"
                                    ref={usernameRef}
                                    type="text"
                                    placeholder="Nombre de usuario"
                                    value={username}
                                    autoComplete="username"
                                    onChange={(ev) => {
                                        setUsername(ev.target.value)
                                        if (touched.username) {
                                            const err = validateUsername(ev.target.value.trim())
                                            setErrors((prev) => ({ ...prev, username: err }))
                                        }
                                    }}
                                    onBlur={() => handleBlur('username')}
                                    aria-required="true"
                                    aria-invalid={touched.username && errors.username ? 'true' : 'false'}
                                    aria-describedby={touched.username && errors.username ? 'username-error' : undefined}
                                    disabled={loading}
                                />
                                {touched.username && errors.username && (
                                    <div id="username-error" role="alert" style={{ color: '#ef4444', marginTop: '4px', fontSize: '13px' }}>
                                        {errors.username}
                                    </div>
                                )}
                            </div>

                            {/* Email */}
                            <div className="form-group">
                                <label htmlFor="reg-email">Email</label>
                                <input
                                    id="reg-email"
                                    ref={emailRef}
                                    type="email"
                                    placeholder="ejemplo@correo.com"
                                    value={email}
                                    autoComplete="email"
                                    onChange={(ev) => {
                                        setEmail(ev.target.value)
                                        if (touched.email) {
                                            const err = validateEmail(ev.target.value.trim())
                                            setErrors((prev) => ({ ...prev, email: err }))
                                        }
                                    }}
                                    onBlur={() => handleBlur('email')}
                                    aria-required="true"
                                    aria-invalid={touched.email && errors.email ? 'true' : 'false'}
                                    aria-describedby={touched.email && errors.email ? 'reg-email-error' : undefined}
                                    disabled={loading}
                                />
                                {touched.email && errors.email && (
                                    <div id="reg-email-error" role="alert" style={{ color: '#ef4444', marginTop: '4px', fontSize: '13px' }}>
                                        {errors.email}
                                    </div>
                                )}
                            </div>

                            {/* Contraseña */}
                            <div className="form-group">
                                <label htmlFor="reg-password">Contraseña</label>
                                <div className="password-input-wrapper">
                                    <input
                                        id="reg-password"
                                        ref={passwordRef}
                                        type={showPw ? 'text' : 'password'}
                                        placeholder="Mínimo 8 caracteres"
                                        value={password}
                                        autoComplete="new-password"
                                        onChange={(ev) => {
                                            setPassword(ev.target.value)
                                            if (touched.password) {
                                                const err = validatePassword(ev.target.value)
                                                setErrors((prev) => ({ ...prev, password: err }))
                                            }
                                            if (touched.confirm) {
                                                const cErr = validateConfirm(confirm, ev.target.value)
                                                setErrors((prev) => ({ ...prev, confirm: cErr }))
                                            }
                                        }}
                                        onBlur={() => handleBlur('password')}
                                        onKeyUp={handleCapsLock}
                                        onKeyDown={handleCapsLock}
                                        aria-required="true"
                                        aria-invalid={touched.password && errors.password ? 'true' : 'false'}
                                        aria-describedby={[
                                            'pw-checks',
                                            touched.password && errors.password ? 'reg-pw-error' : '',
                                            capsLock ? 'reg-caps-warning' : '',
                                        ].filter(Boolean).join(' ')}
                                        disabled={loading}
                                    />
                                    <button
                                        type="button"
                                        className="password-toggle"
                                        onClick={toggleShowPw}
                                        aria-label={showPw ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                                        aria-pressed={showPw}
                                        disabled={loading}
                                        style={eyeBtnStyle(loading)}
                                        onMouseEnter={(e) => { if (!loading) e.currentTarget.style.opacity = '1' }}
                                        onMouseLeave={(e) => { if (!loading) e.currentTarget.style.opacity = '0.7' }}
                                        onFocus={(e) => { e.currentTarget.style.boxShadow = '0 0 0 2px var(--primary-purple)' }}
                                        onBlur={(e) => { e.currentTarget.style.boxShadow = 'none' }}
                                    >
                                        {showPw
                                            ? <EyeOff size={18} color="var(--primary-purple)" aria-hidden="true" />
                                            : <Eye    size={18} color="var(--primary-purple)" aria-hidden="true" />
                                        }
                                    </button>
                                </div>

                                {/* Checks de requisitos */}
                                {password && (
                                    <ul
                                        id="pw-checks"
                                        aria-label="Requisitos de contraseña"
                                        aria-live="polite"
                                        style={{ listStyle: 'none', margin: '10px 0 0', padding: 0, display: 'flex', flexDirection: 'column', gap: '5px' }}
                                    >
                                        {pwChecks.map((rule) => (
                                            <li
                                                key={rule.id}
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '7px',
                                                    fontSize: '12px',
                                                    color: rule.passed ? 'var(--success, #10b981)' : 'var(--text-secondary, #6b7280)',
                                                    transition: 'color 0.2s',
                                                }}
                                            >
                                                <span
                                                    aria-hidden="true"
                                                    style={{
                                                        width: '14px',
                                                        height: '14px',
                                                        borderRadius: '50%',
                                                        flexShrink: 0,
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        fontSize: '9px',
                                                        fontWeight: '700',
                                                        background: rule.passed ? 'var(--success, #10b981)' : 'rgba(0,0,0,0.1)',
                                                        color: rule.passed ? '#fff' : 'transparent',
                                                        transition: 'background 0.2s',
                                                    }}
                                                >
                                                    ✓
                                                </span>
                                                <span>{rule.label}</span>
                                                <span className="sr-only">{rule.passed ? '— cumplido' : '— pendiente'}</span>
                                            </li>
                                        ))}
                                    </ul>
                                )}

                                {/* Caps Lock */}
                                {capsLock && (
                                    <div
                                        id="reg-caps-warning"
                                        role="status"
                                        style={{ marginTop: '5px', fontSize: '12px', color: 'var(--warning, #f59e0b)', display: 'flex', alignItems: 'center', gap: '4px' }}
                                    >
                                        ⚠ Bloq Mayús activado
                                    </div>
                                )}

                                {touched.password && errors.password && (
                                    <div id="reg-pw-error" role="alert" style={{ color: '#ef4444', marginTop: '4px', fontSize: '13px' }}>
                                        {errors.password}
                                    </div>
                                )}
                            </div>

                            {/* Confirmar contraseña */}
                            <div className="form-group">
                                <label htmlFor="reg-confirm">Confirmar contraseña</label>
                                <div className="password-input-wrapper">
                                    <input
                                        id="reg-confirm"
                                        ref={confirmRef}
                                        type={showConfirm ? 'text' : 'password'}
                                        placeholder="Repite tu contraseña"
                                        value={confirm}
                                        autoComplete="new-password"
                                        onChange={(ev) => {
                                            setConfirm(ev.target.value)
                                            if (touched.confirm) {
                                                const err = validateConfirm(ev.target.value, password)
                                                setErrors((prev) => ({ ...prev, confirm: err }))
                                            }
                                        }}
                                        onBlur={() => {
                                            setTouched((prev) => ({ ...prev, confirm: true }))
                                            const err = validateConfirm(confirm, password)
                                            setErrors((prev) => ({ ...prev, confirm: err }))
                                        }}
                                        aria-required="true"
                                        aria-invalid={touched.confirm && errors.confirm ? 'true' : 'false'}
                                        aria-describedby={touched.confirm && errors.confirm ? 'reg-confirm-error' : undefined}
                                        disabled={loading}
                                    />
                                    <button
                                        type="button"
                                        className="password-toggle"
                                        onClick={toggleShowConfirm}
                                        aria-label={showConfirm ? 'Ocultar confirmación' : 'Mostrar confirmación'}
                                        aria-pressed={showConfirm}
                                        disabled={loading}
                                        style={eyeBtnStyle(loading)}
                                        onMouseEnter={(e) => { if (!loading) e.currentTarget.style.opacity = '1' }}
                                        onMouseLeave={(e) => { if (!loading) e.currentTarget.style.opacity = '0.7' }}
                                        onFocus={(e) => { e.currentTarget.style.boxShadow = '0 0 0 2px var(--primary-purple)' }}
                                        onBlur={(e) => { e.currentTarget.style.boxShadow = 'none' }}
                                    >
                                        {showConfirm
                                            ? <EyeOff size={18} color="var(--primary-purple)" aria-hidden="true" />
                                            : <Eye    size={18} color="var(--primary-purple)" aria-hidden="true" />
                                        }
                                    </button>
                                </div>

                                {/* Indicador de coincidencia */}
                                {touched.confirm && confirm && !errors.confirm && (
                                    <div
                                        role="status"
                                        style={{ marginTop: '5px', fontSize: '12px', color: 'var(--success, #10b981)', display: 'flex', alignItems: 'center', gap: '5px' }}
                                    >
                                        <span
                                            aria-hidden="true"
                                            style={{
                                                width: '14px', height: '14px', borderRadius: '50%',
                                                background: 'var(--success, #10b981)', color: '#fff',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                fontSize: '9px', fontWeight: '700', flexShrink: 0,
                                            }}
                                        >
                                            ✓
                                        </span>
                                        Las contraseñas coinciden
                                    </div>
                                )}

                                {touched.confirm && errors.confirm && (
                                    <div
                                        id="reg-confirm-error"
                                        role="alert"
                                        style={{ color: '#ef4444', marginTop: '4px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '5px' }}
                                    >
                                        <span aria-hidden="true">✕</span>
                                        {errors.confirm}
                                    </div>
                                )}
                            </div>

                        </div>
                    </div>

                    {/* ── Sección: Specs de PC ── */}
                    <div className="register-section">
                        <h2 className="register-section-title">
                            <Cpu size={18} color="var(--primary-purple)" aria-hidden="true" />
                            Specs de PC
                            <span className="register-optional">(opcional)</span>
                        </h2>
                        <p className="register-specs-hint">
                            Ingresa tus specs para obtener análisis de compatibilidad personalizados.
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
                                label="Tarjeta gráfica (GPU)"
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
                        aria-busy={loading}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                    >
                        {loading && (
                            <Loader size={18} style={{ animation: 'spin 1s linear infinite' }} aria-hidden="true" />
                        )}
                        {loading ? 'Creando cuenta...' : 'Crear cuenta'}
                    </button>

                    {submitted && Object.keys(errors).length > 0 && (
                        <div role="alert" style={{ marginTop: '8px', color: '#ef4444', fontSize: '13px', textAlign: 'center' }}>
                            Por favor corrige los errores en el formulario.
                        </div>
                    )}
                </form>

                {/* Divisor */}
                <div
                    aria-hidden="true"
                    style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '20px 0 16px' }}
                >
                    <div style={{ flex: 1, height: '1px', background: 'rgba(0,0,0,0.08)' }} />
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary, #9ca3af)', whiteSpace: 'nowrap' }}>
                        ¿Ya tienes cuenta?
                    </span>
                    <div style={{ flex: 1, height: '1px', background: 'rgba(0,0,0,0.08)' }} />
                </div>

                <p className="auth-footer" style={{ textAlign: 'center', margin: 0, fontSize: '14px' }}>
                    ¿Ya tienes cuenta?{' '}
                    <Link to="/login">Iniciar sesión</Link>
                </p>

            </div>
        </div>
    )
}