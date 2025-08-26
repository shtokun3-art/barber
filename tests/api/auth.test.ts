import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { NextRequest } from 'next/server'
import { POST as loginPOST } from '@/app/api/auth/login/route'
import { POST as registerPOST } from '@/app/api/auth/register/route'
import { GET as meGET } from '@/app/api/auth/me/route'
import * as bcrypt from 'bcryptjs'
import * as jwt from 'jsonwebtoken'

// Mock do Prisma
const mockPrisma = {
  user: {
    findFirst: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn()
  }
}

vi.mock('@/lib/utils', () => ({
  prisma: mockPrisma
}))

// Mock do bcrypt
vi.mock('bcryptjs', () => ({
  compare: vi.fn(),
  hash: vi.fn()
}))

// Mock do jwt
vi.mock('jsonwebtoken', () => ({
  sign: vi.fn(),
  verify: vi.fn()
}))

// Mock do cookies
vi.mock('next/headers', () => ({
  cookies: () => ({
    get: vi.fn(),
    set: vi.fn()
  })
}))

describe('API de Autenticação', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('POST /api/auth/login', () => {
    it('deve fazer login com email válido', async () => {
      const mockUser = {
        id: '1',
        name: 'João Silva',
        phone: '11999999999',
        email: 'joao@email.com',
        password: 'hashedpassword',
        role: 'client'
      }

      mockPrisma.user.findFirst.mockResolvedValue(mockUser)
      vi.mocked(bcrypt.compare).mockResolvedValue(true)
      vi.mocked(jwt.sign).mockReturnValue('mock-token')

      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          identifier: 'joao@email.com',
          password: '123456'
        })
      })

      const response = await loginPOST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual({
        id: '1',
        name: 'João Silva',
        phone: '11999999999',
        email: 'joao@email.com',
        role: 'client'
      })
      expect(mockPrisma.user.findFirst).toHaveBeenCalledWith({
        where: { email: 'joao@email.com' }
      })
    })

    it('deve fazer login com telefone válido', async () => {
      const mockUser = {
        id: '1',
        name: 'João Silva',
        phone: '11999999999',
        email: 'joao@email.com',
        password: 'hashedpassword',
        role: 'client'
      }

      mockPrisma.user.findFirst.mockResolvedValue(mockUser)
      vi.mocked(bcrypt.compare).mockResolvedValue(true)
      vi.mocked(jwt.sign).mockReturnValue('mock-token')

      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          identifier: '11999999999',
          password: '123456'
        })
      })

      const response = await loginPOST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(mockPrisma.user.findFirst).toHaveBeenCalledWith({
        where: { phone: '11999999999' }
      })
    })

    it('deve retornar erro para usuário não encontrado', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          identifier: 'naoexiste@email.com',
          password: '123456'
        })
      })

      const response = await loginPOST(request)
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('Usuário não encontrado')
    })

    it('deve retornar erro para senha incorreta', async () => {
      const mockUser = {
        id: '1',
        name: 'João Silva',
        phone: '11999999999',
        email: 'joao@email.com',
        password: 'hashedpassword',
        role: 'client'
      }

      mockPrisma.user.findFirst.mockResolvedValue(mockUser)
      vi.mocked(bcrypt.compare).mockResolvedValue(false)

      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          identifier: 'joao@email.com',
          password: 'senhaerrada'
        })
      })

      const response = await loginPOST(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Senha incorreta')
    })
  })

  describe('POST /api/auth/register', () => {
    it('deve registrar novo usuário com sucesso', async () => {
      const newUser = {
        id: '1',
        name: 'João Silva',
        phone: '11999999999',
        email: 'joao@email.com',
        password: 'hashedpassword',
        role: 'client'
      }

      mockPrisma.user.findFirst.mockResolvedValue(null) // Usuário não existe
      mockPrisma.user.create.mockResolvedValue(newUser)
      vi.mocked(bcrypt.hash).mockResolvedValue('hashedpassword')
      vi.mocked(jwt.sign).mockReturnValue('mock-token')

      const request = new NextRequest('http://localhost:3000/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          name: 'João Silva',
          phone: '11999999999',
          email: 'joao@email.com',
          password: '123456'
        })
      })

      const response = await registerPOST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data).toEqual({
        id: '1',
        name: 'João Silva',
        phone: '11999999999',
        email: 'joao@email.com',
        role: 'client'
      })
    })

    it('deve retornar erro para usuário já existente', async () => {
      const existingUser = {
        id: '1',
        name: 'João Silva',
        phone: '11999999999',
        email: 'joao@email.com',
        password: 'hashedpassword',
        role: 'client'
      }

      mockPrisma.user.findFirst.mockResolvedValue(existingUser)

      const request = new NextRequest('http://localhost:3000/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          name: 'João Silva',
          phone: '11999999999',
          email: 'joao@email.com',
          password: '123456'
        })
      })

      const response = await registerPOST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('já está em uso')
    })
  })

  describe('GET /api/auth/me', () => {
    it('deve retornar dados do usuário autenticado', async () => {
      const mockUser = {
        id: '1',
        name: 'João Silva',
        phone: '11999999999',
        email: 'joao@email.com',
        role: 'client',
        color: '#ff0000',
        profileImage: null,
        hasRatedOnGoogle: false
      }

      const mockCookies = {
        get: vi.fn().mockReturnValue({ value: 'valid-token' })
      }

      vi.mocked(jwt.verify).mockReturnValue({ id: '1', phone: '11999999999', role: 'client' })
      mockPrisma.user.findUnique.mockResolvedValue(mockUser)

      // Mock do cookies
      vi.doMock('next/headers', () => ({
        cookies: () => mockCookies
      }))

      const request = new NextRequest('http://localhost:3000/api/auth/me')
      const response = await meGET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual({
        id: '1',
        name: 'João Silva',
        phone: '11999999999',
        email: 'joao@email.com',
        role: 'client',
        color: '#ff0000',
        profileImage: null,
        hasRatedOnGoogle: false
      })
    })

    it('deve retornar erro para token inválido', async () => {
      const mockCookies = {
        get: vi.fn().mockReturnValue(null)
      }

      vi.doMock('next/headers', () => ({
        cookies: () => mockCookies
      }))

      const request = new NextRequest('http://localhost:3000/api/auth/me')
      const response = await meGET(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Não autorizado')
    })
  })
})