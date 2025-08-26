/**
 * Validação de variáveis de ambiente obrigatórias
 * Garante que todas as configurações necessárias estejam presentes
 */

import { logger } from './logger';

// Lista de variáveis de ambiente obrigatórias
const REQUIRED_ENV_VARS = [
  'JWT_SECRET',
  'DATABASE_URL'
] as const;

// Lista de variáveis de ambiente opcionais com valores padrão
const OPTIONAL_ENV_VARS = {
  NODE_ENV: 'development',
  NEXT_PUBLIC_API_URL: 'http://localhost:3001'
} as const;

/**
 * Valida se todas as variáveis de ambiente obrigatórias estão definidas
 * @throws Error se alguma variável obrigatória estiver faltando
 */
export function validateRequiredEnvVars(): void {
  const missingVars: string[] = [];
  
  REQUIRED_ENV_VARS.forEach(envVar => {
    if (!process.env[envVar]) {
      missingVars.push(envVar);
    }
  });
  
  if (missingVars.length > 0) {
    const errorMessage = `Variáveis de ambiente obrigatórias não configuradas: ${missingVars.join(', ')}`;
    logger.error(errorMessage, {
      component: 'env-validation',
      missingVars,
      function: 'validateRequiredEnvVars'
    });
    throw new Error(errorMessage);
  }
  
  logger.info('Todas as variáveis de ambiente obrigatórias estão configuradas', {
    component: 'env-validation',
    requiredVars: REQUIRED_ENV_VARS.length
  });
}

/**
 * Configura valores padrão para variáveis de ambiente opcionais
 */
export function setDefaultEnvVars(): void {
  Object.entries(OPTIONAL_ENV_VARS).forEach(([key, defaultValue]) => {
    if (!process.env[key]) {
      process.env[key] = defaultValue;
      logger.info(`Variável de ambiente ${key} configurada com valor padrão`, {
        component: 'env-validation',
        variable: key,
        defaultValue
      });
    }
  });
}

/**
 * Valida configurações específicas de segurança
 */
export function validateSecurityConfig(): void {
  const jwtSecret = process.env.JWT_SECRET;
  
  if (jwtSecret) {
    // Verificar se JWT_SECRET tem comprimento adequado
    if (jwtSecret.length < 32) {
      logger.warn('JWT_SECRET muito curto - recomendado pelo menos 32 caracteres', {
        component: 'env-validation',
        currentLength: jwtSecret.length,
        recommendedLength: 32
      });
    }
    
    // Verificar se não é um valor padrão conhecido
    const knownWeakSecrets = [
      'your-secret-key',
      'secret',
      'jwt-secret',
      'X7GmP9LqT2VwZ8B5nK1Y4CdR6FsJ3NxAoMHQDpWtCU'
    ];
    
    if (knownWeakSecrets.includes(jwtSecret)) {
      const errorMessage = 'JWT_SECRET está usando um valor padrão inseguro';
      logger.error(errorMessage, {
        component: 'env-validation',
        function: 'validateSecurityConfig'
      });
      throw new Error(errorMessage);
    }
  }
  
  // Verificar configurações de produção
  if (process.env.NODE_ENV === 'production') {
    const productionRequiredVars = ['DATABASE_URL'];
    
    productionRequiredVars.forEach(envVar => {
      if (!process.env[envVar]) {
        const errorMessage = `Variável ${envVar} é obrigatória em produção`;
        logger.error(errorMessage, {
          component: 'env-validation',
          environment: 'production',
          missingVar: envVar
        });
        throw new Error(errorMessage);
      }
    });
  }
}

/**
 * Inicializa e valida todas as configurações de ambiente
 */
export function initializeEnvironment(): void {
  try {
    logger.info('Iniciando validação de ambiente', {
      component: 'env-validation',
      nodeEnv: process.env.NODE_ENV
    });
    
    setDefaultEnvVars();
    validateRequiredEnvVars();
    validateSecurityConfig();
    
    logger.info('Validação de ambiente concluída com sucesso', {
      component: 'env-validation'
    });
  } catch (error) {
    logger.error('Falha na validação de ambiente', {
      component: 'env-validation',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    });
    throw error;
  }
}

/**
 * Obtém uma variável de ambiente com validação
 * @param key Nome da variável
 * @param required Se é obrigatória
 * @param defaultValue Valor padrão se não obrigatória
 */
export function getEnvVar(key: string, required: boolean = false, defaultValue?: string): string {
  const value = process.env[key];
  
  if (!value && required) {
    const errorMessage = `Variável de ambiente ${key} é obrigatória`;
    logger.error(errorMessage, {
      component: 'env-validation',
      variable: key
    });
    throw new Error(errorMessage);
  }
  
  return value || defaultValue || '';
}