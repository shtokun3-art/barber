// Arquivo de inicialização do servidor
import { getWhatsAppService } from './whatsapp-service';

// Flag para evitar múltiplas inicializações
let servicesInitialized = false;
let initializationPromise: Promise<void> | null = null;

// Função para inicializar serviços quando o servidor iniciar
export function initializeServices(): Promise<void> {
  if (servicesInitialized) {
    console.log('⚠️ Serviços já foram inicializados, pulando...');
    return Promise.resolve();
  }
  
  if (initializationPromise) {
    console.log('⏳ Inicialização já em andamento, aguardando...');
    return initializationPromise;
  }
  
  initializationPromise = (async () => {
    try {
      console.log('🚀 Inicializando serviços do sistema...');
      
      // Aumentar limite de listeners do processo
      if (typeof process !== 'undefined') {
        process.setMaxListeners(25);
      }
      
      // Inicializar serviço do WhatsApp
      try {
        console.log('📱 Inicializando serviço do WhatsApp...');
        getWhatsAppService();
        console.log('✅ Serviço do WhatsApp inicializado');
      } catch (error) {
        console.error('❌ Erro ao inicializar serviço do WhatsApp:', error);
      }
      
      servicesInitialized = true;
      console.log('✅ Todos os serviços foram inicializados');
    } catch (error) {
      console.error('❌ Erro na inicialização dos serviços:', error);
      throw error;
    }
  })();
  
  return initializationPromise;
}

// Auto-executar quando o módulo for importado
if (typeof window === 'undefined') {
  // Só executar no servidor (não no cliente)
  initializeServices().catch(console.error);
}