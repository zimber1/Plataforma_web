import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Cpu, Monitor, HardDrive, Save, Loader, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import HardwareAutocomplete from '../../components/Common/HardwareAutocomplete';
import Navbar from '../../components/Navbar/Navbar';
import Footer from '../../components/Footer/Footer';

/**
 * Profile - Pagina de perfil del usuario.
 * Muestra la informacion del usuario y permite editar las specs de PC.
 * Redirige a /login si no esta autenticado.
 */
export default function Profile() {
    const navigate = useNavigate();
    const { user, isLoggedIn, loading: authLoading, updateUserSpecs } = useAuth();

    const [cpu, setCpu] = useState('');
    const [gpu, setGpu] = useState('');
    const [ram, setRam] = useState('');
    const [saving, setSaving] = useState(false);
    const [mensaje, setMensaje] = useState(null);
    const [error, setError] = useState(null);

    // Redirigir si no esta logueado
    useEffect(() => {
        if (!authLoading && !isLoggedIn) {
            navigate('/login');
        }
    }, [authLoading, isLoggedIn, navigate]);

    // Cargar specs actuales del usuario
    useEffect(() => {
        if (user?.pcSpecs) {
            setCpu(user.pcSpecs.cpu || '');
            setGpu(user.pcSpecs.gpu || '');
            setRam(user.pcSpecs.ram || '');
        }
    }, [user]);

    // Guardar specs
    const handleSaveSpecs = async () => {
        setSaving(true);
        setError(null);
        setMensaje(null);

        try {
            await updateUserSpecs({ cpu, gpu, ram });
            setMensaje('Specs actualizadas correctamente');
        } catch (err) {
            setError(err.message || 'Error al actualizar las specs');
        } finally {
            setSaving(false);
        }
    };

    // Mostrar carga mientras se verifica la sesion
    if (authLoading) {
        return (
            <div className="app-container">
                <Navbar />
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
                    <Loader size={48} className="icon-purple" style={{ animation: 'spin 1s linear infinite' }} />
                </div>
            </div>
        );
    }

    if (!user) return null;

    return (
        <div className="app-container">
            <Navbar />

            <main className="profile-container" id="main-content" tabIndex="-1">
                <div className="profile-header-section">
                    <button className="back-button" onClick={() => navigate('/')} aria-label="Volver al inicio">
                        <ArrowLeft size={24} color="var(--primary-purple)" />
                    </button>
                    <h1 className="profile-title">Mi Perfil</h1>
                </div>

                {/* Informacion del usuario */}
                <section className="profile-card" aria-labelledby="info-title">
                    <div className="profile-avatar">
                        <User size={72} strokeWidth={1} color="var(--primary-purple)" />
                    </div>
                    <div className="profile-info">
                        <h2 id="info-title">{user.username}</h2>
                        <p className="profile-email">{user.email}</p>
                        {user.createdAt && (
                            <p className="profile-date">
                                Miembro desde: {new Date(user.createdAt).toLocaleDateString('es-MX', {
                                    day: 'numeric', month: 'long', year: 'numeric'
                                })}
                            </p>
                        )}
                    </div>
                </section>

                {/* Specs de PC */}
                <section className="profile-card profile-specs-section" aria-labelledby="specs-title">
                    <h2 id="specs-title" className="profile-section-title">
                        <Cpu size={22} color="var(--primary-purple)" aria-hidden="true" />
                        Especificaciones de PC
                    </h2>
                    <p className="profile-specs-description">
                        Configura tus specs para recibir analisis de compatibilidad personalizados.
                    </p>

                    {/* Mensajes de exito/error */}
                    {mensaje && (
                        <div className="profile-message profile-success" role="alert">
                            {mensaje}
                        </div>
                    )}
                    {error && (
                        <div className="profile-message profile-error" role="alert">
                            {error}
                        </div>
                    )}

                    <div className="profile-specs-form">
                        <HardwareAutocomplete
                            type="cpu"
                            value={cpu}
                            onChange={setCpu}
                            label="Procesador (CPU)"
                            placeholder="Ej: Ryzen 5 5600X, Intel i7-12700K..."
                            disabled={saving}
                        />
                        <HardwareAutocomplete
                            type="gpu"
                            value={gpu}
                            onChange={setGpu}
                            label="Tarjeta grafica (GPU)"
                            placeholder="Ej: RTX 3060, RX 6700 XT..."
                            disabled={saving}
                        />
                        <HardwareAutocomplete
                            type="ram"
                            value={ram}
                            onChange={setRam}
                            label="Memoria RAM"
                            placeholder="Ej: 16GB DDR4 3200MHz..."
                            disabled={saving}
                        />

                        <button
                            className="profile-save-btn"
                            onClick={handleSaveSpecs}
                            disabled={saving}
                        >
                            {saving && <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} aria-hidden="true" />}
                            <Save size={18} aria-hidden="true" />
                            {saving ? 'Guardando...' : 'Guardar specs'}
                        </button>
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    );
}
