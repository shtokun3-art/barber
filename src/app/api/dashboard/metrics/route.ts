import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/utils";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

function getDateRange(period: string) {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  switch (period) {
    case '1d':
    case 'today':
      return {
        start: startOfDay,
        end: new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000)
      };
    case '7d':
      return {
        start: new Date(startOfDay.getTime() - 7 * 24 * 60 * 60 * 1000),
        end: now
      };
    case '14d':
      return {
        start: new Date(startOfDay.getTime() - 14 * 24 * 60 * 60 * 1000),
        end: now
      };
    case '30d':
      return {
        start: new Date(startOfDay.getTime() - 30 * 24 * 60 * 60 * 1000),
        end: now
      };
    case '3m':
      return {
        start: new Date(startOfDay.getTime() - 90 * 24 * 60 * 60 * 1000),
        end: now
      };
    case '6m':
      return {
        start: new Date(startOfDay.getTime() - 180 * 24 * 60 * 60 * 1000),
        end: now
      };
    case '1y':
      return {
        start: new Date(startOfDay.getTime() - 365 * 24 * 60 * 60 * 1000),
        end: now
      };
    case '2y':
      return {
        start: new Date(startOfDay.getTime() - 730 * 24 * 60 * 60 * 1000),
        end: now
      };
    case '3y':
      return {
        start: new Date(startOfDay.getTime() - 1095 * 24 * 60 * 60 * 1000),
        end: now
      };
    default:
      return {
        start: new Date(startOfDay.getTime() - 30 * 24 * 60 * 60 * 1000),
        end: now
      };
  }
}

