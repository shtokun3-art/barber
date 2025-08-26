import { NextResponse } from "next/server";
import { prisma } from "@/lib/utils";

export async function GET() {
  try {
    // Buscar configurações do banco de dados
    let settings = await prisma.settings.findFirst();
    
    if (!settings) {
      // Criar configuração padrão se não existir
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

    const fees = {
      credit_card: settings.creditCardFee * 100, // Converter para porcentagem (à vista)
      credit_card_2x: (settings.creditCardFee2x || settings.creditCardFee) * 100, // 2x
      credit_card_3x: (settings.creditCardFee3x || settings.creditCardFee) * 100, // 3x
      debit_card: settings.debitCardFee * 100,
      cash: settings.cashFee * 100,
      pix: settings.pixFee * 100
    };

    return NextResponse.json(fees);
  } catch (error) {
    console.error('Erro ao buscar taxas de pagamento:', error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}