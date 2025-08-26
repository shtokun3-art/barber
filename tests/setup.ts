import { beforeAll, afterAll, afterEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'
import '@testing-library/jest-dom'
import React from 'react'

// Configuração global para testes
beforeAll(() => {
  // Mock do window.location
  Object.defineProperty(window, 'location', {
    value: {
      origin: 'http://localhost:3000',
      href: 'http://localhost:3000',
      pathname: '/',
      search: '',
      hash: ''
    },
    writable: true
  })

  // Mock do fetch global
  global.fetch = vi.fn()

  // Mock do router do Next.js
  vi.mock('next/navigation', () => ({
    useRouter: () => ({
      push: vi.fn(),
      replace: vi.fn(),
      back: vi.fn(),
      forward: vi.fn(),
      refresh: vi.fn(),
      prefetch: vi.fn()
    }),
    usePathname: () => '/',
    useSearchParams: () => new URLSearchParams()
  }))

  // Mock do Next.js Image
  vi.mock('next/image', () => ({
    default: (props: any) => {
      // eslint-disable-next-line @next/next/no-img-element
      return React.createElement('img', props)
    }
  }))

  // Mock das funções de imagem
  vi.mock('@/lib/imageUtils', () => ({
    getImageUrl: vi.fn((path: string) => `/api/images/${path}`),
    getProfileImageUrl: vi.fn((filename: string) => `/api/images/profiles/${filename}`)
  }))

  // Mock do LoadingScreen
  vi.mock('@/app/_components/loadingScreen', () => ({
    LoadingScreen: ({ message = 'Loading...', submessage, showLogo = true }: any) => 
      React.createElement('div', { 'data-testid': 'loading-screen' }, message),
    AuthLoadingScreen: () => 
      React.createElement('div', { 'data-testid': 'auth-loading-screen' }, 'Verificando autenticação...'),
    RedirectingScreen: ({ target, userName }: any) => 
      React.createElement('div', { 'data-testid': 'redirecting-screen' }, `Redirecionando para ${target}`),
    LogoutScreen: () => 
      React.createElement('div', { 'data-testid': 'logout-screen' }, 'Saindo...')
  }))

  // Mock do UserInitialsAvatar
  vi.mock('@/app/_components/userInitialsAvatar', () => ({
    UserInitialsAvatar: ({ name, size = 40 }: any) => 
      React.createElement('div', { 
        'data-testid': 'user-initials-avatar',
        style: { width: size, height: size }
      }, name ? name.charAt(0).toUpperCase() : 'U')
  }))

  // Mock do Spinner
  vi.mock('@/app/_components/spinner', () => ({
    Spinner: ({ size = 'md' }: any) => 
      React.createElement('div', { 
        'data-testid': 'spinner',
        className: `spinner-${size}`
      }, 'Loading...')
  }))

  // Mock dos toasts
  vi.mock('@/app/_components/toasts/success', () => ({
    Success: vi.fn()
  }))

  vi.mock('@/app/_components/toasts/error', () => ({
    UserNotFounded: vi.fn(),
    ErrorToast: vi.fn()
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

  // Mock dos contextos
  vi.mock('@/lib/context/BarbersContext', () => ({
    BarbersProvider: ({ children }: any) => children,
    useBarbersContext: () => ({
      barbers: [],
      loading: false,
      error: null
    })
  }))

  vi.mock('@/lib/context/ItemsContext', () => ({
    ItemsProvider: ({ children }: any) => children,
    useItemsContext: () => ({
      items: [],
      loading: false,
      error: null
    })
  }))

  // Mock do framer-motion
  vi.mock('framer-motion', () => ({
    motion: {
      div: (props: any) => React.createElement('div', props),
      p: (props: any) => React.createElement('p', props),
      button: (props: any) => React.createElement('button', props),
      span: (props: any) => React.createElement('span', props),
      form: (props: any) => React.createElement('form', props),
      section: (props: any) => React.createElement('section', props),
      article: (props: any) => React.createElement('article', props),
      header: (props: any) => React.createElement('header', props),
      main: (props: any) => React.createElement('main', props)
    },
    AnimatePresence: ({ children }: any) => children
  }))


})

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

afterAll(() => {
  vi.restoreAllMocks()
})