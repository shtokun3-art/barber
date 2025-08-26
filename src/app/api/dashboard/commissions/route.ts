import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/utils";
import { logger } from "@/lib/logger";

// Função para calcular datas baseadas no período
const getPeriodDates = (period: string) => {
  const now = new Date();
  const endDate = new Date(now);
  const startDate = new Date(now);

  switch (period) {
    case '1d':
    case 'today':
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
      break;
    case '7d':
      startDate.setDate(startDate.getDate() - 7);
      break;
    case '14d':
      startDate.setDate(startDate.getDate() - 14);
      break;
    case '30d':
      startDate.setDate(startDate.getDate() - 30);
      break;
    case '3m':
      startDate.setMonth(startDate.getMonth() - 3);
      break;
    case '6m':
      startDate.setMonth(startDate.getMonth() - 6);
      break;
    case '1y':
      startDate.setFullYear(startDate.getFullYear() - 1);
      break;
    case '2y':
      startDate.setFullYear(startDate.getFullYear() - 2);
      break;
    case '3y':
      startDate.setFullYear(startDate.getFullYear() - 3);
      break;
    default:
      startDate.setDate(startDate.getDate() - 30);
  }

  return { startDate, endDate };
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '30d';
    const customStartDate = searchParams.get('startDate');
    const customEndDate = searchParams.get('endDate');

    let start: Date, end: Date;

    // Se datas customizadas forem fornecidas, usar elas; caso contrário, usar o período
    if (customStartDate && customEndDate) {
      start = new Date(customStartDate);
      end = new Date(customEndDate);
    } else {
      const dates = getPeriodDates(period);
      start = dates.startDate;
      end = dates.endDate;
    }

    // Buscar taxa de comissão do banco de dados
    let settings = await prisma.settings.findFirst();
    
    if (!settings) {
      // Criar configuração padrão se não existir
      settings = await prisma.settings.create({
        data: {
          commissionRate: 0.15,
          creditCardFee: 0.035,
          debitCardFee: 0.025,
          cashFee: 0.0,
          pixFee: 0.0
        }
      });
    }
    
    const commissionRate = settings.commissionRate;

    // Buscar todos os barbeiros
    const barbeiros = await prisma.barber.findMany({
      where: {
        status: 'active'
      },
      select: {
        id: true,
        name: true
      }
    });

    // Buscar histórico de serviços no período
    const historicos = await prisma.history.findMany({
      where: {
        createdAt: {
          gte: start,
          lte: end
        }
      },
      include: {
        barber: true,
        services: {
          include: {
            service: true
          }
        }
      }
    });

    // Calcular comissões por barbeiro
    const commissionsData = barbeiros.map(barbeiro => {
      const historicoBarbeiro = historicos.filter(h => h.barberId === barbeiro.id);
      
      let totalServicos = 0;
      let totalComissao = 0;
      let quantidadeAtendimentos = historicoBarbeiro.length;

      historicoBarbeiro.forEach(historico => {
        // Calcular valor total dos serviços (excluindo itens)
        const valorServicos = historico.services.reduce((total, hs) => {
          return total + hs.service.price;
        }, 0);
        
        totalServicos += valorServicos;
        totalComissao += valorServicos * commissionRate;
      });

      return {
        barberId: barbeiro.id,
        barberName: barbeiro.name,
        commissionRate: commissionRate,
        totalServicos: Number(totalServicos.toFixed(2)),
        totalComissao: Number(totalComissao.toFixed(2)),
        quantidadeAtendimentos,
        comissaoMedia: quantidadeAtendimentos > 0 ? Number((totalComissao / quantidadeAtendimentos).toFixed(2)) : 0
      };
    });

    // Ordenar por total de comissão (maior para menor)
    commissionsData.sort((a, b) => b.totalComissao - a.totalComissao);

    // Calcular totais gerais
    const totals = {
      totalGeralServicos: Number(commissionsData.reduce((sum, b) => sum + b.totalServicos, 0).toFixed(2)),
      totalGeralComissoes: Number(commissionsData.reduce((sum, b) => sum + b.totalComissao, 0).toFixed(2)),
      totalAtendimentos: commissionsData.reduce((sum, b) => sum + b.quantidadeAtendimentos, 0),
      mediaComissaoPorAtendimento: 0
    };

    if (totals.totalAtendimentos > 0) {
      totals.mediaComissaoPorAtendimento = Number((totals.totalGeralComissoes / totals.totalAtendimentos).toFixed(2));
    }

    // Dados para o gráfico
    const chartData = commissionsData.map(barbeiro => ({
      name: barbeiro.barberName,
      comissao: barbeiro.totalComissao,
      atendimentos: barbeiro.quantidadeAtendimentos,
      rate: Math.round(barbeiro.commissionRate * 100)
    }));

    logger.info('Comissões calculadas', {
      component: 'dashboard-commissions',
      function: 'GET',
      period: { start, end },
      barbeirosCount: barbeiros.length,
      totalComissoes: totals.totalGeralComissoes
    });

    return NextResponse.json({
      success: true,
      data: {
        commissions: commissionsData,
        totals,
        chartData,
        period: {
          start: start.toISOString(),
          end: end.toISOString()
        }
      }
    });

  } catch (error) {
    logger.error('Erro ao calcular comissões', {
      component: 'dashboard-commissions',
      function: 'GET',
      error: error
    });

    return NextResponse.json(
      { 
        success: false,
        error: "Erro ao calcular comissões dos barbeiros" 
      },
      { status: 500 }
    );
  }
}