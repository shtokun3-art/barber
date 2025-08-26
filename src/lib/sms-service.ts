import { logger } from './logger';

class SMSService {
  private twilioClient: any = null;
  private isConfigured = false;

  constructor() {
    this.initializeTwilio();
  }

  private initializeTwilio() {
    try {
      // Verificar se as variáveis de ambiente estão configuradas
      const accountSid = process.env.TWILIO_ACCOUNT_SID;
      const authToken = process.env.TWILIO_AUTH_TOKEN;
      const twilioNumber = process.env.TWILIO_PHONE_NUMBER;

      if (!accountSid || !authToken || !twilioNumber) {
        console.log('⚠️ Twilio não configurado - variáveis de ambiente ausentes');
        console.log('📝 Configure: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER');
        return;
      }

      // Importar Twilio dinamicamente
      const twilio = require('twilio');
      this.twilioClient = twilio(accountSid, authToken);
      this.isConfigured = true;

      console.log('✅ Serviço SMS (Twilio) inicializado com sucesso');
      
      logger.info('SMS Service inicializado', {
        component: 'sms-service',
        function: 'initializeTwilio',
        configured: true
      });
    } catch (error) {
      console.error('❌ Erro ao inicializar Twilio:', error);
      logger.error('Erro ao inicializar SMS Service', {
        component: 'sms-service',
        function: 'initializeTwilio',
        error: error
      });
    }
  }

  async sendSMS(phone: string, message: string): Promise<boolean> {
    if (!this.isConfigured || !this.twilioClient) {
      console.log('⚠️ SMS Service não configurado');
      return false;
    }

    try {
      // Formatar número para padrão internacional
      const formattedPhone = this.formatPhoneNumber(phone);
      console.log(`📱 Enviando SMS para: ${formattedPhone}`);
      console.log(`📝 Mensagem: ${message.substring(0, 50)}...`);

      const result = await this.twilioClient.messages.create({
        body: message,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: formattedPhone
      });

      console.log(`✅ SMS enviado com sucesso!`);
      console.log(`📊 Message SID: ${result.sid}`);
      console.log(`📊 Status: ${result.status}`);
      console.log(`📊 Direction: ${result.direction}`);
      console.log(`📊 Price: ${result.price || 'N/A'}`);

      logger.info('SMS enviado com sucesso', {
        component: 'sms-service',
        function: 'sendSMS',
        phone: formattedPhone,
        messageSid: result.sid,
        status: result.status,
        success: true
      });

      return true;
    } catch (error: any) {
      console.error(`❌ Erro ao enviar SMS para ${phone}:`, error);
      console.error(`🔍 Código do erro:`, error.code || 'Desconhecido');
      console.error(`📝 Mensagem do erro:`, error.message || 'Sem mensagem');

      // Diagnóstico específico de erros Twilio
      if (error.code === 21211) {
        console.error(`📱 DIAGNÓSTICO: Número de telefone inválido`);
      } else if (error.code === 21608) {
        console.error(`🚫 DIAGNÓSTICO: Número não pode receber SMS`);
      } else if (error.code === 21614) {
        console.error(`🔒 DIAGNÓSTICO: Número não verificado (conta trial)`);
      } else if (error.code === 20003) {
        console.error(`🔑 DIAGNÓSTICO: Credenciais de autenticação inválidas`);
      } else {
        console.error(`❓ DIAGNÓSTICO: Erro desconhecido - verifique configuração`);
      }

      logger.error('Erro ao enviar SMS', {
        component: 'sms-service',
        function: 'sendSMS',
        phone: phone,
        error: error.message || error,
        errorCode: error.code
      });

      return false;
    }
  }

  private formatPhoneNumber(phone: string): string {
    // Remover caracteres não numéricos
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    
    // Se já tem código do país, retornar com +
    if (cleanPhone.startsWith('55') && cleanPhone.length >= 12) {
      return `+${cleanPhone}`;
    }
    
    // Se é número brasileiro sem código do país, adicionar +55
    if (cleanPhone.length >= 10) {
      return `+55${cleanPhone}`;
    }
    
    // Retornar como está se não conseguir formatar
    return `+${cleanPhone}`;
  }

  getServiceStatus(): { configured: boolean; ready: boolean } {
    return {
      configured: this.isConfigured,
      ready: this.isConfigured && this.twilioClient !== null
    };
  }

  // Método para testar a configuração
  async testConfiguration(): Promise<boolean> {
    if (!this.isConfigured || !this.twilioClient) {
      console.log('❌ SMS Service não configurado para teste');
      return false;
    }

    try {
      // Tentar obter informações da conta
      const account = await this.twilioClient.api.accounts(process.env.TWILIO_ACCOUNT_SID).fetch();
      console.log(`✅ Teste de configuração SMS bem-sucedido`);
      console.log(`📊 Account Status: ${account.status}`);
      console.log(`📊 Account Type: ${account.type}`);
      
      return true;
    } catch (error) {
      console.error('❌ Falha no teste de configuração SMS:', error);
      return false;
    }
  }
}

// Singleton instance
let smsServiceInstance: SMSService | null = null;

export function getSMSService(): SMSService {
  if (!smsServiceInstance) {
    smsServiceInstance = new SMSService();
  }
  return smsServiceInstance;
}

export { SMSService };