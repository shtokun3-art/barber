import { logger } from './logger';

/**
 * Classe que simula o serviço de WhatsApp
 * Esta é uma implementação simulada que substitui o serviço real
 * que foi removido para otimização do sistema
 */
export class WhatsAppService {
  private static _instance: WhatsAppService;
  private isConfigured: boolean = false;
  
  public static getInstance(): WhatsAppService {
    if (!WhatsAppService._instance) {
      WhatsAppService._instance = new WhatsAppService();
    }
    return WhatsAppService._instance;
  }

  private constructor() {
    logger.info('WhatsApp Service (Simulado) inicializado');
  }

  /**
   * Retorna o status da conexão com o WhatsApp
   */
  getConnectionStatus(): { connected: boolean; connecting: boolean } {
    return {
      connected: false,
      connecting: false
    };
  }

  /**
   * Simula uma tentativa de reconexão
   */
  async reconnect(): Promise<void> {
    logger.info('Tentativa de reconexão do WhatsApp simulada');
    return Promise.resolve();
  }

  /**
   * Simula uma desconexão
   */
  async disconnect(): Promise<void> {
    logger.info('Desconexão do WhatsApp simulada');
    return Promise.resolve();
  }

  /**
   * Simula o envio de uma mensagem
   */
  async sendMessage(phoneNumber: string, message: string): Promise<boolean> {
    logger.info(`Simulação de envio de mensagem para ${phoneNumber}`, {
      component: 'whatsapp-service',
      function: 'sendMessage',
      phoneNumber,
      messageLength: message.length
    });
    
    return Promise.resolve(false);
  }
}

/**
 * Retorna a instância do serviço de WhatsApp simulado
 */
export function getWhatsAppService(): WhatsAppService {
  return WhatsAppService.getInstance();
}