/**
 * Configurações de segurança centralizadas
 * Define políticas e constantes de segurança para toda a aplicação
 */

import { logger } from './logger';

// Configurações de senha
export const PASSWORD_CONFIG = {
  minLength: 4,
  maxLength: 128,
  requireUppercase: false,
  requireLowercase: false,
  requireNumbers: false,
  requireSpecialChars: false,
  specialChars: '!@#$%^&*()_+-=[]{}|;:,.<>?',
  maxConsecutiveChars: 0,
  preventCommonPasswords: false
} as const;

// Lista de senhas comuns a serem rejeitadas
const COMMON_PASSWORDS = [
  'password', '123456', '123456789', 'qwerty', 'abc123',
  'password123', 'admin', 'letmein', 'welcome', 'monkey',
  '1234567890', 'password1', '123123', 'admin123',
  'qwerty123', 'password!', 'Password1', 'Password123'
];

// Configurações de JWT
export const JWT_CONFIG = {
  minSecretLength: 32,
  expiresIn: '24h',
  algorithm: 'HS256' as const,
  issuer: 'barber-queue-system',
  audience: 'barber-queue-users'
};

// Configurações de cookies
export const COOKIE_CONFIG = {
  name: 'barberToken',
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  maxAge: 24 * 60 * 60 * 1000, // 24 horas
  path: '/'
};

// Configurações de CORS
export const CORS_CONFIG = {
  allowedOrigins: process.env.NODE_ENV === 'production' 
    ? [process.env.NEXT_PUBLIC_API_URL || 'https://localhost:3001']
    : ['http://localhost:3000', 'http://localhost:3001'],
  allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true
};

// Configurações de headers de segurança
export const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Strict-Transport-Security': process.env.NODE_ENV === 'production' 
    ? 'max-age=31536000; includeSubDomains; preload' 
    : undefined
};

// Configurações de validação de entrada
export const INPUT_VALIDATION = {
  maxStringLength: 1000,
  maxEmailLength: 254,
  maxNameLength: 100,
  maxPhoneLength: 20,
  allowedFileTypes: ['image/jpeg', 'image/png', 'image/webp'],
  maxFileSize: 5 * 1024 * 1024, // 5MB
  sanitizeHtml: true
};

/**
 * Valida se uma senha atende aos critérios de segurança
 */
export function validatePasswordSecurity(password: string): {
  isValid: boolean;
  errors: string[];
  strength: 'weak' | 'medium' | 'strong';
} {
  const errors: string[] = [];
  let score = 0;

  // Verificar comprimento
  if (password.length < PASSWORD_CONFIG.minLength) {
    errors.push(`Senha deve ter pelo menos ${PASSWORD_CONFIG.minLength} caracteres`);
  } else {
    score += 1;
  }

  if (password.length > PASSWORD_CONFIG.maxLength) {
    errors.push(`Senha deve ter no máximo ${PASSWORD_CONFIG.maxLength} caracteres`);
  }

  // Verificar caracteres obrigatórios
  if (PASSWORD_CONFIG.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Senha deve conter pelo menos uma letra maiúscula');
  } else {
    score += 1;
  }

  if (PASSWORD_CONFIG.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('Senha deve conter pelo menos uma letra minúscula');
  } else {
    score += 1;
  }

  if (PASSWORD_CONFIG.requireNumbers && !/\d/.test(password)) {
    errors.push('Senha deve conter pelo menos um número');
  } else {
    score += 1;
  }

  if (PASSWORD_CONFIG.requireSpecialChars) {
    const specialCharsRegex = new RegExp(`[${PASSWORD_CONFIG.specialChars.replace(/[\-\[\]{}()*+?.,\\^$|#\s]/g, '\\$&')}]`);
    if (!specialCharsRegex.test(password)) {
      errors.push('Senha deve conter pelo menos um caractere especial');
    } else {
      score += 1;
    }
  }

  // Verificar caracteres consecutivos
  if (PASSWORD_CONFIG.maxConsecutiveChars > 0) {
    const consecutiveRegex = new RegExp(`(.)\\1{${PASSWORD_CONFIG.maxConsecutiveChars},}`);
    if (consecutiveRegex.test(password)) {
      errors.push(`Senha não pode ter mais de ${PASSWORD_CONFIG.maxConsecutiveChars} caracteres consecutivos iguais`);
    }
  }

  // Verificar senhas comuns
  if (PASSWORD_CONFIG.preventCommonPasswords) {
    const lowerPassword = password.toLowerCase();
    if (COMMON_PASSWORDS.some(common => lowerPassword.includes(common.toLowerCase()))) {
      errors.push('Senha muito comum, escolha uma senha mais segura');
      score = Math.max(0, score - 2);
    }
  }

  // Verificar padrões sequenciais
  if (/123456|abcdef|qwerty/i.test(password)) {
    errors.push('Senha não pode conter sequências óbvias');
    score = Math.max(0, score - 1);
  }

  // Determinar força da senha
  let strength: 'weak' | 'medium' | 'strong';
  if (score >= 4 && errors.length === 0) {
    strength = 'strong';
  } else if (score >= 3 && errors.length <= 1) {
    strength = 'medium';
  } else {
    strength = 'weak';
  }

  return {
    isValid: errors.length === 0,
    errors,
    strength
  };
}

