import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/utils";
import { cookies } from "next/headers";

export async function GET() {
  try {
    const cookieStore = cookies();
    const token = (await cookieStore).get("barberToken");

    if (!token) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    // Buscar configurações ou criar padrão se não existir
    let settings = await prisma.settings.findFirst();
    
    if (!settings) {
      settings = await prisma.settings.create({
        data: {
          commissionRate: 0.15,
          creditCardFee: 0.035,
          creditCardFee2x: 0.045,
          creditCardFee3x: 0.055,
          debitCardFee: 0.025,
          cashFee: 0.0,
          pixFee: 0.0
        }
      });
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error('Erro ao buscar configurações:', error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const token = (await cookieStore).get("barberToken");

    if (!token) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const data = await request.json();
    const { commissionRate, creditCardFee, creditCardFee2x, creditCardFee3x, debitCardFee, cashFee, pixFee } = data;

    // Buscar configuração existente
    let settings = await prisma.settings.findFirst();
    
    if (settings) {
      // Atualizar configuração existente
      settings = await prisma.settings.update({
        where: { id: settings.id },
        data: {
          commissionRate,
          creditCardFee,
          creditCardFee2x,
          creditCardFee3x,
          debitCardFee,
          cashFee,
          pixFee
        }
      });
    } else {
      // Criar nova configuração
      settings = await prisma.settings.create({
        data: {
          commissionRate,
          creditCardFee,
          creditCardFee2x,
          creditCardFee3x,
          debitCardFee,
          cashFee,
          pixFee
        }
      });
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error('Erro ao atualizar configurações:', error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}