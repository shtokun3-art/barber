"use client";

import { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from "recharts";
import { DollarSign, TrendingUp, TrendingDown, Info, X } from "lucide-react";
import { PeriodFilter } from "../index";
import { API_URL } from "@/lib/utils";
import { Spinner } from "@/app/_components/spinner";

interface RevenueData {
  date: string;
  revenue: number;
  services: number;
}

interface RevenueChartProps {
  period: PeriodFilter;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0
  }).format(value);
};

const formatDate = (dateStr: string, period: PeriodFilter) => {
  // Verificar se a string de data é válida
  if (!dateStr || dateStr === 'undefined' || dateStr === 'null') {
    return 'Data inválida';
  }
  
  try {
    let date: Date;
    
    if (period === '1d') {
      // Para período diário, a string vem no formato YYYY-MM-DDTHH
      if (dateStr.includes('T')) {
        const isoString = dateStr.endsWith('Z') ? dateStr : `${dateStr}:00:00Z`;
        date = new Date(isoString);
      } else {
        date = new Date(`${dateStr}T00:00:00Z`);
      }
      
      if (isNaN(date.getTime())) {
        return dateStr;
      }
      
      const hour = date.getUTCHours();
      return `${hour.toString().padStart(2, '0')}:00`;
    } else if (['7d', '14d', '30d'].includes(period)) {
      // Para períodos de dias, a string vem no formato YYYY-MM-DD
      const isoString = dateStr.includes('T') ? dateStr : `${dateStr}T12:00:00Z`;
      date = new Date(isoString);
      
      if (isNaN(date.getTime())) {
        return dateStr;
      }
      
      return date.toLocaleDateString('pt-BR', { 
        day: '2-digit', 
        month: '2-digit',
        timeZone: 'America/Sao_Paulo'
      });
    } else {
      // Para períodos maiores, usar o formato original
      const isoString = dateStr.includes('T') ? dateStr : `${dateStr}T12:00:00Z`;
      date = new Date(isoString);
      
      if (isNaN(date.getTime())) {
        return dateStr;
      }
      
      return date.toLocaleDateString('pt-BR', { 
        month: 'short', 
        year: '2-digit',
        timeZone: 'America/Sao_Paulo'
      });
    }
  } catch (error) {
    console.warn('Erro ao formatar data:', dateStr, error);
    return dateStr;
  }
};

export const RevenueChart = ({ period }: RevenueChartProps) => {
  const [data, setData] = useState<RevenueData[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [growthRate, setGrowthRate] = useState(0);
  const [showExplanation, setShowExplanation] = useState(false);

  useEffect(() => {
    const fetchRevenueData = async () => {
      try {
        setLoading(true);
        
        const response = await fetch(`/api/dashboard/revenue?period=${period}`);
        const result = await response.json();
        
        if (result.success) {
          setData(result.data);
          setTotalRevenue(result.summary.totalRevenue);
          setGrowthRate(result.summary.growthRate);
        } else {
          console.error('Erro na API:', result.error);
        }
      } catch (error) {
        console.error('Erro ao buscar dados de receita:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRevenueData();
  }, [period]);

  const CustomTooltip = ({ active, payload, label }: {
    active?: boolean;
    payload?: Array<{
      value: number;
      name: string;
      payload: any;
    }>;
    label?: string;
  }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-zinc-800 border border-zinc-600 rounded-lg p-3 shadow-lg">
          <p className="text-zinc-300 text-sm mb-2">{formatDate(label || '', period)}</p>
          <p className="text-green-400 font-semibold">
            Receita: {formatCurrency(payload[0].value)}
          </p>
          <p className="text-orange-400 text-sm">
            Serviços: {payload[0].payload.services}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-zinc-800 rounded-xl p-6 border border-zinc-700 w-full h-full min-h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-green-500/10 rounded-lg">
            <DollarSign size={24} className="text-green-500" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">Evolução da Receita</h3>
            <p className="text-zinc-400 text-sm">Receita ao longo do período selecionado</p>
          </div>
        </div>
        
        <button
          onClick={() => setShowExplanation(!showExplanation)}
          className="p-2 bg-zinc-700 hover:bg-zinc-600 rounded-lg transition-colors"
          title="Como interpretar este gráfico"
        >
          <Info size={20} className="text-zinc-300" />
        </button>
      </div>
      
      {/* Explanation Section */}
      {showExplanation && (
        <div className="mb-6 p-4 bg-zinc-700/50 border border-zinc-600 rounded-lg">
          <div className="flex items-start justify-between mb-3">
            <h4 className="text-lg font-semibold text-white">Como interpretar este gráfico</h4>
            <button
              onClick={() => setShowExplanation(false)}
              className="p-1 hover:bg-zinc-600 rounded transition-colors"
            >
              <X size={16} className="text-zinc-400" />
            </button>
          </div>
          <div className="space-y-2 text-sm text-zinc-300">
            <p>• <span className="text-green-400 font-medium">Linha verde:</span> Mostra a evolução da receita total ao longo do tempo</p>
            <p>• <span className="text-orange-400 font-medium">Pontos no gráfico:</span> Cada ponto representa a receita em uma data específica</p>
            <p>• <span className="text-blue-400 font-medium">Tendência:</span> Linhas ascendentes indicam crescimento, descendentes indicam queda</p>
            <p>• <span className="text-purple-400 font-medium">Tooltip:</span> Passe o mouse sobre os pontos para ver detalhes da receita e número de serviços</p>
          </div>
        </div>
      )}

      {/* Revenue Summary */}
      {data.length > 0 && (
        <div className="mt-4 text-right">
          <p className="text-2xl font-bold text-white">{formatCurrency(totalRevenue)}</p>
          <div className="flex items-center gap-1 justify-end">
            {growthRate >= 0 ? (
              <TrendingUp size={16} className="text-green-500" />
            ) : (
              <TrendingDown size={16} className="text-red-500" />
            )}
            <span className={`text-sm font-medium ${
              growthRate >= 0 ? 'text-green-500' : 'text-red-500'
            }`}>
              {growthRate > 0 ? '+' : ''}{growthRate.toFixed(1)}%
            </span>
          </div>
        </div>
      )}

      {/* Chart */}
      <div className="flex-1 min-h-80">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Spinner />
          </div>
        ) : data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis 
                dataKey="date" 
                stroke="#9ca3af"
                fontSize={12}
                tickFormatter={(value) => formatDate(value, period)}
              />
              <YAxis 
                stroke="#9ca3af"
                fontSize={12}
                tickFormatter={(value) => formatCurrency(value)}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#10b981"
                strokeWidth={3}
                fill="url(#revenueGradient)"
                dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: '#10b981', strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex flex-col items-center justify-center h-full gap-3">
            <div className="w-12 h-12 rounded-full bg-zinc-700/50 flex items-center justify-center">
              <svg className="w-6 h-6 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="text-center">
              <p className="text-zinc-300 font-medium mb-1">Sem dados de receita</p>
              <p className="text-zinc-500 text-sm">Nenhuma receita foi gerada no período selecionado</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};