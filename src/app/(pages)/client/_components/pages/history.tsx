'use client'

import { useAuth } from "@/lib/AuthContext";
import { useHistory } from "@/lib/hooks/useHistory";
import { Spinner } from "@/app/_components/spinner";
import { Clock, Calendar, User, Scissors, DollarSign, CreditCard, Banknote, Smartphone, Package } from "lucide-react";
import { motion } from "framer-motion";
import { useMemo } from "react";

export const HistoryPage = () => {
  const { user } = useAuth();
  const { history, loading, error } = useHistory(true); // Carregar apenas quando necessário

  // Filtrar histórico apenas do usuário logado (memoizado para performance)
  const userHistory = useMemo(() => {
    return history.filter(entry => entry.userId === user?.id);
  }, [history, user?.id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-red-400">Erro ao carregar histórico: {error}</p>
      </div>
    );
  }

  return (
    <section className="p-4 md:p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Clock className="text-orange-500" size={24} />
        <h2 className="text-2xl font-bold text-zinc-100">Meu Histórico</h2>
      </div>

      {userHistory.length === 0 ? (
        <div className="text-center py-12">
          <Scissors className="mx-auto text-zinc-500 mb-4" size={48} />
          <p className="text-zinc-400 text-lg">Você ainda não possui histórico de serviços.</p>
          <p className="text-zinc-500 text-sm mt-2">Quando você concluir um serviço, ele aparecerá aqui.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {userHistory.map((entry, index) => (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-zinc-900/60 backdrop-blur-sm rounded-lg p-4 border border-zinc-700 hover:border-orange-500/50 transition-all duration-300"
            >
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="text-orange-500" size={16} />
                    <span className="text-zinc-300 text-sm">
                      {new Date(entry.createdAt).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <User className="text-orange-500" size={16} />
                    <span className="text-zinc-300 text-sm">
                      Barbeiro: <span className="text-zinc-100 font-medium">{entry.barber.name}</span>
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <DollarSign className="text-green-500" size={16} />
                  <span className="text-green-400 font-bold text-lg">
                    R$ {entry.totalValue.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Método de Pagamento */}
              <div className="mt-4 pt-4 border-t border-zinc-700">
                <h4 className="text-zinc-200 font-medium mb-2 flex items-center gap-2">
                  {entry.paymentMethod === 'cash' && <Banknote className="text-green-500" size={16} />}
                  {entry.paymentMethod === 'pix' && <Smartphone className="text-purple-500" size={16} />}
                  {(entry.paymentMethod === 'credit_card' || entry.paymentMethod === 'debit_card') && <CreditCard className="text-blue-500" size={16} />}
                  Pagamento:
                </h4>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 bg-zinc-700 text-zinc-300 rounded-full text-sm">
                    {entry.paymentMethod === 'cash' && 'Dinheiro'}
                    {entry.paymentMethod === 'pix' && 'PIX'}
                    {entry.paymentMethod === 'debit_card' && 'Cartão de Débito'}
                    {entry.paymentMethod === 'credit_card' && `Cartão de Crédito ${entry.installments > 1 ? `- ${entry.installments}x` : '- À vista'}`}
                  </span>
                  {entry.paymentMethod === 'credit_card' && entry.installments > 1 && (
                    <span className="text-xs text-zinc-400">
                      {entry.installments}x de R$ {(entry.totalValue / entry.installments).toFixed(2)} sem juros
                    </span>
                  )}
                </div>
              </div>

              {/* Serviços realizados */}
              <div className="mt-4 pt-4 border-t border-zinc-700">
                <h4 className="text-zinc-200 font-medium mb-2 flex items-center gap-2">
                  <Scissors className="text-orange-500" size={16} />
                  Serviços realizados:
                </h4>
                <div className="flex flex-wrap gap-2">
                  {entry.services.map((historyService) => (
                    <span
                      key={historyService.id}
                      className="px-3 py-1 bg-orange-500/20 text-orange-300 rounded-full text-sm border border-orange-500/30"
                    >
                      {historyService.service.name}
                    </span>
                  ))}
                </div>
              </div>

              {/* Produtos consumidos */}
              {entry.items && entry.items.length > 0 && (
                <div className="mt-4 pt-4 border-t border-zinc-700">
                  <h4 className="text-zinc-200 font-medium mb-2 flex items-center gap-2">
                    <Package className="text-blue-500" size={16} />
                    Produtos consumidos:
                  </h4>
                  <div className="space-y-2">
                    {entry.items.map((historyItem) => (
                      <div key={historyItem.id} className="flex justify-between items-center bg-zinc-700/50 rounded-lg p-2">
                        <div className="flex items-center gap-2">
                          <span className="text-zinc-300">{historyItem.item.item}</span>
                          <span className="text-xs text-zinc-400">x{historyItem.quantity}</span>
                        </div>
                        <span className="text-blue-400 font-medium">
                          R$ {historyItem.totalPrice.toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </section>
  );
};