"use client";

import { useEffect, useState } from "react";
import { DollarSign, Users, Scissors, TrendingUp, Clock, Calendar, Target, Award } from "lucide-react";
import { PeriodFilter } from "../index";
import { API_URL } from "@/lib/utils";
import { Spinner } from "@/app/_components/spinner";

interface DashboardData {
  totalRevenue: number;
  totalClients: number;
  totalServices: number;
  averageTicket: number;
  activeBarbers: number;
  growthRate: number;
  topBarber: string;
}

interface DashboardCardsProps {
  period: PeriodFilter;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

const formatNumber = (value: number) => {
  return new Intl.NumberFormat('pt-BR').format(value);
};

export const DashboardCards = ({ period }: DashboardCardsProps) => {
  const [cardsData, setCardsData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCards = async () => {
      try {
        setLoading(true);
        
        const response = await fetch(`/api/dashboard?period=${period}`);
        const data = await response.json();
        
        if (response.ok) {
          setCardsData({
            totalRevenue: data.totalRevenue || 0,
            totalClients: data.totalClients || 0,
            totalServices: data.totalServices || 0,
            averageTicket: data.averageTicket || 0,
            activeBarbers: data.activeBarbers || 0,
            growthRate: data.growthRate || 0,
            topBarber: data.topBarber || 'N/A'
          });
        } else {
          console.error('Erro na API:', data.error || 'Erro desconhecido');
        }
      } catch (error) {
        console.error('Erro ao buscar dados dos cards:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCards();
  }, [period]);

  if (loading) {
    return (
      <div className="responsive-grid mb-8">
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className="glass-card-dark rounded-xl p-6 flex items-center justify-center animate-modern-pulse">
            <Spinner />
          </div>
        ))}
      </div>
    );
  }

  if (!cardsData) {
    return (
      <div className="responsive-grid mb-8">
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className="glass-card-dark rounded-xl p-6">
            <p className="text-zinc-400 text-center">Erro ao carregar dados</p>
          </div>
        ))}
      </div>
    );
  }

  const cards = [
    {
      title: "Receita Total",
      value: formatCurrency(cardsData.totalRevenue),
      icon: DollarSign,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
      borderColor: "border-green-500/20"
    },
    {
      title: "Clientes Atendidos",
      value: formatNumber(cardsData.totalClients),
      icon: Users,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
      borderColor: "border-blue-500/20"
    },
    {
      title: "Serviços Realizados",
      value: formatNumber(cardsData.totalServices),
      icon: Scissors,
      color: "text-orange-500",
      bgColor: "bg-orange-500/10",
      borderColor: "border-orange-500/20"
    },
    {
      title: "Ticket Médio",
      value: formatCurrency(cardsData.averageTicket),
      icon: Target,
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
      borderColor: "border-purple-500/20"
    },
    {
      title: "Barbeiros Ativos",
      value: formatNumber(cardsData.activeBarbers),
      icon: Users,
      color: "text-yellow-500",
      bgColor: "bg-yellow-500/10",
      borderColor: "border-yellow-500/20"
    },
    {
      title: "Taxa de Crescimento",
      value: `${(cardsData.growthRate || 0) > 0 ? '+' : ''}${(cardsData.growthRate || 0).toFixed(1)}%`,
      icon: TrendingUp,
      color: (cardsData.growthRate || 0) >= 0 ? "text-green-500" : "text-red-500",
      bgColor: (cardsData.growthRate || 0) >= 0 ? "bg-green-500/10" : "bg-red-500/10",
      borderColor: (cardsData.growthRate || 0) >= 0 ? "border-green-500/20" : "border-red-500/20"
    }
  ];

  return (
    <div className="responsive-grid mb-8">
      {cards.map((card, index) => {
        const IconComponent = card.icon;
        return (
          <div
            key={index}
            className={`glass-card-dark rounded-xl p-6 border ${card.borderColor} card-hover smooth-transition group relative overflow-hidden`}
          >

            
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-lg ${card.bgColor} group-hover:scale-110 transition-transform duration-300 shadow-glow`}>
                  <IconComponent size={24} className={`${card.color} group-hover:drop-shadow-lg`} />
                </div>
                <div className="w-2 h-2 rounded-full bg-orange-500 opacity-50 group-hover:opacity-100 group-hover:shadow-glow transition-all duration-300" />
              </div>
              <div>
                <p className="text-zinc-400 text-sm font-medium mb-2 group-hover:text-zinc-300 transition-colors duration-300">{card.title}</p>
                <p className="text-white text-2xl font-bold group-hover:text-gradient-primary transition-all duration-300">{card.value}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};