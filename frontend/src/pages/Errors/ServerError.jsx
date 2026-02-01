import React from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import Navbar from '../../components/Navbar/Navbar'
import Footer from '../../components/Footer/Footer'

export default function ServerError() {
    return (
        <div className="error-page">
            <Navbar />
            <div className="error-content">
                <AlertTriangle size={120} color="#ff5555" className="error-icon" />
                <h1 className="error-code">500</h1>
                <h2 className="error-message">Error del Servidor</h2>
                <p className="error-description">
                    ¡Vaya! Hubo un fallo en la conexión con la base de datos de la plataforma. Nuestros ingenieros están trabajando para restaurar el sistema.
                </p>
                <button onClick={() => window.location.reload()} className="back-home-btn" style={{ background: '#444', color: 'white' }}>
                    <RefreshCw size={20} /> Reintentar
                </button>
            </div>
            <Footer />
        </div>
    )
}
