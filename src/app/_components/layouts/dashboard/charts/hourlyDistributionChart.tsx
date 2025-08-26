"use client";

import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Clock, TrendingUp, Info, X } from "lucide-react";
import { PeriodFilter } from "../index";
import { API_URL } from "@/lib/utils";
import { Spinner } from "@/app/_components/spinner";

interface HourlyData {
  hour: string;
  services: number;
  revenue: number;
}

interface HourlyDistributionChartProps {
  period: PeriodFilter;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0
  }).format(value);
};

const formatAxisLabel = (value: string, period: PeriodFilter) => {
  if (period === '1d' || period === 'today') {
    // Para período de hoje, mostra apenas a hora
    return `${value}:00`;
  } else {
    // Para períodos de 7 dias ou mais, tenta interpretar como data
    // Para evitar problemas de fuso horário, adicionar UTC
    const isoString = value.includes('T') ? value : `${value}T00:00:00Z`;
    const date = new Date(isoString);
    
    if (!isNaN(date.getTime())) {
      if (['7d', '14d', '30d'].includes(period)) {
        return date.toLocaleDateString('pt-BR', { 
          day: '2-digit', 
          month: '2-digit',
          timeZone: 'America/Sao_Paulo'
        });
      } else {
        return date.toLocaleDateString('pt-BR', { 
          month: 'short', 
          year: '2-digit',
          timeZone: 'America/Sao_Paulo'
        });
      }
    }
    // Fallback para formato de hora se não for uma data válida
    return `${value}:00`;
  }
};

export const HourlyDistributionChart = ({ period }: HourlyDistributionChartProps) => {
  const [data, setData] = useState<HourlyData[]>([]);
  const [loading, setLoading] = useState(true);
  const [peakHour, setPeakHour] = useState<string>('');
  const [peakServices, setPeakServices] = useState<number>(0);
  const [showExplanation, setShowExplanation] = useState(false);

  useEffect(() => {
    const fetchHourlyData = async () => {
      try {
        setLoading(true);
        
        const response = await fetch(`/api/dashboard/hourly?period=${period}`, {
          credentials: 'include'
        });
        const result = await response.json();
        
        if (result.success) {
          setData(result.data);
          setPeakHour(result.summary.peakHour);
          setPeakServices(result.summary.peakServices);
        } else {
          console.error('Erro na API:', result.error);
        }
      } catch (error) {
        console.error('Erro ao buscar dados horários:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchHourlyData();
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
        <div className="bg-zinc-800 border border-zinc-600 rounded-lg p-3 shadow-lg">
          <p className="text-white font-semibold mb-2">{label}:00</p>
          <p className="text-orange-400 text-sm">Serviços: {data.services}</p>
          <p className="text-green-400 text-sm">Receita: {formatCurrency(data.revenue)}</p>
        </div>
      );
    }
    return null;
  };

  const getBarColor = (services: number) => {
    const maxServices = Math.max(...data.map(d => d.services));
    const intensity = services / maxServices;
    
    if (intensity > 0.8) return '#f97316'; // orange-500 - pico
    if (intensity > 0.6) return '#fb923c'; // orange-400
    if (intensity > 0.4) return '#fdba74'; // orange-300
    if (intensity > 0.2) return '#fed7aa'; // orange-200
    return '#ffedd5'; // orange-100
  };

  return (
    <div className="bg-zinc-800 rounded-xl p-6 border border-zinc-700 w-full h-full min-h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-yellow-500/10 rounded-lg">
            <Clock size={24} className="text-yellow-500" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">
              {period === '1d' ? 'Distribuição Horária' : 'Distribuição por Período'}
            </h3>
            <p className="text-zinc-400 text-sm">
              {period === '1d' ? 'Movimento por horário do dia' : 'Movimento por dia no período selecionado'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowExplanation(!showExplanation)}
            className="p-2 bg-zinc-700 hover:bg-zinc-600 rounded-lg transition-colors"
            title="Como interpretar este gráfico"
          >
            <Info size={20} className="text-zinc-300" />
          </button>
        </div>
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
            <p>• <span className="text-orange-400 font-medium">Barras coloridas:</span> Altura representa a quantidade de serviços por hora</p>
            <p>• <span className="text-yellow-400 font-medium">Cores mais intensas:</span> Indicam horários de maior movimento (picos)</p>
            <p>• <span className="text-green-400 font-medium">Padrões:</span> Identifique os horários de maior e menor demanda</p>
            <p>• <span className="text-purple-400 font-medium">Tooltip:</span> Passe o mouse sobre as barras para ver serviços e receita por hora</p>
          </div>
        </div>
      )}

      {/* Peak Hour Info */}
      {data.length > 0 && (
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp size={16} className="text-orange-500" />
            <span className="text-orange-500 text-sm font-medium">Pico: {peakHour}:00</span>
          </div>
          <p className="text-zinc-400 text-xs">{peakServices} serviços</p>
        </div>
      )}

      {/* Chart */}
      <div className="flex-1 min-h-80 w-full">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Spinner />
          </div>
        ) : data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%" minHeight={320}>
            <BarChart data={data} margin={{ top: 20, right: 10, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis 
                dataKey="hour" 
                stroke="#9ca3af"
                fontSize={12}
                tickFormatter={(value) => formatAxisLabel(value, period)}
              />
              <YAxis 
                stroke="#9ca3af"
                fontSize={12}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar 
                dataKey="services" 
                radius={[4, 4, 0, 0] as [number, number, number, number]}
                name="Serviços"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${entry.hour}-${index}`} fill={getBarColor(entry.services)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-zinc-400">Nenhum dado disponível para o período selecionado</p>
          </div>
        )}
      </div>

      {/* Insights */}
      {data.length > 0 && (
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-zinc-700/50 rounded-lg p-3 text-center">
            <p className="text-zinc-400 text-xs">
              {period === '1d' ? 'Horário Mais Movimentado' : 'Dia Mais Movimentado'}
            </p>
            <p className="text-orange-500 text-lg font-bold">
              {period === '1d' ? `${peakHour}:00` : new Date(peakHour).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
            </p>
          </div>
          <div className="bg-zinc-700/50 rounded-lg p-3 text-center">
            <p className="text-zinc-400 text-xs">
              {period === '1d' ? 'Média por Hora' : 'Média por Dia'}
            </p>
            <p className="text-white text-lg font-bold">
              {Math.round(data.reduce((acc, hour) => acc + hour.services, 0) / data.length)}
            </p>
          </div>
          <div className="bg-zinc-700/50 rounded-lg p-3 text-center">
            <p className="text-zinc-400 text-xs">
              {period === '1d' ? 'Total de Horas Ativas' : 'Total de Dias Ativos'}
            </p>
            <p className="text-white text-lg font-bold">
              {data.filter(hour => hour.services > 0).length}{period === '1d' ? 'h' : 'd'}
            </p>
          </div>
        </div>
      )}

      {/* Color Legend */}
      <div className="mt-4 flex items-center justify-center gap-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-orange-100 rounded" />
          <span className="text-zinc-400 text-xs">Baixo</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-orange-300 rounded" />
          <span className="text-zinc-400 text-xs">Médio</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-orange-500 rounded" />
          <span className="text-zinc-400 text-xs">Alto</span>
        </div>
      </div>
    </div>
  );
};