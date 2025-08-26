import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/utils";
import { verifyJWTToken } from "@/lib/jwt-utils";
import { addConnection, removeConnection } from "@/lib/queue-notifier";

export async function GET(request: NextRequest) {
  // Verificar autenticação
  const token = request.cookies.get("barberToken")?.value;
  
  if (!token) {
    return NextResponse.json(
      { error: "Token não encontrado" },
      { status: 401 }
    );
  }

  const decoded = verifyJWTToken(token);
  if (!decoded) {
    return NextResponse.json(
      { error: "Token inválido" },
      { status: 401 }
    );
  }

  // Criar stream SSE
  const stream = new ReadableStream({
    start(controller) {
      // Adicionar conexão ao conjunto
      addConnection(controller);
      
      // Enviar evento inicial
      controller.enqueue(`data: ${JSON.stringify({ type: 'connected', timestamp: Date.now() })}\n\n`);
      
      // Configurar heartbeat para manter conexão viva
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(`data: ${JSON.stringify({ type: 'heartbeat', timestamp: Date.now() })}\n\n`);
        } catch (error) {
          clearInterval(heartbeat);
          removeConnection(controller);
        }
      }, 30000); // Heartbeat a cada 30 segundos
      
      // Cleanup quando conexão é fechada
      request.signal.addEventListener('abort', () => {
        clearInterval(heartbeat);
        removeConnection(controller);
        try {
          controller.close();
        } catch (error) {
          // Ignorar erro se controller já foi fechado
        }
      });
    },
    
    cancel(controller) {
      // Cleanup quando stream é cancelado
      removeConnection(controller);
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control',
      'X-Accel-Buffering': 'no', // Nginx
      'Transfer-Encoding': 'chunked'
    }
  });
}