import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/utils";
import { cookies } from "next/headers";
import { notifyQueueUpdate } from "@/lib/queue-notifier";

export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const token = (await cookieStore).get("barberToken");

    if (!token) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { queueId } = await request.json();

    if (!queueId) {
      return NextResponse.json({ error: "ID da fila é obrigatório" }, { status: 400 });
    }

    // Buscar a entrada da fila
    const queueEntry = await prisma.queue.findUnique({
      where: { id: queueId }
    });

    if (!queueEntry) {
      return NextResponse.json({ error: "Entrada da fila não encontrada" }, { status: 404 });
    }

    if (queueEntry.status !== "waiting") {
      return NextResponse.json({ error: "Esta entrada não está na fila" }, { status: 400 });
    }

    // Iniciar transação para cancelar e remover da fila
    await prisma.$transaction(async (tx) => {
      // Atualizar status para canceled
      await tx.queue.update({
        where: { id: queueId },
        data: { status: "canceled" }
      });

      // Remover serviços da fila
      await tx.queueService.deleteMany({
        where: { queueId: queueId }
      });
    });

    // Notificar todas as conexões SSE sobre a atualização da fila
    notifyQueueUpdate();

    return NextResponse.json({ 
      message: "Entrada cancelada com sucesso" 
    }, { status: 200 });

  } catch (error) {
    console.error("Erro ao cancelar entrada:", error);
    return NextResponse.json(
      { error: "Erro interno no servidor" },
      { status: 500 }
    );
  }
}