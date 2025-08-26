import { NextResponse } from 'next/server';
import jwt, { SignOptions } from 'jsonwebtoken';
import { logger, logJWTError } from './logger';

/**
 * Valida se JWT_SECRET está configurado
 * @returns JWT_SECRET ou lança erro se não configurado
 */
export function getJWTSecret(): string {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET é obrigatório. Configure a variável de ambiente.');
  }
  return process.env.JWT_SECRET;
}

/**
 * Valida JWT_SECRET e retorna resposta de erro se não configurado
 * @returns JWT_SECRET ou NextResponse com erro
 */
export function validateJWTSecret(): string | NextResponse {
  if (!process.env.JWT_SECRET) {
    logger.error('JWT_SECRET não configurado', {
      component: 'jwt-utils',
      function: 'validateJWTSecret'
    });
    return NextResponse.json(
      { error: "Erro de configuração do servidor" },
      { status: 500 }
    );
  }
  return process.env.JWT_SECRET;
}

/**
 * Verifica e decodifica um token JWT
 * @param token Token JWT para verificar
 * @returns Payload decodificado ou null se inválido
 */
export function verifyJWTToken(token: string): any | null {
  try {
    const secret = getJWTSecret();
    return jwt.verify(token, secret);
  } catch (error) {
    logJWTError(error, {
      component: 'jwt-utils',
      function: 'verifyJWTToken'
    });
    return null;
  }
}

/**
 * Cria um token JWT
 * @param payload Dados para incluir no token
 * @param expiresIn Tempo de expiração (padrão: 30d)
 * @returns Token JWT
 */
export function createJWTToken(payload: object, expiresIn: string = '30d'): string {
  const secret = getJWTSecret();
  return jwt.sign(payload, secret, { expiresIn } as SignOptions);
}

/**
 * Interface para payload JWT padrão
 */
export interface JWTPayload {
  id: string;
  phone: string;
  role: string;
}