import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueuePage } from '@/app/(pages)/client/_components/pages/queue'
import { GetInQueue } from '@/app/(pages)/client/_components/pages/getInQueue'
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

describe('Componentes da Fila', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    global.fetch = vi.fn()
  })

  describe('QueuePage', () => {
    const mockProps = {
      setPage: vi.fn(),
      onBack: vi.fn()
    }

    it('deve renderizar a página da fila', async () => {
      // Mock para não ter usuário logado inicialmente
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: false,
        status: 401
      })

      renderWithProviders(<QueuePage {...mockProps} />)

      await waitFor(() => {
        expect(screen.getByText('Fila Atual')).toBeInTheDocument()
      })
    })

    it('deve exibir botão para entrar na fila quando usuário não está na fila', async () => {
      global.fetch = vi.fn()
        .mockResolvedValueOnce({
          ok: false,
          status: 401
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => []
        })

      renderWithProviders(<QueuePage {...mockProps} />)

      await waitFor(() => {
        expect(screen.getByText('Entrar na Fila')).toBeInTheDocument()
      })
    })

    it('deve chamar setPage quando clicar em entrar na fila', async () => {
      global.fetch = vi.fn()
        .mockResolvedValueOnce({
          ok: false,
          status: 401
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => []
        })

      renderWithProviders(<QueuePage {...mockProps} />)

      await waitFor(() => {
        expect(screen.getByText('Entrar na Fila')).toBeInTheDocument()
      })

      const enterQueueButton = screen.getByText('Entrar na Fila')
      await userEvent.click(enterQueueButton)

      expect(mockProps.setPage).toHaveBeenCalledWith('form')
    })

    it('deve exibir fila com usuários', async () => {
      const mockQueue = [
        {
          id: 'queue1',
          user: {
            id: '1',
            name: 'João Silva',
            phone: '11999999999',
            color: '#ff0000'
          },
          barber: {
            id: 'barber1',
            name: 'João Barbeiro',
            color: '#00ff00'
          },
          services: [
            {
              service: {
                id: 'service1',
                name: 'Corte',
                price: 25,
                duration: 30
              }
            }
          ],
          status: 'waiting'
        }
      ]

      global.fetch = vi.fn()
        .mockResolvedValueOnce({
          ok: false,
          status: 401
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockQueue
        })

      renderWithProviders(<QueuePage {...mockProps} />)

      await waitFor(() => {
        expect(screen.getByText('João Silva')).toBeInTheDocument()
        expect(screen.getByText('João Barbeiro')).toBeInTheDocument()
        expect(screen.getByText('Corte')).toBeInTheDocument()
      })
    })
  })

  describe('GetInQueue', () => {
    const mockProps = {
      setPage: vi.fn(),
      onBack: vi.fn()
    }

    it('deve renderizar o formulário para entrar na fila', async () => {
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
        },
        {
          id: 'service2',
          name: 'Barba',
          price: 15,
          duration: 20
        }
      ]

      global.fetch = vi.fn()
        .mockResolvedValueOnce({
          ok: false,
          status: 401
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockBarbers
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockServices
        })

      renderWithProviders(<GetInQueue {...mockProps} />)

      await waitFor(() => {
        expect(screen.getByText('Escolha seu Barbeiro')).toBeInTheDocument()
        expect(screen.getByText('Escolha os Serviços')).toBeInTheDocument()
      })

      await waitFor(() => {
        expect(screen.getByText('João Barbeiro')).toBeInTheDocument()
        expect(screen.getByText('Corte')).toBeInTheDocument()
        expect(screen.getByText('Barba')).toBeInTheDocument()
      })
    })

    it('deve permitir selecionar barbeiro e serviços', async () => {
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
          ok: false,
          status: 401
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockBarbers
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockServices
        })

      renderWithProviders(<GetInQueue {...mockProps} />)

      await waitFor(() => {
        expect(screen.getByText('João Barbeiro')).toBeInTheDocument()
      })

      // Selecionar barbeiro
      const barberButton = screen.getByText('João Barbeiro')
      await userEvent.click(barberButton)

      // Selecionar serviço
      const serviceCheckbox = screen.getByRole('checkbox', { name: /corte/i })
      await userEvent.click(serviceCheckbox)

      // Verificar se o botão de entrar na fila está habilitado
      await waitFor(() => {
        const enterQueueButton = screen.getByText('Entrar na Fila')
        expect(enterQueueButton).not.toBeDisabled()
      })
    })

    it('deve submeter formulário e entrar na fila', async () => {
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
          ok: false,
          status: 401
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

      renderWithProviders(<GetInQueue {...mockProps} />)

      await waitFor(() => {
        expect(screen.getByText('João Barbeiro')).toBeInTheDocument()
      })

      // Selecionar barbeiro
      const barberButton = screen.getByText('João Barbeiro')
      await userEvent.click(barberButton)

      // Selecionar serviço
      const serviceCheckbox = screen.getByRole('checkbox', { name: /corte/i })
      await userEvent.click(serviceCheckbox)

      // Submeter formulário
      const enterQueueButton = screen.getByText('Entrar na Fila')
      await userEvent.click(enterQueueButton)

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/queue/add',
          expect.objectContaining({
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              barberId: 'barber1',
              serviceIds: ['service1']
            }),
            credentials: 'include'
          })
        )
      })
    })

    it('deve exibir erro quando não selecionar barbeiro', async () => {
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
          ok: false,
          status: 401
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => []
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockServices
        })

      renderWithProviders(<GetInQueue {...mockProps} />)

      await waitFor(() => {
        expect(screen.getByText('Escolha os Serviços')).toBeInTheDocument()
      })

      // Selecionar apenas serviço
      const serviceCheckbox = screen.getByRole('checkbox', { name: /corte/i })
      await userEvent.click(serviceCheckbox)

      // Tentar submeter sem barbeiro
      const enterQueueButton = screen.getByText('Entrar na Fila')
      await userEvent.click(enterQueueButton)

      await waitFor(() => {
        expect(screen.getByText('Selecione um barbeiro')).toBeInTheDocument()
      })
    })
  })
})