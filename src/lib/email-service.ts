import nodemailer from 'nodemailer';
import { logger } from './logger';

class EmailService {
  private transporter: nodemailer.Transporter | null = null;
  private isConfigured = false;

  constructor() {
    this.initializeGmailSMTP();
  }

  private initializeGmailSMTP() {
    try {
      // Verificar se as variáveis de ambiente estão configuradas
      const gmailUser = process.env.GMAIL_USER;
      const gmailPassword = process.env.GMAIL_APP_PASSWORD;

      if (!gmailUser || !gmailPassword) {
        console.log('⚠️ Gmail SMTP não configurado - variáveis de ambiente ausentes');
        console.log('📝 Configure: GMAIL_USER, GMAIL_APP_PASSWORD');
        console.log('🔗 Instruções: https://support.google.com/accounts/answer/185833');
        return;
      }

      // Configurar transporter do Gmail
      this.transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: gmailUser,
          pass: gmailPassword
        },
        secure: true,
        port: 465
      });

      this.isConfigured = true;

      console.log('✅ Serviço de Email (Gmail SMTP) inicializado com sucesso');
      
      logger.info('Email Service inicializado', {
        component: 'email-service',
        function: 'initializeGmailSMTP',
        configured: true,
        service: 'gmail'
      });
    } catch (error) {
      console.error('❌ Erro ao inicializar Gmail SMTP:', error);
      logger.error('Erro ao inicializar Email Service', {
        component: 'email-service',
        function: 'initializeGmailSMTP',
        error: error
      });
    }
  }

  async sendVerificationEmail(email: string, code: string, phone: string): Promise<boolean> {
    if (!this.isConfigured || !this.transporter) {
      console.log('⚠️ Email Service não configurado');
      return false;
    }

    try {
      console.log(`📧 Enviando código de verificação para: ${email}`);
      console.log(`📱 Telefone associado: ${phone}`);
      console.log(`🔐 Código: ${code}`);

      const mailOptions = {
        from: {
          name: 'Barbearia WE',
          address: process.env.GMAIL_USER!
        },
        to: email,
        subject: '🔐 Código de Verificação - Barbearia WE',
        html: this.generateEmailTemplate(code, phone),
        text: `Barbearia WE - Código de Verificação\n\nSeu código de verificação é: ${code}\n\nTelefone: ${phone}\n\nEste código expira em 5 minutos.\n\nNão compartilhe este código com ninguém.`
      };

      const result = await this.transporter.sendMail(mailOptions);

      console.log(`✅ Email enviado com sucesso!`);
      console.log(`📊 Message ID: ${result.messageId}`);
      console.log(`📊 Response: ${result.response}`);
      console.log(`📊 Envelope: ${JSON.stringify(result.envelope)}`);

      logger.info('Email de verificação enviado', {
        component: 'email-service',
        function: 'sendVerificationEmail',
        email: email,
        phone: phone,
        messageId: result.messageId,
        success: true
      });

      return true;
    } catch (error: unknown) {
      console.error(`❌ Erro ao enviar email para ${email}:`, error);
      const errorCode = error && typeof error === 'object' && 'code' in error ? (error as any).code : 'Desconhecido';
      const errorMessage = error instanceof Error ? error.message : 'Sem mensagem';
      console.error(`🔍 Código do erro:`, errorCode);
      console.error(`📝 Mensagem do erro:`, errorMessage);

      // Diagnóstico específico de erros Gmail/SMTP
      if (errorCode === 'EAUTH') {
        console.error(`🔑 DIAGNÓSTICO: Credenciais de autenticação inválidas`);
        console.error(`💡 SOLUÇÃO: Verifique GMAIL_USER e GMAIL_APP_PASSWORD`);
      } else if (errorCode === 'ENOTFOUND') {
        console.error(`🌐 DIAGNÓSTICO: Problema de conectividade`);
      } else if (error && typeof error === 'object' && 'responseCode' in error && (error as any).responseCode === 550) {
        console.error(`📧 DIAGNÓSTICO: Email de destino inválido ou rejeitado`);
      } else if (error && typeof error === 'object' && 'responseCode' in error && (error as any).responseCode === 535) {
        console.error(`🔐 DIAGNÓSTICO: Senha de app incorreta`);
        console.error(`💡 SOLUÇÃO: Gere uma nova senha de app no Google`);
      } else {
        console.error(`❓ DIAGNÓSTICO: Erro desconhecido - verifique configuração`);
      }

      logger.error('Erro ao enviar email', {
        component: 'email-service',
        function: 'sendVerificationEmail',
        email: email,
        phone: phone,
        error: errorMessage,
        errorCode: errorCode
      });

      return false;
    }
  }

  private generateEmailTemplate(code: string, phone: string): string {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Código de Verificação - Barbearia WE</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .code-box { background: #fff; border: 2px solid #667eea; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0; }
            .code { font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 5px; }
            .warning { background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 5px; padding: 15px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
            .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 10px 0; }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>🔐 Código de Verificação</h1>
            <p>Barbearia WE - Recuperação de Senha</p>
        </div>
        
        <div class="content">
            <h2>Olá!</h2>
            <p>Você solicitou a recuperação de senha para o telefone <strong>${phone}</strong>.</p>
            
            <div class="code-box">
                <p>Seu código de verificação é:</p>
                <div class="code">${code}</div>
            </div>
            
            <div class="warning">
                <strong>⚠️ Importante:</strong>
                <ul>
                    <li>Este código expira em <strong>5 minutos</strong></li>
                    <li>Use apenas no site oficial da Barbearia WE</li>
                    <li>Não compartilhe este código com ninguém</li>
                    <li>Se você não solicitou este código, ignore este email</li>
                </ul>
            </div>
            
            <p>Se você está tendo problemas, entre em contato conosco.</p>
        </div>
        
        <div class="footer">
            <p>© 2025 Barbearia WE - Sistema de Agendamento</p>
            <p>Este é um email automático, não responda.</p>
        </div>
    </body>
    </html>
    `;
  }

  getServiceStatus(): { configured: boolean; ready: boolean } {
    return {
      configured: this.isConfigured,
      ready: this.isConfigured && this.transporter !== null
    };
  }

  // Método para testar a configuração
  async testConfiguration(): Promise<boolean> {
    if (!this.isConfigured || !this.transporter) {
      console.log('❌ Email Service não configurado para teste');
      return false;
    }

    try {
      // Verificar conexão SMTP
      await this.transporter.verify();
      console.log(`✅ Teste de configuração Email bem-sucedido`);
      console.log(`📧 Servidor SMTP: Gmail`);
      console.log(`👤 Usuário: ${process.env.GMAIL_USER}`);
      
      return true;
    } catch (error) {
      console.error('❌ Falha no teste de configuração Email:', error);
      return false;
    }
  }

  // Método para validar formato de email
  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}

// Singleton instance
let emailServiceInstance: EmailService | null = null;

export function getEmailService(): EmailService {
  if (!emailServiceInstance) {
    emailServiceInstance = new EmailService();
  }
  return emailServiceInstance;
}

export { EmailService };