import React from 'react'
import { Hexagon } from 'lucide-react'

export default function Footer() {
    return (
        <footer className="main-footer">
            <div className="footer-content">
                <div className="footer-section">
                    <div className="logo">
                        <img src="/juego-de-arcade.png" alt="Logo" style={{ height: '32px', width: 'auto' }} />
                        <span style={{ marginLeft: '10px', fontSize: '28px' }}>Plataforma Gamer</span>
                    </div>
                    <p>Tu destino para conocer la compatibilidad de juegos en PC y reseñas de la comunidad.</p>
                </div>

                <div className="footer-section">
                    <h4>Explorar</h4>
                    <ul>
                        <li>Mejor valorados</li>
                        <li>Últimos lanzamientos</li>
                        <li>Categorías</li>
                    </ul>
                </div>

                <div className="footer-section">
                    <h4>Soporte</h4>
                    <ul>
                        <li>Preguntas frecuentes</li>
                        <li>Contacto</li>
                        <li>Privacidad</li>
                    </ul>
                </div>
            </div>
            <div className="footer-bottom">
                <p>&copy; 2026 Plataforma Gamer. Todos los derechos reservados.</p>
            </div>
        </footer>
    )
}
