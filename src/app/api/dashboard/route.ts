import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/utils';
import { cookies } from 'next/headers';
import { verifyJWTToken, JWTPayload } from '@/lib/jwt-utils';

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticação
    const cookieStore = cookies();
    const token = (await cookieStore).get("barberToken");

    if (!token) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    // Verificar e decodificar o token
    const decoded = verifyJWTToken(token.value) as JWTPayload;
    if (!decoded) {
      return NextResponse.json({ error: "Token inválido" }, { status: 401 });
    }

    if (!decoded || !decoded.id) {
      return NextResponse.json({ error: "Token inválido" }, { status: 401 });
    }
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '30d';
    
    // Calcular data de início baseada no período
    const now = new Date();
    let startDate = new Date();
    
    switch (period) {
      case '1d':
      case 'today':
        startDate.setDate(now.getDate() - 1);
        break;
      case '7d':
        startDate.setDate(now.getDate() - 7);
        break;
      case '14d':
        startDate.setDate(now.getDate() - 14);
        break;
      case '30d':
        startDate.setDate(now.getDate() - 29); // 29 dias atrás + hoje = 30 dias
        break;
      case '3m':
        startDate.setMonth(now.getMonth() - 3);
        break;
      case '6m':
        startDate.setMonth(now.getMonth() - 6);
        break;
      case '1y':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      case '2y':
        startDate.setFullYear(now.getFullYear() - 2);
        break;
      case '3y':
        startDate.setFullYear(now.getFullYear() - 3);
        break;
      default:
        startDate.setDate(now.getDate() - 29); // 29 dias atrás + hoje = 30 dias
    }

    // Buscar dados do histórico para o período
    const historyData = await prisma.history.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: now
        }
      },
      include: {
        user: true,
        barber: true,
        services: {
          include: {
            service: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Calcular métricas principais
    const totalRevenue = historyData.reduce((sum, history) => sum + history.totalValue, 0);
    const totalClients = new Set(historyData.map(h => h.userId)).size;
    const totalServices = historyData.reduce((sum, history) => sum + history.services.length, 0);
    const totalBarbers = await prisma.barber.count({ where: { status: 'active' } });

    // Calcular crescimento comparando com período anterior
    const previousStartDate = new Date(startDate);
    const periodDays = Math.ceil((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    previousStartDate.setDate(startDate.getDate() - periodDays);
    
    const previousHistoryData = await prisma.history.findMany({
      where: {
        createdAt: {
          gte: previousStartDate,
          lt: startDate
        }
      }
    });

    const previousRevenue = previousHistoryData.reduce((sum, history) => sum + history.totalValue, 0);
    const revenueGrowth = previousRevenue > 0 ? ((totalRevenue - previousRevenue) / previousRevenue) * 100 : 0;
    
    const previousClients = new Set(previousHistoryData.map(h => h.userId)).size;
    const clientsGrowth = previousClients > 0 ? ((totalClients - previousClients) / previousClients) * 100 : 0;

    // Calcular ticket médio
    const averageTicket = totalClients > 0 ? totalRevenue / totalClients : 0;

    // Buscar melhor barbeiro
    const barberStats = historyData.reduce((acc, history) => {
      const barberId = history.barberId;
      if (!acc[barberId]) {
        acc[barberId] = {
          name: history.barber.name,
          revenue: 0,
          services: 0
        };
      }
      acc[barberId].revenue += history.totalValue;
      acc[barberId].services += history.services.length;
      return acc;
    }, {} as Record<string, { name: string; revenue: number; services: number }>);

    const topBarber = Object.values(barberStats).reduce((top, current) => 
      current.revenue > top.revenue ? current : top, 
      { name: 'N/A', revenue: 0, services: 0 }
    );

    return NextResponse.json({
      totalRevenue,
      totalClients,
      totalServices,
      averageTicket,
      activeBarbers: totalBarbers,
      growthRate: revenueGrowth,
      topBarber: topBarber.name
    });
  } catch (error) {
    console.error('Erro ao buscar dados do dashboard:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}