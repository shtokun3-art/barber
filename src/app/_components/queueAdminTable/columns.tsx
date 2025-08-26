import { ColumnDef, ColumnMeta } from "@tanstack/react-table";
import { QueueEntry } from "@/lib/hooks/useQueue";
import { Button } from "@/components/ui/button";
import { Check, ArrowDown, ArrowUp, X, Eye, Loader2 } from "lucide-react";
import * as emoji from "node-emoji";
import { Message } from "../messages/messages";
import { toast } from "sonner";
import { useState } from "react";

// Componente separado para as ações da linha
const ActionsCell = ({ row, table, actions }: {
  row: { index: number; original: QueueEntry };
  table: { getRowModel: () => { rows: any[] } };
  actions: QueueActions;
}) => {
  const isFirst = row.index === 0;
  const isLast = row.index === table.getRowModel().rows.length - 1;
  const [loadingStates, setLoadingStates] = useState({
    complete: false,
    cancel: false,
    moveUp: false,
    moveDown: false
  });

  const handleOpenCompleteModal = () => {
    actions.onOpenCompleteModal(row.original);
  };

  const handleCancel = async () => {
    try {
      setLoadingStates(prev => ({ ...prev, cancel: true }));
      actions.pauseUpdates();
      await actions.cancelEntry(row.original.id);
      await actions.refetch();
      toast.success('Atendimento cancelado com sucesso!');
    } catch (error) {
      console.error('Erro ao cancelar atendimento:', error);
      toast.error('Erro ao cancelar atendimento');
    } finally {
      setLoadingStates(prev => ({ ...prev, cancel: false }));
      actions.resumeUpdates();
    }
  };

  const handleMoveUp = async () => {
    try {
      setLoadingStates(prev => ({ ...prev, moveUp: true }));
      actions.pauseUpdates();
      await actions.movePosition(row.original.id, 'up');
      await actions.refetch();
      toast.success('Posição alterada com sucesso!');
    } catch (error) {
      console.error('Erro ao mover para cima:', error);
      toast.error('Erro ao alterar posição');
    } finally {
      setLoadingStates(prev => ({ ...prev, moveUp: false }));
      actions.resumeUpdates();
    }
  };

  const handleMoveDown = async () => {
    try {
      setLoadingStates(prev => ({ ...prev, moveDown: true }));
      actions.pauseUpdates();
      await actions.movePosition(row.original.id, 'down');
      await actions.refetch();
      toast.success('Posição alterada com sucesso!');
    } catch (error) {
      console.error('Erro ao mover para baixo:', error);
      toast.error('Erro ao alterar posição');
    } finally {
      setLoadingStates(prev => ({ ...prev, moveDown: false }));
      actions.resumeUpdates();
    }
  };

  return (
    <div className="flex items-center gap-1">
      <Button
        variant="ghost"
        size="sm"
        onClick={handleOpenCompleteModal}
        className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
        title="Concluir atendimento"
      >
        <Check className="h-4 w-4" />
      </Button>

      <Button
        variant="ghost"
        size="sm"
        onClick={handleCancel}
        disabled={loadingStates.cancel}
        className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
        title="Cancelar atendimento"
      >
        {loadingStates.cancel ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <X className="h-4 w-4" />
        )}
      </Button>

      {!isFirst && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleMoveUp}
          disabled={loadingStates.moveUp}
          className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
          title="Mover para cima"
        >
          {loadingStates.moveUp ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ArrowUp className="h-4 w-4" />
          )}
        </Button>
      )}

      {!isLast && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleMoveDown}
          disabled={loadingStates.moveDown}
          className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
          title="Mover para baixo"
        >
          {loadingStates.moveDown ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ArrowDown className="h-4 w-4" />
          )}
        </Button>
      )}
    </div>
  );
};

interface CustomColumnMeta<TData, TValue> extends ColumnMeta<TData, TValue> {
  responsive?: {
    hideOnMobile?: boolean;
  };
}

const calculateTotalPrice = (queueServices: QueueEntry["queueServices"]) => {
  return queueServices.reduce((total, qs) => (qs.service ? total + qs.service.price : total), 0);
};

const formatPhoneForWhatsApp = (phone: string) => {
  const cleanedPhone = phone.replace(/[\s()-]/g, "");
  if (!cleanedPhone.startsWith("+")) {
    return `+55${cleanedPhone}`;
  }
  return cleanedPhone;
};

