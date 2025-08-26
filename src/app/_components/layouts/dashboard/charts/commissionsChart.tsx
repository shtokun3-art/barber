"use client";

import { useEffect, useState } from "react";
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
  Legend
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { DollarSign, Users, TrendingUp, Percent, Award } from "lucide-react";
import { motion } from "framer-motion";
import { PeriodFilter } from "../index";

interface CommissionData {
  barberId: string
  barberName: string
  commissionRate: number
  totalServicos: number
  totalComissao: number
  quantidadeAtendimentos: number
  comissaoMedia: number
}

interface ChartData {
  name: string
  comissao: number
  atendimentos: number
  rate: number
}

interface Totals {
  totalGeralServicos: number
  totalGeralComissoes: number
  totalAtendimentos: number
  mediaComissaoPorAtendimento: number
}

interface CommissionsResponse {
  success: boolean
  data: {
    commissions: CommissionData[]
    totals: Totals
    chartData: ChartData[]
    period: {
      start: string
      end: string
    }
  }
}

const BARBER_COLORS = ['#8B5CF6', '#06B6D4', '#F59E0B', '#10B981', '#EF4444', '#8B5A2B', '#EC4899']

interface CommissionsChartProps {
  period: PeriodFilter;
}

export const CommissionsChart = ({ period }: CommissionsChartProps) => {
  const [data, setData] = useState<CommissionsResponse['data'] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchCommissionsData()
  }, [period])

  const fetchCommissionsData = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/dashboard/commissions?period=${period}`)
      const result: CommissionsResponse = await response.json()
      
      if (result.success) {
        setData(result.data)
      } else {
        setError('Erro ao carregar dados de comissões')
      }
    } catch (error) {
      console.error('Erro ao buscar dados de comissões:', error)
      setError('Erro ao carregar dados de comissões')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 bg-gray-200 rounded w-24"></div>
              <div className="h-4 w-4 bg-gray-200 rounded"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded w-16 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-32"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (error || !data) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-red-500">{error || 'Erro ao carregar dados'}</p>
        </CardContent>
      </Card>
    )
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const formatPercent = (value: number) => {
    return `${(value * 100).toFixed(0)}%`
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="space-y-6"
    >
      {/* Título da Seção */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-gradient-to-r from-green-500/20 to-emerald-500/20">
          <DollarSign className="w-6 h-6 text-green-400" />
        </div>
        <div>
          <h3 className="text-xl font-semibold text-white">Comissões</h3>
          <p className="text-sm text-zinc-400">
            Performance de comissões por barbeiro
          </p>
        </div>
      </div>

      {/* Cards Individuais de Barbeiros - Estilo da Imagem */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {data?.commissions.map((barber, index) => {
          const ticketMedio = barber.quantidadeAtendimentos > 0 
            ? barber.totalServicos / barber.quantidadeAtendimentos 
            : 0;
          
          return (
            <motion.div
              key={barber.barberId}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className="glass-card-dark p-6 rounded-lg border border-zinc-800/50 hover:border-zinc-700/50 transition-all duration-300"
            >
              <div className="text-center space-y-4">
                {/* Avatar com ícone */}
                <div 
                  className="w-16 h-16 rounded-full mx-auto flex items-center justify-center shadow-lg"
                  style={{ backgroundColor: BARBER_COLORS[index % BARBER_COLORS.length] }}
                >
                  <Award className="w-8 h-8 text-white" />
                </div>
                
                {/* Nome do Barbeiro */}
                <h3 className="text-lg font-semibold text-white">{barber.barberName}</h3>
                
                {/* Métricas */}
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-400">Receita:</span>
                    <span className="text-white font-semibold">{formatCurrency(barber.totalServicos)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-400">Atendimentos:</span>
                    <span className="text-white font-semibold">{barber.quantidadeAtendimentos}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-400">Ticket Médio:</span>
                    <span className="text-white font-semibold">{formatCurrency(ticketMedio)}</span>
                  </div>
                  
                  {/* Separador */}
                  <div className="border-t border-zinc-700/50 pt-3">
                    <div className="flex justify-between items-center">
                      <span className="text-zinc-400">Comissão Total:</span>
                      <span 
                        className="text-lg font-bold"
                        style={{ color: BARBER_COLORS[index % BARBER_COLORS.length] }}
                      >
                        {formatCurrency(barber.totalComissao)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Gráficos */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Gráfico de Barras - Comissões */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="glass-card-dark p-6 rounded-lg"
        >
          <div className="mb-4">
            <h4 className="text-lg font-semibold text-white mb-1">Comissões por Barbeiro</h4>
            <p className="text-sm text-zinc-400">Total de comissões ganhas no período</p>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis 
                dataKey="name" 
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tick={{ fill: '#9CA3AF' }}
              />
              <YAxis 
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tick={{ fill: '#9CA3AF' }}
                tickFormatter={(value) => `R$ ${value}`}
              />
              <Tooltip 
                formatter={(value: number) => [formatCurrency(value), 'Comissão']}
                labelFormatter={(label) => `Barbeiro: ${label}`}
                contentStyle={{
                  backgroundColor: '#1F2937',
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  color: '#F9FAFB'
                }}
              />
              <Bar dataKey="comissao" radius={[4, 4, 0, 0]}>
                {data.chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={BARBER_COLORS[index % BARBER_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Gráfico de Pizza - Distribuição */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="glass-card-dark p-6 rounded-lg"
        >
          <div className="mb-4">
            <h4 className="text-lg font-semibold text-white mb-1">Distribuição de Comissões</h4>
            <p className="text-sm text-zinc-400">Participação de cada barbeiro no total</p>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={data.chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="comissao"
              >
                {data.chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={BARBER_COLORS[index % BARBER_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value: number) => formatCurrency(value)}
                contentStyle={{
                  backgroundColor: '#1F2937',
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  color: '#F9FAFB'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

    </motion.div>
  )
}