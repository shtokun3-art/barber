"use client";

import { motion } from "framer-motion";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from "recharts";
import { Users, UserPlus, Repeat, Star, TrendingUp } from "lucide-react";
import { PeriodFilter } from "../index";

interface ClientData {
  newVsReturning: { new: number; returning: number; };
  averageFrequency: number;
  retention: { "30d": number; "60d": number; "90d": number; };
  googleRatingPercentage: number;
}

interface ClientMetricsProps {
  data: ClientData;
  period: PeriodFilter;
}

const COLORS = {
  primary: '#8B5CF6',
  secondary: '#06B6D4',
  accent: '#F59E0B',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444'
};

export const ClientMetrics = ({ data, period }: ClientMetricsProps) => {
  const newVsReturningData = [
    { name: 'Novos Clientes', value: data.newVsReturning.new, color: COLORS.success },
    { name: 'Clientes Recorrentes', value: data.newVsReturning.returning, color: COLORS.primary }
  ];

  const retentionData = [
    { period: '30 dias', percentage: Number(data.retention["30d"].toFixed(1)) },
    { period: '60 dias', percentage: Number(data.retention["60d"].toFixed(1)) },
    { period: '90 dias', percentage: Number(data.retention["90d"].toFixed(1)) }
  ];

  const googleRatingData = [
    { name: 'Avaliaram', value: Number(data.googleRatingPercentage.toFixed(1)), color: COLORS.accent },
    { name: 'Não Avaliaram', value: Number((100 - data.googleRatingPercentage).toFixed(1)), color: '#374151' }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="space-y-6"
    >
      {/* Título da Seção */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-gradient-to-r from-cyan-500/20 to-blue-500/20">
          <Users className="w-6 h-6 text-cyan-400" />
        </div>
        <div>
          <h3 className="text-xl font-semibold text-white">Clientes</h3>
          <p className="text-sm text-zinc-400">
            Análise de comportamento e retenção de clientes
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Novos vs Recorrentes */}
        <div className="glass-card-dark p-6 rounded-xl">
          <div className="mb-4">
            <h4 className="text-lg font-medium text-white mb-1">
              Novos vs. Recorrentes
            </h4>
            <p className="text-sm text-zinc-400">
              Distribuição de clientes novos e recorrentes no período
            </p>
          </div>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={newVsReturningData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {newVsReturningData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{
                    backgroundColor: '#1F2937',
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#F9FAFB'
                  }}
                  formatter={(value: number) => [value, 'Clientes']}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-4 mt-2">
            {newVsReturningData.map((item, index) => (
              <div key={index} className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-sm text-zinc-300">{item.name}</span>
                <span className="text-sm font-medium text-white">({item.value})</span>
              </div>
            ))}
          </div>
        </div>

        {/* Frequência Média */}
        <div className="glass-card-dark p-6 rounded-xl">
          <div className="mb-6">
            <h4 className="text-lg font-medium text-white mb-1">
              Frequência Média
            </h4>
            <p className="text-sm text-zinc-400">
              Retornos por cliente em 90 dias
            </p>
          </div>
          <div className="flex flex-col items-center justify-center space-y-6">
            {/* Círculo Principal */}
            <div className="relative">
              <div className="w-40 h-40 rounded-full border-8 border-zinc-700/50 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-4xl font-bold text-gradient-primary mb-1">
                    {data.averageFrequency.toFixed(1)}
                  </div>
                  <div className="text-sm text-zinc-400 font-medium">visitas</div>
                </div>
              </div>
              <div 
                className="absolute top-0 left-0 w-40 h-40 rounded-full border-8 border-transparent"
                style={{
                  borderTopColor: COLORS.secondary,
                  borderRightColor: COLORS.secondary,
                  transform: `rotate(${Math.min((data.averageFrequency / 10) * 360, 360)}deg)`,
                  transition: 'transform 1.5s ease-out'
                }}
              />
            </div>
            
            {/* Informações Adicionais */}
            <div className="text-center space-y-3">
              <div className="flex items-center justify-center gap-2 text-sm text-zinc-400">
                <Repeat className="w-4 h-4 text-cyan-400" />
                <span>Média de retornos por cliente</span>
              </div>
              
              {/* Indicador de Performance */}
              <div className="flex items-center justify-center gap-2">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-cyan-400"></div>
                  <span className="text-xs text-zinc-500">Excelente: 5+ visitas</span>
                </div>
                <div className="w-px h-4 bg-zinc-600"></div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-zinc-600"></div>
                  <span className="text-xs text-zinc-500">Base: 0-10 visitas</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Retenção por Período */}
      <div className="glass-card-dark p-6 rounded-xl">
        <div className="mb-4">
          <h4 className="text-lg font-medium text-white mb-1">
            Retenção por Período
          </h4>
          <p className="text-sm text-zinc-400">
            Percentual de clientes que retornaram em 30, 60 e 90 dias
          </p>
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={retentionData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis 
                dataKey="period" 
                stroke="#9CA3AF"
                fontSize={12}
              />
              <YAxis 
                stroke="#9CA3AF"
                fontSize={12}
                tickFormatter={(value) => `${value}%`}
                domain={[0, 100]}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: '#1F2937',
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  color: '#F9FAFB'
                }}
                formatter={(value: number) => [`${value}%`, 'Retenção']}
              />
              <Bar 
                dataKey="percentage" 
                fill={COLORS.secondary}
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Avaliações no Google */}
      <div className="glass-card-dark p-6 rounded-xl">
        <div className="mb-4">
          <h4 className="text-lg font-medium text-white mb-1">
            Avaliações no Google
          </h4>
          <p className="text-sm text-zinc-400">
            Percentual de clientes que avaliaram no Google (hasRatedOnGoogle)
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={googleRatingData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  startAngle={90}
                  endAngle={450}
                >
                  {googleRatingData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{
                    backgroundColor: '#1F2937',
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#F9FAFB'
                  }}
                  formatter={(value: number) => [`${value}%`, 'Clientes']}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-col justify-center space-y-4">
            <div className="text-center">
              <div className="text-4xl font-bold text-gradient-primary mb-2">
                {data.googleRatingPercentage.toFixed(1)}%
              </div>
              <div className="flex items-center justify-center gap-2 text-sm text-zinc-400">
                <Star className="w-4 h-4 text-yellow-400" />
                <span>Avaliaram no Google</span>
              </div>
            </div>
            <div className="space-y-2">
              {googleRatingData.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-sm text-zinc-300">{item.name}</span>
                  </div>
                  <span className="text-sm font-medium text-white">{item.value.toFixed(1)}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};