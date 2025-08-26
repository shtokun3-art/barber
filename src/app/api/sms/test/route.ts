import { NextRequest, NextResponse } from "next/server";
import { getSMSService } from "@/lib/sms-service";
import { logger } from "@/lib/logger";

export async function GET(request: NextRequest) {
  try {
    const smsService = getSMSService();
    const status = smsService.getServiceStatus();
    
    return NextResponse.json({
      configured: status.configured,
      ready: status.ready,
      message: status.ready 
        ? "SMS Service configurado e pronto para enviar mensagens"
        : status.configured
        ? "SMS Service configurado mas não pronto"
        : "SMS Service não configurado. Configure as variáveis TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN e TWILIO_PHONE_NUMBER"
    });
  } catch (error) {
    logger.error('Erro ao verificar status do SMS', {
      component: 'sms-test',
      function: 'GET',
      error: error
    });
    
    return NextResponse.json(
      { error: "Erro ao verificar status do SMS" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phone, message } = body;
    
    if (!phone || !message) {
      return NextResponse.json(
        { error: "Parâmetros 'phone' e 'message' são obrigatórios" },
        { status: 400 }
      );
    }
    
    const smsService = getSMSService();
    const status = smsService.getServiceStatus();
    
    if (!status.ready) {
      return NextResponse.json(
        { error: "SMS Service não está configurado ou pronto" },
        { status: 503 }
      );
    }
    
    const success = await smsService.sendSMS(phone, message);
    
    if (success) {
      return NextResponse.json({
        success: true,
        message: "SMS enviado com sucesso"
      });
    } else {
      return NextResponse.json(
        { error: "Falha ao enviar SMS" },
        { status: 500 }
      );
    }
  } catch (error) {
    logger.error('Erro ao enviar SMS de teste', {
      component: 'sms-test',
      function: 'POST',
      error: error
    });
    
    return NextResponse.json(
      { error: "Erro interno no servidor" },
      { status: 500 }
    );
  }
}