import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
    User, Cpu, Monitor, HardDrive, Save, Loader,
    ArrowLeft, Pencil, X, Lock, Eye, EyeOff, CheckCircle,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { apiClient } from '../../api'
import HardwareAutocomplete from '../../components/Common/HardwareAutocomplete'
import Navbar from '../../components/Navbar/Navbar'
import Footer from '../../components/Footer/Footer'

// ─── helpers ─────────────────────────────────────────────────────────────────

const validatePwForm = ({ current, next, confirm }) => {
    const e = {}
    if (!current)                      e.current  = 'La contraseña actual es requerida.'
    if (!next)                         e.next     = 'La nueva contraseña es requerida.'
    else if (next.length < 8)          e.next     = 'Mínimo 8 caracteres.'
    else if (!/[A-Z]/.test(next))      e.next     = 'Debe incluir al menos una mayúscula.'
    else if (!/[a-z]/.test(next))      e.next     = 'Debe incluir al menos una minúscula.'
    else if (!/[0-9]/.test(next))      e.next     = 'Debe incluir al menos un número.'
    if (!confirm)                      e.confirm  = 'Por favor confirma la nueva contraseña.'
    else if (confirm !== next)         e.confirm  = 'Las contraseñas no coinciden.'
    return e
}

// ─── SpecsReadOnly ────────────────────────────────────────────────────────────

function SpecsReadOnly({ cpu, gpu, ram, onEdit }) {
    const items = [
        { icon: <Cpu size={15} aria-hidden="true" />, label: 'CPU', value: cpu },
        { icon: <Monitor size={15} aria-hidden="true" />, label: 'GPU', value: gpu },
        { icon: <HardDrive size={15} aria-hidden="true" />, label: 'RAM', value: ram },
    ]
    const hasAny = cpu || gpu || ram

    return (
        <div>
            {hasAny ? (
                <dl style={{ margin: '0 0 20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {items.map(({ icon, label, value }) => (
                        value ? (
                            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <dt style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary, #6b7280)', fontSize: '13px', minWidth: '44px' }}>
                                    {icon}{label}
                                </dt>
                                <dd style={{ margin: 0, fontSize: '14px', fontWeight: '500' }}>{value}</dd>
                            </div>
                        ) : null
                    ))}
                </dl>
            ) : (
                <p style={{ fontSize: '14px', color: 'var(--text-secondary, #6b7280)', marginBottom: '20px', fontStyle: 'italic' }}>
                    No has configurado tus specs aún.
                </p>
            )}
            <button
                className="profile-save-btn"
                onClick={onEdit}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
            >
                <Pencil size={16} aria-hidden="true" />
                {hasAny ? 'Editar specs' : 'Agregar specs'}
            </button>
        </div>
    )
}

// ─── SpecsForm ────────────────────────────────────────────────────────────────

function SpecsForm({ cpu, gpu, ram, onCpu, onGpu, onRam, saving, onSave, onCancel }) {
    return (
        <div>
            <div className="profile-specs-form">
                <HardwareAutocomplete
                    type="cpu"
                    value={cpu}
                    onChange={onCpu}
                    label="Procesador (CPU)"
                    placeholder="Ej: Ryzen 5 5600X, Intel i7-12700K..."
                    disabled={saving}
                />
                <HardwareAutocomplete
                    type="gpu"
                    value={gpu}
                    onChange={onGpu}
                    label="Tarjeta gráfica (GPU)"
                    placeholder="Ej: RTX 3060, RX 6700 XT..."
                    disabled={saving}
                />
                <HardwareAutocomplete
                    type="ram"
                    value={ram}
                    onChange={onRam}
                    label="Memoria RAM"
                    placeholder="Ej: 16GB DDR4 3200MHz..."
                    disabled={saving}
                />
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '16px', flexWrap: 'wrap' }}>
                <button
                    className="profile-save-btn"
                    onClick={onSave}
                    disabled={saving}
                    aria-busy={saving}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                >
                    {saving
                        ? <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} aria-hidden="true" />
                        : <Save size={16} aria-hidden="true" />
                    }
                    {saving ? 'Guardando...' : 'Guardar specs'}
                </button>
                <button
                    className="profile-cancel-btn"
                    onClick={onCancel}
                    disabled={saving}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(239,68,68,0.12)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.25)' }}
                >
                    <X size={16} aria-hidden="true" />
                    Cancelar
                </button>
            </div>
        </div>
    )
}

