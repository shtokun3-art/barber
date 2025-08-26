"use client";

import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Award, Star } from "lucide-react";
import { PeriodFilter } from "../index";
import { API_URL } from "@/lib/utils";
import { Spinner } from "@/app/_components/spinner";

interface TopServiceData {
  name: string;
  count: number;
  revenue: number;
  averagePrice: number;
  percentage: number;
}

interface TopServicesChartProps {
  period: PeriodFilter;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0
  }).format(value);
};

export const TopServicesChart = ({ period }: TopServicesChartProps) => {
  const [data, setData] = useState<TopServiceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [topService, setTopService] = useState<string>('');
  const [totalServices, setTotalServices] = useState<number>(0);


  useEffect(() => {
    const fetchTopServicesData = async () => {
      try {
        setLoading(true);
        
        const response = await fetch(`/api/dashboard/services?period=${period}`);
        const result = await response.json();
        
        if (result.success) {
          setData(result.data);
          setTotalServices(result.summary.totalServices);
          setTopService(result.summary.topService);
        } else {
          console.error('Erro na API:', result.error);
        }
      } catch (error) {
        console.error('Erro ao buscar dados de top serviços:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTopServicesData();
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
        <div className="bg-zinc-800 border border-zinc-700 rounded-lg p-4 shadow-lg max-w-xs">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-3 h-3 rounded-full bg-amber-500"></div>
            <p className="text-white font-semibold">{label}</p>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-zinc-400 text-sm">📅 Agendamentos:</span>
              <span className="text-amber-400 font-medium">{data.count}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-zinc-400 text-sm">💰 Faturamento:</span>
              <span className="text-green-400 font-medium">{formatCurrency(data.revenue)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-zinc-400 text-sm">📊 Participação:</span>
              <span className="text-blue-400 font-medium">{data.percentage.toFixed(1)}%</span>
            </div>
            <div className="border-t border-zinc-700 pt-2 mt-2">
              <p className="text-zinc-500 text-xs text-center">
                💡 {data.percentage > 20 ? 'Serviço muito popular!' : data.percentage > 10 ? 'Serviço popular' : 'Oportunidade de crescimento'}
              </p>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  const getBarColor = (index: number) => {
    const colors = [
      '#f97316', // orange-500 - 1º lugar
      '#fb923c', // orange-400 - 2º lugar
      '#fdba74', // orange-300 - 3º lugar
      '#fed7aa', // orange-200 - 4º lugar
      '#ffedd5', // orange-100 - 5º lugar
    ];
    return colors[index] || '#ffedd5';
  };

  return (
    <div className="bg-zinc-800 rounded-xl p-6 border border-zinc-700 w-full h-full min-h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-amber-500/10 rounded-lg">
            <Award size={24} className="text-amber-500" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">Ranking de Serviços</h3>
            <p className="text-zinc-400 text-sm">Os 5 serviços mais solicitados pelos clientes</p>
            <p className="text-zinc-500 text-xs mt-1">📊 Quantidade de agendamentos por tipo de serviço</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {topService && (
            <div className="text-right">
              <div className="flex items-center gap-2 justify-end mb-1">
                <Star size={16} className="text-amber-500" />
                <span className="text-amber-500 text-sm font-medium">🏆 Campeão</span>
              </div>
              <p className="text-white text-sm font-semibold">{topService}</p>
              <p className="text-zinc-400 text-xs">Serviço mais procurado</p>
            </div>
          )}
        </div>
      </div>
      


      {/* Chart */}
      <div className="flex-1 min-h-80">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Spinner />
          </div>
        ) : data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart 
              data={data.slice(0, 5)} 
              layout="horizontal"
              margin={{ top: 5, right: 5, left: 110, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis 
                type="number"
                stroke="#9ca3af"
                fontSize={12}
              />
              <YAxis 
                type="category"
                dataKey="name" 
                stroke="#9ca3af"
                fontSize={12}
                width={110}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar 
                dataKey="count" 
                radius={[0, 4, 4, 0] as [number, number, number, number]}
                name="Quantidade"
              >
                {data.slice(0, 5).map((entry, index) => (
                  <Cell key={`topservices-${Date.now()}-${index}-${entry.name.replace(/\s+/g, '-').toLowerCase()}-${entry.count}`} fill={getBarColor(index)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="text-6xl mb-4">📊</div>
            <p className="text-zinc-400 text-lg font-medium mb-2">Ainda não há dados para exibir</p>
            <div className="text-center max-w-md">
              <p className="text-zinc-500 text-sm mb-3">
                Este gráfico mostrará os 5 serviços mais populares da sua barbearia assim que houver agendamentos registrados.
              </p>
              <div className="bg-zinc-700/30 rounded-lg p-3">
                <p className="text-zinc-400 text-xs">
                  💡 <strong>Dica:</strong> Quando clientes começarem a agendar serviços, você verá aqui:
                </p>
                <ul className="text-zinc-500 text-xs mt-2 space-y-1">
                  <li>• Ranking dos serviços mais procurados</li>
                  <li>• Quantidade de agendamentos por serviço</li>
                  <li>• Faturamento gerado por cada tipo</li>
                  <li>• Percentual de participação no total</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Ranking List */}
      {data.length > 0 && (
        <div className="mt-6">
          <h4 className="text-white font-semibold mb-2 flex items-center gap-2">
            <Award size={16} className="text-amber-500" />
            Detalhamento por Posição
          </h4>
          <p className="text-zinc-400 text-xs mb-4">💡 Veja quantas vezes cada serviço foi agendado e quanto faturou</p>
          <div className="space-y-3">
            {data.slice(0, 5).map((service, index) => (
              <div key={service.name} className="flex items-center justify-between bg-zinc-700/30 rounded-lg p-3 hover:bg-zinc-700/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    index === 0 ? 'bg-amber-500 text-white' :
                    index === 1 ? 'bg-gray-400 text-white' :
                    index === 2 ? 'bg-amber-600 text-white' :
                    'bg-zinc-600 text-zinc-300'
                  }`}>
                    {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : index + 1}
                  </div>
                  <div>
                    <p className="text-white font-medium">{service.name}</p>
                    <p className="text-zinc-400 text-sm">{service.percentage.toFixed(1)}% de todos os agendamentos</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-white font-semibold">{service.count} agendamentos</p>
                  <p className="text-green-400 text-sm">💰 {formatCurrency(service.revenue)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Summary Stats */}
      {data.length > 0 && (
        <div className="mt-6">
          <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
            <span className="text-blue-400">📈</span>
            Resumo Geral
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-zinc-700/30 rounded-lg p-4 text-center hover:bg-zinc-700/50 transition-colors">
              <div className="text-2xl mb-1">📅</div>
              <p className="text-zinc-400 text-sm">Total de Agendamentos</p>
              <p className="text-white text-2xl font-bold">{totalServices}</p>
              <p className="text-zinc-500 text-xs mt-1">Todos os serviços</p>
            </div>
            <div className="bg-zinc-700/30 rounded-lg p-4 text-center hover:bg-zinc-700/50 transition-colors">
              <div className="text-2xl mb-1">🎯</div>
              <p className="text-zinc-400 text-sm">Tipos de Serviços</p>
              <p className="text-white text-2xl font-bold">{data.length}</p>
              <p className="text-zinc-500 text-xs mt-1">Variedade oferecida</p>
            </div>
            <div className="bg-zinc-700/30 rounded-lg p-4 text-center hover:bg-zinc-700/50 transition-colors">
              <div className="text-2xl mb-1">💵</div>
              <p className="text-zinc-400 text-sm">Receita Média</p>
              <p className="text-white text-2xl font-bold">
                {formatCurrency(data.reduce((acc, service) => acc + service.revenue, 0) / data.length)}
              </p>
              <p className="text-zinc-500 text-xs mt-1">Por agendamento</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};