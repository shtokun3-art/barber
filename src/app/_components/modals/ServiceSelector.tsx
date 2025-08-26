"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Plus, Scissors, Clock, DollarSign, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useServicesContext } from "@/lib/context/servicesContext";
import { Spinner } from "../spinner";

interface Service {
  id: string;
  name: string;
  price: number;
  averageTime: number;
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

interface ServiceSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  selectedServices: SelectedService[];
  onServicesChange: (services: SelectedService[]) => void;
  pauseUpdates?: () => void;
  resumeUpdates?: () => void;
  excludeServiceIds?: string[]; // Serviços já selecionados na fila que não devem aparecer
}

export const ServiceSelector = ({
  isOpen,
  onClose,
  selectedServices,
  onServicesChange,
  pauseUpdates,
  resumeUpdates,
  excludeServiceIds = []
}: ServiceSelectorProps) => {
  const { services, loading } = useServicesContext();
  const [searchTerm, setSearchTerm] = useState("");

  // Pausar/retomar atualizações quando modal abrir/fechar
  useEffect(() => {
    if (isOpen) {
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

  // Filtrar serviços por termo de busca (mostrar todos os serviços)
  const filteredServices = services.filter(service =>
    service.name.toLowerCase().includes(searchTerm.toLowerCase())
  ).sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()));

  // Adicionar serviço à seleção
  const handleAddService = (service: Service) => {
    const existingService = selectedServices.find(s => s.id === service.id);
    
    if (existingService) {
      // Se já existe, incrementa a quantidade
      const updatedServices = selectedServices.map(s =>
        s.id === service.id
          ? {
              ...s,
              quantity: s.quantity + 1,
              totalPrice: (s.quantity + 1) * s.price,
              totalTime: (s.quantity + 1) * s.averageTime
            }
          : s
      );
      onServicesChange(updatedServices);
    } else {
      // Se não existe, adiciona novo serviço
      const newService: SelectedService = {
        id: service.id,
        name: service.name,
        price: service.price,
        averageTime: service.averageTime,
        quantity: 1,
        totalPrice: service.price,
        totalTime: service.averageTime
      };
      onServicesChange([...selectedServices, newService]);
    }
  };

  // Remover serviço da seleção
  const handleRemoveService = (serviceId: string) => {
    const updatedServices = selectedServices.filter(s => s.id !== serviceId);
    onServicesChange(updatedServices);
  };

  // Diminuir quantidade do serviço
  const handleDecreaseQuantity = (serviceId: string) => {
    const updatedServices = selectedServices.map(s => {
      if (s.id === serviceId) {
        if (s.quantity > 1) {
          return {
            ...s,
            quantity: s.quantity - 1,
            totalPrice: (s.quantity - 1) * s.price,
            totalTime: (s.quantity - 1) * s.averageTime
          };
        } else {
          return null; // Será filtrado abaixo
        }
      }
      return s;
    }).filter(Boolean) as SelectedService[];
    
    onServicesChange(updatedServices);
  };

  // Calcular total dos serviços selecionados
  const totalServicesValue = selectedServices.reduce((total, service) => total + service.totalPrice, 0);
  const totalServicesTime = selectedServices.reduce((total, service) => total + service.totalTime, 0);

  // Formatar moeda
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  // Formatar tempo
  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}min`;
    }
    return `${mins}min`;
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-zinc-800 rounded-xl border border-zinc-700/50 w-full max-w-4xl max-h-[90vh] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-zinc-700/50">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-500/20 rounded-lg">
                <Scissors size={20} className="text-orange-500" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white">Adicionar Serviços</h3>
                <p className="text-zinc-400 text-sm">Selecione serviços adicionais para este atendimento</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-zinc-400 hover:text-white hover:bg-zinc-700"
            >
              <X size={20} />
            </Button>
          </div>

          {/* Content */}
          <div className="flex-1 flex overflow-hidden">
            {/* Services List */}
            <div className="flex-1 p-6 border-r border-zinc-700/50">
              {/* Search */}
              <div className="relative mb-4">
                <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-400" />
                <Input
                  type="text"
                  placeholder="Buscar serviços..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-zinc-700/50 border-zinc-600 text-white placeholder-zinc-400"
                />
              </div>

              {/* Services Grid */}
              <div className="space-y-2 max-h-96 overflow-y-auto custom-scrollbar">
                {loading ? (
                  <div className="flex justify-center py-8">
                    <Spinner />
                  </div>
                ) : filteredServices.length > 0 ? (
                  filteredServices.map((service) => {
                    const selectedService = selectedServices.find(s => s.id === service.id);
                    const isSelected = !!selectedService;
                    
                    return (
                      <motion.div
                        key={service.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`p-4 rounded-lg border transition-all duration-200 ${
                          isSelected
                            ? 'bg-orange-500/20 border-orange-500/50'
                            : 'bg-zinc-700/30 border-zinc-600/50 hover:bg-zinc-700/50 hover:border-zinc-500/50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h4 className="text-white font-medium mb-1">{service.name}</h4>
                            <div className="flex items-center gap-4 text-sm text-zinc-300">
                              <span className="flex items-center gap-1">
                                <DollarSign className="h-4 w-4" />
                                {formatCurrency(service.price)}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                {formatTime(service.averageTime)}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {isSelected ? (
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDecreaseQuantity(service.id)}
                                  className="h-7 w-7 p-0 text-zinc-400 hover:text-white hover:bg-zinc-600 rounded-full"
                                >
                                  -
                                </Button>
                                <span className="bg-orange-500/20 text-orange-400 text-sm px-3 py-1 rounded-full font-medium min-w-[40px] text-center">
                                  {selectedService.quantity}
                                </span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleAddService(service)}
                                  className="h-7 w-7 p-0 text-zinc-400 hover:text-white hover:bg-zinc-600 rounded-full"
                                >
                                  +
                                </Button>
                              </div>
                            ) : (
                              <Button
                                size="sm"
                                onClick={() => handleAddService(service)}
                                className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg"
                              >
                                <Plus size={16} className="mr-1" />
                                Adicionar
                              </Button>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })
                ) : (
                  <div className="text-center py-8 text-zinc-400">
                    <Scissors className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p className="font-medium mb-1">Nenhum serviço encontrado</p>
                    <p className="text-sm">Tente ajustar sua busca</p>
                  </div>
                )}
              </div>
            </div>

            {/* Selected Services */}
            <div className="w-80 p-6">
              <h4 className="text-white font-medium mb-4 flex items-center gap-2">
                <Scissors className="h-4 w-4 text-orange-500" />
                Serviços Selecionados ({selectedServices.length})
              </h4>
              
              {selectedServices.length > 0 ? (
                <div className="space-y-3 max-h-80 overflow-y-auto custom-scrollbar">
                  {selectedServices.map((service) => (
                    <div key={service.id} className="bg-zinc-700/50 rounded-lg p-3 border border-zinc-600/50">
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="text-white font-medium text-sm">{service.name}</h5>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveService(service.id)}
                          className="h-6 w-6 p-0 text-zinc-400 hover:text-red-400 hover:bg-red-500/20"
                        >
                          <X size={12} />
                        </Button>
                      </div>
                      
                      <div className="flex items-center justify-between text-xs text-zinc-300 mb-2">
                        <span>{formatCurrency(service.price)} cada</span>
                        <span>{formatTime(service.averageTime)} cada</span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDecreaseQuantity(service.id)}
                            className="h-6 w-6 p-0 text-zinc-400 hover:text-white hover:bg-zinc-600"
                          >
                            -
                          </Button>
                          <span className="text-white text-sm font-medium w-8 text-center">
                            {service.quantity}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleAddService({ id: service.id, name: service.name, price: service.price, averageTime: service.averageTime })}
                            className="h-6 w-6 p-0 text-zinc-400 hover:text-white hover:bg-zinc-600"
                          >
                            +
                          </Button>
                        </div>
                        <div className="text-right">
                          <div className="text-orange-400 font-medium text-sm">
                            {formatCurrency(service.totalPrice)}
                          </div>
                          <div className="text-zinc-400 text-xs">
                            {formatTime(service.totalTime)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-zinc-400">
                  <Scissors className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Nenhum serviço selecionado</p>
                </div>
              )}
              
              {/* Total */}
              {selectedServices.length > 0 && (
                <div className="mt-4 pt-4 border-t border-zinc-700/50">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-zinc-300">Total de Serviços:</span>
                      <span className="text-white font-medium">
                        {selectedServices.reduce((sum, s) => sum + s.quantity, 0)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-zinc-300">Tempo Total:</span>
                      <span className="text-white font-medium">{formatTime(totalServicesTime)}</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold">
                      <span className="text-white">Total:</span>
                      <span className="text-orange-400">{formatCurrency(totalServicesValue)}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 p-6 border-t border-zinc-700/50">
            <Button
              variant="outline"
              onClick={onClose}
              className="border-zinc-600 text-zinc-300 hover:bg-zinc-700 hover:text-white"
            >
              Cancelar
            </Button>
            <Button
              onClick={onClose}
              className="bg-orange-500 hover:bg-orange-600 text-white"
            >
              Confirmar Serviços
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};