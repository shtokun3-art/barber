import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '1y';
    
    // Calcular data de início baseada no período
    const now = new Date();
    let startDate = new Date();
    let groupBy = 'month';
    
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
        startDate.setFullYear(now.getFullYear() - 1);
        groupBy = 'month';
    }

    // Buscar histórico no período
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

    // Converter para array e calcular crescimento
    const chartData = Array.from(groupedData.values())
      .map((item, index, array) => {
        const previousItem = index > 0 ? array[index - 1] : null;
        const growth = previousItem && previousItem.revenue > 0 
          ? ((item.revenue - previousItem.revenue) / previousItem.revenue) * 100 
          : 0;
        
        const averageTicket = item.services > 0 ? item.revenue / item.services : 0;
        
        return {
          month: item.date,
          revenue: Math.round(item.revenue * 100) / 100,
          services: item.services,
          clients: item.clients.size,
          averageTicket: Math.round(averageTicket * 100) / 100,
          growth: Math.round(growth * 100) / 100
        };
      })
      .sort((a, b) => a.month.localeCompare(b.month));

    // Encontrar melhor mês
    const bestMonth = chartData.reduce((best, current) => 
      current.revenue > best.revenue ? current : best, 
      { month: '', revenue: 0 }
    );

    // Calcular crescimento geral
    const firstMonth = chartData[0];
    const lastMonth = chartData[chartData.length - 1];
    const overallGrowth = firstMonth && lastMonth && firstMonth.revenue > 0
      ? ((lastMonth.revenue - firstMonth.revenue) / firstMonth.revenue) * 100
      : 0;

    return NextResponse.json({
      success: true,
      data: chartData,
      bestMonth: bestMonth.month,
      bestRevenue: bestMonth.revenue,
      overallGrowth: Math.round(overallGrowth * 100) / 100
    });
  } catch (error) {
    console.error('Erro ao buscar dados mensais:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}