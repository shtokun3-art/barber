"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Search, Plus, Scissors, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AddServiceModal } from "@/app/_components/modals/AddServiceModal";
import { ServicesProvider, useServicesContext } from "@/lib/context/servicesContext";
import { Spinner } from "@/app/_components/spinner";
import { Service } from "@/lib/hooks/useServices";

const ServicesContent = () => {
  const [findService, setFindService] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { loading, services, deleteService, refetch, deletingServiceId } = useServicesContext();

  const filteredServices = services?.filter((service: Service) =>
    service.name.toLowerCase().includes(findService.toLowerCase())
  );

  const handleDeleteService = async (serviceId: string) => {
    await deleteService(serviceId);
    await refetch();
  };

  return (
    <div className="w-full h-full flex flex-col">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="max-w-7xl mx-auto w-full flex flex-col h-full"
      >
        {/* Header - Fixed */}
        <div className="p-6 pb-4 flex-shrink-0">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Gerenciar Serviços</h2>
              <p className="text-zinc-400">Configure os serviços oferecidos pela barbearia</p>
            </div>
            <Button 
              onClick={() => setIsModalOpen(true)}
              className="bg-orange-500 hover:bg-orange-600 text-white"
            >
              <Plus size={18} className="mr-2" />
              Novo Serviço
            </Button>
          </div>

          {/* Search Bar */}
          <div className="flex gap-4 items-center bg-zinc-800/50 p-4 rounded-xl border border-zinc-700/50">
            <div className="relative flex-1">
              <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-400" />
              <Input
                type="text"
                placeholder="Buscar serviços por nome..."
                value={findService}
                onChange={(e) => setFindService(e.target.value)}
                className="pl-10 bg-zinc-700/50 border-zinc-600 text-white placeholder-zinc-400 focus:border-orange-500"
              />
            </div>
          </div>
        </div>

        {/* Services List - Scrollable */}
        <div className="flex-1 px-6 pb-6 overflow-hidden">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-zinc-800/30 rounded-xl border border-zinc-700/50 h-full flex flex-col"
          >
            {/* Header da lista - Fixed */}
            <div className="p-6 pb-4 flex-shrink-0">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <Scissors size={20} className="text-blue-500" />
                </div>
                <h3 className="text-xl font-semibold text-white">Serviços Cadastrados</h3>
                {filteredServices && (
                  <span className="text-zinc-400 text-sm">({filteredServices.length} serviços)</span>
                )}
              </div>
            </div>

            {/* Conteúdo da lista - Scrollable */}
             <div className="flex-1 px-6 pb-6 overflow-y-auto">
               {loading ? (
                 <div className="flex items-center justify-center py-12">
                   <Spinner />
                 </div>
               ) : filteredServices && filteredServices.length > 0 ? (
                 <div className="space-y-2">
                   {/* Header */}
                   <div className="grid grid-cols-12 gap-4 px-4 py-2 text-xs text-zinc-500/80 font-medium border-b border-zinc-700/50">
                     <div className="col-span-5">Serviço</div>
                     <div className="col-span-2 text-center">Valor</div>
                     <div className="col-span-2 text-center">Tempo</div>
                     <div className="col-span-3 text-center">Ações</div>
                   </div>
              
              {/* Services */}
              {filteredServices.map((service: Service) => {
                const formattedValue = service.price.toLocaleString("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                });
                
                return (
                  <motion.div
                    key={service.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="grid grid-cols-12 gap-4 px-4 py-3 rounded-lg border border-zinc-700/30 bg-zinc-700/20 hover:bg-zinc-700/40 transition-all duration-200"
                  >
                    <div className="col-span-5 flex items-center">
                      <span className="text-white font-medium hover:text-orange-500 transition-colors duration-200">
                        {service.name}
                      </span>
                    </div>
                    <div className="col-span-2 flex items-center justify-center">
                      <span className="text-green-400 font-bold">{formattedValue}</span>
                    </div>
                    <div className="col-span-2 flex items-center justify-center">
                      <span className="text-zinc-300">{service.averageTime} min</span>
                    </div>
                    <div className="col-span-3 flex items-center justify-center">
                      <Button
                        onClick={() => handleDeleteService(service.id)}
                        size="sm"
                        variant="destructive"
                        className="bg-red-600 hover:bg-red-700 text-white"
                        disabled={deletingServiceId === service.id}
                      >
                        {deletingServiceId === service.id ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-1"></div>
                            Removendo...
                          </>
                        ) : (
                          <>
                            <Trash2 size={16} className="mr-1" />
                            Remover
                          </>
                        )}
                      </Button>
                    </div>
                  </motion.div>
                );
              })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="text-6xl mb-4">✂️</div>
                  <p className="text-zinc-400 text-lg font-medium mb-2">
                    {findService ? 'Nenhum serviço encontrado' : 'Nenhum serviço cadastrado'}
                  </p>
                  <p className="text-zinc-500 text-sm text-center max-w-md">
                    {findService
                       ? `Não encontramos serviços com o termo "${findService}". Tente buscar por outro nome.`
                      : 'Comece adicionando os serviços que sua barbearia oferece. Clique no botão "Novo Serviço" para começar.'
                    }
                  </p>
                  {!findService && (
                    <Button
                       onClick={() => setIsModalOpen(true)}
                      className="mt-4 bg-orange-500 hover:bg-orange-600 text-white"
                    >
                      <Plus size={16} className="mr-2" />
                      Adicionar Primeiro Serviço
                    </Button>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Modal */}
      <AddServiceModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </div>
  );
};

export const ServicesSettingsPage = () => {
  return (
    <ServicesProvider>
      <ServicesContent />
    </ServicesProvider>
  );
};