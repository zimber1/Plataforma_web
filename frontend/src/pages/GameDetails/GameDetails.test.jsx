import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import GameDetails from './GameDetails'; // CORREGIDO: Apunta al archivo en la misma carpeta

// --- MOCKS (Simulaciones) ---
// Simulamos las dependencias para que el test no dependa de todo el proyecto
jest.mock('react-router-dom', () => ({
  useParams: () => ({ id: '1' }),
  Link: ({ children }) => <a href="#">{children}</a>
}));

jest.mock('lucide-react', () => ({
  Star: () => <span data-testid="icon-star">★</span>,
  Settings: () => <span>⚙</span>,
  CheckCircle: () => <span>✔</span>,
  ChevronDown: () => <span>▼</span>,
  User: () => <span>👤</span>,
  MessageSquare: () => <span>💬</span>
}));

// Mock de componentes hijos
// Nota: Como el test está en src/pages/GameDetails/, subir dos niveles (../../) nos lleva a src/
jest.mock('../../components/Navbar/Navbar', () => () => <div data-testid="navbar">Navbar Mock</div>);
jest.mock('../../components/Footer/Footer', () => () => <div data-testid="footer">Footer Mock</div>);
jest.mock('../../components/ReviewModal/ReviewModal', () => ({ isOpen, onClose }) => (
  isOpen ? (
    <div role="dialog" data-testid="review-modal">
      <button onClick={onClose}>Cerrar</button>
    </div>
  ) : null
));

// Mock de los datos JSON
jest.mock('../../data/game_details.json', () => ({
  name: "Juego Test",
  image: "test.jpg",
  artScore: 9.0,
  techScore: 8.5,
  developer: "Dev Test",
  editor: "Editor Test",
  engine: "Engine Test",
  releaseDate: "2024",
  tags: ["RPG"],
  minRequirements: { processor: "i5" },
  compatibility: { status: "Óptimo", cpu: "High", gpu: "High", ram: "16GB" },
  synopsis: "Sinopsis de prueba",
  reviews: [
    { user: "User1", rating: 5, content: "Review content", date: "2024", specs: "High End PC" }
  ]
}));

// --- TEST SUITE ---
describe('GameDetails - Validación DevOps', () => {

  test('Renderiza el título del juego', () => {
    render(<GameDetails />);
    expect(screen.getByText('Juego Test')).toBeInTheDocument();
  });

  test('Interacción: Abre el modal de reseña al hacer click', () => {
    render(<GameDetails />);
    
    // Verifica que el modal NO está antes del click
    expect(screen.queryByTestId('review-modal')).not.toBeInTheDocument();
    
    // Simula el click
    const botonResena = screen.getByText(/Nueva reseña/i);
    fireEvent.click(botonResena);
    
    // Verifica que el modal SÍ está después del click
    expect(screen.getByTestId('review-modal')).toBeInTheDocument();
  });
});