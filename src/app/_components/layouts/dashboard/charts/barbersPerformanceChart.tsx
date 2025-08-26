"use client";

import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Users, Award, Info, X } from "lucide-react";
import { PeriodFilter } from "../index";
import { API_URL } from "@/lib/utils";
import { Spinner } from "@/app/_components/spinner";

interface BarberData {
  name: string;
  services: number;
  revenue: number;
  clients: number;
  averageRating?: number;
}

interface BarbersPerformanceChartProps {
  period: PeriodFilter;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0
  }).format(value);
};

export const BarbersPerformanceChart = ({ period }: BarbersPerformanceChartProps) => {
  const [data, setData] = useState<BarberData[]>([]);
  const [loading, setLoading] = useState(true);
  const [topBarber, setTopBarber] = useState<string>('');
  const [totalServices, setTotalServices] = useState<number>(0);
  const [totalRevenue, setTotalRevenue] = useState<number>(0);
  const [showExplanation, setShowExplanation] = useState(false);

  useEffect(() => {
    const fetchBarbersData = async () => {
      try {
        setLoading(true);
        
        const response = await fetch(`/api/dashboard/barbers?period=${period}`);
        const result = await response.json();
        
        if (result.success) {
          setData(result.data);
          setTotalServices(result.summary.totalServices);
          setTotalRevenue(result.summary.totalRevenue);
          setTopBarber(result.summary.topBarber);
        } else {
          console.error('Erro na API:', result.error);
        }
      } catch (error) {
        console.error('Erro ao buscar dados dos barbeiros:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBarbersData();
  }, [period]);

  const CustomTooltip = ({ active, payload, label }: {
    active?: boolean;
    payload?: Array<{
      payload: BarberData;
    }>;
    label?: string;
  }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-zinc-800 border border-zinc-600 rounded-lg p-3 shadow-lg">
          <p className="text-white font-semibold mb-2">{label}</p>
          <p className="text-orange-400 text-sm">Serviços: {data.services}</p>
          <p className="text-green-400 text-sm">Receita: {formatCurrency(data.revenue)}</p>
          <p className="text-blue-400 text-sm">Clientes: {data.clients}</p>
          {data.averageRating && (
            <p className="text-yellow-400 text-sm">Avaliação: {data.averageRating.toFixed(1)}⭐</p>
          )}
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
          <div className="p-3 bg-blue-500/10 rounded-lg">
            <Users size={24} className="text-blue-500" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">Performance dos Barbeiros</h3>
            <p className="text-zinc-400 text-sm">Serviços realizados por barbeiro</p>
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
          
          {topBarber && (
            <div className="flex items-center gap-2 bg-amber-500/10 px-3 py-2 rounded-lg">
              <Award size={16} className="text-amber-500" />
              <span className="text-amber-500 text-sm font-medium">Destaque: {topBarber}</span>
            </div>
          )}
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
            <p>• <span className="text-blue-400 font-medium">Barras azuis:</span> Altura representa a quantidade de serviços realizados por cada barbeiro</p>
            <p>• <span className="text-orange-400 font-medium">Comparação:</span> Permite identificar os barbeiros mais produtivos</p>
            <p>• <span className="text-amber-400 font-medium">Destaque:</span> O barbeiro com melhor performance é destacado no canto superior</p>
            <p>• <span className="text-purple-400 font-medium">Tooltip:</span> Passe o mouse sobre as barras para ver receita, clientes e avaliações</p>
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
            <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis 
                dataKey="name" 
                stroke="#9ca3af"
                fontSize={12}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis 
                stroke="#9ca3af"
                fontSize={12}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar 
                dataKey="services" 
                radius={[4, 4, 0, 0]}
                name="Serviços"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${entry.name}-${entry.services}-${index}`} fill="#3b82f6" />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex flex-col items-center justify-center h-full gap-3">
            <div className="w-12 h-12 rounded-full bg-zinc-700/50 flex items-center justify-center">
              <svg className="w-6 h-6 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div className="text-center">
              <p className="text-zinc-300 font-medium mb-1">Sem dados de barbeiros</p>
              <p className="text-zinc-500 text-sm">Nenhum atendimento foi realizado no período selecionado</p>
            </div>
          </div>
        )}
      </div>


    </div>
  );
};