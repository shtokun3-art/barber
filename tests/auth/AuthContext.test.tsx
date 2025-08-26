import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, act } from '@testing-library/react'
import { AuthProvider, useAuth } from '@/lib/AuthContext'
import { ReactNode } from 'react'

// Mock do useRouter
const mockPush = vi.fn()
const mockReplace = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace
  })
}))

// Componente de teste para usar o hook useAuth
function TestComponent() {
  const { user, loading, logout, refreshUser, redirectToCorrectPage } = useAuth()
  
  return (
    <div>
      <div data-testid="loading">{loading ? 'loading' : 'not-loading'}</div>
      <div data-testid="user">{user ? user.name : 'no-user'}</div>
      <button onClick={logout} data-testid="logout-btn">Logout</button>
      <button onClick={refreshUser} data-testid="refresh-btn">Refresh</button>
      <button 
        onClick={() => user && redirectToCorrectPage(user)} 
        data-testid="redirect-btn"
      >
        Redirect
      </button>
    </div>
  )
}

function renderWithAuthProvider(children: ReactNode) {
  return render(
    <AuthProvider>
      {children}
    </AuthProvider>
  )
}

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    global.fetch = vi.fn()
  })

  it('deve inicializar com loading true', () => {
    renderWithAuthProvider(<TestComponent />)
    
    expect(screen.getByTestId('loading')).toHaveTextContent('loading')
    expect(screen.getByTestId('user')).toHaveTextContent('no-user')
  })

  it('deve carregar usuário com sucesso', async () => {
    const mockUser = {
      id: '1',
      name: 'João Silva',
      phone: '11999999999',
      email: 'joao@email.com',
      role: 'client'
    }

    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => mockUser
    })

    renderWithAuthProvider(<TestComponent />)

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('not-loading')
    })

    expect(screen.getByTestId('user')).toHaveTextContent('João Silva')
  })

  it('deve lidar com erro ao carregar usuário', async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: false,
      status: 401
    })

    renderWithAuthProvider(<TestComponent />)

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('not-loading')
    })

    expect(screen.getByTestId('user')).toHaveTextContent('no-user')
  })

  it('deve fazer logout corretamente', async () => {
    const mockUser = {
      id: '1',
      name: 'João Silva',
      phone: '11999999999',
      email: 'joao@email.com',
      role: 'client'
    }

    // Mock inicial para carregar usuário
    global.fetch = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockUser
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      })

    renderWithAuthProvider(<TestComponent />)

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('João Silva')
    })

    // Fazer logout
    await act(async () => {
      screen.getByTestId('logout-btn').click()
    })

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/')
    })
  })

  it('deve redirecionar cliente para página correta', async () => {
    const mockUser = {
      id: '1',
      name: 'João Silva',
      phone: '11999999999',
      email: 'joao@email.com',
      role: 'client'
    }

    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => mockUser
    })

    renderWithAuthProvider(<TestComponent />)

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('João Silva')
    })

    await act(async () => {
      screen.getByTestId('redirect-btn').click()
    })

    expect(mockReplace).toHaveBeenCalledWith('/client/1')
  })

  it('deve redirecionar admin para página correta', async () => {
    const mockUser = {
      id: '2',
      name: 'Admin User',
      phone: '11888888888',
      email: 'admin@email.com',
      role: 'admin'
    }

    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => mockUser
    })

    renderWithAuthProvider(<TestComponent />)

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('Admin User')
    })

    await act(async () => {
      screen.getByTestId('redirect-btn').click()
    })

    expect(mockReplace).toHaveBeenCalledWith('/main/2')
  })

  it('deve atualizar usuário com refreshUser', async () => {
    const mockUser = {
      id: '1',
      name: 'João Silva',
      phone: '11999999999',
      email: 'joao@email.com',
      role: 'client'
    }

    const updatedUser = {
      ...mockUser,
      name: 'João Silva Atualizado'
    }

    global.fetch = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockUser
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => updatedUser
      })

    renderWithAuthProvider(<TestComponent />)

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('João Silva')
    })

    await act(async () => {
      screen.getByTestId('refresh-btn').click()
    })

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('João Silva Atualizado')
    })
  })
})