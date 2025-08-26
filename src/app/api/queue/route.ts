// src/pages/api/queue/index.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/utils";

export async function GET(request: Request) {
  try {
    // Busca os barbeiros com status "active"
    const activeBarbers = await prisma.barber.findMany({
      where: {
        status: "active",
      },
      select: {
        id: true,
      },
    });

    // Extrai os IDs dos barbeiros ativos
    const activeBarberIds = activeBarbers.map((barber) => barber.id);

    // Busca as entradas da fila apenas para barbeiros ativos
    const queues = await prisma.queue.findMany({
      where: {
        status: { in: ["waiting", "in_progress"] },
        barberId: { in: activeBarberIds }, // Filtra por barbeiros ativos
      },
      orderBy: [
        { barberId: "asc" },
        { updatedAt: "desc" },
      ],
    });

    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        phone: true,
      },
    });

    const barbers = await prisma.barber.findMany({
      select: {
        id: true,
        name: true,
        status: true,
      },
    });

    const queueServices = await prisma.queueService.findMany();

    const services = await prisma.service.findMany({
      select: {
        id: true,
        name: true,
        price: true,
        averageTime: true,
      },
    });

    const enrichedQueues = queues.map((queue) => {
      const user = users.find((u) => u.id === queue.userId) || null;
      const barber = barbers.find((b) => b.id === queue.barberId) || null;
      const queueServicesForQueue = queueServices.filter((qs) => qs.queueId === queue.id);

      const enrichedQueueServices = queueServicesForQueue.map((qs) => {
        const service = services.find((s) => s.id === qs.serviceId) || null;
        return {
          ...qs,
          service,
        };
      });

      return {
        ...queue,
        user,
        barber,
        queueServices: enrichedQueueServices,
      };
    });

    return NextResponse.json(enrichedQueues, { status: 200 });
  } catch (error) {
    console.error("Erro ao listar a fila:", error);
    return NextResponse.json(
      { error: "Erro interno no servidor" },
      { status: 500 }
    );
  }
}