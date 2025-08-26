import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '30d';
    
    // Calcular data de início baseada no período
    const now = new Date();
    let startDate = new Date();
    let groupBy = 'day';
    
    switch (period) {
      case '1d':
      case 'today':
        startDate.setDate(now.getDate() - 1);
        groupBy = 'hour';
        break;
      case '7d':
        startDate.setDate(now.getDate() - 7);
        groupBy = 'day';
        break;
      case '14d':
        startDate.setDate(now.getDate() - 14);
        groupBy = 'day';
        break;
      case '30d':
        startDate.setDate(now.getDate() - 29); // 29 dias atrás + hoje = 30 dias
        groupBy = 'day';
        break;
      case '3m':
        startDate.setMonth(now.getMonth() - 3);
        groupBy = 'week';
        break;
      case '6m':
        startDate.setMonth(now.getMonth() - 6);
        groupBy = 'week';
        break;
      case '1y':
        startDate.setFullYear(now.getFullYear() - 1);
        groupBy = 'month';
        break;
      case '2y':
        startDate.setFullYear(now.getFullYear() - 2);
        groupBy = 'month';
        break;
      case '3y':
        startDate.setFullYear(now.getFullYear() - 3);
        groupBy = 'month';
        break;
      default:
        startDate.setDate(now.getDate() - 29); // 29 dias atrás + hoje = 30 dias
        groupBy = 'day';
    }

    // Buscar dados do período atual
    const currentPeriodData = await prisma.history.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: now
        }
      },
      include: {
        services: {
          include: {
            service: true
          }
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    // Calcular período anterior para comparação
    const periodDiff = now.getTime() - startDate.getTime();
    const previousStartDate = new Date(startDate.getTime() - periodDiff);
    const previousEndDate = new Date(startDate.getTime());

    const previousPeriodData = await prisma.history.findMany({
      where: {
        createdAt: {
          gte: previousStartDate,
          lt: previousEndDate
        }
      },
      include: {
        services: {
          include: {
            service: true
          }
        }
      }
    });

    // Agrupar dados por período
    const groupedData = new Map();
    
    currentPeriodData.forEach(history => {
      let key: string;
      const date = new Date(history.createdAt);
      
      if (groupBy === 'hour') {
        key = date.toISOString().slice(0, 13); // YYYY-MM-DDTHH
      } else if (groupBy === 'day') {
        key = date.toISOString().slice(0, 10); // YYYY-MM-DD
      } else if (groupBy === 'week') {
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        key = weekStart.toISOString().slice(0, 10);
      } else { // month
        key = date.toISOString().slice(0, 7); // YYYY-MM
      }
      
      if (!groupedData.has(key)) {
        groupedData.set(key, {
          date: key,
          revenue: 0,
          services: 0,
          clients: new Set()
        });
      }
      
      const group = groupedData.get(key);
      group.revenue += history.totalValue;
      group.services += history.services.length;
      group.clients.add(history.userId);
    });

    // Converter para array e calcular crescimento acumulado
    const chartData: Array<{
      date: string;
      revenue: number;
      services: number;
      clients: number;
      cumulativeRevenue: number;
      cumulativeServices: number;
      cumulativeClients: number;
    }> = [];
    let cumulativeRevenue = 0;
    let cumulativeServices = 0;
    let cumulativeClients = new Set();
    
    Array.from(groupedData.values())
      .sort((a, b) => a.date.localeCompare(b.date))
      .forEach(item => {
        cumulativeRevenue += item.revenue;
        cumulativeServices += item.services;
        item.clients.forEach((client: string) => cumulativeClients.add(client));
        
        chartData.push({
          date: item.date,
          revenue: Math.round(item.revenue * 100) / 100,
          services: item.services,
          clients: item.clients.size,
          cumulativeRevenue: Math.round(cumulativeRevenue * 100) / 100,
          cumulativeServices,
          cumulativeClients: cumulativeClients.size
        });
      });

    // Calcular totais dos períodos
    const currentTotal = {
      revenue: currentPeriodData.reduce((sum, h) => sum + h.totalValue, 0),
      services: currentPeriodData.reduce((sum, h) => sum + h.services.length, 0),
      clients: new Set(currentPeriodData.map(h => h.userId)).size
    };

    const previousTotal = {
      revenue: previousPeriodData.reduce((sum, h) => sum + h.totalValue, 0),
      services: previousPeriodData.reduce((sum, h) => sum + h.services.length, 0),
      clients: new Set(previousPeriodData.map(h => h.userId)).size
    };

    // Calcular taxas de crescimento
    const revenueGrowth = previousTotal.revenue > 0 
      ? ((currentTotal.revenue - previousTotal.revenue) / previousTotal.revenue) * 100 
      : currentTotal.revenue > 0 ? 100 : 0;
      
    const servicesGrowth = previousTotal.services > 0 
      ? ((currentTotal.services - previousTotal.services) / previousTotal.services) * 100 
      : currentTotal.services > 0 ? 100 : 0;
      
    const clientsGrowth = previousTotal.clients > 0 
      ? ((currentTotal.clients - previousTotal.clients) / previousTotal.clients) * 100 
      : currentTotal.clients > 0 ? 100 : 0;

    // Calcular crescimento médio
    const averageGrowth = (revenueGrowth + servicesGrowth + clientsGrowth) / 3;

    // Projeção simples baseada na tendência atual
    const projectionMultiplier = period === '1d' ? 30 : period === '7d' ? 4 : period === '30d' ? 1 : 0.33;
    const projectedRevenue = currentTotal.revenue * projectionMultiplier;
    
    // Meta fictícia (pode ser configurável no futuro)
    const targetRevenue = projectedRevenue * 1.2; // Meta 20% acima da projeção
    const targetAchieved = targetRevenue > 0 ? (projectedRevenue / targetRevenue) * 100 : 0;

    return NextResponse.json({
      success: true,
      data: chartData,
      summary: {
        currentPeriod: currentTotal,
        previousPeriod: previousTotal,
        growth: {
          revenue: Math.round(revenueGrowth * 100) / 100,
          services: Math.round(servicesGrowth * 100) / 100,
          clients: Math.round(clientsGrowth * 100) / 100,
          average: Math.round(averageGrowth * 100) / 100
        },
        projection: {
          revenue: Math.round(projectedRevenue * 100) / 100,
          target: Math.round(targetRevenue * 100) / 100,
          achieved: Math.round(targetAchieved * 100) / 100
        }
      }
    });
  } catch (error) {
    console.error('Erro ao buscar dados de crescimento:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}