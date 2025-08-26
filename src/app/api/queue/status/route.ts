import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/utils";
import { cookies } from "next/headers";
import * as jwt from "jsonwebtoken";

export async function GET(request: NextRequest) {
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

    // Buscar se o usuário está na fila
    const userQueue = await prisma.queue.findFirst({
      where: {
        userId: decoded.id,
        status: "waiting"
      },
      include: {
        queueServices: {
          include: {
            service: {
              select: {
                id: true,
                name: true,
                price: true,
                averageTime: true
              }
            }
          }
        }
      }
    });

    if (!userQueue) {
      return NextResponse.json({ inQueue: false }, { status: 200 });
    }

    // Buscar informações do barbeiro
    const barber = await prisma.barber.findUnique({
      where: { id: userQueue.barberId },
      select: {
        id: true,
        name: true
      }
    });

    // Buscar todas as entradas da fila do mesmo barbeiro para calcular posição
    const allQueueEntries = await prisma.queue.findMany({
      where: {
        barberId: userQueue.barberId,
        status: "waiting"
      },
      orderBy: {
        updatedAt: "asc" // Mais antigo primeiro (ordem da fila)
      },
      include: {
        queueServices: {
          include: {
            service: true
          }
        }
      }
    });

    // Encontrar a posição do usuário
    const userPosition = allQueueEntries.findIndex(entry => entry.id === userQueue.id) + 1;
    
    // Calcular quantas pessoas estão na frente
    const peopleAhead = userPosition - 1;
    
    // Encontrar quem está sendo atendido (primeira posição)
    const currentlyServing = allQueueEntries.length > 0 ? allQueueEntries[0] : null;
    
    // Calcular tempo estimado para o usuário atual
    const userTotalTime = userQueue.queueServices.reduce((total, qs) => {
      return total + (qs.service?.averageTime || 0);
    }, 0);

    // Calcular preço total dos serviços do usuário
    const userTotalPrice = userQueue.queueServices.reduce((total, qs) => {
      return total + (qs.service?.price || 0);
    }, 0);

    // Calcular tempo estimado de espera baseado na posição
    let estimatedWaitTime = 0;
    for (let i = 0; i < peopleAhead; i++) {
      const entry = allQueueEntries[i];
      if (entry && entry.queueServices) {
        const entryTime = entry.queueServices.reduce((total, qs) => {
          return total + (qs.service?.averageTime || 0);
        }, 0);
        estimatedWaitTime += entryTime;
      }
    }

    // Mapear todos os clientes na fila com informações anônimas
    const queueList = allQueueEntries.map((entry, index) => ({
      id: entry.id,
      position: index + 1,
      name: entry.userId === decoded.id ? 'Você' : `Cliente ${index + 1}`,
      isCurrentUser: entry.userId === decoded.id,
      services: entry.queueServices?.map(qs => qs.service) || [],
      estimatedTime: entry.queueServices?.reduce((total, qs) => {
        return total + (qs.service?.averageTime || 0);
      }, 0) || 0,
      status: index === 0 ? 'in_progress' : 'waiting'
    }));

    return NextResponse.json({
      inQueue: true,
      queueId: userQueue.id,
      position: userPosition,
      peopleAhead: peopleAhead,
      totalPeople: allQueueEntries.length,
      estimatedTime: userTotalTime,
      estimatedWaitTime: estimatedWaitTime,
      totalPrice: userTotalPrice,
      barber: barber,
      services: userQueue.queueServices.map(qs => qs.service),
      queueList: queueList,
      currentlyServing: currentlyServing ? {
        name: currentlyServing.userId === decoded.id ? 'Você' : `Cliente 1`,
        position: 1,
        isCurrentUser: currentlyServing.userId === decoded.id
      } : null,
      createdAt: userQueue.createdAt,
      updatedAt: userQueue.updatedAt
    }, { status: 200 });

  } catch (error) {
    console.error("Erro ao verificar status da fila:", error);
    return NextResponse.json(
      { error: "Erro interno no servidor" },
      { status: 500 }
    );
  }
}