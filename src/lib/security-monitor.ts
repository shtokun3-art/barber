/**
 * Sistema de Monitoramento de Segurança
 * Monitora e registra eventos de segurança, tentativas de ataque e métricas
 */

import { logger } from './logger';

// Tipos de eventos de segurança
export enum SecurityEventType {
  LOGIN_ATTEMPT = 'login_attempt',
  LOGIN_SUCCESS = 'login_success',
  LOGIN_FAILURE = 'login_failure',
  RATE_LIMIT_EXCEEDED = 'rate_limit_exceeded',
  INVALID_TOKEN = 'invalid_token',
  SUSPICIOUS_ACTIVITY = 'suspicious_activity',
  PASSWORD_BREACH_ATTEMPT = 'password_breach_attempt',
  SQL_INJECTION_ATTEMPT = 'sql_injection_attempt',
  XSS_ATTEMPT = 'xss_attempt',
  UNAUTHORIZED_ACCESS = 'unauthorized_access',
  ACCOUNT_LOCKOUT = 'account_lockout'
}

// Interface para eventos de segurança
interface SecurityEvent {
  type: SecurityEventType;
  ip: string;
  userAgent?: string;
  userId?: string;
  email?: string;
  endpoint?: string;
  timestamp: Date;
  severity: 'low' | 'medium' | 'high' | 'critical';
  details?: Record<string, any>;
}

// Armazenamento em memória para eventos (em produção, usar banco de dados)
const securityEvents: SecurityEvent[] = [];
const suspiciousIPs = new Map<string, {
  count: number;
  lastActivity: Date;
  events: SecurityEventType[];
}>();

// Configurações de monitoramento
const MONITORING_CONFIG = {
  maxEventsInMemory: 10000,
  suspiciousActivityThreshold: 10,
  autoBlockThreshold: 20,
  cleanupIntervalMs: 60 * 60 * 1000, // 1 hora
  alertThresholds: {
    [SecurityEventType.LOGIN_FAILURE]: 5,
    [SecurityEventType.RATE_LIMIT_EXCEEDED]: 3,
    [SecurityEventType.INVALID_TOKEN]: 10,
    [SecurityEventType.SQL_INJECTION_ATTEMPT]: 1,
    [SecurityEventType.XSS_ATTEMPT]: 1
  }
};

/**
 * Registra um evento de segurança
 */
export function logSecurityEvent(
  type: SecurityEventType,
  ip: string,
  options: {
    userAgent?: string;
    userId?: string;
    email?: string;
    endpoint?: string;
    severity?: 'low' | 'medium' | 'high' | 'critical';
    details?: Record<string, any>;
  } = {}
): void {
  const event: SecurityEvent = {
    type,
    ip,
    timestamp: new Date(),
    severity: options.severity || getSeverityForEventType(type),
    ...options
  };

  // Adiciona ao armazenamento
  securityEvents.push(event);

  // Atualiza estatísticas de IP suspeito
  updateSuspiciousIPStats(ip, type);

  // Log estruturado
  logger.warn(`Evento de segurança: ${type}`, {
    component: 'security-monitor',
    eventType: type,
    ip,
    severity: event.severity,
    userId: options.userId,
    email: options.email,
    endpoint: options.endpoint,
    userAgent: options.userAgent,
    details: options.details
  });

  // Verifica se precisa de alerta
  checkForAlerts(ip, type);

  // Limpeza periódica
  if (securityEvents.length > MONITORING_CONFIG.maxEventsInMemory) {
    cleanupOldEvents();
  }
}

/**
 * Determina a severidade baseada no tipo de evento
 */
function getSeverityForEventType(type: SecurityEventType): 'low' | 'medium' | 'high' | 'critical' {
  switch (type) {
    case SecurityEventType.SQL_INJECTION_ATTEMPT:
    case SecurityEventType.XSS_ATTEMPT:
    case SecurityEventType.ACCOUNT_LOCKOUT:
      return 'critical';
    
    case SecurityEventType.PASSWORD_BREACH_ATTEMPT:
    case SecurityEventType.UNAUTHORIZED_ACCESS:
    case SecurityEventType.SUSPICIOUS_ACTIVITY:
      return 'high';
    
    case SecurityEventType.RATE_LIMIT_EXCEEDED:
    case SecurityEventType.INVALID_TOKEN:
    case SecurityEventType.LOGIN_FAILURE:
      return 'medium';
    
    default:
      return 'low';
  }
}

