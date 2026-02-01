import React from 'react'
import { Link } from 'react-router-dom'
import { Ghost, Home } from 'lucide-react'
import Navbar from '../../components/Navbar/Navbar'
import Footer from '../../components/Footer/Footer'

export default function NotFound() {
    return (
        <div className="error-page">
            <Navbar />
            <div className="error-content">
                <Ghost size={120} color="var(--primary-purple)" className="error-icon" />
                <h1 className="error-code">404</h1>
                <h2 className="error-message">¡Página no encontrada!</h2>
                <p className="error-description">
                    Parece que has entrado en una zona sin renderizar. El nivel que buscas no existe o ha sido eliminado.
                </p>
                <Link to="/" className="back-home-btn">
                    <Home size={20} /> Volver al Inicio
                </Link>
            </div>
            <Footer />
        </div>
    )
}
