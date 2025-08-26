import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const cookieStore = cookies();
    const token = (await cookieStore).get("barberToken");

    if (!token) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { id } = await params;
    const barberId = id;
    const barber = await prisma.barber.findUnique({
      where: { id: barberId },
      select: {
        id: true,
        name: true,
        createdAt: true,
        status: true,
      },
    });

    if (!barber) {
      return NextResponse.json({ error: "Barbeiro não encontrado" }, { status: 404 });
    }

    return NextResponse.json(barber, { status: 200 });
  } catch (error) {
    console.error("Erro ao buscar barbeiro:", error);
    return NextResponse.json({ error: "Erro ao buscar barbeiro" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const cookieStore = cookies();
    const token = (await cookieStore).get("barberToken");

    if (!token) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { id } = await params;
    const barberId = id;
    const barber = await prisma.barber.findUnique({
      where: { id: barberId },
    });

    if (!barber) {
      return NextResponse.json({ error: "Barbeiro não encontrado" }, { status: 404 });
    }

    await prisma.barber.delete({
      where: { id: barberId },
    });

    return NextResponse.json({ message: "Barbeiro excluído com sucesso" }, { status: 200 });
  } catch (error) {
    console.error("Erro ao excluir barbeiro:", error);
    return NextResponse.json({ error: "Erro ao excluir barbeiro" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const cookieStore = cookies();
    const token = (await cookieStore).get("barberToken");

    if (!token) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { id } = await params;
    const barberId = id;
    const body = await req.json();
    
    // Preparar dados para atualização (pode ser status, queueStatus, name ou commissionRate)
    const updateData: { status?: string; queueStatus?: string; name?: string; commissionRate?: number } = {};
    
    if (body.status !== undefined) {
      updateData.status = body.status;
    }
    if (body.queueStatus !== undefined) {
      updateData.queueStatus = body.queueStatus;
    }
    if (body.name !== undefined) {
      if (typeof body.name !== "string" || body.name.trim().length < 2) {
        return NextResponse.json({ error: "Nome inválido. Deve ter pelo menos 2 caracteres." }, { status: 400 });
      }
      updateData.name = body.name.trim();
    }
    if (body.commissionRate !== undefined) {
      if (typeof body.commissionRate !== "number" || body.commissionRate < 0 || body.commissionRate > 1) {
        return NextResponse.json({ error: "Taxa de comissão inválida. Deve estar entre 0 e 1." }, { status: 400 });
      }
      updateData.commissionRate = body.commissionRate;
    }

    const barber = await prisma.barber.findUnique({
      where: { id: barberId },
    });

    if (!barber) {
      return NextResponse.json({ error: "Barbeiro não encontrado" }, { status: 404 });
    }

    const updatedBarber = await prisma.barber.update({
      where: { id: barberId },
      data: updateData,
      select: {
        id: true,
        name: true,
        createdAt: true,
        status: true,
        queueStatus: true,
        commissionRate: true,
      },
    });

    return NextResponse.json(updatedBarber, { status: 200 });
  } catch (error) {
    console.error("Erro ao atualizar barbeiro:", error);
    return NextResponse.json({ error: "Erro ao atualizar barbeiro" }, { status: 500 });
  }
}