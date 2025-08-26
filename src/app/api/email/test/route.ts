import { NextRequest, NextResponse } from "next/server";
import { getEmailService } from "@/lib/email-service";
import { logger } from "@/lib/logger";

export async function GET(request: NextRequest) {
  try {
    const emailService = getEmailService();
    const status = emailService.getServiceStatus();
    
    return NextResponse.json({
      configured: status.configured,
      ready: status.ready,
      service: "Gmail SMTP",
      message: status.ready 
        ? "Email Service configurado e pronto para enviar emails"
        : status.configured
        ? "Email Service configurado mas não pronto"
        : "Email Service não configurado. Configure as variáveis GMAIL_USER e GMAIL_APP_PASSWORD"
    });
  } catch (error) {
    logger.error('Erro ao verificar status do Email', {
      component: 'email-test',
      function: 'GET',
      error: error
    });
    
    return NextResponse.json(
      { error: "Erro ao verificar status do Email" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, code, phone } = body;
    
    if (!email || !code || !phone) {
      return NextResponse.json(
        { error: "Parâmetros 'email', 'code' e 'phone' são obrigatórios" },
        { status: 400 }
      );
    }
    
    const emailService = getEmailService();
    const status = emailService.getServiceStatus();
    
    if (!status.ready) {
      return NextResponse.json(
        { error: "Email Service não está configurado ou pronto" },
        { status: 503 }
      );
    }
    
    // Validar formato do email
    if (!emailService.isValidEmail(email)) {
      return NextResponse.json(
        { error: "Formato de email inválido" },
        { status: 400 }
      );
    }
    
    const success = await emailService.sendVerificationEmail(email, code, phone);
    
    if (success) {
      return NextResponse.json({
        success: true,
        message: "Email de verificação enviado com sucesso"
      });
    } else {
      return NextResponse.json(
        { error: "Falha ao enviar email" },
        { status: 500 }
      );
    }
  } catch (error) {
    logger.error('Erro ao enviar email de teste', {
      component: 'email-test',
      function: 'POST',
      error: error
    });
    
    return NextResponse.json(
      { error: "Erro interno no servidor" },
      { status: 500 }
    );
  }
}