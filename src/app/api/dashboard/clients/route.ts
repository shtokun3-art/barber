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

    // Buscar histórico no período
    const historyData = await prisma.history.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: now
        }
      },
      include: {
        user: true
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    // Buscar primeiro atendimento de cada cliente para identificar novos vs recorrentes
    const allUsers = await prisma.user.findMany({
      include: {
        history: {
          orderBy: {
            createdAt: 'asc'
          },
          take: 1
        }
      }
    });

    const firstVisitMap = new Map();
    allUsers.forEach(user => {
      if (user.history.length > 0) {
        firstVisitMap.set(user.id, user.history[0].createdAt);
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
          newClients: new Set(),
          returningClients: new Set(),
          totalClients: new Set()
        });
      }
      
      const group = groupedData.get(key);
      const firstVisit = firstVisitMap.get(history.userId);
      
      // Verificar se é cliente novo (primeira visita no período atual)
      if (firstVisit && firstVisit >= startDate && firstVisit <= now) {
        // Verificar se a primeira visita foi neste período específico
        const firstVisitKey = groupBy === 'hour' 
          ? firstVisit.toISOString().slice(0, 13)
          : groupBy === 'day'
          ? firstVisit.toISOString().slice(0, 10)
          : groupBy === 'week'
          ? (() => {
              const weekStart = new Date(firstVisit);
              weekStart.setDate(firstVisit.getDate() - firstVisit.getDay());
              return weekStart.toISOString().slice(0, 10);
            })()
          : firstVisit.toISOString().slice(0, 7); // month
            
        if (firstVisitKey === key) {
          group.newClients.add(history.userId);
        } else {
          group.returningClients.add(history.userId);
        }
      } else {
        group.returningClients.add(history.userId);
      }
      
      group.totalClients.add(history.userId);
    });

    // Converter para array e formatar
    const chartData = Array.from(groupedData.values()).map(item => ({
      date: item.date,
      newClients: item.newClients.size,
      returningClients: item.returningClients.size,
      total: item.totalClients.size
    }));

    // Calcular totais
    const totalNewClients = new Set();
    const totalReturningClients = new Set();
    const allClients = new Set();
    
    historyData.forEach(history => {
      const firstVisit = firstVisitMap.get(history.userId);
      allClients.add(history.userId);
      
      if (firstVisit && firstVisit >= startDate && firstVisit <= now) {
        totalNewClients.add(history.userId);
      } else {
        totalReturningClients.add(history.userId);
      }
    });

    return NextResponse.json({
      success: true,
      data: chartData,
      summary: {
        totalClients: allClients.size,
        totalNewClients: totalNewClients.size,
        totalReturningClients: totalReturningClients.size,
        newClientPercentage: allClients.size > 0 ? (totalNewClients.size / allClients.size) * 100 : 0
      }
    });
  } catch (error) {
    console.error('Erro ao buscar dados de clientes:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}