/**
 * Sanitiza entrada de texto para prevenir XSS
 */
export function sanitizeInput(input: string): string {
  if (!INPUT_VALIDATION.sanitizeHtml) {
    return input;
  }

  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
    .replace(/document\./g, '')
    .replace(/window\./g, '')
    .replace(/eval\(/g, '')
    .replace(/alert\(/g, '')
    .replace(/console\./g, '')
    .replace(/onerror/gi, '')
    .replace(/onload/gi, '')
    .replace(/onclick/gi, '')
    .replace(/javascript:/gi, '')
    .trim();
}

/**
 * Valida se um email é válido e seguro
 */
export function validateEmail(email: string): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!email) {
    errors.push('Email é obrigatório');
    return { isValid: false, errors };
  }

  if (email.length > INPUT_VALIDATION.maxEmailLength) {
    errors.push(`Email deve ter no máximo ${INPUT_VALIDATION.maxEmailLength} caracteres`);
  }

  // Regex mais rigoroso para email
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  
  if (!emailRegex.test(email)) {
    errors.push('Formato de email inválido');
  }

  // Verificar domínios suspeitos
  const suspiciousDomains = ['tempmail.', '10minutemail.', 'guerrillamail.'];
  if (suspiciousDomains.some(domain => email.toLowerCase().includes(domain))) {
    errors.push('Domínio de email não permitido');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Gera um token CSRF seguro
 */
export function generateCSRFToken(): string {
  const array = new Uint8Array(32);
  if (typeof window !== 'undefined' && window.crypto) {
    window.crypto.getRandomValues(array);
  } else {
    // Fallback para Node.js
    const crypto = require('crypto');
    const buffer = crypto.randomBytes(32);
    array.set(buffer);
  }
  
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Aplica headers de segurança a uma resposta
 */
export function applySecurityHeaders(headers: Headers): void {
  Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
    if (value) {
      headers.set(key, value);
    }
  });
}

/**
 * Valida se uma requisição está dentro dos limites de segurança
 */
export function validateRequestSecurity(request: Request): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  const url = new URL(request.url);

  // Verificar método HTTP
  if (!CORS_CONFIG.allowedMethods.includes(request.method)) {
    errors.push(`Método HTTP ${request.method} não permitido`);
  }

  // Verificar Content-Type para requisições POST/PUT
  if (['POST', 'PUT', 'PATCH'].includes(request.method)) {
    const contentType = request.headers.get('content-type');
    if (!contentType || (!contentType.includes('application/json') && !contentType.includes('multipart/form-data'))) {
      errors.push('Content-Type inválido');
    }
  }

  // Verificar tamanho do payload (se disponível)
  const contentLength = request.headers.get('content-length');
  if (contentLength && parseInt(contentLength) > 10 * 1024 * 1024) { // 10MB
    errors.push('Payload muito grande');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Log de evento de segurança
 */
export function logSecurityEvent(event: string, details: Record<string, any>): void {
  logger.warn(`Evento de segurança: ${event}`, {
    component: 'security',
    event,
    timestamp: new Date().toISOString(),
    ...details
  });
}