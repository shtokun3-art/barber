"use client";

import { useEffect, useState } from "react";
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell } from "recharts";
import { Calendar, TrendingUp, TrendingDown, Info, X } from "lucide-react";
import { PeriodFilter } from "../index";
import { API_URL } from "@/lib/utils";
import { Spinner } from "@/app/_components/spinner";

interface MonthlyData {
  month: string;
  revenue: number;
  services: number;
  clients: number;
  averageTicket: number;
  growth: number;
}

interface MonthlyComparisonChartProps {
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
  // Para evitar problemas de fuso horário, vamos tratar as datas como UTC
  let date: Date;
  
  if (period === '1d' || period === 'today') {
    // Para período diário, a string vem no formato YYYY-MM-DDTHH
    // Adicionar :00:00Z para garantir que seja tratada como UTC
    const isoString = dateStr.includes('T') ? `${dateStr}:00:00Z` : `${dateStr}T00:00:00Z`;
    date = new Date(isoString);
    const hour = date.getUTCHours();
     return `${hour.toString().padStart(2, '0')}:00`;
  } else if (period === '7d' || period === '14d' || period === '30d') {
    // Para períodos de dias, a string vem no formato YYYY-MM-DD
    // Adicionar T00:00:00Z para garantir que seja tratada como UTC
    const isoString = dateStr.includes('T') ? dateStr : `${dateStr}T00:00:00Z`;
    date = new Date(isoString);
    return date.toLocaleDateString('pt-BR', { 
      day: '2-digit', 
      month: '2-digit',
      timeZone: 'America/Sao_Paulo'
    });
  } else {
    // Para períodos maiores, usar o formato original
    date = new Date(dateStr + 'T00:00:00Z');
    return date.toLocaleDateString('pt-BR', { 
      month: 'short', 
      year: '2-digit',
      timeZone: 'America/Sao_Paulo'
    });
  }
};

const getChartTitle = (period: PeriodFilter) => {
  if (period === '1d' || period === 'today') {
    return 'Comparação por Hora';
  } else if (period === '7d' || period === '14d' || period === '30d') {
    return 'Comparação Diária';
  } else {
    return 'Comparação Mensal';
  }
};

const getChartDescription = (period: PeriodFilter) => {
  if (period === '1d' || period === 'today') {
    return 'Evolução de receita e serviços por hora';
  } else if (period === '7d' || period === '14d' || period === '30d') {
    return 'Evolução de receita e serviços por dia';
  } else {
    return 'Evolução de receita e serviços por mês';
  }
};

const getBestPeriodLabel = (period: PeriodFilter) => {
  if (period === '1d' || period === 'today') {
    return 'Melhor Hora';
  } else if (period === '7d' || period === '14d' || period === '30d') {
    return 'Melhor Dia';
  } else {
    return 'Melhor Mês';
  }
};

