import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/utils";
import { cookies } from "next/headers";
import * as jwt from "jsonwebtoken";
import { notifyQueueUpdate } from "@/lib/queue-notifier";

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("barberToken")?.value;
    
    if (!token) {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      );
    }

    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET não configurado');
      return NextResponse.json({ error: "Erro de configuração do servidor" }, { status: 500 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET) as { id: string; phone: string; role: string };
    
    // Apenas admins e barbeiros podem atualizar serviços da fila
    if (decoded.role !== 'admin' && decoded.role !== 'barber') {
      return NextResponse.json(
        { error: "Acesso negado" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { queueId, serviceIdToRemove } = body;

    if (!queueId || !serviceIdToRemove) {
      return NextResponse.json(
        { error: "ID da fila e ID do serviço são obrigatórios" },
        { status: 400 }
      );
    }

    // Verificar se a entrada na fila existe
    const queueEntry = await prisma.queue.findUnique({
      where: { id: queueId },
      include: {
        queueServices: {
          include: {
            service: true
          }
        }
      }
    });

    if (!queueEntry) {
      return NextResponse.json(
        { error: "Entrada na fila não encontrada" },
        { status: 404 }
      );
    }

    // Verificar se há mais de um serviço (não pode remover o último)
    if (queueEntry.queueServices.length <= 1) {
      return NextResponse.json(
        { error: "Não é possível remover o último serviço da fila" },
        { status: 400 }
      );
    }

    // Verificar se o serviço existe na fila
    const serviceToRemove = queueEntry.queueServices.find(
      qs => qs.service?.id === serviceIdToRemove
    );

    if (!serviceToRemove) {
      return NextResponse.json(
        { error: "Serviço não encontrado na fila" },
        { status: 404 }
      );
    }

    // Remover o serviço da fila
    await prisma.queueService.delete({
      where: {
        id: serviceToRemove.id
      }
    });

    // Notificar atualização da fila
    notifyQueueUpdate();

    return NextResponse.json({
      message: "Serviço removido da fila com sucesso"
    });

  } catch (error) {
    console.error("Erro ao atualizar serviços da fila:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}