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

    const { queueId, direction } = await request.json();

    if (!queueId || !direction) {
      return NextResponse.json({ error: "ID da fila e direção são obrigatórios" }, { status: 400 });
    }

    if (!['up', 'down'].includes(direction)) {
      return NextResponse.json({ error: "Direção deve ser 'up' ou 'down'" }, { status: 400 });
    }

    // Buscar a entrada da fila atual
    const currentEntry = await prisma.queue.findUnique({
      where: { id: queueId }
    });

    if (!currentEntry) {
      return NextResponse.json({ error: "Entrada da fila não encontrada" }, { status: 404 });
    }

    if (currentEntry.status !== "waiting") {
      return NextResponse.json({ error: "Esta entrada não está na fila" }, { status: 400 });
    }

    // Buscar todas as entradas da fila do mesmo barbeiro, ordenadas por updatedAt
    const allEntries = await prisma.queue.findMany({
      where: {
        barberId: currentEntry.barberId,
        status: "waiting"
      },
      orderBy: {
        updatedAt: "asc" // Mais antigo primeiro (ordem da fila)
      }
    });

    // Encontrar a posição atual
    const currentIndex = allEntries.findIndex(entry => entry.id === queueId);
    
    if (currentIndex === -1) {
      return NextResponse.json({ error: "Entrada não encontrada na fila" }, { status: 404 });
    }

    let targetIndex;
    if (direction === 'up' && currentIndex > 0) {
      targetIndex = currentIndex - 1; // Mover para cima (posição anterior)
    } else if (direction === 'down' && currentIndex < allEntries.length - 1) {
      targetIndex = currentIndex + 1; // Mover para baixo (próxima posição)
    } else {
      return NextResponse.json({ error: "Não é possível mover nesta direção" }, { status: 400 });
    }

    const targetEntry = allEntries[targetIndex];

    // Trocar os updatedAt para alterar a ordem
    await prisma.$transaction(async (tx) => {
      const tempTime = new Date();
      
      // Atualizar a entrada atual com o updatedAt da entrada alvo
      await tx.queue.update({
        where: { id: currentEntry.id },
        data: { updatedAt: targetEntry.updatedAt }
      });

      // Atualizar a entrada alvo com o updatedAt da entrada atual
      await tx.queue.update({
        where: { id: targetEntry.id },
        data: { updatedAt: currentEntry.updatedAt }
      });
    });

    // Notificar todas as conexões SSE sobre a atualização
    notifyQueueUpdate();

    return NextResponse.json({ 
      message: `Posição alterada com sucesso` 
    }, { status: 200 });

  } catch (error) {
    console.error("Erro ao mover posição:", error);
    return NextResponse.json(
      { error: "Erro interno no servidor" },
      { status: 500 }
    );
  }
}