function formatDateForGrouping(date: Date, period: string): string {
  if (period === '1d' || period === 'today') {
    // Para período de hoje, agrupa por hora
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:00`;
  } else if (period === '7d' || period === '14d' || period === '30d') {
    // Para períodos de dias, agrupa por dia
    return date.toISOString().split('T')[0]; // YYYY-MM-DD
  } else {
    // Para períodos maiores, agrupa por mês
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`; // YYYY-MM
  }
}

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
    const { start, end } = getDateRange(period);

    // Buscar histórico de atendimentos no período
    const history = await prisma.history.findMany({
      where: {
        createdAt: {
          gte: start,
          lte: end
        }
      },
      include: {
        user: true,
        barber: true,
        services: {
          include: {
            service: true
          }
        },
        items: {
          include: {
            item: true
          }
        }
      }
    });

    // Buscar todos os usuários para análise de clientes
    const users = await prisma.user.findMany({
      where: {
        role: 'client'
      },
      include: {
        history: {
          where: {
            createdAt: {
              gte: start,
              lte: end
            }
          },
          include: {
            services: {
              include: {
                service: true
              }
            }
          }
        }
      }
    });

    // Buscar barbeiros
    const barbers = await prisma.barber.findMany({
      include: {
        history: {
          where: {
            createdAt: {
              gte: start,
              lte: end
            }
          },
          include: {
            services: {
              include: {
                service: true
              }
            }
          }
        }
      }
    });

    // Buscar serviços
    const services = await prisma.service.findMany();

    // 1. RECEITA & VENDAS
    
    // Receita diária/semanal/mensal
    const revenueByDate = new Map<string, number>();
    history.forEach(h => {
      const dateKey = formatDateForGrouping(h.createdAt, period);
      const current = revenueByDate.get(dateKey) || 0;
      revenueByDate.set(dateKey, current + h.totalValue);
    });
    
    const dailyRevenue = Array.from(revenueByDate.entries())
      .map(([date, revenue]) => ({ date, revenue }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Ticket médio
    const totalRevenue = history.reduce((sum, h) => sum + h.totalValue, 0);
    const averageTicket = history.length > 0 ? totalRevenue / history.length : 0;

    // Mix de vendas (serviços vs produtos/itens)
    const servicesRevenue = history.reduce((sum, h) => {
      const serviceTotal = h.services.reduce((serviceSum, hs) => serviceSum + (hs.service?.price || 0), 0);
      return sum + serviceTotal;
    }, 0);
    const productsRevenue = history.reduce((sum, h) => {
      const itemTotal = h.items.reduce((itemSum, hi) => itemSum + hi.totalPrice, 0);
      return sum + itemTotal;
    }, 0);
    
    const salesMix = {
      services: servicesRevenue,
      products: productsRevenue
    };

    // Top serviços por receita e volume
    const serviceStats = new Map<string, { revenue: number; volume: number }>();
    history.forEach(h => {
      h.services.forEach(hs => {
        if (hs.service) {
          const current = serviceStats.get(hs.service.name) || { revenue: 0, volume: 0 };
          serviceStats.set(hs.service.name, {
            revenue: current.revenue + hs.service.price,
            volume: current.volume + 1
          });
        }
      });
    });
    
    const topServices = Array.from(serviceStats.entries())
      .map(([name, stats]) => ({ name, ...stats }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    // Top produtos/itens
    const productStats = new Map<string, { revenue: number; volume: number }>();
    history.forEach(h => {
      h.items.forEach(hi => {
        if (hi.item) {
          const current = productStats.get(hi.item.item) || { revenue: 0, volume: 0 };
          productStats.set(hi.item.item, {
            revenue: current.revenue + hi.totalPrice,
            volume: current.volume + hi.quantity
          });
        }
      });
    });
    
    const topProducts = Array.from(productStats.entries())
      .map(([name, stats]) => ({ 
        name, 
        revenue: stats.revenue, 
        margin: 30 // Margem simulada
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    // 2. CLIENTES
    
    // Novos vs recorrentes
    const clientsWithVisitsInPeriod = users.filter(user => {
      return user.history.some(h => h.createdAt >= start && h.createdAt <= end);
    });
    
    const newClients = clientsWithVisitsInPeriod.filter(user => {
      const firstVisit = user.history.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())[0]?.createdAt;
      return firstVisit && firstVisit >= start && firstVisit <= end;
    }).length;
    
    const returningClients = clientsWithVisitsInPeriod.filter(user => {
      const firstVisit = user.history.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())[0]?.createdAt;
      return firstVisit && firstVisit < start;
    }).length;

    const newVsReturning = {
      new: newClients,
      returning: returningClients
    };

    // Frequência média (retornos em 90 dias)
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    const clientsWithVisits = await prisma.user.findMany({
      where: {
        role: 'client',
        history: {
          some: {
            createdAt: {
              gte: ninetyDaysAgo
            }
          }
        }
      },
      include: {
        history: {
          where: {
            createdAt: {
              gte: ninetyDaysAgo
            }
          }
        }
      }
    });
    
    const averageFrequency = clientsWithVisits.length > 0 
      ? clientsWithVisits.reduce((sum, user) => sum + user.history.length, 0) / clientsWithVisits.length
      : 0;

    // Retenção 30/60/90 dias
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);
    
    const totalClientsEver = await prisma.user.count({ where: { role: 'client' } });
    
    const clients30d = await prisma.user.count({
      where: {
        role: 'client',
        history: {
          some: {
            createdAt: {
              gte: thirtyDaysAgo
            }
          }
        }
      }
    });
    
    const clients60d = await prisma.user.count({
      where: {
        role: 'client',
        history: {
          some: {
            createdAt: {
              gte: sixtyDaysAgo
            }
          }
        }
      }
    });
    
    const clients90d = await prisma.user.count({
      where: {
        role: 'client',
        history: {
          some: {
            createdAt: {
              gte: ninetyDaysAgo
            }
          }
        }
      }
    });

    const retention = {
      "30d": totalClientsEver > 0 ? (clients30d / totalClientsEver) * 100 : 0,
      "60d": totalClientsEver > 0 ? (clients60d / totalClientsEver) * 100 : 0,
      "90d": totalClientsEver > 0 ? (clients90d / totalClientsEver) * 100 : 0
    };

    // % clientes que avaliaram no Google
    const totalUsers = await prisma.user.count({ where: { role: 'client' } });
    const usersWithGoogleRating = await prisma.user.count({
      where: {
        role: 'client',
        hasRatedOnGoogle: true
      }
    });
    
    const googleRatingPercentage = totalUsers > 0 ? (usersWithGoogleRating / totalUsers) * 100 : 0;

    // 3. OPERAÇÃO (BARBEIROS)
    
    // Receita por barbeiro
    const barberRevenue = barbers.map(barber => ({
      name: barber.name,
      revenue: barber.history.reduce((sum, h) => sum + h.totalValue, 0)
    })).sort((a, b) => b.revenue - a.revenue);

    // Atendimentos por barbeiro
    const barberServices = barbers.map(barber => ({
      name: barber.name,
      services: barber.history.length
    })).sort((a, b) => b.services - a.services);

    // Ticket médio por barbeiro
    const barberTicket = barbers.map(barber => {
      const revenue = barber.history.reduce((sum, h) => sum + h.totalValue, 0);
      const count = barber.history.length;
      return {
        name: barber.name,
        ticket: count > 0 ? revenue / count : 0
      };
    }).sort((a, b) => b.ticket - a.ticket);

    // Portfólio por barbeiro
    const barberPortfolio = barbers.map(barber => {
      const serviceCount = new Map<string, number>();
      barber.history.forEach(h => {
        h.services.forEach(hs => {
          if (hs.service) {
            const current = serviceCount.get(hs.service.name) || 0;
            serviceCount.set(hs.service.name, current + 1);
          }
        });
      });
      
      return {
        name: barber.name,
        services: Array.from(serviceCount.entries())
          .map(([service, count]) => ({ service, count }))
          .sort((a, b) => b.count - a.count)
      };
    });

    const metricsData = {
      // Receita & Vendas
      dailyRevenue,
      averageTicket,
      salesMix,
      topServices,
      topProducts,
      
      // Clientes
      newVsReturning,
      averageFrequency,
      retention,
      googleRatingPercentage,
      
      // Operação
      barberRevenue,
      barberServices,
      barberTicket,
      barberPortfolio
    };

    return NextResponse.json(metricsData);
  } catch (error) {
    console.error('Erro ao buscar métricas:', error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}