import { prisma } from "@/lib/utils";
import { NextResponse } from "next/server";

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  if (!id) {
    return NextResponse.json({ message: "ID inválido" }, { status: 400 });
  }

  try {
    const service = await prisma.service.findUnique({
      where: { id },
    });

    if (!service) {
      return NextResponse.json({ message: "Serviço não encontrado" }, { status: 404 });
    }

    // Soft delete: marca como inativo ao invés de deletar
    await prisma.service.update({
      where: { id },
      data: { isActive: false },
    });

    return NextResponse.json({ message: "Serviço removido com sucesso" });
  } catch (error) {
    console.error("Erro ao remover serviço:", error);
    return NextResponse.json({ error: "Erro ao remover serviço" }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  if (!id) {
    return NextResponse.json({ message: "ID inválido" }, { status: 400 });
  }

  try {
    const body = await request.json();
    const { name, price, averageTime } = body;

    if (!name || typeof name !== "string" || name.trim() === "") {
      return NextResponse.json(
        { message: "Nome do serviço é obrigatório" },
        { status: 400 }
      );
    }

    if (typeof price !== "number" || price <= 0) {
      return NextResponse.json(
        { message: "Preço deve ser um número maior que 0" },
        { status: 400 }
      );
    }

    if (typeof averageTime !== "number" || averageTime <= 0) {
      return NextResponse.json(
        { message: "Tempo médio deve ser um número maior que 0" },
        { status: 400 }
      );
    }

    // Verificar se o serviço existe
    const existingService = await prisma.service.findUnique({
      where: { id },
    });

    if (!existingService) {
      return NextResponse.json({ message: "Serviço não encontrado" }, { status: 404 });
    }

    const updatedService = await prisma.service.update({
      where: { id },
      data: {
        name: name.trim(),
        price,
        averageTime,
      },
    });

    return NextResponse.json(updatedService, { status: 200 });
  } catch (error) {
    console.error("Erro ao atualizar serviço:", error);
    return NextResponse.json({ error: "Erro ao atualizar serviço" }, { status: 500 });
  }
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  if (!id) {
    return NextResponse.json({ message: "ID inválido" }, { status: 400 });
  }

  try {
    const service = await prisma.service.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        price: true,
        averageTime: true,
        isActive: true,
      },
    });

    if (!service) {
      return NextResponse.json({ message: "Serviço não encontrado" }, { status: 404 });
    }

    return NextResponse.json(service);
  } catch (error) {
    console.error("Erro ao buscar serviço:", error);
    return NextResponse.json({ error: "Erro ao buscar serviço" }, { status: 500 });
  }
}