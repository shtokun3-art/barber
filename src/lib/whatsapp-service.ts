import { Client, LocalAuth } from 'whatsapp-web.js';
import qrcode from 'qrcode-terminal';
import { logger } from './logger';

class WhatsAppService {
  private client: Client | null = null;
  private isConnected = false;
  private isConnecting = false;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private healthCheckTimer: NodeJS.Timeout | null = null;
  private lastMessageTime = Date.now();
  private processListenersAdded = false;

  constructor() {
    // Aumentar limite de listeners para evitar warnings
    if (typeof process !== 'undefined') {
      process.setMaxListeners(20);
    }
    
    this.initializeConnection();
    this.startHealthCheck();
    this.startAutoReconnect();
    this.setupProcessListeners();
  }

  private setupProcessListeners() {
    if (this.processListenersAdded || typeof process === 'undefined') return;
    
    const cleanup = async () => {
      console.log('🧹 Limpando serviço WhatsApp...');
      await this.destroy();
    };

    process.on('SIGINT', cleanup);
    process.on('SIGTERM', cleanup);
    process.on('exit', cleanup);
    
    this.processListenersAdded = true;
  }

  private async initializeConnection() {
    if (this.isConnecting) return;
    this.isConnecting = true;

    try {
      console.log('🔄 Inicializando conexão com WhatsApp...');
      
      this.client = new Client({
        authStrategy: new LocalAuth({
          clientId: 'whatsapp-session',
          dataPath: './.wwebjs_auth'
        }),
        puppeteer: {
          headless: true,
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--disable-gpu',
            '--disable-web-security',
            '--disable-features=VizDisplayCompositor'
          ]
        },
        takeoverOnConflict: true,
        takeoverTimeoutMs: 60000
      });

      this.client.on('qr', (qr) => {
        console.log('\n📱 Escaneie o QR Code abaixo com seu WhatsApp:');
        console.log('👆 Abra o WhatsApp > Menu (3 pontos) > Dispositivos conectados > Conectar dispositivo\n');
        qrcode.generate(qr, { small: true });
        console.log('\n⏳ Aguardando escaneamento do QR Code...\n');
      });

      this.client.on('ready', async () => {
        console.log('🔐 WhatsApp autenticado!');
        this.isConnected = true;
        this.isConnecting = false;
        
        // Configurações adicionais após conexão
        try {
          const info = await this.client?.getWWebVersion();
          console.log('📱 Versão WhatsApp Web:', info);
          
          const state = await this.client?.getState();
          console.log('🔗 Estado da conexão:', state);
        } catch (e) {
          console.log('⚠️ Não foi possível obter informações da sessão');
        }
        
        logger.info('WhatsApp conectado', {
          component: 'whatsapp-service',
          function: 'initializeConnection',
          status: 'connected'
        });
        
        console.log('✅ WhatsApp conectado com sucesso!');
      });

      this.client.on('authenticated', () => {
        console.log('🔐 WhatsApp autenticado!');
      });

      this.client.on('auth_failure', (msg) => {
        console.error('❌ Falha na autenticação:', msg);
        this.isConnected = false;
        this.isConnecting = false;
      });

      this.client.on('disconnected', (reason) => {
        console.log('📱 WhatsApp desconectado:', reason);
        this.isConnected = false;
        this.isConnecting = false;
        
        // Tentar reconectar após 5 segundos
        setTimeout(() => {
          console.log('🔄 Tentando reconectar...');
          this.initializeConnection();
        }, 5000);
      });

      await this.client.initialize();

    } catch (error) {
      console.error('❌ Erro ao inicializar WhatsApp:', error);
      this.isConnecting = false;
    }
  }

  private startHealthCheck() {
    // Verificar saúde da sessão a cada 30 minutos
    this.healthCheckTimer = setInterval(async () => {
      if (this.isConnected && this.client) {
        try {
          console.log('🔍 Verificando saúde da sessão WhatsApp...');
          const state = await this.client.getState();
          console.log('💓 Estado da sessão:', state);
          
          // Se a sessão não estiver em estado válido, reconectar
          if (state !== 'CONNECTED') {
            console.log('⚠️ Sessão não está conectada, forçando reconexão...');
            await this.forceReconnect();
          }
          
          // Verificar se não enviamos mensagens há muito tempo (pode indicar problema)
          const timeSinceLastMessage = Date.now() - this.lastMessageTime;
          if (timeSinceLastMessage > 3600000) { // 1 hora
            console.log('⏰ Última mensagem há mais de 1 hora, verificando conexão...');
            // Tentar enviar mensagem de teste para nós mesmos
            try {
              const info = await this.client.getWWebVersion();
              console.log('✅ Conexão verificada, versão:', info);
            } catch (e) {
              console.log('❌ Falha na verificação, reconectando...');
              await this.forceReconnect();
            }
          }
        } catch (error) {
          console.error('❌ Erro na verificação de saúde:', error);
          await this.forceReconnect();
        }
      }
    }, 30 * 60 * 1000); // 30 minutos
  }

  private startAutoReconnect() {
    // Reconexão automática a cada 2 horas
    this.reconnectTimer = setInterval(async () => {
      console.log('🔄 Reconexão automática programada (2 horas)');
      await this.forceReconnect();
    }, 2 * 60 * 60 * 1000); // 2 horas
  }

  private async forceReconnect() {
    try {
      console.log('🔄 Iniciando reconexão forçada...');
      
      // Limpar timers
      if (this.reconnectTimer) {
        clearInterval(this.reconnectTimer);
        this.reconnectTimer = null;
      }
      if (this.healthCheckTimer) {
        clearInterval(this.healthCheckTimer);
        this.healthCheckTimer = null;
      }
      
      // Desconectar cliente atual
      if (this.client) {
        try {
          await this.client.destroy();
        } catch (e) {
          console.log('⚠️ Erro ao destruir cliente anterior:', e);
        }
      }
      
      // Reset estado
      this.client = null;
      this.isConnected = false;
      this.isConnecting = false;
      
      // Aguardar um pouco antes de reconectar
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      // Inicializar nova conexão
      await this.initializeConnection();
      
      // Reiniciar timers
      this.startHealthCheck();
      this.startAutoReconnect();
      
      console.log('✅ Reconexão forçada concluída');
    } catch (error) {
      console.error('❌ Erro na reconexão forçada:', error);
    }
  }

  private generateBrazilianNumberVariations(cleanPhone: string): string[] {
    const variations: string[] = [];
    
    // Se o número já tem código do país 55, usar como está
    if (cleanPhone.startsWith('55')) {
      variations.push(cleanPhone);
      
      // Para números brasileiros, gerar variações com e sem o dígito 9
      if (cleanPhone.length === 13) { // 55 + DDD (2) + 9 + número (8)
        const ddd = cleanPhone.substring(2, 4);
        const numberPart = cleanPhone.substring(5); // Remove o 9
        const withoutNine = `55${ddd}${numberPart}`;
        variations.push(withoutNine);
      } else if (cleanPhone.length === 12) { // 55 + DDD (2) + número (8)
        const ddd = cleanPhone.substring(2, 4);
        const numberPart = cleanPhone.substring(4);
        const withNine = `55${ddd}9${numberPart}`;
        variations.push(withNine);
      }
    } else {
      // Se não tem código do país, assumir que é brasileiro e adicionar 55
      if (cleanPhone.length === 11) { // DDD + 9 + número
        variations.push(`55${cleanPhone}`);
        // Versão sem o 9
        const ddd = cleanPhone.substring(0, 2);
        const numberPart = cleanPhone.substring(3);
        variations.push(`55${ddd}${numberPart}`);
      } else if (cleanPhone.length === 10) { // DDD + número (sem 9)
        variations.push(`55${cleanPhone}`);
        // Versão com o 9
        const ddd = cleanPhone.substring(0, 2);
        const numberPart = cleanPhone.substring(2);
        variations.push(`55${ddd}9${numberPart}`);
      } else {
        // Tentar adicionar 55 mesmo assim
        variations.push(`55${cleanPhone}`);
      }
    }
    
    // Remover duplicatas e retornar
    return [...new Set(variations)];
  }

  async sendMessage(phone: string, message: string): Promise<boolean> {
    if (!this.isConnected || !this.client) {
      console.log('⚠️ WhatsApp não está conectado. Conecte primeiro.');
      return false;
    }

    try {
      // Limpar número removendo tudo que não é dígito
      const cleanPhone = phone.replace(/[^0-9]/g, '');
      console.log(`🔍 Número original: ${phone}`);
      console.log(`🧹 Número limpo: ${cleanPhone}`);
      
      // Para números brasileiros, tentar com e sem o dígito 9
      const possibleNumbers = this.generateBrazilianNumberVariations(cleanPhone);
      console.log(`🇧🇷 Variações do número brasileiro:`, possibleNumbers);
      
      // Tentar encontrar o número registrado no WhatsApp
      let validNumber = null;
      let chatId = null;
      
      for (const numberVariation of possibleNumbers) {
        const testChatId = `${numberVariation}@c.us`;
        console.log(`🔍 Testando: ${testChatId}`);
        
        try {
          const isRegistered = await this.client.isRegisteredUser(testChatId);
          if (isRegistered) {
            console.log(`✅ Número encontrado no WhatsApp: ${numberVariation}`);
            validNumber = numberVariation;
            chatId = testChatId;
            break;
          } else {
            console.log(`❌ Número não registrado: ${numberVariation}`);
          }
        } catch (error) {
          console.log(`⚠️ Erro ao verificar ${numberVariation}:`, error);
        }
      }
      
      if (!validNumber || !chatId) {
        console.log(`❌ Nenhuma variação do número está registrada no WhatsApp`);
        console.log(`📱 Números testados:`, possibleNumbers);
        return false;
      }
      
      console.log(`🎯 Enviando para: ${chatId}`);
      console.log(`📝 Mensagem: ${message.substring(0, 50)}...`);
      
      // Verificar estado da conexão antes de enviar
      const connectionState = await this.client.getState();
      console.log(`🔗 Estado da conexão antes do envio:`, connectionState);
      
      // Verificar se o cliente ainda está conectado
      const isConnected = await this.client.pupPage?.isClosed();
      console.log(`🌐 Página do Puppeteer fechada?:`, isConnected);
      
      // Enviar mensagem para o número válido
      console.log(`📤 Iniciando envio da mensagem...`);
      const result = await this.client.sendMessage(chatId, message);
      
      // Atualizar tempo da última mensagem
      this.lastMessageTime = Date.now();
      
      console.log(`✅ Mensagem enviada com sucesso!`);
      console.log(`📊 Message ID:`, result.id?._serialized || 'N/A');
      console.log(`📊 ACK Status:`, result.ack || 'N/A');
      console.log(`📊 Timestamp:`, result.timestamp || 'N/A');
      console.log(`📊 From:`, result.from || 'N/A');
      console.log(`📊 To:`, result.to || 'N/A');
      
      // Verificar se a mensagem foi realmente enviada
      if (result.ack === undefined || result.ack === 0) {
        console.log(`⚠️ ATENÇÃO: Mensagem pode não ter sido enviada corretamente (ACK: ${result.ack})`);
        
        // Se ACK é 0 ou undefined, pode indicar problema de sessão
        if (result.ack === undefined) {
          console.log(`🚨 ACK undefined pode indicar problema de sessão - agendando verificação`);
          setTimeout(() => this.forceReconnect(), 10000); // Reconectar em 10 segundos
        }
      } else {
        console.log(`✅ Mensagem enviada com ACK válido: ${result.ack}`);
      }
      
      // Verificar status após 5 segundos
      setTimeout(async () => {
        try {
          if (result.id?._serialized) {
            const msg = await this.client?.getMessageById(result.id._serialized);
            console.log(`📬 Status final da mensagem:`, msg?.ack);
            // 0: Pendente, 1: Enviado, 2: Recebido, 3: Lido
            const statusMap = { 0: 'Pendente', 1: 'Enviado', 2: 'Recebido', 3: 'Lido' };
            console.log(`📊 Status traduzido:`, msg?.ack !== undefined ? statusMap[msg.ack as keyof typeof statusMap] : 'Desconhecido');
          }
        } catch (e) {
          console.log(`⚠️ Não foi possível verificar status da mensagem`);
        }
      }, 5000);
      
      logger.info('Mensagem WhatsApp enviada', {
        component: 'whatsapp-service',
        function: 'sendMessage',
        phone: phone,
        success: true
      });
      
      return true;
    } catch (error: any) {
      console.error(`❌ Erro ao enviar mensagem para ${phone}:`, error);
      console.error(`🔍 Tipo do erro:`, error.name || 'Desconhecido');
      console.error(`📝 Mensagem do erro:`, error.message || 'Sem mensagem');
      
      // Diagnóstico específico
      if (error.message?.includes('phone number is not registered')) {
        console.error(`📱 DIAGNÓSTICO: Número não tem WhatsApp ativo`);
      } else if (error.message?.includes('blocked')) {
        console.error(`🚫 DIAGNÓSTICO: Número bloqueou você`);
      } else if (error.message?.includes('session')) {
        console.error(`🔗 DIAGNÓSTICO: Problema na sessão WhatsApp`);
      } else {
        console.error(`❓ DIAGNÓSTICO: Erro desconhecido - verifique formato do número`);
      }
      
      logger.error('Erro ao enviar mensagem WhatsApp', {
        component: 'whatsapp-service',
        function: 'sendMessage',
        phone: phone,
        error: error.message || error
      });
      
      return false;
    }
  }

  getConnectionStatus(): { connected: boolean; connecting: boolean } {
    return {
      connected: this.isConnected,
      connecting: this.isConnecting
    };
  }

  async disconnect() {
    if (this.client) {
      await this.client.logout();
      this.client = null;
      this.isConnected = false;
      this.isConnecting = false;
      console.log('📱 WhatsApp desconectado.');
    }
  }

  // Método para reconectar manualmente
  async reconnect() {
    console.log('🔄 Reconectando WhatsApp...');
    await this.forceReconnect();
  }

  // Método público para forçar reconexão manual
  async forceReconnectManual() {
    console.log('🔄 Reconexão manual solicitada...');
    await this.forceReconnect();
  }

  // Limpar timers ao destruir o serviço
  async destroy() {
    console.log('🧹 Destruindo serviço WhatsApp...');
    
    if (this.reconnectTimer) {
      clearInterval(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
      this.healthCheckTimer = null;
    }
    if (this.client) {
      try {
        await this.client.destroy();
      } catch (error) {
        console.error('❌ Erro ao destruir cliente WhatsApp:', error);
      }
      this.client = null;
    }
    
    this.isConnected = false;
    this.isConnecting = false;
    this.processListenersAdded = false;
    
    console.log('✅ Serviço WhatsApp destruído');
  }
}

// Singleton instance
let whatsappService: WhatsAppService | null = null;

export function getWhatsAppService(): WhatsAppService {
  if (!whatsappService) {
    whatsappService = new WhatsAppService();
  }
  return whatsappService;
}

export { WhatsAppService };