import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import GameDetails from '../GameDetails'; // Asegúrate de que la ruta sea correcta hacia tu componente

// --- 1. MOCKS (Simulaciones) ---
// Simulamos las dependencias para aislar el test de GameDetails

// Mock de React Router
jest.mock('react-router-dom', () => ({
  useParams: () => ({ id: '1' }),
  Link: ({ children }) => <a href="#">{children}</a>
}));

// Mock de Lucide React (Iconos)
jest.mock('lucide-react', () => ({
  Star: () => <span data-testid="icon-star">★</span>,
  Settings: () => <span>⚙</span>,
  CheckCircle: () => <span>✔</span>,
  ChevronDown: () => <span>▼</span>,
  User: () => <span>👤</span>,
  MessageSquare: () => <span>💬</span>
}));

// Mock de Componentes Hijos
jest.mock('../../components/Navbar/Navbar', () => () => <div data-testid="navbar">Navbar Mock</div>);
jest.mock('../../components/Footer/Footer', () => () => <div data-testid="footer">Footer Mock</div>);
jest.mock('../../components/ReviewModal/ReviewModal', () => ({ isOpen, onClose }) => (
  isOpen ? (
    <div role="dialog" data-testid="review-modal">
      Modal Abierto
      <button onClick={onClose}>Cerrar Modal</button>
    </div>
  ) : null
));

// Mock de los datos JSON
jest.mock('../../data/game_details.json', () => ({
  name: "Juego de Prueba",
  image: "test.jpg",
  artScore: 9.5,
  techScore: 8.0,
  developer: "Test Dev",
  tags: ["RPG", "Acción"],
  minRequirements: { processor: "i5" },
  compatibility: { status: "Óptimo", cpu: "High", gpu: "High", ram: "16GB" },
  reviews: [
    { user: "Gamer1", rating: 5, content: "Gran juego" }
  ]
}));

// --- 2. SUITE DE TESTS ---

describe('GameDetails Component - DevOps Interaction Tests', () => {

  // Test 1: Verificar que el componente renderiza (Pipeline Verde Básico)
  test('Renderiza correctamente la información del juego', () => {
    render(<GameDetails />);
    expect(screen.getByText('Juego de Prueba')).toBeInTheDocument();
    expect(screen.getByText('Puntuación artística')).toBeInTheDocument();
  });

  // Test 2: Interacción de Tabs (Click en Pestaña)
  test('Cambia de pestaña activa al hacer click', () => {
    render(<GameDetails />);
    
    const techTab = screen.getByText('Reseñas técnicas');
    const artTab = screen.getByText('Reseñas artísticas');

    // Verificar estado inicial (Artística activa por defecto en tu useState)
    expect(artTab).toHaveClass('active');
    expect(techTab).not.toHaveClass('active');

    // Simular interacción (Click)
    fireEvent.click(techTab);

    // Verificar cambio de estado (Clase active se mueve)
    expect(techTab).toHaveClass('active');
    expect(artTab).not.toHaveClass('active');
  });

  // Test 3: Interacción de Modal (Click en "Nueva reseña")
  // ESTE ES EL TEST CRÍTICO PARA TU TAREA
  test('Abre el modal de reseña al hacer click en el botón', () => {
    render(<GameDetails />);

    // 1. Verificar que el modal NO está en el documento al inicio
    expect(screen.queryByTestId('review-modal')).not.toBeInTheDocument();

    // 2. Encontrar el botón "Nueva reseña"
    const openModalBtn = screen.getByText(/Nueva reseña/i);
    
    // 3. Simular Click
    fireEvent.click(openModalBtn);

    // 4. Verificar que el modal aparece (isOpen={true})
    expect(screen.getByTestId('review-modal')).toBeInTheDocument();
  });

  // Test 4: Accesibilidad básica (Validación extra)
  test('Los elementos principales tienen atributos ARIA', () => {
    render(<GameDetails />);
    expect(screen.getByLabelText('Información lateral')).toBeInTheDocument();
    expect(screen.getByRole('tablist')).toBeInTheDocument();
  });
});