"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check, DollarSign, Clock, ShoppingBag, CreditCard, Banknote, Smartphone, Scissors } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Spinner } from "../spinner";
import { QueueEntry } from "@/lib/hooks/useQueue";
import { toast } from "sonner";
import { ProductSelector } from "./ProductSelector";
import { ServiceSelector } from "./ServiceSelector";
import { ServicesProvider } from "@/lib/context/servicesContext";

interface SelectedProduct {
  id: string;
  name: string;
  price: number;
  quantity: number;
  totalPrice: number;
}

interface SelectedService {
  id: string;
  name: string;
  price: number;
  averageTime: number;
  quantity: number;
  totalPrice: number;
  totalTime: number;
}

type PaymentMethod = 'cash' | 'credit_card' | 'debit_card' | 'pix';

interface CompleteServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  queueEntry: QueueEntry;
  onComplete: (services: { serviceId: string; price: number; time: number }[], products: SelectedProduct[], paymentMethod: PaymentMethod, installments: number, extraServices?: SelectedService[]) => Promise<void>;
  pauseUpdates?: () => void;
  resumeUpdates?: () => void;
}

export const CompleteServiceModal = ({
  isOpen,
  onClose,
  queueEntry,
  onComplete,
  pauseUpdates,
  resumeUpdates
}: CompleteServiceModalProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<SelectedProduct[]>([]);
  const [selectedExtraServices, setSelectedExtraServices] = useState<SelectedService[]>([]);
  const [isProductSelectorOpen, setIsProductSelectorOpen] = useState(false);
  const [isServiceSelectorOpen, setIsServiceSelectorOpen] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod>('cash');
  const [selectedInstallments, setSelectedInstallments] = useState<number>(1);
  const [removedServiceIds, setRemovedServiceIds] = useState<string[]>([]);
  const [paymentFees, setPaymentFees] = useState({
    credit_card: 3.5,
    credit_card_2x: 4.5,
    credit_card_3x: 5.5,
    debit_card: 2.5,
    cash: 0,
    pix: 0
  });

  // Chaves únicas para localStorage baseadas no queueEntry.id
  const productsStorageKey = `selectedProducts_${queueEntry.id}`;
  const servicesStorageKey = `selectedExtraServices_${queueEntry.id}`;

  // Buscar taxas do backend
  useEffect(() => {
    const fetchPaymentFees = async () => {
      try {
        const response = await fetch('/api/payment-fees');
        if (response.ok) {
          const fees = await response.json();
          setPaymentFees(fees);
        }
      } catch (error) {
        console.error('Erro ao buscar taxas:', error);
      }
    };

    if (isOpen) {
      fetchPaymentFees();
      pauseUpdates?.();
    } else {
      resumeUpdates?.();
    }
    
    // Cleanup: sempre retomar updates quando componente desmontar
    return () => {
      if (isOpen) {
        resumeUpdates?.();
      }
    };
  }, [isOpen, pauseUpdates, resumeUpdates]);

  // Carregar produtos e serviços do localStorage quando o modal abrir
  useEffect(() => {
    if (isOpen) {
      const savedProducts = localStorage.getItem(productsStorageKey);
      if (savedProducts) {
        try {
          setSelectedProducts(JSON.parse(savedProducts));
        } catch (error) {
          console.error('Erro ao carregar produtos salvos:', error);
        }
      }
      
      const savedServices = localStorage.getItem(servicesStorageKey);
      if (savedServices) {
        try {
          setSelectedExtraServices(JSON.parse(savedServices));
        } catch (error) {
          console.error('Erro ao carregar serviços salvos:', error);
        }
      }
    }
  }, [isOpen, productsStorageKey, servicesStorageKey]);

  // Salvar produtos no localStorage sempre que mudarem
  useEffect(() => {
    if (selectedProducts.length > 0) {
      localStorage.setItem(productsStorageKey, JSON.stringify(selectedProducts));
    } else {
      localStorage.removeItem(productsStorageKey);
    }
  }, [selectedProducts, productsStorageKey]);

  // Salvar serviços extras no localStorage sempre que mudarem
  useEffect(() => {
    if (selectedExtraServices.length > 0) {
      localStorage.setItem(servicesStorageKey, JSON.stringify(selectedExtraServices));
    } else {
      localStorage.removeItem(servicesStorageKey);
    }
  }, [selectedExtraServices, servicesStorageKey]);

  // Calcular totais (considerando serviços removidos)
  const servicesValue = queueEntry.queueServices
    .filter(qs => !removedServiceIds.includes(qs.service?.id || ''))
    .reduce((total, qs) => {
      return total + (qs.service?.price || 0);
    }, 0);

  const extraServicesValue = selectedExtraServices.reduce((total, service) => {
    return total + service.totalPrice;
  }, 0);

  const productsValue = selectedProducts.reduce((total, product) => {
    return total + product.totalPrice;
  }, 0);

  const totalValue = servicesValue + extraServicesValue + productsValue;

  const originalServicesTime = queueEntry.queueServices
    .filter(qs => !removedServiceIds.includes(qs.service?.id || ''))
    .reduce((total, qs) => {
      return total + (qs.service?.averageTime || 0);
    }, 0);

  const extraServicesTime = selectedExtraServices.reduce((total, service) => {
    return total + service.totalTime;
  }, 0);

  const totalTime = originalServicesTime + extraServicesTime;

  // Calcular taxa baseada no método de pagamento e parcelamento
  const getCurrentFeeRate = () => {
    if (selectedPaymentMethod === 'credit_card') {
      if (selectedInstallments === 1) {
        return paymentFees.credit_card / 100;
      } else if (selectedInstallments === 2) {
        return paymentFees.credit_card_2x / 100;
      } else if (selectedInstallments === 3) {
        return paymentFees.credit_card_3x / 100;
      }
    }
    return paymentFees[selectedPaymentMethod as keyof typeof paymentFees] / 100;
  };

  // Calcular taxa e valor líquido
  const currentFeeRate = getCurrentFeeRate();
  const feeAmount = totalValue * currentFeeRate;
  const netAmount = totalValue - feeAmount; // Valor líquido que o barbeiro recebe

  const handleComplete = async () => {
    setIsSubmitting(true);
    try {
      // Filtrar apenas os serviços que não foram removidos
      const services = queueEntry.queueServices
        .filter(qs => !removedServiceIds.includes(qs.service?.id || ''))
        .map(qs => ({
          serviceId: qs.service.id,
          price: qs.service.price,
          time: qs.service.averageTime
        }));
      await onComplete(services, selectedProducts, selectedPaymentMethod, selectedInstallments, selectedExtraServices);
      // Limpar produtos e serviços salvos após conclusão bem-sucedida
      localStorage.removeItem(productsStorageKey);
      localStorage.removeItem(servicesStorageKey);
    } catch (error) {
      toast.error("Erro ao concluir serviço");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    // Não limpar selectedProducts e selectedExtraServices aqui - eles serão preservados no localStorage
    setIsProductSelectorOpen(false);
    setIsServiceSelectorOpen(false);
    resumeUpdates?.(); // Garantir que o polling seja retomado
    onClose();
  };

  const handleOpenProductSelector = () => {
    setIsProductSelectorOpen(true);
  };

  const handleOpenServiceSelector = () => {
    setIsServiceSelectorOpen(true);
  };

  const handleCloseProductSelector = () => {
    setIsProductSelectorOpen(false);
  };

  const handleCloseServiceSelector = () => {
    setIsServiceSelectorOpen(false);
  };



  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
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

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="bg-zinc-800 rounded-xl border border-zinc-700/50 shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-zinc-700/50">
                <h2 className="text-xl font-semibold text-white">
                  Finalizar Atendimento
                </h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClose}
                  className="h-8 w-8 p-0 text-zinc-400 hover:text-white hover:bg-zinc-700"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Content */}
              <div className="p-6 space-y-6">
                {/* Cliente Info */}
                <div className="bg-zinc-700/50 rounded-lg p-4">
                  <h3 className="font-medium text-white mb-2">Cliente</h3>
                  <p className="text-zinc-300">{queueEntry.user.name}</p>
                </div>

                {/* Serviços Selecionados */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium text-white">Serviços Selecionados</h3>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleOpenServiceSelector}
                      className="border-orange-500 text-orange-500 hover:bg-orange-500 hover:text-white"
                    >
                      <Scissors className="h-4 w-4 mr-2" />
                      Adicionar Serviços
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {/* Serviços originais da fila */}
                    {queueEntry.queueServices
                      .filter(qs => !removedServiceIds.includes(qs.service?.id || ''))
                      .map((qs, index) => {
                        const remainingOriginalServices = queueEntry.queueServices.filter(s => !removedServiceIds.includes(s.service?.id || ''));
                        const totalServices = remainingOriginalServices.length + selectedExtraServices.length;
                        const canRemove = totalServices > 1;
                        
                        return (
                          <div key={`service-${index}`} className="flex justify-between items-center p-3 bg-orange-500/20 rounded-lg border border-orange-500/30">
                            <div className="flex items-center gap-2">
                              <span className="text-white">{qs.service?.name || "Serviço não encontrado"}</span>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-zinc-300">
                              <span className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                {formatTime(qs.service?.averageTime || 0)}
                              </span>
                              <span className="flex items-center gap-1">
                                <DollarSign className="h-4 w-4" />
                                {formatCurrency(qs.service?.price || 0)}
                              </span>
                              {canRemove && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      // Remover instantaneamente da interface
                                      setRemovedServiceIds(prev => [...prev, qs.service?.id || '']);
                                      toast.success('Serviço removido da fila!');
                                      
                                      // Fazer chamada da API em background
                                      fetch(`${window.location.origin}/api/queue/update-services`, {
                                        method: 'POST',
                                        headers: {
                                          'Content-Type': 'application/json',
                                        },
                                        credentials: 'include',
                                        body: JSON.stringify({
                                          queueId: queueEntry.id,
                                          serviceIdToRemove: qs.service?.id
                                        })
                                      }).catch(error => {
                                        console.error('Erro ao remover serviço do backend:', error);
                                        // Em caso de erro, reverter a remoção
                                        setRemovedServiceIds(prev => prev.filter(id => id !== qs.service?.id));
                                        toast.error('Erro ao remover serviço. Tente novamente.');
                                      });
                                    }}
                                    className="h-6 w-6 p-0 text-zinc-400 hover:text-red-400 hover:bg-red-500/20"
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                )}
                            </div>
                          </div>
                        );
                      })}
                    
                    {/* Serviços extras adicionados */}
                     {selectedExtraServices.map((service, index) => {
                       const remainingOriginalServices = queueEntry.queueServices.filter(s => !removedServiceIds.includes(s.service?.id || ''));
                       const totalServices = remainingOriginalServices.length + selectedExtraServices.length;
                       const canRemove = totalServices > 1;
                      
                      return (
                        <div key={`service-extra-${service.id}-${index}`} className="flex justify-between items-center p-3 bg-orange-500/20 rounded-lg border border-orange-500/30">
                          <div className="flex items-center gap-2">
                            <span className="text-white">{service.name}</span>
                            {service.quantity > 1 && (
                              <span className="bg-orange-500/30 text-orange-300 text-xs px-2 py-1 rounded-full">
                                {service.quantity}x
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-zinc-300">
                            <span className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              {formatTime(service.totalTime)}
                            </span>
                            <span className="flex items-center gap-1">
                              <DollarSign className="h-4 w-4" />
                              {formatCurrency(service.totalPrice)}
                            </span>
                            {canRemove && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  const updatedServices = selectedExtraServices.filter((_, i) => i !== index);
                                  setSelectedExtraServices(updatedServices);
                                  // Salvar no localStorage
                                  localStorage.setItem(servicesStorageKey, JSON.stringify(updatedServices));
                                  toast.success("Serviço removido com sucesso!");
                                }}
                                className="h-6 w-6 p-0 text-zinc-400 hover:text-red-400 hover:bg-red-500/20"
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Produtos */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium text-white">Produtos</h3>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleOpenProductSelector}
                      className="border-orange-500 text-orange-500 hover:bg-orange-500 hover:text-white"
                    >
                      <ShoppingBag className="h-4 w-4 mr-2" />
                      Adicionar Produtos
                    </Button>
                  </div>
                  
                  {selectedProducts.length > 0 ? (
                    <div className="space-y-2">
                      {selectedProducts.map((product) => (
                        <div key={product.id} className="flex justify-between items-center p-3 bg-blue-500/20 rounded-lg border border-blue-500/30">
                          <div>
                            <span className="text-white">{product.name}</span>
                            <div className="text-sm text-zinc-300">
                              Quantidade: {product.quantity}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="flex items-center gap-1 text-sm text-zinc-300">
                              <span>{product.quantity}x {formatCurrency(product.price)}</span>
                            </div>
                            <div className="flex items-center gap-1 text-blue-400 font-medium">
                              <DollarSign className="h-4 w-4" />
                              {formatCurrency(product.totalPrice)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-zinc-400 bg-zinc-700/30 rounded-lg border border-zinc-600/50">
                      <ShoppingBag className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Nenhum produto adicionado</p>
                    </div>
                  )}
                </div>

                {/* Método de Pagamento */}
                <div>
                  <h3 className="font-medium text-white mb-3">Método de Pagamento *</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setSelectedPaymentMethod('cash')}
                      className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                        selectedPaymentMethod === 'cash'
                          ? 'border-green-500 bg-green-500/20 text-green-400'
                          : 'border-zinc-600 bg-zinc-700/30 text-zinc-300 hover:border-zinc-500'
                      }`}
                    >
                      <div className="flex flex-col items-center gap-2">
                        <Banknote className="h-6 w-6" />
                        <span className="text-sm font-medium">Dinheiro</span>
                        <span className="text-xs opacity-75">Sem taxa</span>
                      </div>
                    </button>
                    
                    <button
                      onClick={() => setSelectedPaymentMethod('pix')}
                      className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                        selectedPaymentMethod === 'pix'
                          ? 'border-green-500 bg-green-500/20 text-green-400'
                          : 'border-zinc-600 bg-zinc-700/30 text-zinc-300 hover:border-zinc-500'
                      }`}
                    >
                      <div className="flex flex-col items-center gap-2">
                        <Smartphone className="h-6 w-6" />
                        <span className="text-sm font-medium">PIX</span>
                        <span className="text-xs opacity-75">Sem taxa</span>
                      </div>
                    </button>
                    
                    <button
                      onClick={() => setSelectedPaymentMethod('debit_card')}
                      className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                        selectedPaymentMethod === 'debit_card'
                          ? 'border-blue-500 bg-blue-500/20 text-blue-400'
                          : 'border-zinc-600 bg-zinc-700/30 text-zinc-300 hover:border-zinc-500'
                      }`}
                    >
                      <div className="flex flex-col items-center gap-2">
                        <CreditCard className="h-6 w-6" />
                        <span className="text-sm font-medium">Débito</span>
                        <span className="text-xs opacity-75">Taxa {paymentFees.debit_card.toFixed(2)}%</span>
                      </div>
                    </button>
                    
                    <button
                       onClick={() => {
                         setSelectedPaymentMethod('credit_card');
                         setSelectedInstallments(1); // Reset para 1x quando selecionar crédito
                       }}
                       className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                         selectedPaymentMethod === 'credit_card'
                           ? 'border-orange-500 bg-orange-500/20 text-orange-400'
                           : 'border-zinc-600 bg-zinc-700/30 text-zinc-300 hover:border-zinc-500'
                       }`}
                     >
                       <div className="flex flex-col items-center gap-2">
                         <CreditCard className="h-6 w-6" />
                         <span className="text-sm font-medium">Crédito</span>
                         <span className="text-xs opacity-75">Taxa variável</span>
                       </div>
                     </button>
                  </div>
                </div>

                {/* Opções de Parcelamento - Apenas para Cartão de Crédito */}
                {selectedPaymentMethod === 'credit_card' && (
                  <div>
                    <h3 className="font-medium text-white mb-3">Parcelamento</h3>
                    <div className="grid grid-cols-3 gap-3">
                      <button
                        onClick={() => setSelectedInstallments(1)}
                        className={`p-3 rounded-lg border-2 transition-all duration-200 ${
                          selectedInstallments === 1
                            ? 'border-orange-500 bg-orange-500/20 text-orange-400'
                            : 'border-zinc-600 bg-zinc-700/30 text-zinc-300 hover:border-zinc-500'
                        }`}
                      >
                        <div className="text-center">
                          <div className="font-medium">1x</div>
                          <div className="text-xs opacity-75">Taxa {paymentFees.credit_card.toFixed(2)}%</div>
                          <div className="text-xs font-medium mt-1">
                            {formatCurrency(totalValue)}
                          </div>
                        </div>
                      </button>
                      
                      <button
                        onClick={() => setSelectedInstallments(2)}
                        className={`p-3 rounded-lg border-2 transition-all duration-200 ${
                          selectedInstallments === 2
                            ? 'border-orange-500 bg-orange-500/20 text-orange-400'
                            : 'border-zinc-600 bg-zinc-700/30 text-zinc-300 hover:border-zinc-500'
                        }`}
                      >
                        <div className="text-center">
                          <div className="font-medium">2x</div>
                          <div className="text-xs opacity-75">Taxa {paymentFees.credit_card_2x.toFixed(2)}%</div>
                          <div className="text-xs font-medium mt-1">
                            {formatCurrency(totalValue / 2)}
                          </div>
                        </div>
                      </button>
                      
                      <button
                        onClick={() => setSelectedInstallments(3)}
                        className={`p-3 rounded-lg border-2 transition-all duration-200 ${
                          selectedInstallments === 3
                            ? 'border-orange-500 bg-orange-500/20 text-orange-400'
                            : 'border-zinc-600 bg-zinc-700/30 text-zinc-300 hover:border-zinc-500'
                        }`}
                      >
                        <div className="text-center">
                          <div className="font-medium">3x</div>
                          <div className="text-xs opacity-75">Taxa {paymentFees.credit_card_3x.toFixed(2)}%</div>
                          <div className="text-xs font-medium mt-1">
                            {formatCurrency(totalValue / 3)}
                          </div>
                        </div>
                      </button>
                    </div>
                  </div>
                )}

                {/* Resumo do Atendimento */}
                <div className="border-t border-zinc-700/50 pt-4">
                  <h3 className="font-medium text-white mb-3">Resumo do Atendimento</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-zinc-300">Tempo Total:</span>
                      <span className="flex items-center gap-1 text-zinc-300">
                        <Clock className="h-4 w-4" />
                        {formatTime(totalTime)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-zinc-300">Serviços Realizados:</span>
                      <span className="flex items-center gap-1 text-zinc-300">
                        <DollarSign className="h-4 w-4" />
                        {formatCurrency(servicesValue + extraServicesValue)}
                      </span>
                    </div>
                    {selectedProducts.length > 0 && (
                      <div className="flex justify-between items-center">
                        <span className="text-zinc-300">Valor dos Produtos:</span>
                        <span className="flex items-center gap-1 text-zinc-300">
                          <DollarSign className="h-4 w-4" />
                          {formatCurrency(productsValue)}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between items-center pt-2 border-t border-zinc-700/50 font-semibold">
                      <span className="text-white">Valor Total:</span>
                      <span className="flex items-center gap-1 text-green-400 text-xl">
                        <DollarSign className="h-5 w-5" />
                        {formatCurrency(totalValue)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="flex justify-end gap-3 p-6 border-t border-zinc-700/50 bg-zinc-800/50">
                <Button
                  variant="outline"
                  onClick={handleClose}
                  disabled={isSubmitting}
                  className="border-zinc-600 text-zinc-300 hover:bg-zinc-700 hover:text-white"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleComplete}
                  disabled={isSubmitting}
                  className="bg-orange-500 hover:bg-orange-600 text-white"
                >
                  {isSubmitting ? (
                    <>
                      <Spinner className="mr-2 h-4 w-4" />
                      Finalizando...
                    </>
                  ) : (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      Concluir Serviço
                    </>
                  )}
                </Button>
              </div>
            </div>
          </motion.div>

          {/* Product Selector */}
          <ProductSelector
            isOpen={isProductSelectorOpen}
            onClose={handleCloseProductSelector}
            selectedProducts={selectedProducts}
            onProductsChange={setSelectedProducts}
            pauseUpdates={pauseUpdates}
            resumeUpdates={resumeUpdates}
          />
          
          {/* Service Selector */}
          <ServicesProvider>
            <ServiceSelector
              isOpen={isServiceSelectorOpen}
              onClose={handleCloseServiceSelector}
              selectedServices={selectedExtraServices}
              onServicesChange={setSelectedExtraServices}
              pauseUpdates={pauseUpdates}
              resumeUpdates={resumeUpdates}
              excludeServiceIds={queueEntry.queueServices.map(qs => qs.service?.id || '').filter(Boolean)}
            />
          </ServicesProvider>
        </>
      )}
    </AnimatePresence>
  );
};