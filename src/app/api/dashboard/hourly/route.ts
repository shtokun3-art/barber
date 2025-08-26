import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '30d';
    
    // Calcular data de início baseada no período
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    let startDate = new Date();
    
    switch (period) {
      case '1d':
      case 'today':
        startDate = startOfDay;
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
      }
    });

    let chartData;
    let peakHour;
    
    if (period === '1d' || period === 'today') {
      // Para período de hoje, agrupar por hora (0-23)
      const hourlyStats = new Array(24).fill(0).map((_, hour) => ({
        hour: hour.toString().padStart(2, '0'),
        services: 0,
        revenue: 0,
        clients: new Set()
      }));

      historyData.forEach(history => {
        const hour = new Date(history.createdAt).getHours();
        hourlyStats[hour].services += history.services.length;
        hourlyStats[hour].revenue += history.totalValue;
        hourlyStats[hour].clients.add(history.userId);
      });

      // Converter sets para números
      chartData = hourlyStats.map(stat => ({
        hour: stat.hour,
        services: stat.services,
        revenue: Math.round(stat.revenue * 100) / 100,
        clients: stat.clients.size
      }));
      
      // Encontrar horário de pico
      peakHour = chartData.reduce((peak, current) => 
        current.services > peak.services ? current : peak
      );
    } else {
      // Para períodos maiores, agrupar por dia
      const dailyStats = new Map();
      
      historyData.forEach(history => {
        const date = new Date(history.createdAt);
        const dateKey = date.toISOString().split('T')[0]; // YYYY-MM-DD
        
        if (!dailyStats.has(dateKey)) {
          dailyStats.set(dateKey, {
            hour: dateKey,
            services: 0,
            revenue: 0,
            clients: new Set()
          });
        }
        
        const stat = dailyStats.get(dateKey);
        stat.services += history.services.length;
        stat.revenue += history.totalValue;
        stat.clients.add(history.userId);
      });
      
      // Converter para array
      chartData = Array.from(dailyStats.values()).map(stat => ({
        hour: stat.hour,
        services: stat.services,
        revenue: Math.round(stat.revenue * 100) / 100,
        clients: stat.clients.size
      })).sort((a, b) => a.hour.localeCompare(b.hour));
      
      // Encontrar dia de pico
      peakHour = chartData.reduce((peak, current) => 
        current.services > peak.services ? current : peak, { hour: '', services: 0 }
      );
    }

    // Calcular estatísticas
    const totalServices = chartData.reduce((sum, hour) => sum + hour.services, 0);
    const activeHours = chartData.filter(hour => hour.services > 0).length;
    const averageServicesPerHour = activeHours > 0 ? totalServices / activeHours : 0;

    // Horários/dias mais movimentados (top 3)
    const topHours = [...chartData]
      .sort((a, b) => b.services - a.services)
      .slice(0, 3)
      .filter(hour => hour.services > 0);

    return NextResponse.json({
      success: true,
      data: chartData,
      summary: {
        peakHour: peakHour.hour,
        peakServices: peakHour.services,
        totalServices,
        activeHours,
        averageServicesPerHour: Math.round(averageServicesPerHour * 100) / 100,
        topHours: topHours.map(h => ({
          hour: h.hour,
          services: h.services
        }))
      }
    });
  } catch (error) {
    console.error('Erro ao buscar dados horários:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}