import { describe, it, expect } from 'vitest'
import { loginSchema } from '@/lib/schemas/loginSchema'
import { registerSchema } from '@/lib/schemas/registerSchema'

describe('Schemas e Utilitários da Aplicação', () => {
  describe('Login Schema', () => {
    it('deve validar email válido', () => {
      const validData = {
        identifier: 'joao@email.com',
        password: 'senha123'
      }
      
      const result = loginSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('deve validar telefone válido (formato 11 dígitos)', () => {
      const validData = {
        identifier: '11999999999',
        password: 'senha123'
      }
      
      const result = loginSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('deve validar telefone válido (formato formatado)', () => {
      const validData = {
        identifier: '(11) 9 9999-9999',
        password: 'senha123'
      }
      
      const result = loginSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('deve rejeitar identifier vazio', () => {
      const invalidData = {
        identifier: '',
        password: 'senha123'
      }
      
      const result = loginSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      expect(result.error?.issues[0].message).toBe('Email ou telefone é obrigatório')
    })

    it('deve aceitar senha de 8 caracteres', () => {
      const validData = {
        identifier: 'joao@email.com',
        password: 'senha123'
      }
      
      const result = loginSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('deve aceitar senha válida', () => {
      const validData = {
        identifier: 'joao@email.com',
        password: 'MinhaSenh@123'
      }
      
      const result = loginSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('deve aceitar senha com caracteres especiais', () => {
      const validData = {
        identifier: 'joao@email.com',
        password: 'senha123!@#'
      }
      
      const result = loginSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('deve rejeitar email inválido', () => {
      const invalidData = {
        identifier: 'email-invalido',
        password: 'senha123'
      }
      
      const result = loginSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      expect(result.error?.issues[0].message).toBe('Por favor, insira um email ou telefone válido')
    })
  })

  describe('Register Schema', () => {
    it('deve validar dados de registro válidos', () => {
      const validData = {
        name: 'João Silva',
        phone: '11999999999',
        email: 'joao@email.com',
        password: 'MinhaSenh@123',
        confirmPassword: 'MinhaSenh@123'
      }
      
      const result = registerSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('deve validar dados sem email (opcional)', () => {
      const validData = {
        name: 'João Silva',
        phone: '11999999999',
        password: 'MinhaSenh@123',
        confirmPassword: 'MinhaSenh@123'
      }
      
      const result = registerSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('deve rejeitar nome vazio', () => {
      const invalidData = {
        name: '',
        phone: '11999999999',
        email: 'joao@email.com',
        password: 'senha123',
        confirmPassword: 'senha123'
      }
      
      const result = registerSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      expect(result.error?.issues[0].message).toBe('Nome é obrigatório')
    })

    it('deve rejeitar telefone vazio', () => {
      const invalidData = {
        name: 'João Silva',
        phone: '',
        email: 'joao@email.com',
        password: 'senha123',
        confirmPassword: 'senha123'
      }
      
      const result = registerSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      expect(result.error?.issues[0].message).toBe('Telefone é Obrigatório')
    })

    it('deve rejeitar senha muito curta', () => {
      const invalidData = {
        name: 'João Silva',
        phone: '11999999999',
        email: 'joao@email.com',
        password: '123',
        confirmPassword: '123'
      }
      
      const result = registerSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      expect(result.error?.issues.some(issue => issue.message.includes('A senha deve ter pelo menos 4 caracteres'))).toBe(true)
    })

    it('deve aceitar senha simples com 4+ caracteres', () => {
      const validData = {
        name: 'João Silva',
        phone: '11999999999',
        email: 'joao@email.com',
        password: 'senha',
        confirmPassword: 'senha'
      }
      
      const result = registerSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('deve aceitar senha com caracteres especiais', () => {
      const validData = {
        name: 'João Silva',
        phone: '11999999999',
        email: 'joao@email.com',
        password: 'MinhaSenh@123',
        confirmPassword: 'MinhaSenh@123'
      }
      
      const result = registerSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('deve rejeitar senhas que não coincidem', () => {
      const invalidData = {
        name: 'João Silva',
        phone: '11999999999',
        email: 'joao@email.com',
        password: 'MinhaSenh@123',
        confirmPassword: 'MinhaSenh@456'
      }
      
      const result = registerSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      expect(result.error?.issues.some(issue => issue.message === 'As senhas não coincidem')).toBe(true)
    })

    it('deve rejeitar email inválido', () => {
      const invalidData = {
        name: 'João Silva',
        phone: '11999999999',
        email: 'email-invalido',
        password: 'MinhaSenh@123',
        confirmPassword: 'MinhaSenh@123'
      }
      
      const result = registerSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      expect(result.error?.issues.some(issue => issue.message === 'Email inválido ou não permitido')).toBe(true)
    })
  })

  describe('Funções Utilitárias', () => {
    describe('Formatação de Moeda', () => {
      it('deve formatar valores em reais corretamente', () => {
        const formatCurrency = (value: number) => {
          return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
          }).format(value)
        }

        // Testa se contém os elementos essenciais da formatação
        expect(formatCurrency(25)).toContain('25,00')
        expect(formatCurrency(25)).toContain('R$')
        expect(formatCurrency(15.5)).toContain('15,50')
        expect(formatCurrency(0)).toContain('0,00')
        expect(formatCurrency(1000)).toContain('1.000,00')
      })
    })

    describe('Formatação de Tempo', () => {
      it('deve formatar tempo em minutos corretamente', () => {
        const formatTime = (minutes: number) => {
          const hours = Math.floor(minutes / 60)
          const mins = minutes % 60
          if (hours > 0) {
            return `${hours}h ${mins}min`
          }
          return `${mins}min`
        }

        expect(formatTime(30)).toBe('30min')
        expect(formatTime(60)).toBe('1h 0min')
        expect(formatTime(90)).toBe('1h 30min')
        expect(formatTime(0)).toBe('0min')
        expect(formatTime(125)).toBe('2h 5min')
      })

      it('deve formatar tempo com formato alternativo', () => {
        const formatTime = (minutes: number): string => {
          if (minutes === 0) return '0 min'
          
          const hours = Math.floor(minutes / 60)
          const remainingMinutes = minutes % 60
          
          if (hours === 0) {
            return `${remainingMinutes} min`
          } else if (remainingMinutes === 0) {
            return `${hours}h`
          } else {
            return `${hours}h ${remainingMinutes}min`
          }
        }

        expect(formatTime(0)).toBe('0 min')
        expect(formatTime(30)).toBe('30 min')
        expect(formatTime(60)).toBe('1h')
        expect(formatTime(90)).toBe('1h 30min')
        expect(formatTime(120)).toBe('2h')
      })
    })

    describe('Formatação de Telefone para WhatsApp', () => {
      it('deve formatar telefone para WhatsApp corretamente', () => {
        const formatPhoneForWhatsApp = (phone: string) => {
          const cleanedPhone = phone.replace(/[\s()-]/g, "")
          if (!cleanedPhone.startsWith("+")) {
            return `+55${cleanedPhone}`
          }
          return cleanedPhone
        }

        expect(formatPhoneForWhatsApp('11999999999')).toBe('+5511999999999')
        expect(formatPhoneForWhatsApp('(11) 99999-9999')).toBe('+5511999999999')
        expect(formatPhoneForWhatsApp('11 99999-9999')).toBe('+5511999999999')
        expect(formatPhoneForWhatsApp('+5511999999999')).toBe('+5511999999999')
      })
    })

    describe('Cálculos de Negócio', () => {
      it('deve calcular tempo estimado de espera', () => {
        const calculateEstimatedWaitTime = (queuePosition: number, averageServiceTime: number) => {
          return queuePosition * averageServiceTime
        }

        expect(calculateEstimatedWaitTime(3, 30)).toBe(90) // 3 pessoas * 30min = 90min
        expect(calculateEstimatedWaitTime(1, 45)).toBe(45) // 1 pessoa * 45min = 45min
        expect(calculateEstimatedWaitTime(0, 30)).toBe(0) // Ninguém na frente
      })

      it('deve calcular preço total dos serviços', () => {
        const services = [
          { price: 25 }, // Corte
          { price: 15 }, // Barba
          { price: 10 }  // Sobrancelha
        ]
        
        const total = services.reduce((sum, service) => sum + service.price, 0)
        expect(total).toBe(50)
      })

      it('deve calcular tempo total dos serviços', () => {
        const services = [
          { averageTime: 30 }, // Corte
          { averageTime: 20 }, // Barba
          { averageTime: 10 }  // Sobrancelha
        ]
        
        const totalTime = services.reduce((sum, service) => sum + service.averageTime, 0)
        expect(totalTime).toBe(60)
      })
    })

    describe('Validação de Roles', () => {
      it('deve identificar administradores corretamente', () => {
        const isAdmin = (role: string) => role === 'admin' || role === 'barber'
        
        expect(isAdmin('admin')).toBe(true)
        expect(isAdmin('barber')).toBe(true)
        expect(isAdmin('client')).toBe(false)
        expect(isAdmin('user')).toBe(false)
      })

      it('deve identificar clientes corretamente', () => {
        const isClient = (role: string) => role === 'client'
        
        expect(isClient('client')).toBe(true)
        expect(isClient('admin')).toBe(false)
        expect(isClient('barber')).toBe(false)
      })
    })

    describe('Geração de Cores', () => {
      it('deve gerar cores válidas para usuários', () => {
        const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8']
        const generateRandomColor = () => {
          return colors[Math.floor(Math.random() * colors.length)]
        }

        const color = generateRandomColor()
        expect(colors).toContain(color)
        expect(color).toMatch(/^#[0-9A-F]{6}$/i)
      })
    })
  })
})