import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { API_URL } from "../utils";

export interface Barber {
  id: string;
  name: string;
  createdAt: Date;
  status: string;
  queueStatus: string;
  commissionRate: number;
}

interface BarbersContextType {
  barbers: Barber[];
  loading: boolean;
  addingBarber: boolean;
  error: string | null;
  deletingBarberId: string | null;
  togglingBarberId: string | null;
  togglingQueueId: string | null;
  addBarber: (name: string, commissionRate?: number) => Promise<Barber>;
  deleteBarber: (id: string) => Promise<void>;
  toggleBarberStatus: (id: string, currentStatus: string) => Promise<void>;
  toggleQueueStatus: (id: string, currentQueueStatus: string) => Promise<void>;
  refetch: () => Promise<void>;
  refetchStatus: (id: string) => Promise<void>;
}

const BarbersContext = createContext<BarbersContextType | undefined>(undefined);

export const BarbersProvider = ({ children }: { children: ReactNode }) => {
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingBarber, setAddingBarber] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingBarberId, setDeletingBarberId] = useState<string | null>(null);
  const [togglingBarberId, setTogglingBarberId] = useState<string | null>(null);
  const [togglingQueueId, setTogglingQueueId] = useState<string | null>(null);

  const fetchBarbers = async () => {
    try {
      setLoading(true);
      const baseUrl = window.location.origin;
      const response = await fetch(`${baseUrl}/api/barbers`, {
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error(`Erro ao buscar barbeiros: ${response.status} ${response.statusText}`);
      }
      const data: Barber[] = await response.json();
      setBarbers(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  };

  const addBarber = async (name: string, commissionRate?: number) => {
    try {
      setAddingBarber(true);
      const baseUrl = window.location.origin;
      const response = await fetch(`${baseUrl}/api/barbers`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, commissionRate }),
      });
      if (!response.ok) {
        throw new Error(`Erro ao adicionar barbeiro: ${response.status} ${response.statusText}`);
      }
      const newBarber: Barber = await response.json();
      setBarbers((prevBarbers) => [...prevBarbers, newBarber]);
      setError(null);
      return newBarber;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
      throw err;
    } finally {
      setAddingBarber(false);
    }
  };

  const deleteBarber = async (id: string) => {
    try {
      setDeletingBarberId(id);
      const baseUrl = window.location.origin;
      const response = await fetch(`${baseUrl}/api/barbers/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error(`Erro ao excluir barbeiro: ${response.status} ${response.statusText}`);
      }
      setBarbers((prevBarbers) => prevBarbers.filter((barber) => barber.id !== id));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
      throw err;
    } finally {
      setDeletingBarberId(null);
    }
  };

  const toggleBarberStatus = async (id: string, currentStatus: string) => {
    try {
      setTogglingBarberId(id);
      const newStatus = currentStatus === "active" ? "inactive" : "active";
      const baseUrl = window.location.origin;
      const response = await fetch(`${baseUrl}/api/barbers/${id}`, {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!response.ok) {
        throw new Error(`Erro ao atualizar status: ${response.status} ${response.statusText}`);
      }

      setBarbers((prevBarbers) =>
        prevBarbers.map((barber) =>
          barber.id === id ? { ...barber, status: newStatus } : barber
        )
      );
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
      throw err;
    } finally {
      setTogglingBarberId(null);
    }
  };

  const toggleQueueStatus = async (id: string, currentQueueStatus: string) => {
    try {
      setTogglingQueueId(id);
      const newQueueStatus = currentQueueStatus === "open" ? "closed" : "open";
      const baseUrl = window.location.origin;
      const response = await fetch(`${baseUrl}/api/barbers/${id}`, {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ queueStatus: newQueueStatus }),
      });
      if (!response.ok) {
        throw new Error(`Erro ao atualizar status da fila: ${response.status} ${response.statusText}`);
      }

      setBarbers((prevBarbers) =>
        prevBarbers.map((barber) =>
          barber.id === id ? { ...barber, queueStatus: newQueueStatus } : barber
        )
      );
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
      throw err;
    } finally {
      setTogglingQueueId(null);
    }
  };

  const refetchStatus = async (id: string) => {
    try {
      const baseUrl = window.location.origin;
      const response = await fetch(`${baseUrl}/api/barbers/${id}`, {
        method: "GET",
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error(`Erro ao buscar status do barbeiro: ${response.status} ${response.statusText}`);
      }
      const updatedBarber: Barber = await response.json();
      setBarbers((prevBarbers) =>
        prevBarbers.map((barber) =>
          barber.id === id ? { ...barber, status: updatedBarber.status } : barber
        )
      );
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
      throw err;
    }
  };

  useEffect(() => {
    fetchBarbers();
  }, []);

  return (
    <BarbersContext.Provider
      value={{
        barbers,
        loading,
        addingBarber,
        error,
        deletingBarberId,
        togglingBarberId,
        togglingQueueId,
        addBarber,
        deleteBarber,
        toggleBarberStatus,
        toggleQueueStatus,
        refetch: fetchBarbers,
        refetchStatus,
      }}
    >
      {children}
    </BarbersContext.Provider>
  );
};

export const useBarbersContext = () => {
  const context = useContext(BarbersContext);
  if (!context) {
    throw new Error("useBarbersContext deve ser usado dentro de um BarbersProvider");
  }
  return context;
};