"use client";

import { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { TrendingUp, Target, AlertTriangle } from "lucide-react";
import { PeriodFilter } from "../index";
import { API_URL } from "@/lib/utils";
import { Spinner } from "@/app/_components/spinner";

interface GrowthData {
  period: string;
  revenueGrowth: number;
  clientGrowth: number;
  serviceGrowth: number;
  target: number;
}

interface GrowthTrendChartProps {
  period: PeriodFilter;
}

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
    return 'Tendência de Crescimento por Hora';
  } else if (period === '7d' || period === '14d' || period === '30d') {
    return 'Tendência de Crescimento Diário';
  } else {
    return 'Tendência de Crescimento';
  }
};

const getChartDescription = (period: PeriodFilter) => {
  if (period === '1d' || period === 'today') {
    return 'Acompanhe como seu negócio está evoluindo por hora';
  } else if (period === '7d' || period === '14d' || period === '30d') {
    return 'Acompanhe como seu negócio está evoluindo diariamente';
  } else {
    return 'Acompanhe como seu negócio está evoluindo';
  }
};

export const GrowthTrendChart = ({ period }: GrowthTrendChartProps) => {
  const [data, setData] = useState<GrowthData[]>([]);
  const [loading, setLoading] = useState(true);
  const [averageGrowth, setAverageGrowth] = useState<number>(0);
  const [targetAchieved, setTargetAchieved] = useState<boolean>(false);
  const [growthTarget, setGrowthTarget] = useState<number>(10); // Meta de 10% por padrão
  const [showExplanation, setShowExplanation] = useState<boolean>(false);

  useEffect(() => {
    const fetchGrowthData = async () => {
      try {
        setLoading(true);
        
        const response = await fetch(`/api/dashboard/growth?period=${period}`);
        const result = await response.json();
        
        if (result.success) {
          setData(result.data);
          setAverageGrowth(result.summary.growth.average);
          setTargetAchieved(result.summary.projection.achieved);
        } else {
          console.error('Erro na API:', result.error);
        }
      } catch (error) {
        console.error('Erro ao buscar dados de crescimento:', error);
        setData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchGrowthData();
  }, [period, growthTarget]);

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
          <p className="text-zinc-300 text-sm mb-2">{formatDate(label || '', period)}</p>
          <div className="space-y-1">
            <p className="text-green-400 text-sm">
              Receita: {data.revenueGrowth > 0 ? '+' : ''}{data.revenueGrowth.toFixed(1)}%
            </p>
            <p className="text-blue-400 text-sm">
              Clientes: {data.clientGrowth > 0 ? '+' : ''}{data.clientGrowth.toFixed(1)}%
            </p>
            <p className="text-orange-400 text-sm">
              Serviços: {data.serviceGrowth > 0 ? '+' : ''}{data.serviceGrowth.toFixed(1)}%
            </p>
          </div>
          <div className="border-t border-zinc-600 mt-2 pt-2">
            <p className="text-zinc-300 text-xs">Meta: {data.target}%</p>
          </div>
        </div>
      );
    }
    return null;
  };

  const getGrowthStatus = () => {
    if (averageGrowth >= growthTarget) {
      return {
        icon: Target,
        color: 'text-green-500',
        bgColor: 'bg-green-500/10',
        message: 'Meta Atingida!'
      };
    } else if (averageGrowth >= growthTarget * 0.7) {
      return {
        icon: TrendingUp,
        color: 'text-yellow-500',
        bgColor: 'bg-yellow-500/10',
        message: 'Próximo da Meta'
      };
    } else {
      return {
        icon: AlertTriangle,
        color: 'text-red-500',
        bgColor: 'bg-red-500/10',
        message: 'Abaixo da Meta'
      };
    }
  };

  const status = getGrowthStatus();
  const StatusIcon = status.icon;

  return (
    <div className="bg-zinc-800 rounded-xl p-6 border border-zinc-700 w-full h-full min-h-full flex flex-col">
      {/* Header */}
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-500/10 rounded-lg">
              <TrendingUp size={24} className="text-purple-500" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">{getChartTitle(period)}</h3>
              <p className="text-zinc-400 text-sm">{getChartDescription(period)}</p>
            </div>
          </div>
          
          <div className="text-right">
            <div className={`flex items-center gap-2 justify-end mb-2 px-3 py-1 rounded-lg ${status.bgColor}`}>
              <StatusIcon size={16} className={status.color} />
              <span className={`text-sm font-medium ${status.color}`}>{status.message}</span>
            </div>
            <p className="text-zinc-400 text-xs">Crescimento médio: {averageGrowth.toFixed(1)}%</p>
          </div>
        </div>
        
        {/* Botão de informação */}
        <div className="flex justify-center">
          <button
            onClick={() => setShowExplanation(!showExplanation)}
            className="p-2 bg-purple-500/20 rounded-full hover:bg-purple-500/30 transition-colors duration-200"
            title="Como interpretar este gráfico"
          >
            <svg className="w-4 h-4 text-purple-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
        
        {/* Explicação do gráfico - colapsável */}
        {showExplanation && (
          <div className="bg-zinc-700/30 rounded-lg p-4 border-l-4 border-purple-500 relative">
            <button
              onClick={() => setShowExplanation(false)}
              className="absolute top-2 right-2 p-1 hover:bg-zinc-600/50 rounded transition-colors duration-200"
              title="Fechar"
            >
              <svg className="w-4 h-4 text-zinc-400 hover:text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
            <div className="flex items-start gap-3 pr-8">
              <div className="p-1 bg-purple-500/20 rounded">
                <svg className="w-4 h-4 text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-medium text-white mb-1">Como interpretar este gráfico:</h4>
                <p className="text-xs text-zinc-300 leading-relaxed">
                  Este gráfico mostra a <span className="text-purple-400 font-medium">taxa de crescimento percentual</span> de três indicadores principais do seu negócio. 
                  Valores <span className="text-green-400 font-medium">positivos</span> indicam crescimento, 
                  <span className="text-red-400 font-medium">negativos</span> indicam redução. 
                  A linha tracejada representa sua <span className="text-gray-400 font-medium">meta de crescimento</span>.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Chart */}
      <div className="flex-1 min-h-80">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Spinner />
          </div>
        ) : data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis 
                dataKey="period" 
                stroke="#9ca3af"
                fontSize={12}
                tickFormatter={(value) => formatDate(value, period)}
              />
              <YAxis 
                stroke="#9ca3af"
                fontSize={12}
                tickFormatter={(value) => `${value}%`}
              />
              <Tooltip content={<CustomTooltip />} />
              
              {/* Linha de referência para a meta */}
              <ReferenceLine 
                y={growthTarget} 
                stroke="#6b7280" 
                strokeDasharray="5 5" 
                label={{ value: `Meta: ${growthTarget}%`, position: 'top', fill: '#6b7280' }}
              />
              
              {/* Linha de referência para 0% */}
              <ReferenceLine 
                y={0} 
                stroke="#374151" 
                strokeWidth={2}
              />
              
              <Line
                type="monotone"
                dataKey="revenueGrowth"
                stroke="#10b981"
                strokeWidth={3}
                dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: '#10b981', strokeWidth: 2 }}
                name="Crescimento de Receita"
              />
              <Line
                type="monotone"
                dataKey="clientGrowth"
                stroke="#3b82f6"
                strokeWidth={3}
                dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: '#3b82f6', strokeWidth: 2 }}
                name="Crescimento de Clientes"
              />
              <Line
                type="monotone"
                dataKey="serviceGrowth"
                stroke="#f97316"
                strokeWidth={3}
                dot={{ fill: '#f97316', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: '#f97316', strokeWidth: 2 }}
                name="Crescimento de Serviços"
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-zinc-400">Nenhum dado disponível para o período selecionado</p>
          </div>
        )}
      </div>

      {/* Legend com explicações */}
      <div className="mt-4">
        <h4 className="text-sm font-medium text-white mb-3 text-center">Indicadores de Crescimento</h4>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-zinc-700/30 rounded-lg p-3 text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <div className="w-3 h-3 bg-green-500 rounded-full" />
              <span className="text-zinc-300 text-sm font-medium">Receita</span>
            </div>
            <p className="text-xs text-zinc-400">Faturamento total</p>
          </div>
          <div className="bg-zinc-700/30 rounded-lg p-3 text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <div className="w-3 h-3 bg-blue-500 rounded-full" />
              <span className="text-zinc-300 text-sm font-medium">Clientes</span>
            </div>
            <p className="text-xs text-zinc-400">Base de clientes</p>
          </div>
          <div className="bg-zinc-700/30 rounded-lg p-3 text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <div className="w-3 h-3 bg-orange-500 rounded-full" />
              <span className="text-zinc-300 text-sm font-medium">Serviços</span>
            </div>
            <p className="text-xs text-zinc-400">Volume de serviços</p>
          </div>
          <div className="bg-zinc-700/30 rounded-lg p-3 text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <div className="w-3 h-0.5 bg-gray-500 border-dashed" style={{ borderTop: '2px dashed #6b7280' }} />
              <span className="text-zinc-300 text-sm font-medium">Meta</span>
            </div>
            <p className="text-xs text-zinc-400">Objetivo: {growthTarget}%</p>
          </div>
        </div>
      </div>

      {/* Growth Insights */}
      {data.length > 0 && (
        <div className="mt-6">
          <h4 className="text-sm font-medium text-white mb-4 text-center">Resumo do Desempenho</h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-green-500/10 to-green-600/5 border border-green-500/20 rounded-lg p-4 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <p className="text-zinc-300 text-xs font-medium">Melhor Indicador</p>
              </div>
              <p className="text-green-400 text-xl font-bold mb-1">
                {Math.max(
                  data[data.length - 1]?.revenueGrowth || 0,
                  data[data.length - 1]?.clientGrowth || 0,
                  data[data.length - 1]?.serviceGrowth || 0
                ).toFixed(1)}%
              </p>
              <p className="text-zinc-400 text-xs">Último período</p>
            </div>
            
            <div className={`bg-gradient-to-br ${averageGrowth >= 0 ? 'from-blue-500/10 to-blue-600/5 border-blue-500/20' : 'from-red-500/10 to-red-600/5 border-red-500/20'} border rounded-lg p-4 text-center`}>
              <div className="flex items-center justify-center gap-2 mb-2">
                <svg className={`w-4 h-4 ${averageGrowth >= 0 ? 'text-blue-500' : 'text-red-500'}`} fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <p className="text-zinc-300 text-xs font-medium">Crescimento Médio</p>
              </div>
              <p className={`text-xl font-bold mb-1 ${
                averageGrowth >= 0 ? 'text-blue-400' : 'text-red-400'
              }`}>
                {averageGrowth > 0 ? '+' : ''}{averageGrowth.toFixed(1)}%
              </p>
              <p className="text-zinc-400 text-xs">No período selecionado</p>
            </div>
            
            <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border border-purple-500/20 rounded-lg p-4 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <svg className="w-4 h-4 text-purple-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <p className="text-zinc-300 text-xs font-medium">Meta Estabelecida</p>
              </div>
              <p className="text-purple-400 text-xl font-bold mb-1">{growthTarget}%</p>
              <p className={`text-xs ${
                averageGrowth >= growthTarget ? 'text-green-400' : 'text-zinc-400'
              }`}>
                {averageGrowth >= growthTarget ? '✓ Atingida' : `Faltam ${(growthTarget - averageGrowth).toFixed(1)}%`}
              </p>
            </div>
          </div>
          
          {/* Dica de interpretação */}
          <div className="mt-4 bg-zinc-700/20 rounded-lg p-3 border border-zinc-600/30">
            <div className="flex items-start gap-2">
              <svg className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <div>
                <p className="text-yellow-400 text-xs font-medium mb-1">💡 Dica de Análise:</p>
                <p className="text-zinc-300 text-xs leading-relaxed">
                  {averageGrowth >= growthTarget 
                    ? "Parabéns! Seu negócio está crescendo acima da meta. Continue investindo nas estratégias que estão funcionando."
                    : averageGrowth >= 0
                    ? "Seu negócio está crescendo, mas ainda há espaço para melhorar. Analise quais indicadores podem ser otimizados."
                    : "Atenção: há uma tendência de queda. Revise suas estratégias e considere ajustes para reverter essa situação."
                  }
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};