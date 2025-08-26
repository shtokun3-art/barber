import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import LoginPage from '@/app/(pages)/auth/login/page'
import RegisterPage from '@/app/(pages)/auth/register/page'
import ClientMainPage from '@/app/(pages)/client/[id]/page'
import MainPage from '@/app/(pages)/main/[id]/page'
import { AuthProvider } from '@/lib/AuthContext'
import { BarbersProvider } from '@/lib/context/BarbersContext'
import { ItemsProvider } from '@/lib/context/ItemsContext'

// Mock do useRouter
const mockPush = vi.fn()
const mockReplace = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace
  }),
  useParams: () => ({ id: '1' })
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

// Mock do framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    button: ({ children, ...props }: any) => <button {...props}>{children}</button>
  },
  AnimatePresence: ({ children }: any) => children
}))

// Mock dos hooks customizados
vi.mock('@/lib/hooks/useUserQueue', () => ({
  useUserQueue: () => ({
    queueStatus: {
      inQueue: false,
      position: null,
      estimatedTime: null,
      queueData: null
    },
    loading: false,
    refreshQueue: vi.fn()
  })
}))

vi.mock('@/lib/hooks/useRatingModal', () => ({
  useRatingModal: () => ({
    isRatingModalOpen: false,
    hideRatingModal: vi.fn(),
    handleRateOnGoogle: vi.fn()
  })
}))

function renderWithProviders(component: React.ReactElement) {
  return render(
    <AuthProvider>
      <BarbersProvider>
        <ItemsProvider>
          {component}
        </ItemsProvider>
      </BarbersProvider>
    </AuthProvider>
  )
}

