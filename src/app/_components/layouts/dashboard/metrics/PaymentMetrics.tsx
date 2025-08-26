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
  Cell
} from "recharts";
import { CreditCard, DollarSign, TrendingDown, Percent } from "lucide-react";
import { PeriodFilter } from "../index";

interface PaymentMethodData {
  method: string;
  methodName: string;
  totalRevenue: number;
  feeAmount: number;
  netRevenue: number;
  transactionCount: number;
  averageTicket: number;
}

interface PaymentMetricsData {
  paymentMethods: PaymentMethodData[];
  totalGrossRevenue: number;
  totalFees: number;
  totalNetRevenue: number;
  mostUsedMethod: string;
  highestRevenueMethod: string;
}

interface PaymentMetricsProps {
  data: PaymentMetricsData;
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

const PAYMENT_COLORS = {
  cash: '#10B981',        // Verde - Dinheiro
  pix: '#8B5CF6',         // Roxo - PIX
  debit_card: '#06B6D4',  // Azul - Débito
  credit_card: '#F59E0B'  // Laranja - Crédito
};

const getPaymentIcon = (method: string) => {
  switch (method) {
    case 'cash':
      return '💵';
    case 'pix':
      return '📱';
    case 'debit_card':
      return '💳';
    case 'credit_card':
      return '💳';
    default:
      return '💰';
  }
};

export const PaymentMetrics = ({ data, period }: PaymentMetricsProps) => {
  const chartData = data.paymentMethods.map(method => ({
    name: method.methodName,
    revenue: method.totalRevenue,
    netRevenue: method.netRevenue,
    fees: method.feeAmount,
    transactions: method.transactionCount,
    color: PAYMENT_COLORS[method.method as keyof typeof PAYMENT_COLORS]
  }));

  const pieData = data.paymentMethods.map(method => ({
    name: method.methodName,
    value: method.totalRevenue,
    color: PAYMENT_COLORS[method.method as keyof typeof PAYMENT_COLORS]
  }));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="space-y-6"
    >
      {/* Título da Seção */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-gradient-to-r from-green-500/20 to-emerald-500/20">
          <CreditCard className="w-6 h-6 text-green-400" />
        </div>
        <div>
          <h3 className="text-xl font-semibold text-white">Métodos de Pagamento</h3>
          <p className="text-sm text-zinc-400">
            Análise de faturamento e taxas por método de pagamento
          </p>
        </div>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Faturamento Bruto */}
        <div className="glass-card-dark p-4 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/20">
              <DollarSign className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-zinc-400">Faturamento Bruto</p>
              <p className="text-lg font-semibold text-white">
                {formatCurrency(data.totalGrossRevenue)}
              </p>
            </div>
          </div>
        </div>

        {/* Total de Taxas */}
        <div className="glass-card-dark p-4 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-500/20">
              <TrendingDown className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <p className="text-sm text-zinc-400">Total de Taxas</p>
              <p className="text-lg font-semibold text-red-400">
                {formatCurrency(data.totalFees)}
              </p>
            </div>
          </div>
        </div>

        {/* Faturamento Líquido */}
        <div className="glass-card-dark p-4 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-500/20">
              <DollarSign className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <p className="text-sm text-zinc-400">Faturamento Líquido</p>
              <p className="text-lg font-semibold text-green-400">
                {formatCurrency(data.totalNetRevenue)}
              </p>
            </div>
          </div>
        </div>

        {/* Método Mais Usado */}
        <div className="glass-card-dark p-4 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-500/20">
              <Percent className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-zinc-400">Mais Usado</p>
              <p className="text-lg font-semibold text-white">
                {data.mostUsedMethod}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de Barras - Receita por Método */}
        <div className="glass-card-dark p-6 rounded-xl">
          <div className="mb-4">
            <h4 className="text-lg font-medium text-white mb-1">
              Receita por Método de Pagamento
            </h4>
            <p className="text-sm text-zinc-400">
              Comparativo entre faturamento bruto e líquido
            </p>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis 
                  dataKey="name" 
                  stroke="#9CA3AF"
                  fontSize={12}
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
                    formatCurrency(value),
                    name === 'revenue' ? 'Receita Bruta' : 'Receita Líquida'
                  ]}
                />
                <Bar 
                  dataKey="revenue" 
                  fill="#06B6D4"
                  radius={[2, 2, 0, 0]}
                  name="revenue"
                />
                <Bar 
                  dataKey="netRevenue" 
                  fill="#10B981"
                  radius={[2, 2, 0, 0]}
                  name="netRevenue"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-6 mt-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-cyan-500" />
              <span className="text-sm text-zinc-300">Receita Bruta</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span className="text-sm text-zinc-300">Receita Líquida</span>
            </div>
          </div>
        </div>

        {/* Gráfico de Pizza - Distribuição */}
        <div className="glass-card-dark p-6 rounded-xl">
          <div className="mb-4">
            <h4 className="text-lg font-medium text-white mb-1">
              Distribuição por Método
            </h4>
            <p className="text-sm text-zinc-400">
              Participação de cada método no faturamento total
            </p>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
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
        </div>
      </div>

      {/* Detalhamento por Método */}
      <div className="glass-card-dark p-6 rounded-xl">
        <div className="mb-4">
          <h4 className="text-lg font-medium text-white mb-1">
            Detalhamento por Método
          </h4>
          <p className="text-sm text-zinc-400">
            Análise detalhada de cada método de pagamento
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {data.paymentMethods.map((method, index) => {
            const feePercentage = method.totalRevenue > 0 
              ? (method.feeAmount / method.totalRevenue) * 100 
              : 0;
            
            return (
              <motion.div
                key={method.method}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className="glass-card-dark p-4 rounded-lg border border-zinc-800/50 hover:border-zinc-700/50 transition-all duration-300"
              >
                <div className="text-center space-y-3">
                  {/* Ícone e Nome */}
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-2xl">{getPaymentIcon(method.method)}</span>
                    <h5 className="font-medium text-white">{method.methodName}</h5>
                  </div>
                  
                  {/* Métricas */}
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Transações:</span>
                      <span className="text-white font-medium">{method.transactionCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Receita Bruta:</span>
                      <span className="text-white font-medium">{formatCurrency(method.totalRevenue)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Taxa ({feePercentage.toFixed(1)}%):</span>
                      <span className="text-red-400 font-medium">-{formatCurrency(method.feeAmount)}</span>
                    </div>
                    <div className="border-t border-zinc-700/50 pt-2">
                      <div className="flex justify-between">
                        <span className="text-zinc-400">Receita Líquida:</span>
                        <span 
                          className="font-bold text-lg"
                          style={{ color: PAYMENT_COLORS[method.method as keyof typeof PAYMENT_COLORS] }}
                        >
                          {formatCurrency(method.netRevenue)}
                        </span>
                      </div>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Ticket Médio:</span>
                      <span className="text-white font-medium">{formatCurrency(method.averageTicket)}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
};