export const MonthlyComparisonChart = ({ period }: MonthlyComparisonChartProps) => {
  const [data, setData] = useState<MonthlyData[]>([]);
  const [loading, setLoading] = useState(true);
  const [bestMonth, setBestMonth] = useState<string>('');
  const [bestRevenue, setBestRevenue] = useState<number>(0);
  const [overallGrowth, setOverallGrowth] = useState<number>(0);
  const [showExplanation, setShowExplanation] = useState(false);

  useEffect(() => {
    const fetchMonthlyData = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${window.location.origin}/api/dashboard/monthly?period=${period}`);
        if (response.ok) {
          const result = await response.json();
          setData(result.data || []);
          setBestMonth(result.bestMonth || '');
          setBestRevenue(result.bestRevenue || 0);
          setOverallGrowth(result.overallGrowth || 0);
        }
      } catch (error) {
        console.error('Erro ao buscar dados mensais:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMonthlyData();
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
      const data = payload[0].payload;
      return (
        <div className="bg-zinc-800 border border-zinc-600 rounded-lg p-4 shadow-lg">
          <p className="text-white font-semibold mb-3">{formatDate(label || '', period)}</p>
          <div className="space-y-1">
            <p className="text-green-400 text-sm">Receita: {formatCurrency(data.revenue)}</p>
            <p className="text-orange-400 text-sm">Serviços: {data.services}</p>
            <p className="text-blue-400 text-sm">Clientes: {data.clients}</p>
            <p className="text-purple-400 text-sm">Ticket Médio: {formatCurrency(data.averageTicket)}</p>
            <p className={`text-sm ${
              data.growth >= 0 ? 'text-green-400' : 'text-red-400'
            }`}>
              Crescimento: {data.growth > 0 ? '+' : ''}{data.growth.toFixed(1)}%
            </p>
          </div>
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
          <div className="p-3 bg-cyan-500/10 rounded-lg">
            <Calendar size={24} className="text-cyan-500" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">{getChartTitle(period)}</h3>
            <p className="text-zinc-400 text-sm">{getChartDescription(period)}</p>
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
            <p>• <span className="text-green-400 font-medium">Barras verdes:</span> Representam a receita mensal em valores monetários</p>
            <p>• <span className="text-orange-400 font-medium">Linha laranja:</span> Mostra a quantidade de serviços realizados por mês</p>
            <p>• <span className="text-blue-400 font-medium">Comparação:</span> Permite identificar tendências e sazonalidades</p>
            <p>• <span className="text-purple-400 font-medium">Tooltip:</span> Passe o mouse sobre os pontos para ver todos os detalhes do mês</p>
          </div>
        </div>
      )}

      {/* Performance Summary */}
      {data.length > 0 && (
        <div className="mt-4 flex items-center justify-between">
          <div className="text-left">
            {bestMonth && (
              <div className="mb-2">
                <p className="text-cyan-500 text-sm font-medium">{getBestPeriodLabel(period)}: {formatDate(bestMonth, period)}</p>
                <p className="text-zinc-400 text-xs">{formatCurrency(bestRevenue)}</p>
              </div>
            )}
          </div>
          <div className="text-right">
            <div className="flex items-center gap-1 justify-end">
              {overallGrowth >= 0 ? (
                <TrendingUp size={16} className="text-green-500" />
              ) : (
                <TrendingDown size={16} className="text-red-500" />
              )}
              <span className={`text-sm font-medium ${
                overallGrowth >= 0 ? 'text-green-500' : 'text-red-500'
              }`}>
                {overallGrowth > 0 ? '+' : ''}{overallGrowth.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Chart */}
      <div className="flex-1 min-h-96">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Spinner />
          </div>
        ) : data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis 
                dataKey="month" 
                stroke="#9ca3af"
                fontSize={12}
                tickFormatter={(value) => formatDate(value, period)}
              />
              <YAxis 
                yAxisId="left"
                stroke="#9ca3af"
                fontSize={12}
                tickFormatter={(value) => formatCurrency(value)}
              />
              <YAxis 
                yAxisId="right"
                orientation="right"
                stroke="#9ca3af"
                fontSize={12}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                wrapperStyle={{ color: '#9ca3af', fontSize: '12px' }}
              />
              <Bar 
                yAxisId="left"
                dataKey="revenue" 
                radius={[4, 4, 0, 0]}
                name="Receita (R$)"
                opacity={0.8}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${entry.month}-${entry.revenue}-${index}`} fill="#10b981" />
                ))}
              </Bar>
              <Line 
                yAxisId="right"
                type="monotone" 
                dataKey="services" 
                stroke="#f97316" 
                strokeWidth={3}
                dot={{ fill: '#f97316', strokeWidth: 2, r: 5 }}
                activeDot={{ r: 7, stroke: '#f97316', strokeWidth: 2 }}
                name="Serviços"
              />
              <Line 
                yAxisId="right"
                type="monotone" 
                dataKey="clients" 
                stroke="#3b82f6" 
                strokeWidth={3}
                dot={{ fill: '#3b82f6', strokeWidth: 2, r: 5 }}
                activeDot={{ r: 7, stroke: '#3b82f6', strokeWidth: 2 }}
                name="Clientes"
              />
            </ComposedChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-zinc-400">Nenhum dado disponível para o período selecionado</p>
          </div>
        )}
      </div>

      {/* Summary Stats */}
      {data.length > 0 && (
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="bg-zinc-700/50 rounded-lg p-3 text-center">
            <p className="text-zinc-400 text-xs">Receita Total</p>
            <p className="text-green-500 text-lg font-bold">
              {formatCurrency(data.reduce((acc, month) => acc + month.revenue, 0))}
            </p>
          </div>
          <div className="bg-zinc-700/50 rounded-lg p-3 text-center">
            <p className="text-zinc-400 text-xs">Total de Serviços</p>
            <p className="text-orange-500 text-lg font-bold">
              {data.reduce((acc, month) => acc + month.services, 0)}
            </p>
          </div>
          <div className="bg-zinc-700/50 rounded-lg p-3 text-center">
            <p className="text-zinc-400 text-xs">Total de Clientes</p>
            <p className="text-blue-500 text-lg font-bold">
              {data.reduce((acc, month) => acc + month.clients, 0)}
            </p>
          </div>
          <div className="bg-zinc-700/50 rounded-lg p-3 text-center">
            <p className="text-zinc-400 text-xs">Ticket Médio Geral</p>
            <p className="text-purple-500 text-lg font-bold">
              {formatCurrency(
                data.reduce((acc, month) => acc + month.averageTicket, 0) / data.length
              )}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};