/**
 * Sistema de Rate Limiting para proteção contra ataques de força bruta
 * Implementa limitação de requisições por IP e endpoint
 */

import { NextRequest, NextResponse } from 'next/server';
import { logger } from './logger';

// Configurações de rate limiting por endpoint
const RATE_LIMITS = {
  // Autenticação - mais restritivo
  '/api/auth/login': {
    windowMs: 15 * 60 * 1000, // 15 minutos
    maxRequests: 5, // 5 tentativas por IP
    blockDurationMs: 30 * 60 * 1000 // 30 minutos de bloqueio
  },
  '/api/auth/register': {
    windowMs: 60 * 60 * 1000, // 1 hora
    maxRequests: 3, // 3 registros por IP por hora
    blockDurationMs: 60 * 60 * 1000 // 1 hora de bloqueio
  },
  // APIs gerais - menos restritivo
  '/api/queue': {
    windowMs: 1 * 60 * 1000, // 1 minuto
    maxRequests: 30, // 30 requisições por minuto
    blockDurationMs: 5 * 60 * 1000 // 5 minutos de bloqueio
  },
  // Padrão para outras rotas
  default: {
    windowMs: 1 * 60 * 1000, // 1 minuto
    maxRequests: 60, // 60 requisições por minuto
    blockDurationMs: 2 * 60 * 1000 // 2 minutos de bloqueio
  }
};

// Armazenamento em memória para rate limiting
// Em produção, considere usar Redis ou outro cache distribuído
interface RateLimitEntry {
  count: number;
  resetTime: number;
  blocked: boolean;
  blockUntil?: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

/**
 * Obtém o IP real do cliente considerando proxies
 */
function getClientIP(request: NextRequest): string {
  // Verifica headers de proxy comuns
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  const realIP = request.headers.get('x-real-ip');
  if (realIP) {
    return realIP;
  }
  
  // Fallback para IP desconhecido
  return 'unknown';
}

/**
 * Obtém a configuração de rate limit para um endpoint
 */
function getRateLimitConfig(pathname: string) {
  // Verifica se há configuração específica para o endpoint
  for (const [endpoint, config] of Object.entries(RATE_LIMITS)) {
    if (endpoint !== 'default' && pathname.startsWith(endpoint)) {
      return config;
    }
  }
  
  return RATE_LIMITS.default;
}

/**
 * Limpa entradas expiradas do store
 */
function cleanupExpiredEntries() {
  const now = Date.now();
  
  for (const [key, entry] of rateLimitStore.entries()) {
    // Remove entradas que passaram do tempo de reset e não estão bloqueadas
    if (now > entry.resetTime && (!entry.blocked || (entry.blockUntil && now > entry.blockUntil))) {
      rateLimitStore.delete(key);
    }
  }
}

/**
 * Verifica se uma requisição deve ser limitada
 */
export function checkRateLimit(request: NextRequest): {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
} {
  const ip = getClientIP(request);
  const pathname = new URL(request.url).pathname;
  const config = getRateLimitConfig(pathname);
  const key = `${ip}:${pathname}`;
  const now = Date.now();
  
  // Limpa entradas expiradas periodicamente
  if (Math.random() < 0.01) { // 1% de chance a cada requisição
    cleanupExpiredEntries();
  }
  
  let entry = rateLimitStore.get(key);
  
  // Se não existe entrada, cria uma nova
  if (!entry) {
    entry = {
      count: 1,
      resetTime: now + config.windowMs,
      blocked: false
    };
    rateLimitStore.set(key, entry);
    
    logger.info('Nova entrada de rate limit criada', {
      component: 'rate-limiter',
      ip,
      pathname,
      count: 1,
      maxRequests: config.maxRequests
    });
    
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetTime: entry.resetTime
    };
  }
  
  // Verifica se está bloqueado
  if (entry.blocked && entry.blockUntil && now < entry.blockUntil) {
    logger.warn('Requisição bloqueada por rate limit', {
      component: 'rate-limiter',
      ip,
      pathname,
      blockUntil: entry.blockUntil,
      remainingBlockTime: entry.blockUntil - now
    });
    
    return {
      allowed: false,
      remaining: 0,
      resetTime: entry.resetTime,
      retryAfter: Math.ceil((entry.blockUntil - now) / 1000)
    };
  }
  
