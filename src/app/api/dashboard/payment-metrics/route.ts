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

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '30d';

    // Calcular data de início baseada no período
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case '1d':
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '14d':
        startDate = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '3m':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case '6m':
        startDate = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
        break;
      case '1y':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      case '2y':
        startDate = new Date(now.getTime() - 730 * 24 * 60 * 60 * 1000);
        break;
      case '3y':
        startDate = new Date(now.getTime() - 1095 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    // Buscar configurações de taxas
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

    // Buscar dados de histórico com método de pagamento
    const historyData = await prisma.history.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: now
        }
      },
      select: {
        totalValue: true,
        paymentMethod: true,
        installments: true,
        feeRate: true,
        feeAmount: true,
        netAmount: true,
        createdAt: true
      }
    });

    // Agrupar dados por método de pagamento
    const paymentMethodsMap = new Map();
    let totalGrossRevenue = 0;
    let totalFees = 0;
    let totalNetRevenue = 0;

    // Nomes amigáveis para os métodos
    const methodNames = {
      'cash': 'Dinheiro',
      'pix': 'PIX',
      'debit_card': 'Cartão de Débito',
      'credit_card': 'Cartão de Crédito'
    };

    historyData.forEach(record => {
      const method = record.paymentMethod || 'cash';
      const revenue = record.totalValue || 0;
      const installments = record.installments || 1;
      
      // Calcular taxa correta baseada no método e parcelas
      let feeRate = 0;
      switch (method) {
        case 'credit_card':
          if (installments === 1) {
            feeRate = settings.creditCardFee;
          } else if (installments === 2) {
            feeRate = settings.creditCardFee2x;
          } else {
            feeRate = settings.creditCardFee3x;
          }
          break;
        case 'debit_card':
          feeRate = settings.debitCardFee;
          break;
        case 'pix':
          feeRate = settings.pixFee;
          break;
        case 'cash':
        default:
          feeRate = settings.cashFee;
          break;
      }
      
      const feeAmount = revenue * feeRate;
      const netAmount = revenue - feeAmount;

      totalGrossRevenue += revenue;
      totalFees += feeAmount;
      totalNetRevenue += netAmount;

      if (!paymentMethodsMap.has(method)) {
        paymentMethodsMap.set(method, {
          method,
          methodName: methodNames[method as keyof typeof methodNames] || method,
          totalRevenue: 0,
          feeAmount: 0,
          netRevenue: 0,
          transactionCount: 0,
          transactions: []
        });
      }

      const methodData = paymentMethodsMap.get(method);
      methodData.totalRevenue += revenue;
      methodData.feeAmount += feeAmount;
      methodData.netRevenue += netAmount;
      methodData.transactionCount += 1;
      methodData.transactions.push(revenue);
    });

    // Converter para array e calcular ticket médio
    const paymentMethods = Array.from(paymentMethodsMap.values()).map(method => ({
      ...method,
      averageTicket: method.transactionCount > 0 
        ? method.totalRevenue / method.transactionCount 
        : 0,
      transactions: undefined // Remover array de transações do resultado final
    }));

    // Ordenar por receita total (maior para menor)
    paymentMethods.sort((a, b) => b.totalRevenue - a.totalRevenue);

    // Encontrar método mais usado (por número de transações)
    const mostUsedMethod = paymentMethods.reduce((prev, current) => 
      (prev.transactionCount > current.transactionCount) ? prev : current
    )?.methodName || 'N/A';

    // Encontrar método com maior receita
    const highestRevenueMethod = paymentMethods[0]?.methodName || 'N/A';

    const paymentMetricsData = {
      paymentMethods,
      totalGrossRevenue,
      totalFees,
      totalNetRevenue,
      mostUsedMethod,
      highestRevenueMethod
    };

    return NextResponse.json(paymentMetricsData);
  } catch (error) {
    console.error('Erro ao buscar métricas de pagamento:', error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}