/**
 * Atualiza estatísticas de IPs suspeitos
 */
function updateSuspiciousIPStats(ip: string, eventType: SecurityEventType): void {
  const stats = suspiciousIPs.get(ip) || {
    count: 0,
    lastActivity: new Date(),
    events: []
  };

  stats.count++;
  stats.lastActivity = new Date();
  stats.events.push(eventType);

  // Mantém apenas os últimos 50 eventos por IP
  if (stats.events.length > 50) {
    stats.events = stats.events.slice(-50);
  }

  suspiciousIPs.set(ip, stats);

  // Verifica se IP deve ser marcado como suspeito (evita recursão)
  if (stats.count >= MONITORING_CONFIG.suspiciousActivityThreshold && eventType !== SecurityEventType.SUSPICIOUS_ACTIVITY) {
    logSecurityEvent(SecurityEventType.SUSPICIOUS_ACTIVITY, ip, {
      severity: 'high',
      details: {
        totalEvents: stats.count,
        recentEvents: stats.events.slice(-10)
      }
    });
  }
}

/**
 * Verifica se um alerta deve ser disparado
 */
function checkForAlerts(ip: string, eventType: SecurityEventType): void {
  const threshold = MONITORING_CONFIG.alertThresholds[eventType as keyof typeof MONITORING_CONFIG.alertThresholds];
  if (!threshold) return;

  // Conta eventos do mesmo tipo nas últimas 24 horas
  const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const recentEvents = securityEvents.filter(
    event => event.ip === ip && 
             event.type === eventType && 
             event.timestamp > last24Hours
  );

  if (recentEvents.length >= threshold) {
    logger.error(`ALERTA DE SEGURANÇA: Threshold excedido para ${eventType}`, {
      component: 'security-monitor',
      alertType: 'threshold_exceeded',
      ip,
      eventType,
      count: recentEvents.length,
      threshold,
      timeWindow: '24h'
    });

    // Em um sistema real, aqui você enviaria notificações
    // sendSecurityAlert(ip, eventType, recentEvents.length);
  }
}

/**
 * Remove eventos antigos da memória
 */
function cleanupOldEvents(): void {
  const cutoffDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // 7 dias
  const initialLength = securityEvents.length;
  
  // Remove eventos antigos
  const recentEvents = securityEvents.filter(event => event.timestamp > cutoffDate);
  securityEvents.length = 0;
  securityEvents.push(...recentEvents);

  // Limpa IPs suspeitos antigos
  for (const [ip, stats] of suspiciousIPs.entries()) {
    if (stats.lastActivity < cutoffDate) {
      suspiciousIPs.delete(ip);
    }
  }

  logger.info('Limpeza de eventos de segurança concluída', {
    component: 'security-monitor',
    removedEvents: initialLength - securityEvents.length,
    remainingEvents: securityEvents.length,
    cleanedIPs: suspiciousIPs.size
  });
}

/**
 * Verifica se um IP é suspeito
 */
export function isIPSuspicious(ip: string): boolean {
  const stats = suspiciousIPs.get(ip);
  if (!stats) return false;

  return stats.count >= MONITORING_CONFIG.suspiciousActivityThreshold;
}

/**
 * Verifica se um IP deve ser bloqueado automaticamente
 */
export function shouldBlockIP(ip: string): boolean {
  const stats = suspiciousIPs.get(ip);
  if (!stats) return false;

  return stats.count >= MONITORING_CONFIG.autoBlockThreshold;
}

/**
 * Obtém estatísticas de segurança
 */
