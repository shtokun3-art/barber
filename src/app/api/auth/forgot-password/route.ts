import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/utils";
import { logger, logAuthError } from "@/lib/logger";
import { getEmailService } from "@/lib/email-service";

// Função para gerar código de 6 dígitos
function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Função para enviar código via email
async function sendVerificationEmail(email: string, code: string, phone: string): Promise<boolean> {
  try {
    console.log(`📧 Enviando código ${code} via email para: ${email}`);
    console.log(`📱 Telefone associado: ${phone}`);
    
    const emailService = getEmailService();
    const emailStatus = emailService.getServiceStatus();
    
    if (!emailStatus.ready) {
      console.log('⚠️ Email Service não configurado');
      console.log('📝 Configure: GMAIL_USER e GMAIL_APP_PASSWORD');
      return false;
    }
    
    const success = await emailService.sendVerificationEmail(email, code, phone);
    
    if (success) {
      console.log('✅ Código enviado via email com sucesso!');
      return true;
    } else {
      console.log('❌ Falha ao enviar email');
      return false;
    }
  } catch (error) {
    console.error('❌ Erro ao enviar email:', error);
    return false;
  }
}

export async function POST(request: NextRequest) {
  let body: any;
  try {
    const text = await request.text();
    if (!text || text.trim() === '') {
      return NextResponse.json(
        { error: "Dados não fornecidos" },
        { status: 400 }
      );
    }
    
    body = JSON.parse(text);
    const { phone, email } = body;

    // Se apenas telefone foi enviado, verificar se existe e retornar sucesso
    if (phone && !email) {
      if (!phone) {
        return NextResponse.json(
          { error: "Número de telefone é obrigatório" },
          { status: 400 }
        );
      }

      // Validar formato do telefone (apenas números, 10-11 dígitos)
      const phoneRegex = /^[0-9]{10,11}$/;
      if (!phoneRegex.test(phone)) {
        return NextResponse.json(
          { error: "Formato de telefone inválido. Use apenas números (10-11 dígitos)" },
          { status: 400 }
        );
      }

      // Verificar se o usuário existe
      const user = await prisma.user.findUnique({
        where: { phone }
      });

      if (!user) {
        return NextResponse.json(
          { error: "Usuário não encontrado com este número de telefone" },
          { status: 404 }
        );
      }

      // Telefone válido, solicitar email
      return NextResponse.json({
        success: true,
        message: "Telefone válido. Agora informe seu email para receber o código.",
        step: "email_required"
      });
    }

    // Se telefone e email foram enviados, processar envio do código
    if (phone && email) {
      if (!phone || !email) {
        return NextResponse.json(
          { error: "Telefone e email são obrigatórios" },
          { status: 400 }
        );
      }

      // Validar formato do telefone
      const phoneRegex = /^[0-9]{10,11}$/;
      if (!phoneRegex.test(phone)) {
        return NextResponse.json(
          { error: "Formato de telefone inválido" },
          { status: 400 }
        );
      }

      // Validar formato do email
      const emailService = getEmailService();
      if (!emailService.isValidEmail(email)) {
        return NextResponse.json(
          { error: "Formato de email inválido" },
          { status: 400 }
        );
      }

      // Verificar se o usuário existe
      const user = await prisma.user.findUnique({
        where: { phone }
      });

      if (!user) {
        return NextResponse.json(
          { error: "Usuário não encontrado" },
          { status: 404 }
        );
      }

      // Gerar código de verificação
      const verificationCode = generateVerificationCode();
      const expirationTime = new Date(Date.now() + 300000); // 5 minutos

      // Salvar o token no banco de dados
      await prisma.user.update({
        where: { phone },
        data: {
          tokenId: verificationCode,
          tokenExpiration: expirationTime,
        },
      });

      // Enviar código via email
      const emailSent = await sendVerificationEmail(email, verificationCode, phone);

      if (!emailSent) {
        // Se falhou ao enviar, limpar o token do banco
        await prisma.user.update({
          where: { phone },
          data: {
            tokenId: null,
            tokenExpiration: null,
          },
        });

        return NextResponse.json(
          { error: "Erro ao enviar código por email. Verifique se o email está correto e tente novamente." },
          { status: 500 }
        );
      }

      logger.info('Código de recuperação enviado por email', {
        component: 'auth-forgot-password',
        function: 'POST',
        phone: phone,
        email: email,
        codeGenerated: true
      });

      return NextResponse.json({
        success: true,
        message: "Código enviado com sucesso para seu email",
        expiresIn: "5 minutos"
      });
    }

    // Se nem telefone nem email foram enviados
    return NextResponse.json(
      { error: "Dados insuficientes" },
      { status: 400 }
    );

  } catch (error) {
    // Tratar erro de JSON parsing especificamente
    if (error instanceof SyntaxError && error.message.includes('JSON')) {
      return NextResponse.json(
        { error: "Dados inválidos fornecidos" },
        { status: 400 }
      );
    }
    
    logAuthError(error, {
      component: 'auth-forgot-password',
      function: 'POST',
      action: 'send_verification_code',
      phone: body?.phone
    });
    return NextResponse.json(
      { error: "Erro interno no servidor" },
      { status: 500 }
    );
  }
}