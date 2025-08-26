import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'
import { rateLimitMiddleware } from '@/lib/rate-limiter'
import { logger } from '@/lib/logger'
import { prisma } from '@/lib/utils'

// Função auxiliar para obter IP do cliente
function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  const realIP = request.headers.get('x-real-ip');
  if (realIP) {
    return realIP;
  }
  
  return 'unknown';
}

// Validar JWT_SECRET obrigatório
if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET é obrigatório. Configure a variável de ambiente.')
}

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET)

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Aplica rate limiting para todas as rotas de API
  if (pathname.startsWith('/api/')) {
    const rateLimitResponse = rateLimitMiddleware(request);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }
  }
  
  // Rotas públicas que não precisam de autenticação
  const publicRoutes = ['/', '/auth/login', '/auth/register', '/auth/forgot-password', '/auth/verify-code', '/auth/reset-password']
  
  // Rotas de API que não precisam de autenticação
  const publicApiRoutes = ['/api/auth/', '/api/whatsapp/status']
  
  // Arquivos estáticos que não precisam de autenticação
  const staticFiles = ['/auth_bg.svg', '/bg_alternative.svg', '/favicon.ico']
  
  // Se for uma rota pública, permitir acesso
  if (publicRoutes.includes(pathname)) {
    return NextResponse.next()
  }
  
  // Se for uma rota de API pública, permitir acesso
  if (publicApiRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.next()
  }
  
  // Se for um arquivo estático, permitir acesso
  if (staticFiles.includes(pathname)) {
    return NextResponse.next()
  }
  
  // Verificar se há token
  const token = request.cookies.get('barberToken')?.value
  
  if (!token) {
    // Se não há token e está tentando acessar rota protegida, redirecionar para login
    logger.warn('Acesso negado - token não encontrado', {
      component: 'middleware',
      pathname,
      ip: getClientIP(request)
    });
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }
  
  try {
    // Verificar se o token é válido
    const { payload } = await jwtVerify(token, JWT_SECRET)
    const userRole = payload.role as string
    
    // Regras de redirecionamento baseadas na role e rota
    if (pathname.startsWith('/main/')) {
      // Página de admin - apenas admin e barber podem acessar
      if (userRole === 'client') {
        return NextResponse.redirect(new URL(`/client/${payload.id}`, request.url))
      }
    }
    
    if (pathname.startsWith('/client/')) {
      // Página de cliente - apenas client pode acessar
      if (userRole !== 'client') {
        return NextResponse.redirect(new URL(`/main/${payload.id}`, request.url))
      }
    }
    
    return NextResponse.next()
  } catch (error) {
    // Token inválido ou expirado - múltiplas sessões permitidas
    try {
      // Log do token expirado para auditoria
      const tokenParts = token.split('.');
      if (tokenParts.length === 3) {
        const payload = JSON.parse(atob(tokenParts[1]));
        if (payload.id) {
          logger.info('Token expirado detectado', {
            component: 'middleware',
            userId: payload.id
          });
        }
      }
    } catch (decodeError) {
      // Se não conseguir decodificar, apenas continuar
      console.log('Erro ao decodificar token expirado:', decodeError);
    }
    
    // Token inválido, redirecionar para login
    logger.warn('Acesso negado - token inválido', {
      component: 'middleware',
      pathname,
      ip: getClientIP(request),
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    const response = NextResponse.redirect(new URL('/auth/login', request.url))
    response.cookies.delete('barberToken')
    return response
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}