// ─── PasswordField ────────────────────────────────────────────────────────────

function PasswordField({ id, label, value, onChange, onBlur, error, show, onToggle, disabled, autoComplete }) {
    return (
        <div className="form-group">
            <label htmlFor={id}>{label}</label>
            <div className="password-input-wrapper">
                <input
                    id={id}
                    type={show ? 'text' : 'password'}
                    value={value}
                    autoComplete={autoComplete}
                    onChange={onChange}
                    onBlur={onBlur}
                    aria-required="true"
                    aria-invalid={error ? 'true' : 'false'}
                    aria-describedby={error ? `${id}-error` : undefined}
                    disabled={disabled}
                    style={{ paddingRight: '44px', width: '100%' }}
                />
                <button
                    type="button"
                    onClick={onToggle}
                    aria-label={show ? `Ocultar ${label.toLowerCase()}` : `Mostrar ${label.toLowerCase()}`}
                    aria-pressed={show}
                    disabled={disabled}
                    style={{
                        background: 'none', border: 'none', cursor: disabled ? 'not-allowed' : 'pointer',
                        display: 'flex', alignItems: 'center', opacity: disabled ? 0.4 : 0.7,
                        transition: 'opacity 0.15s', borderRadius: '4px', outline: 'none',
                    }}
                    onMouseEnter={(e) => { if (!disabled) e.currentTarget.style.opacity = '1' }}
                    onMouseLeave={(e) => { if (!disabled) e.currentTarget.style.opacity = '0.7' }}
                    onFocus={(e) => { e.currentTarget.style.boxShadow = '0 0 0 2px var(--primary-purple)' }}
                    onBlur={(e) => { e.currentTarget.style.boxShadow = 'none' }}
                >
                    {show
                        ? <EyeOff size={18} color="var(--primary-purple)" aria-hidden="true" />
                        : <Eye    size={18} color="var(--primary-purple)" aria-hidden="true" />
                    }
                </button>
            </div>
            {error && (
                <div id={`${id}-error`} role="alert" style={{ color: '#ef4444', marginTop: '4px', fontSize: '13px' }}>
                    {error}
                </div>
            )}
        </div>
    )
}

// ─── Profile ─────────────────────────────────────────────────────────────────

