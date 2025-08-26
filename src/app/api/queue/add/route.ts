import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/utils";
import { cookies } from "next/headers";
import * as jwt from "jsonwebtoken";
import { notifyQueueUpdate } from "@/lib/queue-notifier";

export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const token = (await cookieStore).get("barberToken");

    if (!token) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    // Verificar e decodificar o token
    const secret = process.env.JWT_SECRET || "X7GmP9LqT2VwZ8B5nK1Y4CdR6FsJ3NxAoMHQDpWtCU";
    let decoded;
    try {
      decoded = jwt.verify(token.value, secret) as { id: string; phone: string; role: string };
    } catch (error) {
      return NextResponse.json({ error: "Token inválido" }, { status: 401 });
    }

    const { serviceIds, barberId } = await request.json();

    if (!serviceIds || !Array.isArray(serviceIds) || serviceIds.length === 0) {
      return NextResponse.json({ error: "Serviços são obrigatórios" }, { status: 400 });
    }

    if (!barberId) {
      return NextResponse.json({ error: "Barbeiro é obrigatório" }, { status: 400 });
    }

    // Verificar se o usuário já está na fila
    const existingQueue = await prisma.queue.findFirst({
      where: {
        userId: decoded.id,
        status: "waiting"
      }
    });

    if (existingQueue) {
      return NextResponse.json({ error: "Você já está na fila" }, { status: 400 });
    }

    // Verificar se o barbeiro existe, está ativo e com fila aberta
    const barber = await prisma.barber.findUnique({
      where: { id: barberId }
    });

    if (!barber || barber.status !== "active") {
      return NextResponse.json({ error: "Barbeiro não disponível" }, { status: 400 });
    }

    if (barber.queueStatus !== "open") {
      return NextResponse.json({ error: "A fila deste barbeiro está fechada no momento" }, { status: 400 });
    }

    // Verificar se os serviços existem
    const services = await prisma.service.findMany({
      where: {
        id: { in: serviceIds }
      }
    });

    if (services.length !== serviceIds.length) {
      return NextResponse.json({ error: "Alguns serviços não foram encontrados" }, { status: 400 });
    }

    // Criar entrada na fila
    const result = await prisma.$transaction(async (tx) => {
      // Criar entrada na fila
      const queueEntry = await tx.queue.create({
        data: {
          userId: decoded.id,
          barberId: barberId,
          status: "waiting"
        }
      });

      // Adicionar serviços à fila
      for (const serviceId of serviceIds) {
        await tx.queueService.create({
          data: {
            queueId: queueEntry.id,
            serviceId: serviceId
          }
        });
      }

      return queueEntry;
    });

    // Notificar todas as conexões SSE sobre a atualização da fila
    notifyQueueUpdate();

    return NextResponse.json({ 
      message: "Adicionado à fila com sucesso",
      queueId: result.id
    }, { status: 201 });

  } catch (error) {
    console.error("Erro ao adicionar à fila:", error);
    return NextResponse.json(
      { error: "Erro interno no servidor" },
      { status: 500 }
    );
  }
}