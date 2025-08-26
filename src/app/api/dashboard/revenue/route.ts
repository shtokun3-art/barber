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
    }

    // Buscar dados do histórico
    const historyData = await prisma.history.findMany({
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

    // Agrupar dados por período
    const groupedData = new Map();
    
    historyData.forEach(history => {
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

    // Converter para array e formatar
    const chartData = Array.from(groupedData.values()).map(item => ({
      date: item.date,
      revenue: Math.round(item.revenue * 100) / 100,
      services: item.services,
      clients: item.clients.size
    }));

    // Calcular totais e crescimento
    const totalRevenue = chartData.reduce((sum, item) => sum + item.revenue, 0);
    const totalServices = chartData.reduce((sum, item) => sum + item.services, 0);
    const totalClients = new Set();
    historyData.forEach(h => totalClients.add(h.userId));

    // Calcular crescimento (comparar primeira e última semana)
    let growthRate = 0;
    if (chartData.length >= 7) {
      const firstWeek = chartData.slice(0, 7);
      const lastWeek = chartData.slice(-7);
      
      const firstWeekRevenue = firstWeek.reduce((sum, item) => sum + item.revenue, 0) / firstWeek.length;
      const lastWeekRevenue = lastWeek.reduce((sum, item) => sum + item.revenue, 0) / lastWeek.length;
      
      if (firstWeekRevenue > 0) {
        growthRate = ((lastWeekRevenue - firstWeekRevenue) / firstWeekRevenue) * 100;
      }
    }

    return NextResponse.json({
      success: true,
      data: chartData,
      summary: {
        totalRevenue,
        totalServices,
        totalClients: totalClients.size,
        growthRate: Math.round(growthRate * 10) / 10
      }
    });
  } catch (error) {
    console.error('Erro ao buscar dados de receita:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}