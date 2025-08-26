import { useMemo, useState } from "react";
import { useQueue, QueueEntry } from "@/lib/hooks/useQueue";
import { motion, AnimatePresence } from "framer-motion";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
  ColumnDef,
} from "@tanstack/react-table";
import { createColumns } from "./columns";
import { Spinner } from "../spinner";
import { CompleteServiceModal } from "../modals/CompleteServiceModal";
import { toast } from "sonner";

interface ServiceData {
  serviceId: string;
  price: number;
  time: number;
}

interface ProductData {
  id: string;
  name: string;
  price: number;
  quantity: number;
  totalPrice: number;
}

interface CustomColumnMeta<TData, TValue> {
  responsive?: {
    hideOnMobile?: boolean;
  };
}

interface QueueAdminTableProps {
  selectedBarber: string | null;
}

export const QueueAdminTable = ({ selectedBarber }: QueueAdminTableProps) => {
  const { queueEntries, loading, isFirstLoad, error, refetch, completeService, cancelEntry, movePosition, pauseUpdates, resumeUpdates } = useQueue();
  const [modalStates, setModalStates] = useState<Record<string, boolean>>({});
  
  // Estado global para o modal de finalizar atendimento
  const [activeCompleteModal, setActiveCompleteModal] = useState<{
    isOpen: boolean;
    queueEntry: QueueEntry | null;
  }>({ isOpen: false, queueEntry: null });
  
  // Estado para controlar se está processando
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredEntries = useMemo(() => {
    if (!queueEntries) return [];
    return selectedBarber
      ? queueEntries.filter((entry) => entry.barberId === selectedBarber)
      : queueEntries;
  }, [queueEntries, selectedBarber]);

  const handleOpenModal = (entryId: string) => {
    pauseUpdates();
    setModalStates(prev => ({ ...prev, [entryId]: true }));
  };

  const handleCloseModal = (entryId: string) => {
    resumeUpdates();
    setModalStates(prev => ({ ...prev, [entryId]: false }));
  };
  
  // Funções para o modal global de finalizar atendimento
  const handleOpenCompleteModal = (queueEntry: QueueEntry) => {
    pauseUpdates();
    setActiveCompleteModal({ isOpen: true, queueEntry });
  };
  
  const handleCloseCompleteModal = () => {
    resumeUpdates();
    setActiveCompleteModal({ isOpen: false, queueEntry: null });
  };
  
  // Função para completar o serviço
  const handleCompleteService = async (
    services: ServiceData[],
    products: ProductData[],
    paymentMethod: 'cash' | 'credit_card' | 'debit_card' | 'pix',
    installments: number,
    extraServices?: any[]
  ) => {
    if (!activeCompleteModal.queueEntry) return;
    
    setIsSubmitting(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      await completeService(activeCompleteModal.queueEntry.id, services, products, paymentMethod, installments, extraServices);
      toast.success("Serviço concluído com sucesso!");
      handleCloseCompleteModal();
      await refetch();
    } catch (error) {
      toast.error("Erro ao concluir serviço");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Wrapper para adaptar a assinatura da função completeService
  const completeServiceWrapper = async (id: string, services: ServiceData[], products?: ProductData[]) => {
    // Esta função será chamada pelo modal, não diretamente pelas colunas
    // A implementação real está em handleCompleteService
    return Promise.resolve();
  };

  const columns = useMemo(() => {
    return createColumns({
      completeService: completeServiceWrapper,
      cancelEntry,
      movePosition,
      pauseUpdates,
      resumeUpdates,
      modalStates,
      onOpenModal: handleOpenModal,
      onCloseModal: handleCloseModal,
      onOpenCompleteModal: handleOpenCompleteModal,
      refetch,
    });
  }, [completeService, cancelEntry, movePosition, pauseUpdates, resumeUpdates, modalStates, refetch]);

  const table = useReactTable({
    data: filteredEntries,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: 7,
      },
    },
  });

  if (loading && isFirstLoad) {
    return (
      <div className="flex justify-center py-10">
        <Spinner />
      </div>
    );
  }


  if (error) {
    return (
      <div className="p-4 text-center text-red-500">
        Erro: {error}
        <button
          onClick={() => refetch()}
          className="ml-2 text-blue-500 underline"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto">
      <div className="transition-all duration-500 ease-in-out">
        <AnimatePresence mode="popLayout">
          <motion.div
            key={isFirstLoad ? 'initial-load' : filteredEntries.map(item => item.id).join('-')}
            initial={isFirstLoad ? { opacity: 0, y: 20 } : false}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            layout
          >
            <Table className="min-w-full border border-gray-200/20 rounded-lg">
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id} className="bg-zinc-900">
              {headerGroup.headers.map((header) => {
                const hideOnMobile =
                  (header.column.columnDef.meta as CustomColumnMeta<
                    QueueEntry,
                    unknown
                  >)?.responsive?.hideOnMobile ?? false;
                return (
                  <TableHead
                    key={header.id}
                    className={`px-4 py-2 text-left text-sm font-medium text-white ${
                      hideOnMobile ? "hidden md:table-cell" : ""
                    }`}
                    style={{ width: header.column.columnDef.size }}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                );
              })}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          <AnimatePresence>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row, index) => (
                <motion.tr
                  key={row.original.id}
                  className="border-b border-gray-200/50 hover:bg-zinc-800"
                  initial={isFirstLoad ? { opacity: 0, x: -20 } : false}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20, scale: 0.95 }}
                  transition={{ 
                    duration: 0.3, 
                    delay: isFirstLoad ? index * 0.05 : 0,
                    ease: "easeInOut" 
                  }}
                  layout
                  layoutId={`row-${row.original.id}`}
                >
                  {row.getVisibleCells().map((cell) => {
                    const hideOnMobile =
                      (cell.column.columnDef.meta as CustomColumnMeta<
                        QueueEntry,
                        unknown
                      >)?.responsive?.hideOnMobile ?? false;
                    return (
                      <TableCell
                        key={cell.id}
                        className={`px-4 py-2 text-sm text-white ${
                          hideOnMobile ? "hidden md:table-cell" : ""
                        }`}
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    );
                  })}
                </motion.tr>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="py-4 text-center text-gray-500"
                >
                  Nenhuma entrada na fila.
                </TableCell>
              </TableRow>
            )}
          </AnimatePresence>
        </TableBody>
            </Table>
          </motion.div>
        </AnimatePresence>
      </div>


      
      {/* Controles de Paginação */}
      {table.getPageCount() > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-zinc-900/50 rounded-lg mt-4 relative z-0">
          {/* Informações da Página */}
          <div className="text-sm text-zinc-400">
            Mostrando {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1} a{' '}
            {Math.min(
              (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
              filteredEntries.length
            )}{' '}
            de {filteredEntries.length} pessoas na fila
          </div>

          {/* Controles de Navegação */}
          <div className="flex items-center gap-2 relative z-10">
            <button
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
              className="px-3 py-2 text-white bg-zinc-800 rounded-lg hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              ««
            </button>
            <button
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="px-4 py-2 text-white bg-zinc-800 rounded-lg hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Anterior
            </button>
            
            {/* Indicador de Página */}
            <div className="flex items-center gap-1 mx-2">
              {Array.from({ length: table.getPageCount() }, (_, i) => (
                <button
                  key={i}
                  onClick={() => {
                    console.log('Página', i + 1, 'clicada');
                    table.setPageIndex(i);
                  }}
                  className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors pointer-events-auto relative z-20 ${
                    i === table.getState().pagination.pageIndex
                      ? 'bg-orange-500 text-white'
                      : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>

            <button
              onClick={() => {
                table.nextPage();
              }}
              disabled={!table.getCanNextPage()}
              className="px-4 py-2 text-white bg-zinc-800 rounded-lg hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors pointer-events-auto relative z-20"
            >
              Próximo
            </button>
            <button
              onClick={() => {
                table.setPageIndex(table.getPageCount() - 1);
              }}
              disabled={!table.getCanNextPage()}
              className="px-3 py-2 text-white bg-zinc-800 rounded-lg hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors pointer-events-auto relative z-20"
            >
              »»
            </button>
          </div>
        </div>
      )}
      
      {/* Modal Global de Finalizar Atendimento - Fora da estrutura da tabela */}
      {activeCompleteModal.queueEntry && (
        <CompleteServiceModal
          isOpen={activeCompleteModal.isOpen}
          onClose={handleCloseCompleteModal}
          queueEntry={activeCompleteModal.queueEntry}
          onComplete={handleCompleteService}
          pauseUpdates={pauseUpdates}
          resumeUpdates={resumeUpdates}
        />
      )}
    </div>
  );
};