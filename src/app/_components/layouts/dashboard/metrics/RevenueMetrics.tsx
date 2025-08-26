"use client";

import { motion } from "framer-motion";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { DollarSign, TrendingUp, Package, Star } from "lucide-react";
import { PeriodFilter } from "../index";

interface RevenueData {
  dailyRevenue: Array<{ date: string; revenue: number; }>;
  averageTicket: number;
  salesMix: { services: number; products: number; };
  topServices: Array<{ name: string; revenue: number; volume: number; }>;
  topProducts: Array<{ name: string; revenue: number; margin: number; }>;
}

interface RevenueMetricsProps {
  data: RevenueData;
  period: PeriodFilter;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
};

const formatDate = (dateStr: string, period: PeriodFilter) => {
  // Verificar se a string de data é válida
  if (!dateStr || dateStr === 'undefined' || dateStr === 'null') {
    return 'Data inválida';
  }
  
  try {
    let date: Date;
    
    if (period === '1d' || period === 'today') {
      // Para período diário, a string vem no formato YYYY-MM-DDTHH
      if (dateStr.includes('T')) {
        // Se já tem T, adicionar apenas os segundos e Z se necessário
        const isoString = dateStr.endsWith('Z') ? dateStr : `${dateStr}:00:00Z`;
        date = new Date(isoString);
      } else {
        // Se não tem T, adicionar formato completo
        date = new Date(`${dateStr}T00:00:00Z`);
      }
      
      if (isNaN(date.getTime())) {
        return dateStr; // Retorna a string original se não conseguir parsear
      }
      
      const hour = date.getUTCHours();
      return `${hour.toString().padStart(2, '0')}:00`;
    } else if (period === '7d' || period === '14d' || period === '30d') {
      // Para períodos de dias, a string vem no formato YYYY-MM-DD
      const isoString = dateStr.includes('T') ? dateStr : `${dateStr}T12:00:00Z`;
      date = new Date(isoString);
      
      if (isNaN(date.getTime())) {
        return dateStr; // Retorna a string original se não conseguir parsear
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
        return dateStr; // Retorna a string original se não conseguir parsear
      }
      
      return date.toLocaleDateString('pt-BR', { 
        month: 'short', 
        year: '2-digit',
        timeZone: 'America/Sao_Paulo'
      });
    }
  } catch (error) {
    console.warn('Erro ao formatar data:', dateStr, error);
    return dateStr; // Retorna a string original em caso de erro
  }
};

const COLORS = {
  primary: '#8B5CF6',
  secondary: '#06B6D4',
  accent: '#F59E0B',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444'
};

const PIE_COLORS = [COLORS.primary, COLORS.secondary, COLORS.accent, COLORS.success, COLORS.warning];

