"use client";

import { useState, useMemo } from "react";
import { useHistory, HistoryEntry } from "@/lib/hooks/useHistory";
import { useServices } from "@/lib/hooks/useServices";
import { useItemsContext } from "@/lib/context/ItemsContext";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CalendarIcon, FilterIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { HistoryDetailModal } from "@/app/_components/modals/HistoryDetailModal";
import { CustomCalendar } from "@/app/_components/customCalendar";

interface HistoryTableProps {
  selectedService: string;
  setSelectedService: (value: string) => void;
  selectedProduct: string;
  setSelectedProduct: (value: string) => void;
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  startDate: Date | undefined;
  setStartDate: (date: Date | undefined) => void;
  endDate: Date | undefined;
  setEndDate: (date: Date | undefined) => void;
  selectedPaymentMethod: string;
  setSelectedPaymentMethod: (value: string) => void;
  filteredHistory: HistoryEntry[];
}

export const HistoryTable = ({ selectedService, setSelectedService, selectedProduct, setSelectedProduct, searchTerm, setSearchTerm, startDate, setStartDate, endDate, setEndDate, selectedPaymentMethod, setSelectedPaymentMethod, filteredHistory }: HistoryTableProps) => {
  const { loading, error } = useHistory();
  const { services } = useServices();
  const { items } = useItemsContext();
  const [selectedHistoryEntry, setSelectedHistoryEntry] = useState<HistoryEntry | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 10;

  // Paginação
  const totalPages = Math.ceil(filteredHistory.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedHistory = filteredHistory.slice(startIndex, endIndex);

  // Reset da página quando os filtros mudam
  useMemo(() => {
    setCurrentPage(1);
  }, [selectedService, selectedProduct, searchTerm, selectedPaymentMethod]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  };



  const clearFilters = () => {
    setSelectedService("all");
    setSelectedProduct("all");
    setSelectedPaymentMethod("all");
    setSearchTerm("");
    setStartDate(undefined);
    setEndDate(undefined);
    setCurrentPage(1);
  };

  const goToPage = (page: number) => {
    setCurrentPage(page);
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handleRowClick = (entry: HistoryEntry) => {
    setSelectedHistoryEntry(entry);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedHistoryEntry(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-500 p-4">
        Erro ao carregar histórico: {error}
      </div>
    );
  }

  return (
    <>
      <style jsx>{`
        .scrollbar-orange {
          scrollbar-width: thin;
          scrollbar-color: #f97316 #374151;
        }
        .scrollbar-orange::-webkit-scrollbar {
          width: 8px;
        }
        .scrollbar-orange::-webkit-scrollbar-track {
          background: #374151;
          border-radius: 4px;
        }
        .scrollbar-orange::-webkit-scrollbar-thumb {
          background: #f97316;
          border-radius: 4px;
        }
        .scrollbar-orange::-webkit-scrollbar-thumb:hover {
          background: #ea580c;
        }
      `}</style>
      <div className="space-y-4">
      {/* Filtros */}
      <div className="bg-zinc-800 p-4 rounded-lg space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <FilterIcon className="h-5 w-5 text-orange-500" />
          <h3 className="text-lg font-semibold text-white">Filtros</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Busca por nome */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Buscar cliente
            </label>
            <Input
              type="text"
              placeholder="Nome do cliente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-zinc-700 border-zinc-600 text-white"
            />
          </div>

          {/* Filtro por serviço */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Serviço
            </label>
            <Select value={selectedService} onValueChange={setSelectedService}>
              <SelectTrigger className="bg-gradient-to-r from-zinc-700 to-zinc-600 border-orange-500/30 text-white hover:border-orange-500/50 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all duration-300 shadow-lg hover:shadow-orange-500/10">
                <SelectValue placeholder="Selecione um serviço" />
              </SelectTrigger>
              <SelectContent className="bg-zinc-800 border-zinc-600 shadow-2xl">
                <SelectItem value="all" className="text-white hover:bg-orange-500/20 focus:bg-orange-500/20 cursor-pointer transition-colors duration-200">
                  Todos os serviços
                </SelectItem>
                {services.map((service) => (
                  <SelectItem 
                    key={service.id} 
                    value={service.id}
                    className="text-white hover:bg-orange-500/20 focus:bg-orange-500/20 cursor-pointer transition-colors duration-200"
                  >
                    {service.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Filtro por produto */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Produto
            </label>
            <Select value={selectedProduct} onValueChange={setSelectedProduct}>
              <SelectTrigger className="bg-gradient-to-r from-zinc-700 to-zinc-600 border-orange-500/30 text-white hover:border-orange-500/50 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all duration-300 shadow-lg hover:shadow-orange-500/10">
                <SelectValue placeholder="Selecione um produto" />
              </SelectTrigger>
              <SelectContent className="bg-zinc-800 border-zinc-600 shadow-2xl">
                <SelectItem value="all" className="text-white hover:bg-orange-500/20 focus:bg-orange-500/20 cursor-pointer transition-colors duration-200">
                  Todos os produtos
                </SelectItem>
                {items.map((item) => (
                  <SelectItem 
                    key={item.id} 
                    value={item.id}
                    className="text-white hover:bg-orange-500/20 focus:bg-orange-500/20 cursor-pointer transition-colors duration-200"
                  >
                    {item.item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Filtro por método de pagamento */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Método de Pagamento
            </label>
            <Select value={selectedPaymentMethod} onValueChange={setSelectedPaymentMethod}>
              <SelectTrigger className="bg-gradient-to-r from-zinc-700 to-zinc-600 border-orange-500/30 text-white hover:border-orange-500/50 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all duration-300 shadow-lg hover:shadow-orange-500/10">
                <SelectValue placeholder="Todos os métodos" />
              </SelectTrigger>
              <SelectContent className="bg-zinc-800 border-zinc-600 shadow-2xl">
                <SelectItem value="all" className="text-white hover:bg-orange-500/20 focus:bg-orange-500/20 cursor-pointer transition-colors duration-200">
                  Todos os métodos
                </SelectItem>
                <SelectItem value="cash" className="text-white hover:bg-green-500/20 focus:bg-green-500/20 cursor-pointer transition-colors duration-200">
                  💵 Dinheiro
                </SelectItem>
                <SelectItem value="pix" className="text-white hover:bg-purple-500/20 focus:bg-purple-500/20 cursor-pointer transition-colors duration-200">
                  📱 PIX
                </SelectItem>
                <SelectItem value="debit_card" className="text-white hover:bg-blue-500/20 focus:bg-blue-500/20 cursor-pointer transition-colors duration-200">
                  💳 Cartão de Débito
                </SelectItem>
                <SelectItem value="credit_card" className="text-white hover:bg-orange-500/20 focus:bg-orange-500/20 cursor-pointer transition-colors duration-200">
                  💳 Cartão de Crédito
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <CustomCalendar
              startDate={startDate}
              endDate={endDate}
              onStartDateChange={setStartDate}
              onEndDateChange={setEndDate}
            />
        </div>

        <div className="flex justify-center">
          <Button
            onClick={clearFilters}
            className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white border-none shadow-lg hover:shadow-xl transition-all duration-300"
          >
            Limpar filtros
          </Button>
        </div>
      </div>

      {/* Cabeçalho da tabela */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold tracking-tight text-white">
            Histórico de Serviços
          </h2>
          
          {/* Controles de Paginação no cabeçalho */}
          {totalPages > 1 && (
            <div className="flex items-center gap-2">
              <Button
                onClick={goToPreviousPage}
                disabled={currentPage === 1}
                variant="outline"
                size="sm"
                className="border-zinc-600 text-gray-300 hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(3, totalPages) }, (_, i) => {
                  let pageNumber;
                  if (totalPages <= 3) {
                    pageNumber = i + 1;
                  } else if (currentPage <= 2) {
                    pageNumber = i + 1;
                  } else if (currentPage >= totalPages - 1) {
                    pageNumber = totalPages - 2 + i;
                  } else {
                    pageNumber = currentPage - 1 + i;
                  }
                  
                  return (
                    <Button
                      key={pageNumber}
                      onClick={() => goToPage(pageNumber)}
                      variant={currentPage === pageNumber ? "default" : "outline"}
                      size="sm"
                      className={currentPage === pageNumber 
                        ? "bg-orange-500 hover:bg-orange-600 text-white" 
                        : "border-zinc-600 text-gray-300 hover:bg-zinc-700"
                      }
                    >
                      {pageNumber}
                    </Button>
                  );
                })}
              </div>
              
              <Button
                onClick={goToNextPage}
                disabled={currentPage === totalPages}
                variant="outline"
                size="sm"
                className="border-zinc-600 text-gray-300 hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              
              <span className="text-sm text-gray-400 ml-2">
                {currentPage}/{totalPages}
              </span>
            </div>
          )}
        </div>
        
        <div className="text-sm text-gray-400">
          {filteredHistory.length > 0 ? (
            <>
              Mostrando {startIndex + 1}-{Math.min(endIndex, filteredHistory.length)} de {filteredHistory.length} {filteredHistory.length === 1 ? 'registro' : 'registros'}
            </>
          ) : (
            '0 registros'
          )}
        </div>
      </div>

      {/* Tabela */}
      <div className="bg-zinc-800 rounded-lg overflow-hidden">
        <div className="max-h-[600px] overflow-y-auto scrollbar-orange">
          <Table>
            <TableHeader className="sticky top-0 bg-zinc-800 z-10">
              <TableRow className="border-b border-zinc-700">
                <TableHead className="text-gray-300">Data/Hora</TableHead>
                <TableHead className="text-gray-300">Cliente</TableHead>
                <TableHead className="text-gray-300">Barbeiro</TableHead>
                <TableHead className="text-gray-300">Serviços</TableHead>
                <TableHead className="text-gray-300 text-right">Valor Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <AnimatePresence>
                {paginatedHistory.length > 0 ? (
                  paginatedHistory.map((entry, index) => (
                    <motion.tr
                      key={entry.id}
                      className="border-b border-zinc-700 hover:bg-zinc-700/50 cursor-pointer transition-all duration-200 hover:shadow-lg"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ 
                        duration: 0.3, 
                        delay: index * 0.05,
                        ease: "easeInOut" 
                      }}
                      onClick={() => handleRowClick(entry)}
                      title="Clique para ver detalhes"
                    >
                      <TableCell className="text-white">
                        {formatDate(entry.createdAt)}
                      </TableCell>
                      <TableCell className="text-white">
                        <div>
                          <div className="font-medium">{entry.user.name}</div>
                          <div className="text-sm text-gray-400">{entry.user.phone}</div>
                        </div>
                      </TableCell>
                      <TableCell className="text-white">
                        {entry.barber.name}
                      </TableCell>
                      <TableCell className="text-white">
                        <div 
                          className="space-y-1 cursor-pointer hover:bg-zinc-700/30 p-2 rounded transition-colors"
                          onClick={() => handleRowClick(entry)}
                          title="Clique para ver todos os detalhes"
                        >
                          {entry.services.slice(0, 2).map((historyService) => (
                            <div
                              key={historyService.id}
                              className="text-sm bg-zinc-700 px-2 py-1 rounded inline-block mr-1 mb-1"
                            >
                              {historyService.service.name}
                            </div>
                          ))}
                          {entry.services.length > 2 && (
                            <div className="text-sm bg-orange-500/20 text-orange-400 px-2 py-1 rounded inline-block mr-1 mb-1">
                              +{entry.services.length - 2} mais...
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-white text-right font-medium">
                        {formatCurrency(entry.totalValue)}
                      </TableCell>
                    </motion.tr>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="text-center text-gray-400 py-8"
                    >
                      Nenhum registro encontrado
                    </TableCell>
                  </TableRow>
                )}
              </AnimatePresence>
            </TableBody>
          </Table>
        </div>
      </div>



      {/* Modal de Detalhes */}
      <HistoryDetailModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        historyEntry={selectedHistoryEntry}
      />
    </div>
    </>
  );
};