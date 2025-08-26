import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET(req: NextRequest) {
  try {
    const cookieStore = cookies();
    const token = (await cookieStore).get("barberToken");

    if (!token) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const barbers = await prisma.barber.findMany({
      select: {
        id: true,
        name: true,
        createdAt: true,
        status: true,
        queueStatus: true,
        commissionRate: true,
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    return NextResponse.json(barbers);
  } catch (error) {
    console.error("Erro ao listar barbeiros:", error);
    
    // Log detalhado do erro para debug na Vercel
    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }
    
    return NextResponse.json({ 
      error: "Erro ao buscar barbeiros",
      details: process.env.NODE_ENV === 'development' ? error : undefined
    }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const cookieStore = cookies();
    const token = (await cookieStore).get("barberToken");

    if (!token) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { name, commissionRate } = await req.json();

    if (!name || typeof name !== "string" || name.length < 2) {
      return NextResponse.json({ error: "Nome inválido" }, { status: 400 });
    }

    // Validar comissão (deve ser um número entre 0 e 1)
    if (commissionRate !== undefined && (typeof commissionRate !== "number" || commissionRate < 0 || commissionRate > 1)) {
      return NextResponse.json({ error: "Taxa de comissão inválida. Deve estar entre 0 e 1." }, { status: 400 });
    }

    // Verificar se já existe um barbeiro com o mesmo nome (case insensitive)
    const existingBarber = await prisma.barber.findFirst({
      where: {
        name: {
          equals: name.trim()
        }
      }
    });

    if (existingBarber) {
      return NextResponse.json({ error: "Já existe um barbeiro com este nome" }, { status: 409 });
    }

    const newBarber = await prisma.barber.create({
      data: {
        name: name.trim(),
        commissionRate: commissionRate !== undefined ? commissionRate : 0.20, // Padrão 20%
      },
      select: {
        id: true,
        name: true,
        createdAt: true,
        status: true,
        queueStatus: true,
        commissionRate: true,
      },
    });

    return NextResponse.json(newBarber, { status: 201 });
  } catch (error) {
    console.error("Erro ao adicionar barbeiro:", error);
    
    // Log detalhado do erro para debug na Vercel
    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }
    
    return NextResponse.json({ 
      error: "Erro ao adicionar barbeiro",
      details: process.env.NODE_ENV === 'development' ? error : undefined
    }, { status: 500 });
  }
}