"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Calendar, 
  Clock, 
  DollarSign, 
  User, 
  Scissors, 
  Phone,
  MapPin,
  X,
  Package,
  CreditCard,
  Banknote,
  Smartphone
} from "lucide-react";
import { HistoryEntry } from "@/lib/hooks/useHistory";

interface HistoryDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  historyEntry: HistoryEntry | null;
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
};

const formatTime = (minutes: number) => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours > 0) {
    return `${hours}h ${mins}min`;
  }
  return `${mins}min`;
};

export const HistoryDetailModal = ({ isOpen, onClose, historyEntry }: HistoryDetailModalProps) => {
  if (!historyEntry) return null;

  const totalTime = historyEntry.services.reduce((total, service) => total + service.service.averageTime, 0);
  const servicesValue = historyEntry.services.reduce((total, service) => total + service.service.price, 0);
  const productsValue = historyEntry.items?.reduce((total, item) => total + item.totalPrice, 0) || 0;
  const averageServicePrice = historyEntry.services.length > 0 ? servicesValue / historyEntry.services.length : 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-zinc-900 border-zinc-700">
        <DialogHeader className="space-y-4">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl font-bold text-white flex items-center gap-2">
              <Scissors className="h-6 w-6 text-orange-500" />
              Detalhes do Atendimento
            </DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-gray-400 hover:text-white"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Informações Gerais */}
          <div className="bg-zinc-800 rounded-lg p-4 space-y-4">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <Calendar className="h-5 w-5 text-orange-500" />
              Informações Gerais
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <Calendar className="h-4 w-4" />
                  Data e Hora
                </div>
                <p className="text-white font-medium">{formatDate(historyEntry.createdAt)}</p>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <DollarSign className="h-4 w-4" />
                  Valor Total
                </div>
                <p className="text-white font-medium text-lg">{formatCurrency(historyEntry.totalValue)}</p>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <Clock className="h-4 w-4" />
                  Tempo Total Estimado
                </div>
                <p className="text-white font-medium">{formatTime(totalTime)}</p>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <Scissors className="h-4 w-4" />
                  Quantidade de Serviços
                </div>
                <p className="text-white font-medium">{historyEntry.services.length}</p>
              </div>
            </div>
          </div>

          {/* Informações do Cliente */}
          <div className="bg-zinc-800 rounded-lg p-4 space-y-4">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <User className="h-5 w-5 text-orange-500" />
              Cliente
            </h3>
            
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full flex items-center justify-center">
                  <User className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-white font-medium text-lg">{historyEntry.user.name}</p>
                  <div className="flex items-center gap-2 text-gray-400">
                    <Phone className="h-4 w-4" />
                    <span>{historyEntry.user.phone}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Informações do Barbeiro */}
          <div className="bg-zinc-800 rounded-lg p-4 space-y-4">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <Scissors className="h-5 w-5 text-orange-500" />
              Barbeiro Responsável
            </h3>
            
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                <Scissors className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-white font-medium text-lg">{historyEntry.barber.name}</p>
                <p className="text-gray-400 text-sm">Barbeiro profissional</p>
              </div>
            </div>
          </div>

          {/* Informações de Pagamento */}
          <div className="bg-zinc-800 rounded-lg p-4 space-y-4">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              {historyEntry.paymentMethod === 'cash' && <Banknote className="h-5 w-5 text-green-500" />}
              {historyEntry.paymentMethod === 'pix' && <Smartphone className="h-5 w-5 text-purple-500" />}
              {(historyEntry.paymentMethod === 'credit_card' || historyEntry.paymentMethod === 'debit_card') && <CreditCard className="h-5 w-5 text-blue-500" />}
              Informações de Pagamento
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  {historyEntry.paymentMethod === 'cash' && <Banknote className="h-4 w-4" />}
                  {historyEntry.paymentMethod === 'pix' && <Smartphone className="h-4 w-4" />}
                  {(historyEntry.paymentMethod === 'credit_card' || historyEntry.paymentMethod === 'debit_card') && <CreditCard className="h-4 w-4" />}
                  Método de Pagamento
                </div>
                <div className="flex items-center gap-2">
                  <Badge 
                    variant="secondary" 
                    className={`${
                      historyEntry.paymentMethod === 'cash' ? 'bg-green-500/20 text-green-300 border-green-500/30' :
                      historyEntry.paymentMethod === 'pix' ? 'bg-purple-500/20 text-purple-300 border-purple-500/30' :
                      historyEntry.paymentMethod === 'debit_card' ? 'bg-blue-500/20 text-blue-300 border-blue-500/30' :
                      'bg-orange-500/20 text-orange-300 border-orange-500/30'
                    }`}
                  >
                    {historyEntry.paymentMethod === 'cash' && 'Dinheiro'}
                    {historyEntry.paymentMethod === 'pix' && 'PIX'}
                    {historyEntry.paymentMethod === 'debit_card' && 'Cartão de Débito'}
                    {historyEntry.paymentMethod === 'credit_card' && 'Cartão de Crédito'}
                  </Badge>
                  {historyEntry.paymentMethod === 'credit_card' && (
                    <Badge variant="outline" className="border-orange-500/30 text-orange-300">
                      {historyEntry.installments > 1 ? `${historyEntry.installments}x` : 'À vista'}
                    </Badge>
                  )}
                </div>
              </div>
              
              {historyEntry.paymentMethod === 'credit_card' && historyEntry.installments > 1 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <DollarSign className="h-4 w-4" />
                    Valor da Parcela
                  </div>
                  <p className="text-white font-medium">
                    {historyEntry.installments}x de {formatCurrency(historyEntry.totalValue / historyEntry.installments)}
                  </p>
                </div>
              )}
              
              {(historyEntry.feeAmount > 0) && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <DollarSign className="h-4 w-4" />
                    Taxa Aplicada
                  </div>
                  <p className="text-red-400 font-medium">
                    {formatCurrency(historyEntry.feeAmount)} ({(historyEntry.feeRate * 100).toFixed(1)}%)
                  </p>
                </div>
              )}
              
              {historyEntry.netAmount && historyEntry.netAmount !== historyEntry.totalValue && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <DollarSign className="h-4 w-4" />
                    Valor Líquido
                  </div>
                  <p className="text-green-400 font-medium">
                    {formatCurrency(historyEntry.netAmount)}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Serviços Realizados */}
          <div className="bg-zinc-800 rounded-lg p-4 space-y-4">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <Scissors className="h-5 w-5 text-orange-500" />
              Serviços Realizados
            </h3>
            
            <div className="space-y-3">
              {historyEntry.services.map((historyService, index) => (
                <div key={historyService.id} className="bg-zinc-700/50 rounded-lg p-4 border border-zinc-600">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="bg-orange-500/20 text-orange-300 border-orange-500/30">
                        #{index + 1}
                      </Badge>
                      <h4 className="text-white font-medium text-lg">{historyService.service.name}</h4>
                    </div>
                    <div className="text-right">
                      <p className="text-white font-bold text-lg">{formatCurrency(historyService.service.price)}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2 text-gray-400">
                      <Clock className="h-4 w-4" />
                      <span>Tempo estimado: {formatTime(historyService.service.averageTime)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-400">
                      <DollarSign className="h-4 w-4" />
                      <span>Valor individual: {formatCurrency(historyService.service.price)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Produtos Utilizados */}
          {historyEntry.items && historyEntry.items.length > 0 && (
            <div className="bg-zinc-800 rounded-lg p-4 space-y-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Package className="h-5 w-5 text-orange-500" />
                Produtos Utilizados
              </h3>
              
              <div className="space-y-3">
                {historyEntry.items.map((historyItem, index) => (
                  <div key={historyItem.id} className="bg-zinc-700/50 rounded-lg p-4 border border-zinc-600">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="bg-blue-500/20 text-blue-300 border-blue-500/30">
                          #{index + 1}
                        </Badge>
                        <h4 className="text-white font-medium text-lg">{historyItem.item.item}</h4>
                      </div>
                      <div className="text-right">
                        <p className="text-white font-bold text-lg">{formatCurrency(historyItem.totalPrice)}</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div className="flex items-center gap-2 text-gray-400">
                        <Package className="h-4 w-4" />
                        <span>Quantidade: {historyItem.quantity}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-400">
                        <DollarSign className="h-4 w-4" />
                        <span>Valor unitário: {formatCurrency(historyItem.unitPrice)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-400">
                        <DollarSign className="h-4 w-4" />
                        <span>Total: {formatCurrency(historyItem.totalPrice)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Resumo Financeiro */}
          <div className="bg-gradient-to-r from-orange-500/10 to-orange-600/10 border border-orange-500/30 rounded-lg p-4 space-y-4">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-orange-500" />
              Resumo Financeiro
            </h3>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center bg-zinc-700/30 p-3 rounded-lg">
                  <p className="text-gray-400 text-sm">Valor Bruto</p>
                  <p className="text-white font-bold text-xl">{formatCurrency(historyEntry.totalValue)}</p>
                </div>
                <div className="text-center bg-zinc-700/30 p-3 rounded-lg">
                  <p className="text-gray-400 text-sm">Total de Serviços</p>
                  <p className="text-white font-bold text-xl">{historyEntry.services.length}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center bg-orange-500/10 p-3 rounded-lg border border-orange-500/20">
                  <p className="text-gray-400 text-sm">Valor dos Serviços</p>
                  <p className="text-orange-400 font-bold text-xl">{formatCurrency(servicesValue)}</p>
                </div>
                <div className="text-center bg-blue-500/10 p-3 rounded-lg border border-blue-500/20">
                  <p className="text-gray-400 text-sm">Valor dos Produtos</p>
                  <p className="text-blue-400 font-bold text-xl">{formatCurrency(productsValue)}</p>
                </div>
              </div>
              
              {historyEntry.feeAmount > 0 && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center bg-red-500/10 p-3 rounded-lg border border-red-500/20">
                    <p className="text-gray-400 text-sm">Taxa Descontada</p>
                    <p className="text-red-400 font-bold text-xl">-{formatCurrency(historyEntry.feeAmount)}</p>
                  </div>
                  {historyEntry.netAmount && (
                    <div className="text-center bg-green-500/10 p-3 rounded-lg border border-green-500/20">
                      <p className="text-gray-400 text-sm">Valor Líquido</p>
                      <p className="text-green-400 font-bold text-xl">{formatCurrency(historyEntry.netAmount)}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <Separator className="bg-zinc-700" />
        
        <div className="flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            className="border-zinc-600 text-gray-300 hover:bg-zinc-700"
          >
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};