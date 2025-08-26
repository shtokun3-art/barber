import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { POST as addToQueue } from '@/app/api/queue/add/route'
import { POST as cancelQueue } from '@/app/api/queue/cancel/route'
import { POST as completeQueue } from '@/app/api/queue/complete/route'
import { POST as moveQueue } from '@/app/api/queue/move/route'
import { GET as getQueue } from '@/app/api/queue/route'
import * as jwt from 'jsonwebtoken'

// Mock do Prisma
const mockPrisma = {
  queue: {
    findFirst: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn()
  },
  queueService: {
    create: vi.fn(),
    findMany: vi.fn()
  },
  barber: {
    findUnique: vi.fn(),
    findMany: vi.fn()
  },
  service: {
    findMany: vi.fn()
  },
  user: {
    findUnique: vi.fn()
  },
  $transaction: vi.fn()
}

vi.mock('@/lib/utils', () => ({
  prisma: mockPrisma
}))

// Mock do jwt
vi.mock('jsonwebtoken', () => ({
  verify: vi.fn()
}))

// Mock do cookies
const mockCookies = {
  get: vi.fn()
}

vi.mock('next/headers', () => ({
  cookies: () => mockCookies
}))

// Mock do notifyQueueUpdate
vi.mock('@/lib/queue-notifier', () => ({
  notifyQueueUpdate: vi.fn()
}))

