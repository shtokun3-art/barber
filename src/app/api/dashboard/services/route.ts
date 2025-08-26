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

    // Buscar dados dos serviços no histórico
    const historyServices = await prisma.historyService.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: now
        }
      },
      include: {
        service: true,
        history: true
      }
    });

    // Agrupar serviços por tipo
    const serviceStats = new Map();
    
    historyServices.forEach(historyService => {
      const serviceName = historyService.service.name;
      const servicePrice = historyService.service.price;
      
      if (!serviceStats.has(serviceName)) {
        serviceStats.set(serviceName, {
          name: serviceName,
          count: 0,
          revenue: 0,
          price: servicePrice
        });
      }
      
      const stats = serviceStats.get(serviceName);
      stats.count += 1;
      stats.revenue += servicePrice;
    });

    // Converter para array e calcular percentuais
    const totalServices = Array.from(serviceStats.values()).reduce((sum, service) => sum + service.count, 0);
    
    const servicesData = Array.from(serviceStats.values())
      .map(service => ({
        ...service,
        percentage: totalServices > 0 ? (service.count / totalServices) * 100 : 0,
        averagePrice: service.count > 0 ? service.revenue / service.count : 0
      }))
      .sort((a, b) => b.count - a.count) // Ordenar por quantidade
      .slice(0, 10); // Top 10 serviços

    // Adicionar cores para o gráfico
    const colors = [
      '#f97316', // orange-500
      '#3b82f6', // blue-500
      '#10b981', // green-500
      '#8b5cf6', // purple-500
      '#f59e0b', // yellow-500
      '#ef4444', // red-500
      '#06b6d4', // cyan-500
      '#84cc16', // lime-500
      '#f472b6', // pink-400
      '#6b7280'  // gray-500
    ];

    const servicesWithColors = servicesData.map((service, index) => ({
      ...service,
      color: colors[index % colors.length]
    }));

    return NextResponse.json({
      success: true,
      data: servicesWithColors,
      summary: {
        totalServices,
        topService: servicesWithColors[0]?.name || 'Nenhum serviço',
        totalRevenue: servicesData.reduce((sum, service) => sum + service.revenue, 0)
      }
    });
  } catch (error) {
    console.error('Erro ao buscar dados de serviços:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}