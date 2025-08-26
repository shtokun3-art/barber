import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import LoginPage from '@/app/(pages)/auth/login/page'
import { AuthProvider } from '@/lib/AuthContext'

// Mock do useRouter
const mockPush = vi.fn()
const mockReplace = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace
  })
}))

// Mock dos toasts
vi.mock('@/app/_components/toasts/success', () => ({
  Success: vi.fn()
}))

vi.mock('@/app/_components/toasts/error', () => ({
  UserNotFounded: vi.fn()
}))

// Mock do getImageUrl
vi.mock('@/lib/imageUtils', () => ({
  getImageUrl: (path: string) => path
}))

function renderLoginPage() {
  return render(
    <AuthProvider>
      <LoginPage />
    </AuthProvider>
  )
}

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    global.fetch = vi.fn()
  })

  it('deve renderizar o formulário de login', async () => {
    // Mock para não ter usuário logado
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: false,
      status: 401
    })

    renderLoginPage()

    await waitFor(() => {
      expect(screen.getByText('Bem Vindo de Volta!')).toBeInTheDocument()
    })

    expect(screen.getByPlaceholderText('Digite seu email ou telefone')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Digite sua senha')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Entrar' })).toBeInTheDocument()
    expect(screen.getByText('Não tem uma conta?')).toBeInTheDocument()
  })

  it('deve permitir alternar visibilidade da senha', async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: false,
      status: 401
    })

    renderLoginPage()

    await waitFor(() => {
      expect(screen.getByText('Bem Vindo de Volta!')).toBeInTheDocument()
    })

    const passwordInput = screen.getByPlaceholderText('Digite sua senha')
    const showPasswordCheckbox = screen.getByLabelText('Mostrar Senha')

    expect(passwordInput).toHaveAttribute('type', 'password')

    await userEvent.click(showPasswordCheckbox)
    expect(passwordInput).toHaveAttribute('type', 'text')
    expect(screen.getByLabelText('Esconder Senha')).toBeInTheDocument()

    await userEvent.click(showPasswordCheckbox)
    expect(passwordInput).toHaveAttribute('type', 'password')
  })

  it('deve validar campos obrigatórios', async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: false,
      status: 401
    })

    renderLoginPage()

    await waitFor(() => {
      expect(screen.getByText('Bem Vindo de Volta!')).toBeInTheDocument()
    })

    const submitButton = screen.getByRole('button', { name: 'Entrar' })
    await userEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('Email ou telefone é obrigatório')).toBeInTheDocument()
      expect(screen.getByText('Senha é obrigatória')).toBeInTheDocument()
    })
  })

  it('deve fazer login com sucesso', async () => {
    const mockUser = {
      id: '1',
      name: 'João Silva',
      phone: '11999999999',
      email: 'joao@email.com',
      role: 'client'
    }

    global.fetch = vi.fn()
      .mockResolvedValueOnce({
        ok: false,
        status: 401
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockUser
      })

    renderLoginPage()

    await waitFor(() => {
      expect(screen.getByText('Bem Vindo de Volta!')).toBeInTheDocument()
    })

    const emailInput = screen.getByPlaceholderText('Digite seu email ou telefone')
    const passwordInput = screen.getByPlaceholderText('Digite sua senha')
    const submitButton = screen.getByRole('button', { name: 'Entrar' })

    await userEvent.type(emailInput, 'joao@email.com')
    await userEvent.type(passwordInput, '123456')
    await userEvent.click(submitButton)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/auth/login',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            identifier: 'joao@email.com',
            password: '123456'
          }),
          credentials: 'include'
        })
      )
    })
  })

  it('deve exibir erro para credenciais inválidas', async () => {
    global.fetch = vi.fn()
      .mockResolvedValueOnce({
        ok: false,
        status: 401
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ error: 'Credenciais inválidas' })
      })

    const { UserNotFounded } = await import('@/app/_components/toasts/error')

    renderLoginPage()

    await waitFor(() => {
      expect(screen.getByText('Bem Vindo de Volta!')).toBeInTheDocument()
    })

    const emailInput = screen.getByPlaceholderText('Digite seu email ou telefone')
    const passwordInput = screen.getByPlaceholderText('Digite sua senha')
    const submitButton = screen.getByRole('button', { name: 'Entrar' })

    await userEvent.type(emailInput, 'email@invalido.com')
    await userEvent.type(passwordInput, 'senhaerrada')
    await userEvent.click(submitButton)

    await waitFor(() => {
      expect(UserNotFounded).toHaveBeenCalledWith({
        error: expect.any(Error)
      })
    })
  })

  it('deve redirecionar usuário já logado', async () => {
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

    renderLoginPage()

    await waitFor(() => {
      expect(screen.getByText('Redirecionando...')).toBeInTheDocument()
    })
  })

  it('deve navegar para página de registro', async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: false,
      status: 401
    })

    renderLoginPage()

    await waitFor(() => {
      expect(screen.getByText('Bem Vindo de Volta!')).toBeInTheDocument()
    })

    const registerLink = screen.getByText('Registrar')
    expect(registerLink.closest('a')).toHaveAttribute('href', '/auth/register')
  })

  it('deve navegar de volta para home', async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: false,
      status: 401
    })

    renderLoginPage()

    await waitFor(() => {
      expect(screen.getByText('Bem Vindo de Volta!')).toBeInTheDocument()
    })

    const backButton = screen.getByRole('button', { name: '' }) // ArrowLeft icon
    await userEvent.click(backButton)

    expect(mockPush).toHaveBeenCalledWith('/')
  })
})