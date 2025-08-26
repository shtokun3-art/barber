"use client";

import { useEffect, useState } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { Scissors } from "lucide-react";
import { PeriodFilter } from "../index";
import { API_URL } from "@/lib/utils";
import { Spinner } from "@/app/_components/spinner";

interface ServiceData {
  name: string;
  count: number;
  revenue: number;
  percentage: number;
}

interface ServicesChartProps {
  period: PeriodFilter;
}

const COLORS = [
  '#f97316', // orange-500
  '#3b82f6', // blue-500
  '#10b981', // green-500
  '#8b5cf6', // purple-500
  '#f59e0b', // yellow-500
  '#ef4444', // red-500
  '#06b6d4', // cyan-500
  '#84cc16', // lime-500
];

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0
  }).format(value);
};

export const ServicesChart = ({ period }: ServicesChartProps) => {
  const [data, setData] = useState<ServiceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalServices, setTotalServices] = useState(0);
  const [topService, setTopService] = useState<string>('');


  useEffect(() => {
    const fetchServicesData = async () => {
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
        console.error('Erro ao buscar dados de serviços:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchServicesData();
  }, [period]);

  const CustomTooltip = ({ active, payload }: {
    active?: boolean;
    payload?: Array<{
      value: number;
      name: string;
      payload: {
         name: string;
         value: number;
         count: number;
         revenue: number;
         percentage: number;
       };
    }>;
  }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-zinc-800 border border-zinc-600 rounded-lg p-3 shadow-lg">
          <p className="text-white font-semibold mb-1">{data.name}</p>
          <p className="text-orange-400 text-sm">Quantidade: {data.count}</p>
          <p className="text-green-400 text-sm">Receita: {formatCurrency(data.revenue)}</p>
          <p className="text-zinc-300 text-sm">{data.percentage.toFixed(1)}% do total</p>
        </div>
      );
    }
    return null;
  };

  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: {
    cx: number;
    cy: number;
    midAngle: number;
    innerRadius: number;
    outerRadius: number;
    percent: number;
  }) => {
    if (percent < 5) return null; // Não mostrar label para fatias muito pequenas
    
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        fontSize={12}
        fontWeight="bold"
      >
        {`${(percent * 100).toFixed(1)}%`}
      </text>
    );
  };

  return (
    <div className="bg-zinc-800 rounded-xl p-6 border border-zinc-700 w-full h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-orange-500/10 rounded-lg">
            <Scissors size={24} className="text-orange-500" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">Distribuição de Serviços</h3>
            <p className="text-zinc-400 text-sm">Total: {totalServices} serviços</p>
          </div>
        </div>
        

      </div>
      


      {/* Chart */}
      <div className="flex-1 min-h-0">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Spinner />
          </div>
        ) : data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={renderCustomizedLabel}
                outerRadius={100}
                fill="#8884d8"
                dataKey="count"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${entry.name}-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex flex-col items-center justify-center h-full gap-3">
            <div className="w-12 h-12 rounded-full bg-zinc-700/50 flex items-center justify-center">
              <svg className="w-6 h-6 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div className="text-center">
              <p className="text-zinc-300 font-medium mb-1">Sem dados de serviços</p>
              <p className="text-zinc-500 text-sm">Nenhum serviço foi realizado no período selecionado</p>
            </div>
          </div>
        )}
      </div>

      {/* Legend */}
      {data.length > 0 && (
        <div className="mt-4 grid grid-cols-1 gap-2">
          {data.slice(0, 4).map((service, index) => (
            <div key={service.name} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                />
                <span className="text-zinc-300">{service.name}</span>
              </div>
              <div className="text-right">
                <span className="text-white font-medium">{service.count}</span>
                <span className="text-zinc-400 ml-2">({service.percentage.toFixed(1)}%)</span>
              </div>
            </div>
          ))}
          {data.length > 4 && (
            <div className="text-zinc-400 text-xs text-center mt-2">
              +{data.length - 4} outros serviços
            </div>
          )}
        </div>
      )}
    </div>
  );
};