describe('API da Fila', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockCookies.get.mockReturnValue({ value: 'valid-token' })
    vi.mocked(jwt.verify).mockReturnValue({ id: '1', phone: '11999999999', role: 'client' })
  })

  describe('POST /api/queue/add', () => {
    it('deve adicionar usuário à fila com sucesso', async () => {
      const mockBarber = {
        id: 'barber1',
        name: 'João Barbeiro',
        status: 'active'
      }

      const mockServices = [
        { id: 'service1', name: 'Corte', price: 25 },
        { id: 'service2', name: 'Barba', price: 15 }
      ]

      const mockQueueEntry = {
        id: 'queue1',
        userId: '1',
        barberId: 'barber1',
        status: 'waiting'
      }

      mockPrisma.queue.findFirst.mockResolvedValue(null) // Usuário não está na fila
      mockPrisma.barber.findUnique.mockResolvedValue(mockBarber)
      mockPrisma.service.findMany.mockResolvedValue(mockServices)
      mockPrisma.$transaction.mockImplementation(async (callback) => {
        return await callback({
          queue: {
            create: vi.fn().mockResolvedValue(mockQueueEntry)
          },
          queueService: {
            create: vi.fn()
          }
        })
      })

      const request = new NextRequest('http://localhost:3000/api/queue/add', {
        method: 'POST',
        body: JSON.stringify({
          serviceIds: ['service1', 'service2'],
          barberId: 'barber1'
        })
      })

      const response = await addToQueue(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.message).toBe('Adicionado à fila com sucesso')
      expect(mockPrisma.queue.findFirst).toHaveBeenCalledWith({
        where: {
          userId: '1',
          status: 'waiting'
        }
      })
    })

    it('deve retornar erro se usuário já está na fila', async () => {
      const existingQueue = {
        id: 'queue1',
        userId: '1',
        barberId: 'barber1',
        status: 'waiting'
      }

      mockPrisma.queue.findFirst.mockResolvedValue(existingQueue)

      const request = new NextRequest('http://localhost:3000/api/queue/add', {
        method: 'POST',
        body: JSON.stringify({
          serviceIds: ['service1'],
          barberId: 'barber1'
        })
      })

      const response = await addToQueue(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Você já está na fila')
    })

    it('deve retornar erro se barbeiro não está disponível', async () => {
      const inactiveBarber = {
        id: 'barber1',
        name: 'João Barbeiro',
        status: 'inactive'
      }

      mockPrisma.queue.findFirst.mockResolvedValue(null)
      mockPrisma.barber.findUnique.mockResolvedValue(inactiveBarber)

      const request = new NextRequest('http://localhost:3000/api/queue/add', {
        method: 'POST',
        body: JSON.stringify({
          serviceIds: ['service1'],
          barberId: 'barber1'
        })
      })

      const response = await addToQueue(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Barbeiro não disponível')
    })

    it('deve retornar erro para token inválido', async () => {
      mockCookies.get.mockReturnValue(null)

      const request = new NextRequest('http://localhost:3000/api/queue/add', {
        method: 'POST',
        body: JSON.stringify({
          serviceIds: ['service1'],
          barberId: 'barber1'
        })
      })

      const response = await addToQueue(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Não autorizado')
    })
  })

  describe('POST /api/queue/cancel', () => {
    it('deve cancelar entrada na fila com sucesso', async () => {
      const mockQueueEntry = {
        id: 'queue1',
        userId: '1',
        barberId: 'barber1',
        status: 'waiting'
      }

      mockPrisma.queue.findFirst.mockResolvedValue(mockQueueEntry)
      mockPrisma.queue.update.mockResolvedValue({
        ...mockQueueEntry,
        status: 'cancelled'
      })

      const request = new NextRequest('http://localhost:3000/api/queue/cancel', {
        method: 'POST'
      })

      const response = await cancelQueue(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.message).toBe('Saiu da fila com sucesso')
      expect(mockPrisma.queue.update).toHaveBeenCalledWith({
        where: { id: 'queue1' },
        data: { status: 'cancelled' }
      })
    })

    it('deve retornar erro se usuário não está na fila', async () => {
      mockPrisma.queue.findFirst.mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/queue/cancel', {
        method: 'POST'
      })

      const response = await cancelQueue(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Você não está na fila')
    })
  })

  describe('POST /api/queue/complete', () => {
    it('deve completar atendimento com sucesso (admin)', async () => {
      vi.mocked(jwt.verify).mockReturnValue({ id: 'admin1', phone: '11888888888', role: 'admin' })

      const mockQueueEntry = {
        id: 'queue1',
        userId: '1',
        barberId: 'barber1',
        status: 'in_progress'
      }

      mockPrisma.queue.findUnique.mockResolvedValue(mockQueueEntry)
      mockPrisma.queue.update.mockResolvedValue({
        ...mockQueueEntry,
        status: 'completed'
      })

      const request = new NextRequest('http://localhost:3000/api/queue/complete', {
        method: 'POST',
        body: JSON.stringify({
          queueId: 'queue1'
        })
      })

      const response = await completeQueue(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.message).toBe('Atendimento concluído')
    })

    it('deve retornar erro para usuário não autorizado', async () => {
      const request = new NextRequest('http://localhost:3000/api/queue/complete', {
        method: 'POST',
        body: JSON.stringify({
          queueId: 'queue1'
        })
      })

      const response = await completeQueue(request)
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.error).toBe('Acesso negado')
    })
  })

  describe('GET /api/queue', () => {
    it('deve retornar fila atual', async () => {
      const mockQueue = [
        {
          id: 'queue1',
          userId: '1',
          barberId: 'barber1',
          status: 'waiting',
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
          ]
        }
      ]

      mockPrisma.queue.findMany.mockResolvedValue(mockQueue)

      const request = new NextRequest('http://localhost:3000/api/queue')
      const response = await getQueue(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual(mockQueue)
      expect(mockPrisma.queue.findMany).toHaveBeenCalledWith({
        where: {
          status: {
            in: ['waiting', 'in_progress']
          }
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              phone: true,
              color: true,
              profileImage: true
            }
          },
          barber: {
            select: {
              id: true,
              name: true,
              color: true
            }
          },
          services: {
            include: {
              service: {
                select: {
                  id: true,
                  name: true,
                  price: true,
                  duration: true
                }
              }
            }
          }
        },
        orderBy: {
          createdAt: 'asc'
        }
      })
    })
  })

  describe('POST /api/queue/move', () => {
    it('deve mover posição na fila com sucesso (admin)', async () => {
      vi.mocked(jwt.verify).mockReturnValue({ id: 'admin1', phone: '11888888888', role: 'admin' })

      const request = new NextRequest('http://localhost:3000/api/queue/move', {
        method: 'POST',
        body: JSON.stringify({
          queueId: 'queue1',
          direction: 'up'
        })
      })

      const response = await moveQueue(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.message).toBe('Posição alterada com sucesso')
    })

    it('deve retornar erro para usuário não autorizado', async () => {
      const request = new NextRequest('http://localhost:3000/api/queue/move', {
        method: 'POST',
        body: JSON.stringify({
          queueId: 'queue1',
          direction: 'up'
        })
      })

      const response = await moveQueue(request)
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.error).toBe('Acesso negado')
    })
  })
})