export default function Profile() {
    const navigate = useNavigate()
    const { user, isLoggedIn, loading: authLoading, updateUserSpecs } = useAuth()

    // ── specs ──────────────────────────────────────────────────────────────────
    const [cpu,        setCpu]        = useState('')
    const [gpu,        setGpu]        = useState('')
    const [ram,        setRam]        = useState('')
    const [editingSpecs, setEditingSpecs] = useState(false)
    const [savingSpecs,  setSavingSpecs]  = useState(false)
    const [specsMsg,     setSpecsMsg]     = useState(null)   // { type: 'success'|'error', text }

    // ── password ───────────────────────────────────────────────────────────────
    const [showPwSection, setShowPwSection] = useState(false)
    const [pwForm,   setPwForm]   = useState({ current: '', next: '', confirm: '' })
    const [pwErrors, setPwErrors] = useState({})
    const [pwTouched,setPwTouched]= useState({})
    const [showPw,   setShowPw]   = useState({ current: false, next: false, confirm: false })
    const [savingPw, setSavingPw] = useState(false)
    const [pwMsg,    setPwMsg]    = useState(null)   // { type: 'success'|'error', text }

    const specsEditRef = useRef(null)
    const pwSectionRef = useRef(null)

    // ── redirect ───────────────────────────────────────────────────────────────
    useEffect(() => {
        if (!authLoading && !isLoggedIn) navigate('/login')
    }, [authLoading, isLoggedIn, navigate])

    // ── cargar specs del usuario ───────────────────────────────────────────────
    useEffect(() => {
        if (user?.pcSpecs) {
            setCpu(user.pcSpecs.cpu || '')
            setGpu(user.pcSpecs.gpu || '')
            setRam(user.pcSpecs.ram || '')
        }
    }, [user])

    // ── guardar specs ──────────────────────────────────────────────────────────
    const handleSaveSpecs = async () => {
        setSavingSpecs(true)
        setSpecsMsg(null)
        try {
            await updateUserSpecs({ cpu, gpu, ram })
            setSpecsMsg({ type: 'success', text: 'Specs actualizadas correctamente.' })
            setEditingSpecs(false)
        } catch (err) {
            setSpecsMsg({ type: 'error', text: err.message || 'Error al actualizar las specs.' })
        } finally {
            setSavingSpecs(false)
        }
    }

    const handleCancelSpecs = () => {
        // Restaurar valores originales
        setCpu(user?.pcSpecs?.cpu || '')
        setGpu(user?.pcSpecs?.gpu || '')
        setRam(user?.pcSpecs?.ram || '')
        setEditingSpecs(false)
        setSpecsMsg(null)
    }

    // ── cambio de password ─────────────────────────────────────────────────────
    const handlePwBlur = (field) => {
        setPwTouched(prev => ({ ...prev, [field]: true }))
        const errs = validatePwForm({ ...pwForm, [field]: pwForm[field] })
        setPwErrors(prev => ({ ...prev, [field]: errs[field] || '' }))
    }

    const handlePwChange = (field, value) => {
        const updated = { ...pwForm, [field]: value }
        setPwForm(updated)
        if (pwTouched[field]) {
            const errs = validatePwForm(updated)
            setPwErrors(prev => ({ ...prev, [field]: errs[field] || '' }))
        }
        // Re-validar confirm si cambia next y confirm ya fue tocado
        if (field === 'next' && pwTouched.confirm) {
            const errs = validatePwForm(updated)
            setPwErrors(prev => ({ ...prev, confirm: errs.confirm || '' }))
        }
    }

    const handleSavePassword = async () => {
        setPwTouched({ current: true, next: true, confirm: true })
        const errs = validatePwForm(pwForm)
        setPwErrors(errs)
        if (Object.keys(errs).length > 0) return

        setSavingPw(true)
        setPwMsg(null)
        try {
            // PUT /api/auth/password — endpoint que necesita el backend
            await apiClient('/api/auth/password', {
                method: 'PUT',
                body: { currentPassword: pwForm.current, newPassword: pwForm.next },
            })
            setPwMsg({ type: 'success', text: 'Contraseña actualizada correctamente.' })
            setPwForm({ current: '', next: '', confirm: '' })
            setPwTouched({})
            setShowPwSection(false)
        } catch (err) {
            setPwMsg({ type: 'error', text: err.message || 'Error al cambiar la contraseña.' })
        } finally {
            setSavingPw(false)
        }
    }

    const handleCancelPassword = () => {
        setPwForm({ current: '', next: '', confirm: '' })
        setPwErrors({})
        setPwTouched({})
        setPwMsg(null)
        setShowPwSection(false)
    }

    // ── loading ────────────────────────────────────────────────────────────────
    if (authLoading) {
        return (
            <div className="app-container">
                <Navbar />
                <div role="status" aria-label="Cargando perfil" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
                    <Loader size={48} className="icon-purple" style={{ animation: 'spin 1s linear infinite' }} aria-hidden="true" />
                </div>
            </div>
        )
    }

    if (!user) return null

    const joinDate = user.createdAt
        ? new Date(user.createdAt).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })
        : null

    // ── render ─────────────────────────────────────────────────────────────────
    return (
        <div className="app-container">
            <Navbar />

            <main className="profile-container" id="main-content" tabIndex="-1">

                {/* Cabecera */}
                <div className="profile-header-section">
                    <button
                        className="back-button"
                        onClick={() => navigate('/')}
                        aria-label="Volver al inicio"
                    >
                        <ArrowLeft size={24} color="var(--primary-purple)" />
                    </button>
                    <h1 className="profile-title">Mi Perfil</h1>
                </div>

                {/* ── Info del usuario ── */}
                <section className="profile-card" aria-labelledby="info-title">
                    <div className="profile-avatar" aria-hidden="true">
                        <User size={72} strokeWidth={1} color="var(--primary-purple)" />
                    </div>
                    <div className="profile-info">
                        <h2 id="info-title">{user.username}</h2>
                        <p className="profile-email">{user.email}</p>
                        {joinDate && (
                            <p className="profile-date">Miembro desde: {joinDate}</p>
                        )}
                    </div>
                </section>

                {/* ── Specs de PC ── */}
                <section className="profile-card profile-specs-section" aria-labelledby="specs-title">
                    <h2 id="specs-title" className="profile-section-title">
                        <Cpu size={22} color="var(--primary-purple)" aria-hidden="true" />
                        Especificaciones de PC
                    </h2>
                    <p className="profile-specs-description">
                        Configura tus specs para recibir análisis de compatibilidad personalizados en cada juego.
                    </p>

                    {specsMsg && (
                        <div
                            role="alert"
                            className={`profile-message ${specsMsg.type === 'success' ? 'profile-success' : 'profile-error'}`}
                            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                        >
                            {specsMsg.type === 'success' && <CheckCircle size={16} aria-hidden="true" />}
                            {specsMsg.text}
                        </div>
                    )}

                    {editingSpecs ? (
                        <SpecsForm
                            cpu={cpu} gpu={gpu} ram={ram}
                            onCpu={setCpu} onGpu={setGpu} onRam={setRam}
                            saving={savingSpecs}
                            onSave={handleSaveSpecs}
                            onCancel={handleCancelSpecs}
                        />
                    ) : (
                        <SpecsReadOnly
                            cpu={cpu} gpu={gpu} ram={ram}
                            onEdit={() => {
                                setSpecsMsg(null)
                                setEditingSpecs(true)
                                // Dar foco al primer campo tras render
                                setTimeout(() => specsEditRef.current?.focus(), 50)
                            }}
                        />
                    )}
                </section>

                {/* ── Cambio de contraseña ── */}
                <section className="profile-card" aria-labelledby="pw-title" ref={pwSectionRef}>
                    <h2 id="pw-title" className="profile-section-title">
                        <Lock size={22} color="var(--primary-purple)" aria-hidden="true" />
                        Cambiar contraseña
                    </h2>

                    {pwMsg && (
                        <div
                            role="alert"
                            className={`profile-message ${pwMsg.type === 'success' ? 'profile-success' : 'profile-error'}`}
                            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                        >
                            {pwMsg.type === 'success' && <CheckCircle size={16} aria-hidden="true" />}
                            {pwMsg.text}
                        </div>
                    )}

                    {!showPwSection ? (
                        <button
                            className="profile-save-btn"
                            onClick={() => { setPwMsg(null); setShowPwSection(true) }}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                        >
                            <Lock size={16} aria-hidden="true" />
                            Cambiar contraseña FALTA IMPLEMENTAR EN BACKEND
                        </button>
                    ) : (
                        <div className="profile-specs-form">
                            <PasswordField
                                id="pw-current"
                                label="Contraseña actual"
                                value={pwForm.current}
                                onChange={(e) => handlePwChange('current', e.target.value)}
                                onBlur={() => handlePwBlur('current')}
                                error={pwTouched.current && pwErrors.current}
                                show={showPw.current}
                                onToggle={() => setShowPw(p => ({ ...p, current: !p.current }))}
                                disabled={savingPw}
                                autoComplete="current-password"
                            />
                            <PasswordField
                                id="pw-new"
                                label="Nueva contraseña"
                                value={pwForm.next}
                                onChange={(e) => handlePwChange('next', e.target.value)}
                                onBlur={() => handlePwBlur('next')}
                                error={pwTouched.next && pwErrors.next}
                                show={showPw.next}
                                onToggle={() => setShowPw(p => ({ ...p, next: !p.next }))}
                                disabled={savingPw}
                                autoComplete="new-password"
                            />
                            <PasswordField
                                id="pw-confirm"
                                label="Confirmar nueva contraseña"
                                value={pwForm.confirm}
                                onChange={(e) => handlePwChange('confirm', e.target.value)}
                                onBlur={() => handlePwBlur('confirm')}
                                error={pwTouched.confirm && pwErrors.confirm}
                                show={showPw.confirm}
                                onToggle={() => setShowPw(p => ({ ...p, confirm: !p.confirm }))}
                                disabled={savingPw}
                                autoComplete="new-password"
                            />

                            <div style={{ display: 'flex', gap: '10px', marginTop: '4px', flexWrap: 'wrap' }}>
                                <button
                                    className="profile-save-btn"
                                    onClick={handleSavePassword}
                                    disabled={savingPw}
                                    aria-busy={savingPw}
                                    style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                                >
                                    {savingPw
                                        ? <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} aria-hidden="true" />
                                        : <Save size={16} aria-hidden="true" />
                                    }
                                    {savingPw ? 'Guardando...' : 'Guardar contraseña'}
                                </button>
                                <button
                                    className="profile-cancel-btn"
                                    onClick={handleCancelPassword}
                                    disabled={savingPw}
                                    style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(239,68,68,0.12)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.25)' }}
                                >
                                    <X size={16} aria-hidden="true" />
                                    Cancelar
                                </button>
                            </div>
                        </div>
                    )}
                </section>

            </main>

            <Footer />
        </div>
    )
}