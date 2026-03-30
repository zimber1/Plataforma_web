import React from 'react'
import { Link } from 'react-router-dom'
import { Gamepad2, Twitter, Github, Mail, Shield, AlertCircle, MessageSquare } from 'lucide-react'

export default function Footer() {
    return (
        <footer className="main-footer">
            <div className="footer-gradient-bar"></div>
            
            <div className="footer-content">
                <div className="footer-brand">
                    <Link to="/" className="footer-logo">
                        <img src="/juego-de-arcade.png" alt="Logo" className="footer-logo-img" />
                        <span>GameRate</span>
                    </Link>
                    <p className="footer-description">
                        Tu destino definitivo para descubrir la compatibilidad de hardware, explorar increíbles juegos de PC y compartir reseñas con una comunidad apasionada.
                    </p>
                    <div className="footer-socials">
                        <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" aria-label="Twitter">
                            <Twitter size={18} />
                        </a>
                        <a href="https://github.com" target="_blank" rel="noopener noreferrer" aria-label="GitHub">
                            <Github size={18} />
                        </a>
                        <a href="mailto:contacto@gamerate.com" aria-label="Correo de Contacto">
                            <Mail size={18} />
                        </a>
                    </div>
                </div>

                <div className="footer-links-grid">
                    <div className="footer-section">
                        <h4>Explorar</h4>
                        <ul>
                            <li><Link to="/">Inicio</Link></li>
                            <li><Link to="/">Mejor valorados</Link></li>
                            <li><Link to="/">Últimos lanzamientos</Link></li>
                        </ul>
                    </div>

                    <div className="footer-section">
                        <h4>Comunidad</h4>
                        <ul>
                            <li><Link to="/"><MessageSquare size={14} /> Foros e ideas</Link></li>
                            <li><Link to="/"><Gamepad2 size={14} /> Servidor de Discord</Link></li>
                            <li><Link to="/"><AlertCircle size={14} /> Reglas y conducta</Link></li>
                        </ul>
                    </div>

                    <div className="footer-section">
                        <h4>Soporte</h4>
                        <ul>
                            <li><Link to="/">Centro de ayuda</Link></li>
                            <li><Link to="/">Términos de servicio</Link></li>
                            <li><Link to="/"><Shield size={14} /> Privacidad</Link></li>
                        </ul>
                    </div>
                </div>
            </div>
            
            <div className="footer-bottom">
                <div className="footer-bottom-content">
                    <p>&copy; {new Date().getFullYear()} GameRate. Diseñado para gamers, por gamers.</p>
                </div>
            </div>
        </footer>
    )
}
