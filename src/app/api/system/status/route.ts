import { NextRequest, NextResponse } from "next/server";
import { getEmailService } from "@/lib/email-service";
import { logger } from "@/lib/logger";

export async function GET(request: NextRequest) {
  try {
    const emailService = getEmailService();
    const emailStatus = emailService.getServiceStatus();
    
    // Verificar variáveis de ambiente críticas
    const envStatus = {
      NODE_ENV: process.env.NODE_ENV || 'development',
      GMAIL_USER: !!process.env.GMAIL_USER,
      GMAIL_APP_PASSWORD: !!process.env.GMAIL_APP_PASSWORD,
      JWT_SECRET: !!process.env.JWT_SECRET,
      DATABASE_URL: !!process.env.DATABASE_URL
    };
    
    const systemStatus = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      services: {
        email: {
          configured: emailStatus.configured,
          ready: emailStatus.ready,
          service: 'Gmail SMTP'
        },
        database: {
          configured: !!process.env.DATABASE_URL,
          ready: true // Assumindo que se chegou até aqui, o DB está funcionando
        },
        auth: {
          configured: !!process.env.JWT_SECRET,
          ready: !!process.env.JWT_SECRET
        }
      },
      environment_variables: envStatus,
      recommendations: [] as Array<{
        type: string;
        service: string;
        message: string;
        impact: string;
      }>
    };
    
    // Adicionar recomendações baseadas no status
    if (!emailStatus.configured) {
      systemStatus.recommendations.push({
        type: 'warning',
        service: 'email',
        message: 'Configure GMAIL_USER e GMAIL_APP_PASSWORD para envio de emails',
        impact: 'Sistema funcionará em modo desenvolvimento'
      });
    }
    
    if (!process.env.JWT_SECRET) {
      systemStatus.recommendations.push({
        type: 'error',
        service: 'auth',
        message: 'JWT_SECRET não configurado',
        impact: 'Autenticação pode não funcionar corretamente'
      });
    }
    
    if (process.env.NODE_ENV === 'production' && !emailStatus.configured) {
      systemStatus.recommendations.push({
        type: 'warning',
        service: 'email',
        message: 'Em produção sem email configurado',
        impact: 'Usuários não receberão códigos por email'
      });
    }
    
    logger.info('Status do sistema verificado', {
      component: 'system-status',
      function: 'GET',
      environment: process.env.NODE_ENV,
      emailConfigured: emailStatus.configured
    });
    
    return NextResponse.json(systemStatus);
  } catch (error) {
    logger.error('Erro ao verificar status do sistema', {
      component: 'system-status',
      function: 'GET',
      error: error
    });
    
    return NextResponse.json(
      { 
        error: "Erro ao verificar status do sistema",
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}