export function getSecurityStats(timeWindow: '1h' | '24h' | '7d' = '24h'): {
  totalEvents: number;
  eventsByType: Record<string, number>;
  suspiciousIPs: number;
  topThreats: Array<{ ip: string; count: number; lastActivity: Date }>;
  severityDistribution: Record<string, number>;
} {
  const windowMs = {
    '1h': 60 * 60 * 1000,
    '24h': 24 * 60 * 60 * 1000,
    '7d': 7 * 24 * 60 * 60 * 1000
  }[timeWindow];

  const cutoffDate = new Date(Date.now() - windowMs);
  const recentEvents = securityEvents.filter(event => event.timestamp > cutoffDate);

  // Conta eventos por tipo
  const eventsByType: Record<string, number> = {};
  const severityDistribution: Record<string, number> = {};

  recentEvents.forEach(event => {
    eventsByType[event.type] = (eventsByType[event.type] || 0) + 1;
    severityDistribution[event.severity] = (severityDistribution[event.severity] || 0) + 1;
  });

  // Top IPs suspeitos
  const topThreats = Array.from(suspiciousIPs.entries())
    .filter(([_, stats]) => stats.lastActivity > cutoffDate)
    .map(([ip, stats]) => ({ ip, count: stats.count, lastActivity: stats.lastActivity }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  return {
    totalEvents: recentEvents.length,
    eventsByType,
    suspiciousIPs: topThreats.length,
    topThreats,
    severityDistribution
  };
}

/**
 * Obtém eventos de segurança para um IP específico
 */
export function getIPSecurityHistory(ip: string, limit: number = 50): SecurityEvent[] {
  return securityEvents
    .filter(event => event.ip === ip)
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    .slice(0, limit);
}

/**
 * Remove um IP da lista de suspeitos (para uso administrativo)
 */
export function clearIPSuspiciousStatus(ip: string): boolean {
  const removed = suspiciousIPs.delete(ip);
  
  if (removed) {
    logger.info('Status suspeito removido para IP', {
      component: 'security-monitor',
      ip,
      action: 'clear_suspicious_status'
    });
  }
  
  return removed;
}

/**
 * Detecta padrões de ataque comuns
 */
export function detectAttackPatterns(userAgent?: string, endpoint?: string, payload?: string): SecurityEventType[] {
  const detectedPatterns: SecurityEventType[] = [];

  if (userAgent) {
    // Detecta user agents suspeitos
    const suspiciousAgents = [
      'sqlmap', 'nikto', 'nmap', 'masscan', 'zap', 'burp',
      'python-requests', 'curl', 'wget'
    ];
    
    if (suspiciousAgents.some(agent => userAgent.toLowerCase().includes(agent))) {
      detectedPatterns.push(SecurityEventType.SUSPICIOUS_ACTIVITY);
    }
  }

  if (endpoint) {
    // Detecta tentativas de acesso a endpoints sensíveis
    const sensitiveEndpoints = [
      '/admin', '/.env', '/config', '/backup', '/database',
      '/phpmyadmin', '/wp-admin', '/.git'
    ];
    
    if (sensitiveEndpoints.some(path => endpoint.includes(path))) {
      detectedPatterns.push(SecurityEventType.UNAUTHORIZED_ACCESS);
    }
  }

  if (payload) {
    // Detecta SQL injection
    const sqlPatterns = [
      /('|(\-\-)|(;)|(\||\|)|(\*|\*))/i,
      /(union|select|insert|delete|update|drop|create|alter|exec|execute)/i,
      /(script|javascript|vbscript|onload|onerror|onclick)/i
    ];
    
    if (sqlPatterns.some(pattern => pattern.test(payload))) {
      detectedPatterns.push(SecurityEventType.SQL_INJECTION_ATTEMPT);
    }

    // Detecta XSS
    const xssPatterns = [
      /<script[^>]*>.*?<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /<iframe[^>]*>.*?<\/iframe>/gi
    ];
    
    if (xssPatterns.some(pattern => pattern.test(payload))) {
      detectedPatterns.push(SecurityEventType.XSS_ATTEMPT);
    }
  }

  return detectedPatterns;
}

/**
 * Middleware para detecção automática de ataques
 */
export function securityDetectionMiddleware(request: Request): SecurityEventType[] {
  const url = new URL(request.url);
  const userAgent = request.headers.get('user-agent') || undefined;
  const endpoint = url.pathname;
  
  // Para requisições POST/PUT, você precisaria ler o body
  // const payload = await request.text(); // Cuidado: isso consome o stream
  
  return detectAttackPatterns(userAgent, endpoint);
}

// Inicializa limpeza periódica
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupOldEvents, MONITORING_CONFIG.cleanupIntervalMs);
}