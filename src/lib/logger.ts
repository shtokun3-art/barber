/**
 * Sistema de logging estruturado e seguro
 * Evita exposição de dados sensíveis em logs
 */

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogContext {
  userId?: string;
  endpoint?: string;
  method?: string;
  timestamp?: string;
  requestId?: string;
  [key: string]: any;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';
  private isProduction = process.env.NODE_ENV === 'production';

  private sanitizeContext(context: LogContext): LogContext {
    const sanitized = { ...context };
    
    // Remove dados sensíveis
    const sensitiveKeys = ['password', 'token', 'secret', 'key', 'authorization'];
    
    Object.keys(sanitized).forEach(key => {
      if (sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive))) {
        sanitized[key] = '[REDACTED]';
      }
    });
    
    return sanitized;
  }

  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const sanitizedContext = context ? this.sanitizeContext(context) : {};
    
    if (this.isProduction) {
      // Em produção, usar formato JSON estruturado
      return JSON.stringify({
        level,
        message,
        timestamp,
        ...sanitizedContext
      });
    } else {
      // Em desenvolvimento, formato mais legível
      const contextStr = Object.keys(sanitizedContext).length > 0 
        ? ` | Context: ${JSON.stringify(sanitizedContext)}`
        : '';
      return `[${timestamp}] ${level.toUpperCase()}: ${message}${contextStr}`;
    }
  }

  info(message: string, context?: LogContext): void {
    const formatted = this.formatMessage('info', message, context);
    console.log(formatted);
  }

  warn(message: string, context?: LogContext): void {
    const formatted = this.formatMessage('warn', message, context);
    console.warn(formatted);
  }

  error(message: string, context?: LogContext): void {
    const formatted = this.formatMessage('error', message, context);
    console.error(formatted);
  }

  debug(message: string, context?: LogContext): void {
    if (this.isDevelopment) {
      const formatted = this.formatMessage('debug', message, context);
      console.debug(formatted);
    }
  }

  // Método específico para logs de autenticação
  authError(message: string, context?: Omit<LogContext, 'userId'> & { userId?: string }): void {
    this.error(`Auth: ${message}`, {
      ...context,
      timestamp: new Date().toISOString()
    });
  }

  // Método específico para logs de API
  apiError(message: string, context?: LogContext): void {
    this.error(`API: ${message}`, {
      ...context,
      timestamp: new Date().toISOString()
    });
  }

  // Método específico para logs de validação
  validationError(message: string, context?: LogContext): void {
    this.error(`Validation: ${message}`, {
      ...context,
      timestamp: new Date().toISOString()
    });
  }
}

// Instância singleton do logger
export const logger = new Logger();

// Função helper para criar contexto de request
export function createRequestContext(request: Request, additionalContext?: LogContext): LogContext {
  return {
    method: request.method,
    endpoint: new URL(request.url).pathname,
    timestamp: new Date().toISOString(),
    ...additionalContext
  };
}

// Função helper para logs de erro de JWT
export function logJWTError(error: any, context?: LogContext): void {
  logger.authError('Token verification failed', {
    error: error.message || 'Unknown JWT error',
    ...context
  });
}

// Função helper para logs de erro de banco de dados
export function logDatabaseError(error: any, context?: LogContext): void {
  logger.error('Database operation failed', {
    error: error.message || 'Unknown database error',
    ...context
  });
}

// Função helper para logs de erro de autenticação
export function logAuthError(error: any, context?: LogContext): void {
  logger.authError('Authentication error', {
    error: error.message || 'Unknown auth error',
    ...context
  });
}

// Função helper para logs de erro de validação
export function logValidationError(error: any, context?: LogContext): void {
  logger.validationError('Validation error', {
    error: error.message || 'Unknown validation error',
    ...context
  });
}