import { NextRequest, NextResponse } from "next/server";
import { getWhatsAppService } from "@/lib/whatsapp-service";
import { logger } from "@/lib/logger";

export async function GET(request: NextRequest) {
  try {
    const whatsappService = getWhatsAppService();
    const status = whatsappService.getConnectionStatus();
    
    return NextResponse.json({
      connected: status.connected,
      connecting: status.connecting,
      message: status.connected 
        ? "WhatsApp conectado e pronto para enviar mensagens"
        : status.connecting 
        ? "WhatsApp conectando... Verifique o QR Code no terminal"
        : "WhatsApp desconectado. Escaneie o QR Code no terminal"
    });
  } catch (error) {
    logger.error('Erro ao verificar status do WhatsApp', {
      component: 'whatsapp-status',
      function: 'GET',
      error: error
    });
    
    return NextResponse.json(
      { error: "Erro ao verificar status do WhatsApp" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;
    
    if (action === 'reconnect') {
      const whatsappService = getWhatsAppService();
      await whatsappService.reconnect();
      
      return NextResponse.json({
        message: "Reconexão iniciada. Verifique o QR Code no terminal."
      });
    }
    
    if (action === 'disconnect') {
      const whatsappService = getWhatsAppService();
      await whatsappService.disconnect();
      
      return NextResponse.json({
        message: "WhatsApp desconectado com sucesso."
      });
    }
    
    return NextResponse.json(
      { error: "Ação não reconhecida. Use 'reconnect' ou 'disconnect'" },
      { status: 400 }
    );
  } catch (error) {
    logger.error('Erro ao executar ação do WhatsApp', {
      component: 'whatsapp-status',
      function: 'POST',
      error: error
    });
    
    return NextResponse.json(
      { error: "Erro ao executar ação do WhatsApp" },
      { status: 500 }
    );
  }
}