export const RevenueMetrics = ({ data, period }: RevenueMetricsProps) => {
  const salesMixData = [
    { name: 'Serviços', value: data.salesMix.services, color: COLORS.primary },
    { name: 'Produtos', value: data.salesMix.products, color: COLORS.secondary }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      {/* Título da Seção */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-gradient-to-r from-violet-500/20 to-purple-500/20">
          <DollarSign className="w-6 h-6 text-violet-400" />
        </div>
        <div>
          <h3 className="text-xl font-semibold text-white">Receita & Vendas</h3>
          <p className="text-sm text-zinc-400">
            Análise financeira e performance de vendas
          </p>
        </div>
      </div>

      {/* Receita Total por Período */}
      <div className="glass-card-dark p-6 rounded-xl">
        <div className="mb-4">
          <h4 className="text-lg font-medium text-white mb-1">
            Receita Total por Período
          </h4>
          <p className="text-sm text-zinc-400">
            Evolução da receita ao longo do tempo selecionado
          </p>
        </div>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data.dailyRevenue}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis 
                dataKey="date" 
                stroke="#9CA3AF"
                fontSize={12}
                tickFormatter={(value) => formatDate(value, period)}
              />
              <YAxis 
                stroke="#9CA3AF"
                fontSize={12}
                tickFormatter={formatCurrency}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: '#1F2937',
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  color: '#F9FAFB'
                }}
                labelFormatter={(value) => {
                  const formattedValue = formatDate(value, period);
                  return period === '1d' || period === 'today' ? `Horário: ${formattedValue}` : `Data: ${formattedValue}`;
                }}
                formatter={(value: number) => [formatCurrency(value), 'Receita']}
              />
              <Line 
                type="monotone" 
                dataKey="revenue" 
                stroke={COLORS.primary}
                strokeWidth={3}
                dot={{ fill: COLORS.primary, strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: COLORS.primary, strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ticket Médio */}
        <div className="glass-card-dark p-6 rounded-xl">
          <div className="mb-4">
            <h4 className="text-lg font-medium text-white mb-1">
              Ticket Médio
            </h4>
            <p className="text-sm text-zinc-400">
              Valor médio por atendimento (receita ÷ nº de atendimentos)
            </p>
          </div>
          <div className="flex items-center justify-center h-32">
            <div className="text-center">
              <div className="text-4xl font-bold text-gradient-primary mb-2">
                {formatCurrency(data.averageTicket)}
              </div>
              <div className="flex items-center justify-center gap-2 text-sm text-zinc-400">
                <TrendingUp className="w-4 h-4" />
                <span>Ticket médio do período</span>
              </div>
            </div>
          </div>
        </div>

        {/* Mix de Vendas */}
        <div className="glass-card-dark p-6 rounded-xl">
          <div className="mb-4">
            <h4 className="text-lg font-medium text-white mb-1">
              Mix de Vendas
            </h4>
            <p className="text-sm text-zinc-400">
              Distribuição entre serviços e produtos
            </p>
          </div>
          <div className="h-32">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={salesMixData}
                  cx="50%"
                  cy="50%"
                  innerRadius={30}
                  outerRadius={60}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {salesMixData.map((entry, index) => (
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
                  formatter={(value: number) => [formatCurrency(value), 'Receita']}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-4 mt-2">
            {salesMixData.map((item, index) => (
              <div key={index} className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-sm text-zinc-300">{item.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Serviços */}
      <div className="glass-card-dark p-6 rounded-xl">
        <div className="mb-4">
          <h4 className="text-lg font-medium text-white mb-1">
            Receita por Serviço
          </h4>
          <p className="text-sm text-zinc-400">
            Valor arrecadado por cada serviço no período selecionado
          </p>
        </div>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart 
              data={data.topServices} 
              margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis 
                dataKey="name" 
                stroke="#9CA3AF"
                fontSize={12}
                angle={-45}
                textAnchor="end"
                height={80}
                interval={0}
              />
              <YAxis 
                stroke="#9CA3AF"
                fontSize={12}
                tickFormatter={formatCurrency}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: '#1F2937',
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  color: '#F9FAFB'
                }}
                formatter={(value: number) => [
                  formatCurrency(value),
                  'Receita Arrecadada'
                ]}
              />
              <Bar 
                dataKey="revenue" 
                fill={COLORS.primary}
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Produtos */}
      {data.topProducts.length > 0 && (
        <div className="glass-card-dark p-6 rounded-xl">
          <div className="mb-4">
            <h4 className="text-lg font-medium text-white mb-1">
              Top Produtos por Receita e Margem
            </h4>
            <p className="text-sm text-zinc-400">
              Produtos mais rentáveis e com melhor margem
            </p>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.topProducts}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis 
                  dataKey="name" 
                  stroke="#9CA3AF"
                  fontSize={12}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis 
                  stroke="#9CA3AF"
                  fontSize={12}
                  tickFormatter={formatCurrency}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: '#1F2937',
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#F9FAFB'
                  }}
                  formatter={(value: number, name: string) => [
                    name === 'margin' ? `${value}%` : formatCurrency(value),
                    name === 'revenue' ? 'Receita' : 'Margem'
                  ]}
                />
                <Bar 
                  dataKey="revenue" 
                  fill={COLORS.secondary}
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </motion.div>
  );
};