const getGreetingByTime = () => {
  // Use a default greeting to avoid hydration issues
  // The greeting will be updated on the client side if needed
  if (typeof window === 'undefined') {
    return emoji.emojify(":wave: Olá!"); // Default server-side greeting
  }
  
  const hour = new Date().getHours();
  if (hour < 12) return emoji.emojify(":sunny: Bom dia!");
  if (hour < 18) return emoji.emojify(":city_sunset: Boa tarde!");
  return emoji.emojify(":crescent_moon: Boa noite!");
};

const createCustomWhatsAppMessage = (
  userName: string,
  queueServices: QueueEntry["queueServices"]
) => {
  return "";
};

const createWhatsAppLink = (
  phone: string,
  userName: string,
  queueServices: QueueEntry["queueServices"]
) => {
  const formattedPhone = formatPhoneForWhatsApp(phone);
  const message = createCustomWhatsAppMessage(userName, queueServices);
  const encodedMessage = encodeURIComponent(message);
  
  // Use client-side detection to avoid hydration issues
  if (typeof window !== 'undefined') {
    const screenWidth = window.innerWidth;
    if (screenWidth > 1050) {
      return `https://web.whatsapp.com/send?phone=${formattedPhone.replace("+", "")}&text=${encodedMessage}`;
    }
  }
  
  // Default to mobile WhatsApp link
  return `https://wa.me/${formattedPhone.replace("+", "")}?text=${encodedMessage}`;
};

interface QueueActions {
  completeService: (id: string, services: { serviceId: string; price: number; time: number }[], products?: { id: string; name: string; price: number; quantity: number; totalPrice: number }[]) => Promise<void>;
  cancelEntry: (id: string) => Promise<void>;
  movePosition: (id: string, direction: 'up' | 'down') => Promise<void>;
  pauseUpdates: () => void;
  resumeUpdates: () => void;
  modalStates: Record<string, boolean>;
  onOpenModal: (entryId: string) => void;
  onCloseModal: (entryId: string) => void;
  onOpenCompleteModal: (queueEntry: QueueEntry) => void;
  refetch: () => Promise<void>;
}

export const createColumns = (actions: QueueActions): ColumnDef<QueueEntry, any>[] => [
  {
    accessorKey: "position",
    header: "Posição",
    cell: ({ row }: { row: { index: number } }) => <span className="font-bold">{row.index + 1}º</span>,
    size: 10,
    meta: { responsive: {} } as CustomColumnMeta<QueueEntry, any>,
  },
  {
    accessorFn: (row) => row.user.name,
    header: "Nome",
    cell: ({ row }: { row: { original: QueueEntry } }) => (
      <span className="ease-in-out duration-200 hover:text-orange-500 hover:underline underline-offset-4 cursor-pointer">
        {row.original.user.name}
      </span>
    ),
    size: 150,
    meta: { responsive: {} } as CustomColumnMeta<QueueEntry, any>,
  },
  {
    accessorFn: (row) => row.user.phone,
    header: "Telefone",
    cell: ({ row }: { row: { original: QueueEntry } }) => {
      const phone = row.original.user.phone;
      const userName = row.original.user.name;
      const queueServices = row.original.queueServices;
      const whatsappLink = createWhatsAppLink(phone, userName, queueServices);
      return (
        <a
          href={whatsappLink}
          target="_blank"
          rel="noopener noreferrer"
          title="Abrir conversa no WhatsApp"
          className="text-orange-500 cursor-pointer hover:underline"
        >
          {phone}
        </a>
      );
    },
    size: 120,
    meta: { responsive: { hideOnMobile: false } } as CustomColumnMeta<QueueEntry, any>,
  },
  {
    accessorFn: (row) => row.queueServices.map((qs) => (qs.service ? qs.service.name : "Serviço não encontrado")).join(", "),
    header: "Serviços",
    cell: ({ row }: { row: { original: QueueEntry } }) => (
      <span>
        {row.original.queueServices
          .map((qs) => (qs.service ? qs.service.name : "Serviço não encontrado"))
          .join(", ")}
      </span>
    ),
    size: 200,
    meta: { responsive: { hideOnMobile: true } } as CustomColumnMeta<QueueEntry, any>,
  },
  {
    accessorFn: (row) => calculateTotalPrice(row.queueServices),
    header: "Valor Total",
    cell: ({ row }: { row: { original: QueueEntry } }) => {
      const total = calculateTotalPrice(row.original.queueServices);
      return <span>R$ {total.toFixed(2)}</span>;
    },
    size: 120,
    meta: { responsive: { hideOnMobile: true } } as CustomColumnMeta<QueueEntry, any>,
  },
  {
    id: "actions",
    header: "Ações",
    cell: ({ row, table }) => (
      <ActionsCell row={row} table={table} actions={actions} />
    ),
    size: 180,
    meta: { responsive: {} } as CustomColumnMeta<QueueEntry, any>,
  },
];