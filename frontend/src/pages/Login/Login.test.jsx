/* global jest, describe, test, expect */
import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import Login from './Login'
import { MemoryRouter } from 'react-router-dom'

// mock useNavigate to avoid react-router dependency in tests
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn()
}))

describe('Login component', () => {
  test('renders the form', () => {
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    )
    expect(screen.getByLabelText(/Email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Contraseña/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Inició Sesión/i })).toBeInTheDocument()
  })

  test('shows error for invalid email', () => {
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    )
    const email = screen.getByLabelText(/Email/i)
    const password = screen.getByLabelText(/Contraseña/i)
    const form = screen.getByRole('form')

    fireEvent.change(email, { target: { value: 'invalid-email' } })
    fireEvent.change(password, { target: { value: 'validpassword' } })
    fireEvent.submit(form)

    expect(screen.getByText(/Formato de email inválido/i)).toBeInTheDocument()
  })

  test('does not allow submitting empty form', () => {
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    )
    const form = screen.getByRole('form')
    fireEvent.submit(form)
    // when empty, there should be specific required messages
    expect(screen.getByText(/El email es requerido/i)).toBeInTheDocument()
    expect(screen.getByText(/La contraseña es requerida/i)).toBeInTheDocument()
  })
})
