import { prisma } from "@/lib/utils";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const services = await prisma.service.findMany({
      where: {
        isActive: true, // Retorna apenas serviços ativos
      },
      select: {
        id: true,
        name: true,
        price: true,
        averageTime: true,
      },
    });
    return NextResponse.json(services);
  } catch (error) {
    console.error("Erro ao listar serviços:", error);
    return NextResponse.json(
      { error: "Erro ao buscar serviços" },
      { status: 500 }
    );
  }
}


export async function POST(request: Request) {
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

    const newService = await prisma.service.create({
      data: {
        name: name.trim(),
        price,
        averageTime,
      },
    });

    return NextResponse.json(newService, { status: 201 });
  } catch (error) {
    console.error("Erro ao adicionar serviço:", error);
    return NextResponse.json(
      { error: "Erro ao adicionar serviço" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, name, price, averageTime } = body;

    if (!id || typeof id !== "string") {
      return NextResponse.json(
        { message: "ID do serviço é obrigatório" },
        { status: 400 }
      );
    }

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
      return NextResponse.json(
        { message: "Serviço não encontrado" },
        { status: 404 }
      );
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
    return NextResponse.json(
      { error: "Erro ao atualizar serviço" },
      { status: 500 }
    );
  }
}