"use client";

import { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Users, UserPlus, Info, X } from "lucide-react";
import { PeriodFilter } from "../index";
import { API_URL } from "@/lib/utils";
import { Spinner } from "@/app/_components/spinner";

interface ClientData {
  date: string;
  newClients: number;
  returningClients: number;
  totalClients: number;
}

interface ClientsChartProps {
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
  } else if (['7d', '14d', '30d'].includes(period)) {
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

export const ClientsChart = ({ period }: ClientsChartProps) => {
  const [data, setData] = useState<ClientData[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalNewClients, setTotalNewClients] = useState(0);
  const [totalReturningClients, setTotalReturningClients] = useState(0);
  const [showExplanation, setShowExplanation] = useState(false);

  useEffect(() => {
    const fetchClientsData = async () => {
      try {
        setLoading(true);
        
        const response = await fetch(`/api/dashboard/clients?period=${period}`);
        const result = await response.json();
        
        if (result.success) {
          setData(result.data);
          setTotalNewClients(result.summary.totalNewClients);
          setTotalReturningClients(result.summary.totalReturningClients);
        } else {
          console.error('Erro na API:', result.error);
        }
      } catch (error) {
        console.error('Erro ao buscar dados de clientes:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchClientsData();
  }, [period]);

  const CustomTooltip = ({ active, payload, label }: {
    active?: boolean;
    payload?: Array<{
      value: number;
      name: string;
      payload: ClientData;
    }>;
    label?: string;
  }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-zinc-800 border border-zinc-600 rounded-lg p-3 shadow-lg">
          <p className="text-zinc-300 text-sm mb-2">{formatDate(label || '', period)}</p>
          <p className="text-green-400 font-semibold">
            Novos: {payload[0].value}
          </p>
          <p className="text-blue-400 font-semibold">
            Retornando: {payload[1].value}
          </p>
          <p className="text-white text-sm">
            Total: {payload[0].payload.totalClients}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-zinc-800 rounded-xl p-6 border border-zinc-700 w-full h-full min-h-full flex flex-col flex-1">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-500/10 rounded-lg">
            <Users size={24} className="text-blue-500" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">Evolução de Clientes</h3>
            <p className="text-zinc-400 text-sm">Novos vs. Clientes Retornando</p>
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
          <div className="text-right">
            <div className="flex items-center gap-2 mb-1">
              <UserPlus size={16} className="text-green-500" />
              <span className="text-green-500 text-sm font-medium">
                {totalNewClients} novos
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Users size={16} className="text-blue-500" />
              <span className="text-blue-500 text-sm font-medium">
                {totalReturningClients} retornando
              </span>
            </div>
          </div>
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
              <p>• <span className="text-green-400 font-medium">Linha verde:</span> Representa a evolução de novos clientes ao longo do tempo</p>
              <p>• <span className="text-blue-400 font-medium">Linha azul:</span> Mostra a quantidade de clientes que retornaram</p>
              <p>• <span className="text-orange-400 font-medium">Tendências:</span> Compare as duas linhas para entender fidelização vs. aquisição</p>
              <p>• <span className="text-purple-400 font-medium">Tooltip:</span> Passe o mouse sobre os pontos para ver detalhes de cada período</p>
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
            <LineChart data={data}>
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
              />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="newClients"
                stroke="#10b981"
                strokeWidth={3}
                dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: '#10b981', strokeWidth: 2 }}
                name="Novos Clientes"
              />
              <Line
                type="monotone"
                dataKey="returningClients"
                stroke="#3b82f6"
                strokeWidth={3}
                dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: '#3b82f6', strokeWidth: 2 }}
                name="Clientes Retornando"
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-zinc-400">Nenhum dado disponível para o período selecionado</p>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 mt-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-500 rounded-full" />
          <span className="text-zinc-300 text-sm">Novos Clientes</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-blue-500 rounded-full" />
          <span className="text-zinc-300 text-sm">Clientes Retornando</span>
        </div>
      </div>
    </div>
  );
};