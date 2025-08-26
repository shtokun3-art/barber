import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/utils";
import { cookies } from "next/headers";

export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const token = (await cookieStore).get("barberToken");

    if (!token) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    // Buscar histórico com informações relacionadas
    const history = await prisma.history.findMany({
      orderBy: {
        createdAt: "desc"
      },
      include: {
        // Buscar informações do usuário
        user: {
          select: {
            id: true,
            name: true,
            phone: true
          }
        },
        // Buscar informações do barbeiro
        barber: {
          select: {
            id: true,
            name: true
          }
        },
        // Buscar serviços do histórico
        services: {
          select: {
            id: true,
            historyId: true,
            serviceId: true,
            isExtra: true,
            createdAt: true,
            service: {
              select: {
                id: true,
                name: true,
                price: true,
                averageTime: true
              }
            }
          }
        },
        // Buscar produtos/itens do histórico
        items: {
          include: {
            item: {
              select: {
                id: true,
                item: true,
                value: true
              }
            }
          }
        }
      }
    });

    return NextResponse.json(history, { status: 200 });
  } catch (error) {
    console.error("Erro ao buscar histórico:", error);
    return NextResponse.json(
      { error: "Erro interno no servidor" },
      { status: 500 }
    );
  }
}