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
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Cell
} from "recharts";
import { Scissors, Users, DollarSign, Award, TrendingUp } from "lucide-react";
import { PeriodFilter } from "../index";
import { HourlyDistributionChart } from "../charts/hourlyDistributionChart";

interface OperationData {
  barberRevenue: Array<{ name: string; revenue: number; }>;
  barberServices: Array<{ name: string; services: number; }>;
  barberTicket: Array<{ name: string; ticket: number; }>;
  barberPortfolio: Array<{ name: string; services: Array<{ service: string; count: number; }>; }>;
}

interface OperationMetricsProps {
  data: OperationData;
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

const COLORS = {
  primary: '#8B5CF6',
  secondary: '#06B6D4',
  accent: '#F59E0B',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444'
};

const BARBER_COLORS = ['#8B5CF6', '#06B6D4', '#F59E0B', '#10B981', '#EF4444', '#8B5A2B', '#EC4899'];

export const OperationMetrics = ({ data, period }: OperationMetricsProps) => {
  // Preparar dados para o gráfico de portfólio (radar)
  const portfolioData = data.barberPortfolio.length > 0 ? 
    data.barberPortfolio[0].services.map(service => {
      const serviceData: any = { service: service.service };
      data.barberPortfolio.forEach(barber => {
        const barberService = barber.services.find(s => s.service === service.service);
        serviceData[barber.name] = barberService ? barberService.count : 0;
      });
      return serviceData;
    }) : [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="space-y-6"
    >
      {/* Título da Seção */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-gradient-to-r from-amber-500/20 to-orange-500/20">
          <Scissors className="w-6 h-6 text-amber-400" />
        </div>
        <div>
          <h3 className="text-xl font-semibold text-white">Operação</h3>
          <p className="text-sm text-zinc-400">
            Performance individual dos barbeiros
          </p>
        </div>
      </div>

      {/* Receita por Barbeiro */}
      <div className="glass-card-dark p-6 rounded-xl">
        <div className="mb-4">
          <h4 className="text-lg font-medium text-white mb-1">
            Receita por Barbeiro
          </h4>
          <p className="text-sm text-zinc-400">
            Comparativo de receita gerada por cada barbeiro
          </p>
        </div>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.barberRevenue}>
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
                formatter={(value: number) => [formatCurrency(value), 'Receita']}
              />
              <Bar 
                dataKey="revenue" 
                radius={[4, 4, 0, 0]}
              >
                {data.barberRevenue.map((entry: { name: string; revenue: number }, index: number) => (
                  <Cell key={`cell-${index}`} fill={BARBER_COLORS[index % BARBER_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Distribuição de Horários - Largura Total */}
      <div className="glass-card-dark p-6 rounded-xl w-full">
        <HourlyDistributionChart period={period} />
      </div>

      {/* Portfólio por Barbeiro */}
      {portfolioData.length > 0 && (
        <div className="glass-card-dark p-6 rounded-xl">
          <div className="mb-4">
            <h4 className="text-lg font-medium text-white mb-1">
              Portfólio por Barbeiro
            </h4>
            <p className="text-sm text-zinc-400">
              Distribuição de serviços executados por cada barbeiro
            </p>
          </div>
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={portfolioData}>
                <PolarGrid stroke="#374151" />
                <PolarAngleAxis 
                  dataKey="service" 
                  tick={{ fontSize: 12, fill: '#9CA3AF' }}
                />
                <PolarRadiusAxis 
                  angle={90} 
                  domain={[0, 'dataMax']} 
                  tick={{ fontSize: 10, fill: '#9CA3AF' }}
                />
                {data.barberPortfolio.map((barber, index) => (
                  <Radar
                    key={barber.name}
                    name={barber.name}
                    dataKey={barber.name}
                    stroke={BARBER_COLORS[index % BARBER_COLORS.length]}
                    fill={BARBER_COLORS[index % BARBER_COLORS.length]}
                    fillOpacity={0.1}
                    strokeWidth={2}
                  />
                ))}
                <Tooltip 
                  contentStyle={{
                    backgroundColor: '#1F2937',
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#F9FAFB'
                  }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap justify-center gap-4 mt-4">
            {data.barberPortfolio.map((barber, index) => (
              <div key={barber.name} className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: BARBER_COLORS[index % BARBER_COLORS.length] }}
                />
                <span className="text-sm text-zinc-300">{barber.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}


    </motion.div>
  );
};