describe('Fluxo Completo da Aplicação', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    global.fetch = vi.fn()
  })

  describe('Fluxo de Autenticação', () => {
    it('deve permitir registro e login de novo usuário', async () => {
      // Simular registro
      const newUser = {
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
          json: async () => newUser
        })

      renderWithProviders(<RegisterPage />)

      await waitFor(() => {
        expect(screen.getByText('Criar Conta')).toBeInTheDocument()
      })

      // Preencher formulário de registro
      const nameInput = screen.getByPlaceholderText('Digite seu nome completo')
      const phoneInput = screen.getByPlaceholderText('Digite seu telefone')
      const emailInput = screen.getByPlaceholderText('Digite seu email')
      const passwordInput = screen.getByPlaceholderText('Digite sua senha')
      const submitButton = screen.getByRole('button', { name: 'Criar Conta' })

      await userEvent.type(nameInput, 'João Silva')
      await userEvent.type(phoneInput, '11999999999')
      await userEvent.type(emailInput, 'joao@email.com')
      await userEvent.type(passwordInput, '123456')
      await userEvent.click(submitButton)

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          'http://localhost:3000/api/auth/register',
          expect.objectContaining({
            method: 'POST',
            body: JSON.stringify({
              name: 'João Silva',
              phone: '11999999999',
              email: 'joao@email.com',
              password: '123456'
            })
          })
        )
      })
    })

    it('deve permitir login de usuário existente', async () => {
      const existingUser = {
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
          json: async () => existingUser
        })

      renderWithProviders(<LoginPage />)

      await waitFor(() => {
        expect(screen.getByText('Bem Vindo de Volta!')).toBeInTheDocument()
      })

      // Preencher formulário de login
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
            body: JSON.stringify({
              identifier: 'joao@email.com',
              password: '123456'
            })
          })
        )
      })
    })
  })

  describe('Fluxo do Cliente', () => {
    it('deve permitir cliente entrar na fila', async () => {
      const mockUser = {
        id: '1',
        name: 'João Silva',
        phone: '11999999999',
        email: 'joao@email.com',
        role: 'client'
      }

      const mockBarbers = [
        {
          id: 'barber1',
          name: 'João Barbeiro',
          status: 'active',
          color: '#00ff00'
        }
      ]

      const mockServices = [
        {
          id: 'service1',
          name: 'Corte',
          price: 25,
          duration: 30
        }
      ]

      global.fetch = vi.fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockUser
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => []
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockBarbers
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockServices
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ message: 'Adicionado à fila com sucesso' })
        })

      renderWithProviders(<ClientMainPage />)

      await waitFor(() => {
        expect(screen.getByText('Entrar na Fila')).toBeInTheDocument()
      })

      // Clicar para entrar na fila
      const enterQueueButton = screen.getByText('Entrar na Fila')
      await userEvent.click(enterQueueButton)

      await waitFor(() => {
        expect(screen.getByText('Escolha seu Barbeiro')).toBeInTheDocument()
      })

      // Selecionar barbeiro
      const barberButton = screen.getByText('João Barbeiro')
      await userEvent.click(barberButton)

      // Selecionar serviço
      const serviceCheckbox = screen.getByRole('checkbox', { name: /corte/i })
      await userEvent.click(serviceCheckbox)

      // Confirmar entrada na fila
      const confirmButton = screen.getByText('Entrar na Fila')
      await userEvent.click(confirmButton)

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/queue/add',
          expect.objectContaining({
            method: 'POST',
            body: JSON.stringify({
              barberId: 'barber1',
              serviceIds: ['service1']
            })
          })
        )
      })
    })

    it('deve permitir cliente cancelar da fila', async () => {
      const mockUser = {
        id: '1',
        name: 'João Silva',
        phone: '11999999999',
        email: 'joao@email.com',
        role: 'client'
      }

      // Mock do hook para simular usuário na fila
      vi.doMock('@/lib/hooks/useUserQueue', () => ({
        useUserQueue: () => ({
          queueStatus: {
            inQueue: true,
            position: 1,
            estimatedTime: '15 min',
            queueData: {
              id: 'queue1',
              barber: { name: 'João Barbeiro' },
              services: [{ service: { name: 'Corte' } }]
            }
          },
          loading: false,
          refreshQueue: vi.fn()
        })
      }))

      global.fetch = vi.fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockUser
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ message: 'Saiu da fila com sucesso' })
        })

      renderWithProviders(<ClientMainPage />)

      await waitFor(() => {
        expect(screen.getByText('Sair da Fila')).toBeInTheDocument()
      })

      // Cancelar da fila
      const cancelButton = screen.getByText('Sair da Fila')
      await userEvent.click(cancelButton)

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/queue/cancel',
          expect.objectContaining({
            method: 'POST',
            credentials: 'include'
          })
        )
      })
    })
  })

  describe('Fluxo do Administrador', () => {
    it('deve permitir admin gerenciar fila', async () => {
      const mockAdmin = {
        id: 'admin1',
        name: 'Admin User',
        phone: '11888888888',
        email: 'admin@email.com',
        role: 'admin'
      }

      const mockQueue = [
        {
          id: 'queue1',
          user: {
            id: '1',
            name: 'João Silva',
            phone: '11999999999'
          },
          barber: {
            id: 'barber1',
            name: 'João Barbeiro'
          },
          services: [
            {
              service: {
                id: 'service1',
                name: 'Corte',
                price: 25
              }
            }
          ],
          status: 'waiting'
        }
      ]

      global.fetch = vi.fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockAdmin
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockQueue
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ message: 'Atendimento concluído' })
        })

      renderWithProviders(<MainPage />)

      await waitFor(() => {
        expect(screen.getByText('João Silva')).toBeInTheDocument()
      })

      // Completar atendimento
      const completeButton = screen.getByText('Concluir')
      await userEvent.click(completeButton)

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/queue/complete',
          expect.objectContaining({
            method: 'POST',
            body: JSON.stringify({
              queueId: 'queue1'
            })
          })
        )
      })
    })

    it('deve permitir admin mover posições na fila', async () => {
      const mockAdmin = {
        id: 'admin1',
        name: 'Admin User',
        phone: '11888888888',
        email: 'admin@email.com',
        role: 'admin'
      }

      const mockQueue = [
        {
          id: 'queue1',
          user: { id: '1', name: 'João Silva', phone: '11999999999' },
          barber: { id: 'barber1', name: 'João Barbeiro' },
          services: [{ service: { id: 'service1', name: 'Corte', price: 25 } }],
          status: 'waiting'
        },
        {
          id: 'queue2',
          user: { id: '2', name: 'Maria Silva', phone: '11888888888' },
          barber: { id: 'barber1', name: 'João Barbeiro' },
          services: [{ service: { id: 'service1', name: 'Corte', price: 25 } }],
          status: 'waiting'
        }
      ]

      global.fetch = vi.fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockAdmin
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockQueue
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ message: 'Posição alterada com sucesso' })
        })

      renderWithProviders(<MainPage />)

      await waitFor(() => {
        expect(screen.getByText('João Silva')).toBeInTheDocument()
        expect(screen.getByText('Maria Silva')).toBeInTheDocument()
      })

      // Mover posição na fila
      const moveUpButton = screen.getAllByText('↑')[0]
      await userEvent.click(moveUpButton)

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/queue/move',
          expect.objectContaining({
            method: 'POST',
            body: JSON.stringify({
              queueId: 'queue1',
              direction: 'up'
            })
          })
        )
      })
    })
  })

  describe('Validação de Permissões', () => {
    it('deve redirecionar cliente para página de cliente', async () => {
      const mockClient = {
        id: '1',
        name: 'João Silva',
        phone: '11999999999',
        email: 'joao@email.com',
        role: 'client'
      }

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => mockClient
      })

      renderWithProviders(<MainPage />)

      await waitFor(() => {
        expect(screen.getByText('Redirecionando...')).toBeInTheDocument()
      })
    })

    it('deve redirecionar admin para página de admin', async () => {
      const mockAdmin = {
        id: 'admin1',
        name: 'Admin User',
        phone: '11888888888',
        email: 'admin@email.com',
        role: 'admin'
      }

      global.fetch = vi.fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockAdmin
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => []
        })

      renderWithProviders(<MainPage />)

      await waitFor(() => {
        expect(screen.getByText('Dashboard')).toBeInTheDocument()
      })
    })
  })
})