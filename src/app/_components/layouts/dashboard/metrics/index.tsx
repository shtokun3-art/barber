"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { PeriodFilter } from "../index";
import { RevenueMetrics } from "./RevenueMetrics";
import { ClientMetrics } from "./ClientMetrics";
import { OperationMetrics } from "./OperationMetrics";
import { PaymentMetrics } from "./PaymentMetrics";
import { API_URL } from "@/lib/utils";
import { Spinner } from "@/app/_components/spinner";

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

interface MetricsData {
  // Receita & Vendas
  dailyRevenue: Array<{ date: string; revenue: number; }>;
  averageTicket: number;
  salesMix: { services: number; products: number; };
  topServices: Array<{ name: string; revenue: number; volume: number; }>;
  topProducts: Array<{ name: string; revenue: number; margin: number; }>;
  
  // Clientes
  newVsReturning: { new: number; returning: number; };
  averageFrequency: number;
  retention: { "30d": number; "60d": number; "90d": number; };
  googleRatingPercentage: number;
  
  // Operação
  barberRevenue: Array<{ name: string; revenue: number; }>;
  barberServices: Array<{ name: string; services: number; }>;
  barberTicket: Array<{ name: string; ticket: number; }>;
  barberPortfolio: Array<{ name: string; services: Array<{ service: string; count: number; }>; }>;
}

interface DashboardMetricsProps {
  period: PeriodFilter;
}

export const DashboardMetrics = ({ period }: DashboardMetricsProps) => {
  const [metricsData, setMetricsData] = useState<MetricsData | null>(null);
  const [paymentMetricsData, setPaymentMetricsData] = useState<PaymentMetricsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Buscar métricas gerais
        const metricsResponse = await fetch(`/api/dashboard/metrics?period=${period}`);
        
        // Buscar métricas de pagamento
        const paymentResponse = await fetch(`/api/dashboard/payment-metrics?period=${period}`);
        
        const metricsData = await metricsResponse.json();
        const paymentData = await paymentResponse.json();
        
        if (metricsResponse.ok && paymentResponse.ok) {
          setMetricsData(metricsData);
          setPaymentMetricsData(paymentData);
        } else {
          setError(metricsData.error || paymentData.error || 'Erro ao carregar métricas');
        }
      } catch (error) {
        console.error('Erro ao buscar métricas:', error);
        setError('Erro ao carregar métricas');
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, [period]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-card-dark p-6 rounded-xl text-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-zinc-700/50 flex items-center justify-center">
            <svg className="w-8 h-8 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <div className="text-center">
            <h3 className="text-lg font-medium text-white mb-2">Sem dados para métricas</h3>
            <p className="text-zinc-400 text-sm">Não há dados suficientes para gerar métricas no período selecionado.</p>
            <p className="text-zinc-500 text-xs mt-2">Complete alguns atendimentos para visualizar as análises.</p>
          </div>
        </div>
      </div>
    );
  }

  if (!metricsData) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="space-y-8 mt-8"
    >
      {/* Título Principal */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gradient-primary mb-2">
          Métricas Avançadas
        </h2>
        <p className="text-zinc-400">
          Análise detalhada para otimização de performance e crescimento
        </p>
      </div>

      {/* Receita & Vendas */}
      <RevenueMetrics 
        data={{
          dailyRevenue: metricsData.dailyRevenue,
          averageTicket: metricsData.averageTicket,
          salesMix: metricsData.salesMix,
          topServices: metricsData.topServices,
          topProducts: metricsData.topProducts
        }}
        period={period}
      />

      {/* Clientes */}
      <ClientMetrics 
        data={{
          newVsReturning: metricsData.newVsReturning,
          averageFrequency: metricsData.averageFrequency,
          retention: metricsData.retention,
          googleRatingPercentage: metricsData.googleRatingPercentage
        }}
        period={period}
      />

      {/* Operação */}
      <OperationMetrics 
        data={{
          barberRevenue: metricsData.barberRevenue,
          barberServices: metricsData.barberServices,
          barberTicket: metricsData.barberTicket,
          barberPortfolio: metricsData.barberPortfolio
        }}
        period={period}
      />

      {/* Pagamentos */}
      {paymentMetricsData && (
        <PaymentMetrics 
          data={paymentMetricsData}
          period={period}
        />
      )}
    </motion.div>
  );
};