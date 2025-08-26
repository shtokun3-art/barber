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

    // Buscar dados do histórico por barbeiro
    const historyData = await prisma.history.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: now
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

    // Agrupar dados por barbeiro
    const barberStats = new Map();
    
    historyData.forEach(history => {
      const barberId = history.barberId;
      const barberName = history.barber.name;
      
      if (!barberStats.has(barberId)) {
        barberStats.set(barberId, {
          id: barberId,
          name: barberName,
          services: 0,
          revenue: 0,
          clients: new Set()
        });
      }
      
      const stats = barberStats.get(barberId);
      stats.services += history.services.length;
      stats.revenue += history.totalValue;
      stats.clients.add(history.userId);
    });

    // Converter para array e formatar
    const barbersData = Array.from(barberStats.values())
      .map(barber => ({
        id: barber.id,
        name: barber.name,
        services: barber.services,
        revenue: Math.round(barber.revenue * 100) / 100,
        clients: barber.clients.size,
        averageRevenue: barber.services > 0 ? Math.round((barber.revenue / barber.services) * 100) / 100 : 0
      }))
      .sort((a, b) => b.revenue - a.revenue); // Ordenar por receita

    // Buscar barbeiros que não tiveram atendimentos no período
    const activeBarberIds = new Set(barbersData.map(b => b.id));
    const allBarbers = await prisma.barber.findMany({
      where: {
        status: 'active'
      }
    });

    // Adicionar barbeiros sem atendimentos
    allBarbers.forEach(barber => {
      if (!activeBarberIds.has(barber.id)) {
        barbersData.push({
          id: barber.id,
          name: barber.name,
          services: 0,
          revenue: 0,
          clients: 0,
          averageRevenue: 0
        });
      }
    });

    // Calcular totais
    const totalServices = barbersData.reduce((sum, barber) => sum + barber.services, 0);
    const totalRevenue = barbersData.reduce((sum, barber) => sum + barber.revenue, 0);
    const totalClients = new Set();
    historyData.forEach(h => totalClients.add(h.userId));

    return NextResponse.json({
      success: true,
      data: barbersData,
      summary: {
        totalServices,
        totalRevenue,
        totalClients: totalClients.size,
        topBarber: barbersData[0]?.name || 'Nenhum barbeiro',
        activeBarbers: barbersData.filter(b => b.services > 0).length
      }
    });
  } catch (error) {
    console.error('Erro ao buscar dados dos barbeiros:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}