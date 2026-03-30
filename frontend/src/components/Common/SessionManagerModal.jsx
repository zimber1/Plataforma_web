import React, { useState, useEffect } from 'react';
import { LogOut, RefreshCw } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function SessionManagerModal() {
    const [showModal, setShowModal] = useState(false);
    const [message, setMessage] = useState('');
    const [actionType, setActionType] = useState('logout'); // 'logout' | 'login'
    const { logoutUser, isLoggedIn } = useAuth();

    useEffect(() => {
        // Escuchar cambios en localStorage (cuando otra pestaña altera la sesión)
        const handleStorageChange = (e) => {
            // e.key === null significa que localStorage.clear() fue llamado
            if (e.key === 'auth_token' || e.key === null) {
                
                // CASO 1: Cierre de sesión en otra pestaña
                if (!e.newValue || e.key === null) {
                    if (isLoggedIn) {
                        logoutUser();
                        setActionType('logout');
                        setMessage('Se ha cerrado la sesión en este dispositivo. Por favor, inicia sesión nuevamente para continuar.');
                        setShowModal(true);
                    }
                } 
                // CASO 2: Inicio de sesión en otra pestaña
                else if (e.newValue) {
                    if (!isLoggedIn) {
                        setActionType('login');
                        setMessage('Detectamos un inicio de sesión en otra pestaña. Sincronizando tu estado...');
                        setShowModal(true);
                        
                        // Auto-recargar suavemente después de dar tiempo a leer el mensaje
                        setTimeout(() => {
                            window.location.reload();
                        }, 2500);
                    }
                }
            }
        };

        // Escuchar eventos personalizados de token vencido o sesión expirada desde apiClient
        const handleSessionExpired = () => {
            if (isLoggedIn) {
                logoutUser();
                setActionType('logout');
                setMessage('Tu sesión ha caducado, por favor ingresa nuevamente para continuar.');
                setShowModal(true);
            }
        };

        window.addEventListener('storage', handleStorageChange);
        window.addEventListener('session_expired', handleSessionExpired);

        return () => {
            window.removeEventListener('storage', handleStorageChange);
            window.removeEventListener('session_expired', handleSessionExpired);
        };
    }, [isLoggedIn, logoutUser]);

    if (!showModal) return null;

    const handleClose = () => {
        setShowModal(false);
        // Recargar para limpiar estado residual o redirigir al login
        if (actionType === 'logout') {
            window.location.href = '/login';
        } else {
            window.location.reload();
        }
    };

    return (
        <div style={{
            position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000,
            backdropFilter: 'blur(4px)',
            animation: 'fadeIn 0.2s ease-out'
        }}>
            <div style={{
                background: 'var(--bg-secondary, #1f2937)',
                padding: '40px 30px', borderRadius: '16px', textAlign: 'center',
                maxWidth: '400px', width: '90%',
                boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
                color: 'var(--text-primary, #f9fafb)',
                animation: 'scaleUp 0.3s ease-out'
            }}>
                <div style={{
                    display: 'inline-flex', justifyContent: 'center', alignItems: 'center', 
                    width: '64px', height: '64px', borderRadius: '50%', 
                    background: actionType === 'login' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', 
                    color: actionType === 'login' ? '#10b981' : '#ef4444', 
                    marginBottom: '24px' 
                }}>
                    {actionType === 'login' ? (
                        <RefreshCw size={32} style={{ animation: 'spin 2s linear infinite' }} />
                    ) : (
                        <LogOut size={32} />
                    )}
                </div>
                <h2 style={{ margin: '0 0 12px', fontSize: '22px', fontWeight: '600' }}>
                    {actionType === 'login' ? 'Sincronizando Sesión' : 'Sesión Cerrada'}
                </h2>
                <p style={{ margin: '0 0 30px', color: 'var(--text-secondary, #9ca3af)', fontSize: '15px', lineHeight: '1.5' }}>
                    {message}
                </p>
                {actionType === 'logout' && (
                    <button
                        onClick={handleClose}
                        style={{
                            background: 'var(--primary-purple, #633cb4)', color: 'white', border: 'none',
                            padding: '12px 24px', borderRadius: '8px', cursor: 'pointer', 
                            fontWeight: '600', width: '100%', fontSize: '15px',
                            transition: 'background 0.2s'
                        }}
                        onMouseEnter={(e) => e.target.style.background = 'var(--primary-purple-hover, #7b4cc6)'}
                        onMouseLeave={(e) => e.target.style.background = 'var(--primary-purple, #633cb4)'}
                    >
                        Iniciar sesión
                    </button>
                )}
            </div>
            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes scaleUp {
                    from { transform: scale(0.95); opacity: 0; }
                    to { transform: scale(1); opacity: 1; }
                }
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}
