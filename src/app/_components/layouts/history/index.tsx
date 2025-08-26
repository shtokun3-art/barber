"use client";

import { HistoryTable } from "@/app/_components/historyTable";
import { ExportToPDF } from "@/app/_components/historyTable/ExportToPDF";
import { CalendarClock } from "lucide-react";
import { useHistory } from "@/lib/hooks/useHistory";
import { useServices } from "@/lib/hooks/useServices";
import { useItemsContext } from "@/lib/context/ItemsContext";
import { useState, useMemo } from "react";

export const HistoryAdmin = () => {
  const { history } = useHistory();
  const { services } = useServices();
  const { items } = useItemsContext();
  const [selectedService, setSelectedService] = useState<string>("all");
  const [selectedProduct, setSelectedProduct] = useState<string>("all");
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);

  const filteredHistory = useMemo(() => {
    return history.filter((entry) => {
      // Filtro por serviço
      if (selectedService !== "all") {
        const hasService = entry.services.some(
          (historyService) => historyService.service.id === selectedService
        );
        if (!hasService) return false;
      }

      // Filtro por produto
      if (selectedProduct !== "all") {
        const hasProduct = entry.items && entry.items.some(
          (historyItem) => historyItem.item.id === selectedProduct
        );
        if (!hasProduct) return false;
      }

      // Filtro por método de pagamento
      if (selectedPaymentMethod !== "all") {
        // Garantir que ambos os valores sejam strings e fazer comparação case-insensitive
        const entryPaymentMethod = String(entry.paymentMethod || '').toLowerCase().trim();
        const selectedMethod = String(selectedPaymentMethod).toLowerCase().trim();
        
        if (entryPaymentMethod !== selectedMethod) {
          return false;
        }
      }

      // Filtro por termo de busca (nome do cliente)
      if (searchTerm) {
        const matchesSearch = entry.user.name
          .toLowerCase()
          .includes(searchTerm.toLowerCase());
        if (!matchesSearch) return false;
      }

      // Filtro por data de início
      if (startDate) {
        const entryDate = new Date(entry.createdAt);
        const startOfDay = new Date(startDate);
        startOfDay.setHours(0, 0, 0, 0);
        if (entryDate < startOfDay) return false;
      }

      // Filtro por data de fim
      if (endDate) {
        const entryDate = new Date(entry.createdAt);
        const endOfDay = new Date(endDate);
        endOfDay.setHours(23, 59, 59, 999);
        if (entryDate > endOfDay) return false;
      }

      return true;
    });
  }, [history, selectedService, selectedProduct, selectedPaymentMethod, searchTerm, startDate, endDate]);

  return (
    <section className="w-full h-full overflow-clip px-6 p-2">
      <header className="glass-card-dark p-6 rounded-xl mb-6">
        <div className="flex justify-between items-center">
          <div className="flex gap-4 items-center">
            <div className="p-3 rounded-xl bg-gradient-primary shadow-glow">
              <CalendarClock size={32} className="text-white"/>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gradient-primary">Histórico de Atendimentos</h1>
              <p className="text-zinc-400">Visualize todos os atendimentos realizados</p>
            </div>
          </div>
          
          {/* Botão de PDF no cabeçalho */}
        <ExportToPDF
          filteredHistory={filteredHistory}
          searchTerm={searchTerm}
          selectedService={selectedService}
          selectedProduct={selectedProduct}
          selectedPaymentMethod={selectedPaymentMethod}
          services={services}
          items={items}
          isHeaderButton={true}
        />
        </div>
      </header>
      
      <main className="glass-card-dark p-6 rounded-xl h-full overflow-y-auto">
        <HistoryTable 
          selectedService={selectedService}
          setSelectedService={setSelectedService}
          selectedProduct={selectedProduct}
          setSelectedProduct={setSelectedProduct}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          startDate={startDate}
          setStartDate={setStartDate}
          endDate={endDate}
          setEndDate={setEndDate}
          selectedPaymentMethod={selectedPaymentMethod}
          setSelectedPaymentMethod={setSelectedPaymentMethod}
          filteredHistory={filteredHistory}
        />
      </main>
    </section>
  );
};