  // Se passou do tempo de reset, reinicia o contador
  if (now > entry.resetTime) {
    entry.count = 1;
    entry.resetTime = now + config.windowMs;
    entry.blocked = false;
    delete entry.blockUntil;
    
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetTime: entry.resetTime
    };
  }
  
  // Incrementa o contador
  entry.count++;
  
  // Verifica se excedeu o limite
  if (entry.count > config.maxRequests) {
    entry.blocked = true;
    entry.blockUntil = now + config.blockDurationMs;
    
    logger.error('Rate limit excedido - IP bloqueado', {
      component: 'rate-limiter',
      ip,
      pathname,
      count: entry.count,
      maxRequests: config.maxRequests,
      blockDurationMs: config.blockDurationMs
    });
    
    return {
      allowed: false,
      remaining: 0,
      resetTime: entry.resetTime,
      retryAfter: Math.ceil(config.blockDurationMs / 1000)
    };
  }
  
  const remaining = config.maxRequests - entry.count;
  
  // Log de warning quando se aproxima do limite
  if (remaining <= 2) {
    logger.warn('Aproximando-se do limite de rate limit', {
      component: 'rate-limiter',
      ip,
      pathname,
      count: entry.count,
      remaining,
      maxRequests: config.maxRequests
    });
  }
  
  return {
    allowed: true,
    remaining,
    resetTime: entry.resetTime
  };
}

/**
 * Middleware de rate limiting para Next.js
 */
export function rateLimitMiddleware(request: NextRequest): NextResponse | null {
  const result = checkRateLimit(request);
  
  if (!result.allowed) {
    const response = NextResponse.json(
      {
        error: 'Muitas requisições. Tente novamente mais tarde.',
        retryAfter: result.retryAfter
      },
      { status: 429 }
    );
    
    // Adiciona headers informativos
    response.headers.set('X-RateLimit-Limit', getRateLimitConfig(new URL(request.url).pathname).maxRequests.toString());
    response.headers.set('X-RateLimit-Remaining', '0');
    response.headers.set('X-RateLimit-Reset', new Date(result.resetTime).toISOString());
    
    if (result.retryAfter) {
      response.headers.set('Retry-After', result.retryAfter.toString());
    }
    
    return response;
  }
  
  // Adiciona headers informativos para requisições permitidas
  const response = NextResponse.next();
  const config = getRateLimitConfig(new URL(request.url).pathname);
  
  response.headers.set('X-RateLimit-Limit', config.maxRequests.toString());
  response.headers.set('X-RateLimit-Remaining', result.remaining.toString());
  response.headers.set('X-RateLimit-Reset', new Date(result.resetTime).toISOString());
  
  return null; // Permite que a requisição continue
}

/**
 * Obtém estatísticas do rate limiter
 */
export function getRateLimitStats() {
  const now = Date.now();
  const stats = {
    totalEntries: rateLimitStore.size,
    blockedIPs: 0,
    activeEntries: 0,
    expiredEntries: 0
  };
  
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.blocked && entry.blockUntil && now < entry.blockUntil) {
      stats.blockedIPs++;
    }
    
    if (now <= entry.resetTime) {
      stats.activeEntries++;
    } else {
      stats.expiredEntries++;
    }
  }
  
  return stats;
}

/**
 * Remove um IP específico do rate limiter (para uso administrativo)
 */
export function removeIPFromRateLimit(ip: string, pathname?: string): boolean {
  if (pathname) {
    const key = `${ip}:${pathname}`;
    return rateLimitStore.delete(key);
  }
  
  // Remove todas as entradas para o IP
  let removed = false;
  for (const key of rateLimitStore.keys()) {
    if (key.startsWith(`${ip}:`)) {
      rateLimitStore.delete(key);
      removed = true;
    }
  }
  
  if (removed) {
    logger.info('IP removido do rate limiter', {
      component: 'rate-limiter',
      ip,
      pathname: pathname || 'all'
    });
  }
  
  return removed;
}